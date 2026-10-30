import express, { type Request, type Response } from 'express';
import { validateScanUrl } from './security.ts';
import { launchAuditBrowser } from './browser.ts';
import { crawlAndAuditWebsite } from './crawler.ts';
import { verifyAndCompareScans } from './verifier.ts';
import {
  getAllScans,
  getScanById,
  saveScan,
  deleteScan,
  updateFixStatus,
  getMonitoredWebsites,
  getOverallStats,
  isDemoMode,
  setDemoMode,
  clearAllScans,
  getAllSites,
  getSiteConfig,
  saveSiteConfig,
  deleteSiteConfig,
  getGeminiApiKey,
  setGeminiApiKey,
  type WidgetSiteConfig
} from './storage.ts';
import { generateAiRemediationWithGemini } from './remediation.ts';
import path from 'path';
import fs from 'fs';

export const apiRouter = express.Router();

// Parse JSON bodies
apiRouter.use(express.json());

/**
 * Direct route to serve the standalone accessibility widget
 */
apiRouter.get('/accessibility-widget.js', (_req: Request, res: Response) => {
  const widgetPath = path.resolve('public', 'accessibility-widget.js');
  if (fs.existsSync(widgetPath)) {
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.sendFile(widgetPath);
  }
  res.status(404).send('Widget script not found');
});

/**
 * Health check endpoint
 */
apiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    engine: 'AccessAI Real Website Scanning Engine',
    axeVersion: '4.14.0',
    timestamp: new Date().toISOString()
  });
});

/**
 * Overall aggregate dashboard statistics
 */
apiRouter.get('/stats', (_req: Request, res: Response) => {
  try {
    const stats = getOverallStats();
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to compute stats' });
  }
});

/**
 * Monitored websites list derived from scans
 */
apiRouter.get('/websites', (_req: Request, res: Response) => {
  try {
    const websites = getMonitoredWebsites();
    res.json(websites);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch websites' });
  }
});

/**
 * List all historical scan records (newest first)
 */
apiRouter.get('/scans', (_req: Request, res: Response) => {
  try {
    const scans = getAllScans();
    res.json(scans);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch scans' });
  }
});

/**
 * Get specific scan by ID
 */
apiRouter.get('/scans/:id', (req: Request, res: Response) => {
  try {
    const scanId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const scan = getScanById(scanId);
    if (!scan) {
      return res.status(404).json({ error: 'Scan record not found' });
    }
    res.json(scan);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch scan' });
  }
});

/**
 * Delete a scan by ID
 */
apiRouter.delete('/scans/:id', (req: Request, res: Response) => {
  try {
    const scanId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const success = deleteScan(scanId);
    if (!success) {
      return res.status(404).json({ error: 'Scan not found' });
    }
    res.json({ success: true, message: 'Scan deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete scan' });
  }
});

/**
 * Initiate a real website scan
 */
apiRouter.post('/scan', async (req: Request, res: Response) => {
  const { url, maxPages } = req.body;

  // 1. Validate URL & enforce anti-SSRF protections
  const validation = await validateScanUrl(url);
  if (!validation.valid || !validation.normalizedUrl) {
    return res.status(400).json({
      error: validation.error || 'Invalid or forbidden URL'
    });
  }

  const targetUrl = validation.normalizedUrl;
  const pageLimit = typeof maxPages === 'number' ? Math.min(10, Math.max(1, maxPages)) : 3;

  let browser = null;
  try {
    // 2. Launch safe browser instance
    browser = await launchAuditBrowser();

    // 3. Execute crawl and axe-core analysis
    const auditResult = await crawlAndAuditWebsite(browser, targetUrl, pageLimit);

    // 4. Save scan to persistent database
    saveScan(auditResult);

    res.json({
      success: true,
      scan: auditResult
    });
  } catch (scanErr: any) {
    console.error('Audit scanning execution error:', scanErr);
    res.status(500).json({
      error: scanErr?.message || 'Accessibility audit failed during execution'
    });
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
});

/**
 * Rescan and verify resolution of previous findings
 */
apiRouter.post('/scans/:id/rescan', async (req: Request, res: Response) => {
  const targetId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const previousScan = getScanById(targetId);
  if (!previousScan) {
    return res.status(404).json({ error: 'Target scan for rescan not found' });
  }

  const targetUrl = previousScan.websiteUrl;
  const pageLimit = previousScan.pagesScanned || 3;

  let browser = null;
  try {
    browser = await launchAuditBrowser();
    const newScan = await crawlAndAuditWebsite(browser, targetUrl, pageLimit);

    // Compare findings to verify resolved issues
    const verification = verifyAndCompareScans(previousScan, newScan);

    // Save the new verified scan
    saveScan(newScan);

    res.json({
      success: true,
      scan: newScan,
      verification
    });
  } catch (err: any) {
    console.error('Rescan verification error:', err);
    res.status(500).json({
      error: err?.message || 'Rescan verification failed'
    });
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
});

/**
 * Update fix lifecycle status (approved, applied, rejected, verified)
 */
apiRouter.post('/fixes/:id/status', (req: Request, res: Response) => {
  const { status } = req.body;
  const fixId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const validStatuses = ['suggested', 'approved', 'rejected', 'applied', 'verified'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Expected one of: ${validStatuses.join(', ')}` });
  }

  const updated = updateFixStatus(fixId, status);
  if (!updated) {
    return res.status(404).json({ error: 'Fix suggestion not found' });
  }

  res.json({ success: true, fixId, status });
});

/**
 * Demo Mode management
 */
apiRouter.get('/demo/status', (_req: Request, res: Response) => {
  res.json({ demoMode: isDemoMode() });
});

apiRouter.post('/demo/toggle', (req: Request, res: Response) => {
  const { active } = req.body;
  setDemoMode(Boolean(active));
  res.json({ success: true, demoMode: isDemoMode() });
});

/**
 * Clear all real scans
 */
apiRouter.post('/clear', (_req: Request, res: Response) => {
  clearAllScans();
  res.json({ success: true, message: 'All audit records reset successfully.' });
});

/**
 * ============================================================================
 * WIDGET CONFIGURATION & SITES API
 * ============================================================================
 */

/**
 * Fetch configuration for the standalone accessibility widget
 */
apiRouter.get('/widget/config/:siteId', (req: Request, res: Response) => {
  try {
    const siteId = Array.isArray(req.params.siteId) ? req.params.siteId[0] : req.params.siteId;
    const config = getSiteConfig(siteId);

    if (config) {
      return res.json({
        success: true,
        siteId: config.siteId,
        domain: config.domain,
        name: config.name || config.domain,
        enabledFeatures: config.enabledFeatures,
        position: config.position || 'bottom-right',
        primaryColor: config.primaryColor || '#C96F82'
      });
    }

    // Default configuration for unregistered / demo sites
    res.json({
      success: true,
      siteId,
      domain: 'default',
      name: 'AccessAI Accessibility Layer',
      enabledFeatures: {
        textResize: true,
        dyslexiaFont: true,
        highContrast: true,
        keyboardFocus: true,
        voiceControl: true,
        readingRuler: true,
        screenReaderAnnounce: true
      },
      position: 'bottom-right',
      primaryColor: '#C96F82'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to retrieve widget config' });
  }
});

/**
 * List all registered widget sites
 */
apiRouter.get('/widget/sites', (_req: Request, res: Response) => {
  try {
    const sites = getAllSites();
    res.json(sites);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to list sites' });
  }
});

/**
 * Save or update widget site configuration
 */
apiRouter.post('/widget/config', (req: Request, res: Response) => {
  try {
    const { siteId, domain, name, enabledFeatures, position, primaryColor, allowedOrigins } = req.body;

    if (!siteId || !domain) {
      return res.status(400).json({ error: 'siteId and domain are required' });
    }

    const config: WidgetSiteConfig = {
      siteId: String(siteId).trim(),
      domain: String(domain).trim(),
      name: name ? String(name).trim() : undefined,
      enabledFeatures: enabledFeatures || {
        textResize: true,
        dyslexiaFont: true,
        highContrast: true,
        keyboardFocus: true,
        voiceControl: true,
        readingRuler: true,
        screenReaderAnnounce: true
      },
      position: position === 'bottom-left' ? 'bottom-left' : 'bottom-right',
      primaryColor: primaryColor || '#C96F82',
      allowedOrigins: Array.isArray(allowedOrigins) ? allowedOrigins : undefined,
      createdAt: new Date().toISOString()
    };

    saveSiteConfig(config);
    res.json({ success: true, site: config });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to save widget config' });
  }
});

/**
 * Delete a registered widget site
 */
apiRouter.delete('/widget/sites/:siteId', (req: Request, res: Response) => {
  try {
    const siteId = Array.isArray(req.params.siteId) ? req.params.siteId[0] : req.params.siteId;
    const deleted = deleteSiteConfig(siteId);
    if (!deleted) {
      return res.status(404).json({ error: 'Site not found' });
    }
    res.json({ success: true, message: 'Site configuration removed' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete site' });
  }
});

/**
 * ============================================================================
 * AI SETTINGS & REMEDIATION API
 * ============================================================================
 */

/**
 * Get AI configuration status
 */
apiRouter.get('/settings/ai', (_req: Request, res: Response) => {
  const currentKey = getGeminiApiKey();
  const isConfigured = Boolean(currentKey && currentKey.length > 5);
  const maskedKey = isConfigured
    ? `${currentKey.slice(0, 4)}...${currentKey.slice(-4)}`
    : '';

  res.json({
    provider: 'google-gemini',
    model: 'gemini-1.5-flash',
    isConfigured,
    maskedKey
  });
});

/**
 * Save Gemini API key
 */
apiRouter.post('/settings/ai', (req: Request, res: Response) => {
  try {
    const { apiKey } = req.body;
    if (typeof apiKey !== 'string') {
      return res.status(400).json({ error: 'apiKey must be a string' });
    }

    setGeminiApiKey(apiKey.trim());
    res.json({
      success: true,
      message: 'Gemini API key updated successfully',
      isConfigured: apiKey.trim().length > 5
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update AI settings' });
  }
});

/**
 * Trigger AI Remediation for a single defect on demand
 */
apiRouter.post('/remediation/ai', async (req: Request, res: Response) => {
  try {
    const { ruleId, rawHtml, description, helpText, wcagCriteria, apiKey } = req.body;

    if (!ruleId || !rawHtml) {
      return res.status(400).json({ error: 'ruleId and rawHtml are required' });
    }

    const keyToUse = apiKey || getGeminiApiKey();
    const result = await generateAiRemediationWithGemini(
      ruleId,
      rawHtml,
      description || ruleId,
      helpText || ruleId,
      wcagCriteria || 'WCAG 2.1 AA',
      keyToUse
    );

    res.json({ success: true, remediation: result });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'AI remediation generation failed' });
  }
});
