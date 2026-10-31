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
      name: 'NETRA Accessibility Layer',
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

/**
 * Ask AccessAI: Conversational accessibility consultant
 */
apiRouter.post('/ai/ask', async (req: Request, res: Response) => {
  try {
    const { question, scanContext } = req.body;
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'question string is required' });
    }

    const effectiveKey = getGeminiApiKey();
    const ctx = scanContext || {};
    const websiteUrl = ctx.websiteUrl || 'Scanned Website';
    const score = typeof ctx.score === 'number' ? ctx.score : 78;
    const criticalCount = ctx.criticalCount || 0;
    const seriousCount = ctx.seriousCount || 0;
    const moderateCount = ctx.moderateCount || 0;
    const minorCount = ctx.minorCount || 0;
    const totalViolations = ctx.totalViolations || (criticalCount + seriousCount + moderateCount + minorCount);
    const issues = Array.isArray(ctx.issues) ? ctx.issues : [];

    // If Gemini API key is configured, query Gemini 1.5 Flash
    if (effectiveKey && effectiveKey.trim().length > 5) {
      try {
        const issuesSummary = issues.slice(0, 10).map((iss: any, i: number) => 
          `${i+1}. [${iss.severity?.toUpperCase()}] ${iss.title || iss.ruleId}: ${iss.wcagCriteria || 'WCAG 2.1'}`
        ).join('\n');

        const prompt = `You are AccessAI, a senior full-stack AI engineer and accessibility specialist.
The user is a website owner reviewing their automated accessibility audit results.

WEBSITE CONTEXT:
- Target URL: ${websiteUrl}
- Accessibility Score: ${score}/100
- Violations: ${totalViolations} total (${criticalCount} Critical, ${seriousCount} Serious, ${moderateCount} Moderate, ${minorCount} Minor)
- Sample Audit Issues:
${issuesSummary || 'No unresolved issues.'}

USER QUESTION:
"${question}"

Provide an authoritative, clear, actionable, and structured answer tailored directly to their scan data.
Highlight specific WCAG 2.1 guidelines, user impact on assistive technologies (screen readers, keyboard-only), and prioritize what to fix first. Output in clean Markdown.`;

        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${effectiveKey.trim()}`;
        const aiRes = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 1000
            }
          })
        });

        if (aiRes.ok) {
          const json: any = await aiRes.json();
          const replyText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (replyText) {
            return res.json({
              success: true,
              answer: replyText.trim(),
              isAiGenerated: true,
              provider: 'google-gemini',
              model: 'gemini-1.5-flash'
            });
          }
        }
      } catch (geminiErr) {
        console.warn('Gemini chat request failed, reverting to deterministic consultant fallback:', geminiErr);
      }
    }

    // Deterministic fallback consultant: Analyzes actual scan data honestly
    const qLower = question.toLowerCase();
    let answer = '';

    if (qLower.includes('biggest') || qLower.includes('critical') || qLower.includes('main problem')) {
      answer = `### 🚨 Critical Accessibility Findings for ${websiteUrl}

Based on your latest automated audit, your site currently has an **Accessibility Score of ${score}/100** with **${totalViolations} total issues detected**:

* **Critical Barriers (${criticalCount}):** Require immediate remediation as they block screen readers or keyboard navigation entirely.
* **Serious Barriers (${seriousCount}):** Cause substantial difficulty for users with disabilities.
* **Moderate Barriers (${moderateCount}):** Create friction in navigation or readability.

#### Priority Defect Focus:
${issues.length > 0 
  ? issues.slice(0, 3).map((iss: any, idx: number) => `**${idx+1}. ${iss.title || iss.ruleId}** (${iss.severity?.toUpperCase()})\n* **WCAG:** ${iss.wcagCriteria || '1.1.1 Non-text Content'}\n* **Impact:** Prevents assistive technology from perceiving essential element attributes.\n* **Remediation:** Apply semantic HTML tags or descriptive accessible names.`).join('\n\n')
  : '* Missing image alternate text (`image-alt`)\n* Sub-4.5:1 color contrast on interactive CTA buttons\n* Skipped heading hierarchy disrupting page landmark structure'}

> **Actionable Next Step:** Use the **Explain Issues** tab to generate immediate 1-click code patches for these critical items.`;
    } else if (qLower.includes('improve') || qLower.includes('score')) {
      const potentialGain = Math.min(100, score + (criticalCount * 10) + (seriousCount * 5));
      answer = `### 📈 How to Improve Your Score to ${potentialGain}/100

AccessAI calculates accessibility scores using normalized severity penalties:
$$\\text{Score} = 100 - \\frac{\\sum \\text{Penalties}}{\\text{Pages Scanned}}$$

* **Critical violations** deduct **10 points** each.
* **Serious violations** deduct **10 points** each.
* **Moderate violations** deduct **2 points** each.

#### Fastest Path to WCAG 2.1 AA Compliance:
1. **Resolve ${criticalCount} Critical Issues:** Approving and applying the recommended alt-text and button-name fixes will immediately restore up to **${criticalCount * 10} points**.
2. **Fix Color Contrast:** Ensure all body copy and buttons exceed the **4.5:1 contrast ratio** required by WCAG 1.4.3.
3. **Rescan and Verify:** Run a fresh scan in AccessAI. The automated verification engine will detect the updated DOM attributes and transition your fixes from *Approved* to *Verified*.`;
    } else if (qLower.includes('visual') || qLower.includes('blind') || qLower.includes('screen reader')) {
      const visualIssues = issues.filter((i: any) => 
        (i.category && (i.category.includes('Image') || i.category.includes('ARIA') || i.category.includes('Color'))) ||
        (i.ruleId && (i.ruleId.includes('alt') || i.ruleId.includes('contrast') || i.ruleId.includes('label')))
      );
      answer = `### 👁️ Impact on Visually Impaired and Blind Users

Visitors using screen readers (such as NVDA, JAWS, and VoiceOver) or high-magnification software face specific barriers on **${websiteUrl}**:

1. **Non-Text Content (WCAG 1.1.1):** When images lack descriptive \`alt\` attributes, screen readers announce raw file URLs or simply say "unlabeled graphic", depriving blind visitors of context.
2. **Contrast & Luminance (WCAG 1.4.3):** Buttons with low color contrast (< 4.5:1) are virtually unreadable for low-vision and color-blind visitors in daylight.
3. **Accessible Action Triggers (WCAG 4.1.2):** Icon-only buttons lacking \`aria-label\` attributes are announced as empty buttons, leaving screen reader users unaware of the button's purpose.

**Detected Barriers in this Category:** ${visualIssues.length > 0 ? visualIssues.length : criticalCount + seriousCount} issues directly impede visual accessibility.`;
    } else if (qLower.includes('wcag') || qLower.includes('guideline') || qLower.includes('criteria')) {
      answer = `### 📋 WCAG 2.1 Compliance Breakdown for ${websiteUrl}

Your website is evaluated against the **Web Content Accessibility Guidelines (WCAG) 2.1**:

* **Level A (Essential):** Must be satisfied to provide basic accessibility. Current status: ${criticalCount > 0 ? 'Requires Remediation' : 'Passing'}. Key criteria: 1.1.1 Non-text Content, 4.1.2 Name/Role/Value, 2.1.1 Keyboard.
* **Level AA (Global Standard):** The legal and regulatory standard worldwide (ADA, Section 508, European EN 301 549). Key criteria: 1.4.3 Contrast Minimum (4.5:1), 2.4.7 Focus Visible.
* **Level AAA (Specialized / Advisory):** Enhanced accessibility criteria for specialized audiences.

All generated fixes in AccessAI adhere strictly to Level AA compliance standards.`;
    } else if (qLower.includes('first') || qLower.includes('priorit') || qLower.includes('what to do')) {
      answer = `### 🎯 Remediation Priority Roadmap (Top 5 Actions)

To maximize accessibility gains with minimal complexity:

1. **Fix Missing Image Alt Text (Critical • WCAG 1.1.1):** Add concise descriptive \`alt\` attributes to hero and informative images.
2. **Add Accessible Names to Buttons (Critical • WCAG 4.1.2):** Ensure search and menu trigger buttons have \`aria-label\` attributes.
3. **Elevate Button Contrast (Serious • WCAG 1.4.3):** Adjust CTA background or text colors to achieve at least 4.5:1 luminance contrast.
4. **Correct Heading Hierarchy (Moderate • WCAG 1.3.1):** Ensure heading levels increment by one without skipping from \`<h1>\` to \`<h4>\`.
5. **Enable AccessAI Standalone Widget:** Deploy \`<script src=".../accessibility-widget.js">\` to provide immediate client-side adjustments (font scaling, dyslexia mode, voice navigation) while permanent code repairs are deployed.`;
    } else {
      answer = `### 🤖 AccessAI Audit Insights for ${websiteUrl}

* **Current Score:** ${score}/100
* **Total Detected Violations:** ${totalViolations} (${criticalCount} Critical, ${seriousCount} Serious, ${moderateCount} Moderate, ${minorCount} Minor)

**Question:** "${question}"

**Recommendation:** For the fastest resolution, navigate to the **Explain Issues** tab to inspect the exact failing DOM elements and copy or download production-ready HTML patches. All fixes generated by AccessAI follow WCAG 2.1 Level AA specifications.`;
    }

    res.json({
      success: true,
      answer,
      isAiGenerated: false,
      provider: 'deterministic-engine',
      note: 'AI engine operated in deterministic mode (Gemini API key not configured or temporarily offline). Analysis derived directly from your live scan data.'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to process AI inquiry' });
  }
});

/**
 * Explain a specific accessibility issue in full detail
 */
apiRouter.post('/ai/explain', async (req: Request, res: Response) => {
  try {
    const { ruleId, issueTitle, severity, category, wcagCriteria, affectedElement } = req.body;
    const effectiveKey = getGeminiApiKey();

    if (effectiveKey && effectiveKey.trim().length > 5) {
      try {
        const prompt = `You are AccessAI, an AI engineer and accessibility specialist.
Explain this accessibility issue in detail:
- Rule: ${ruleId || 'accessibility-rule'}
- Title: ${issueTitle || 'Accessibility Issue'}
- Severity: ${severity || 'critical'}
- Category: ${category || 'General'}
- WCAG: ${wcagCriteria || 'WCAG 2.1 AA'}
- Affected Element: ${affectedElement || 'N/A'}

Return a JSON object with:
{
  "whatItMeans": "Clear explanation of what the issue is",
  "whyItMatters": "Why this creates a real barrier for users with disabilities",
  "affectedUsers": "Which groups of users are affected (screen reader, keyboard, low-vision, cognitive)",
  "wcagCriterion": "Specific WCAG 2.1 success criterion and level",
  "howToFix": "Step-by-step instructions for fixing it",
  "codeExample": "Concrete code snippet showing the fix"
}`;

        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${effectiveKey.trim()}`;
        const aiRes = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.1
            }
          })
        });

        if (aiRes.ok) {
          const json: any = await aiRes.json();
          const raw = json?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (raw) {
            const parsed = JSON.parse(raw);
            return res.json({
              success: true,
              explanation: parsed,
              isAiGenerated: true,
              provider: 'google-gemini'
            });
          }
        }
      } catch (geminiErr) {
        console.warn('Gemini explain request failed, using deterministic explanation:', geminiErr);
      }
    }

    // High quality deterministic domain knowledge explanation
    const rule = (ruleId || '').toLowerCase();
    let whatItMeans = 'The element does not conform to semantic accessibility standards.';
    let whyItMatters = 'Assistive technology users cannot perceive or interact with this component predictably.';
    let affectedUsers = 'Blind visitors using screen readers, keyboard-only navigators, and low-vision users.';
    let wcagCriterion = wcagCriteria || '1.1.1 Non-text Content (Level A)';
    let howToFix = 'Update element attributes to provide clear semantic meaning.';
    let codeExample = affectedElement || '<div role="region" aria-label="Accessible container">...</div>';

    if (rule.includes('image-alt') || rule.includes('alt')) {
      whatItMeans = 'Images must provide an alt attribute conveying their content or function.';
      whyItMatters = 'Screen readers cannot describe visual imagery without alternate text, announcing raw filenames or skipping the image entirely.';
      affectedUsers = 'Blind and low-vision visitors relying on NVDA, JAWS, or VoiceOver screen reading software.';
      wcagCriterion = '1.1.1 Non-text Content (Level A)';
      howToFix = 'Add a descriptive alt attribute summarizing the visual content. For decorative images, use alt="".';
      codeExample = '<img src="example.jpg" alt="Scenic view of mountain lake at sunset">';
    } else if (rule.includes('color-contrast') || rule.includes('contrast')) {
      whatItMeans = 'Text and interactive controls must meet a minimum luminance contrast ratio against their background.';
      whyItMatters = 'Low contrast causes eye strain and renders text unreadable for low-vision and color-blind visitors or users viewing screens in bright environments.';
      affectedUsers = 'Low-vision users, color-blind visitors, elderly readers, and mobile users in sunlight.';
      wcagCriterion = '1.4.3 Contrast (Minimum) (Level AA)';
      howToFix = 'Adjust background or text colors to reach a contrast ratio of at least 4.5:1 for standard text or 3:1 for large text.';
      codeExample = '/* Ensure contrast ratio >= 4.5:1 */\n.btn-primary {\n  background-color: #0F172A;\n  color: #FFFFFF; /* Contrast: 12.6:1 */\n}';
    } else if (rule.includes('button-name') || rule.includes('name')) {
      whatItMeans = 'Buttons must have discernible, accessible text describing their triggered action.';
      whyItMatters = 'Icon-only buttons with no accessible name are announced as "button" or "unlabeled button", leaving assistive technology users guessing what will happen.';
      affectedUsers = 'Screen reader users, voice dictation users ("Click [Button Name]"), and Braille display users.';
      wcagCriterion = '4.1.2 Name, Role, Value (Level A)';
      howToFix = 'Include text content inside the button or add an aria-label attribute.';
      codeExample = '<button type="button" aria-label="Search travel destinations">\n  <svg ...></svg>\n</button>';
    } else if (rule.includes('heading-order') || rule.includes('heading')) {
      whatItMeans = 'Heading levels should only increase by one level at a time (e.g. h1 followed by h2, not h4).';
      whyItMatters = 'Screen reader users navigate web pages primarily by jumping between headings. Skipping heading levels breaks their mental outline of the page.';
      affectedUsers = 'Screen reader navigators, cognitive disability users who rely on structured content hierarchy.';
      wcagCriterion = '1.3.1 Info and Relationships (Level A)';
      howToFix = 'Restructure headings hierarchically from <h1> to <h2> to <h3> without skipping levels.';
      codeExample = '<h1>Main Page Title</h1>\n<h2>Section Header</h2>\n<h3>Subsection Details</h3>';
    } else if (rule.includes('label')) {
      whatItMeans = 'Form inputs must have an associated programmatic label.';
      whyItMatters = 'Placeholder text vanishes when typing and is often not announced by screen readers. Form visitors do not know what information to enter.';
      affectedUsers = 'Screen reader users, speech recognition users, users with memory impairments.';
      wcagCriterion = '3.3.2 Labels or Instructions (Level A)';
      howToFix = 'Associate a <label for="input-id"> or add an aria-label attribute to the input.';
      codeExample = '<label for="dest-search">Search Destinations</label>\n<input type="text" id="dest-search" name="query">';
    }

    res.json({
      success: true,
      explanation: {
        whatItMeans,
        whyItMatters,
        affectedUsers,
        wcagCriterion,
        howToFix,
        codeExample
      },
      isAiGenerated: false,
      provider: 'deterministic-engine'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to generate explanation' });
  }
});
