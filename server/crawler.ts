import { type Browser, type Page } from 'playwright-core';
import { URL } from 'url';
import { createAuditContext, getAxeSource } from './browser.ts';
import { type AxeViolation, generateIssueAndFix, type GeneratedIssueAndFix } from './remediation.ts';
import { calculateAccessibilityScore, type ScoreBreakdown } from './scorer.ts';

export interface CrawlPageResult {
  url: string;
  pathname: string;
  status: 'success' | 'failed';
  error?: string;
  violationsCount: number;
  durationMs: number;
}

export interface CrawlAuditResult {
  scanId: string;
  websiteUrl: string;
  domain: string;
  timestamp: string;
  durationMs: number;
  pagesScanned: number;
  pagesFailed: number;
  pagesDiscovered: number;
  pagesList: CrawlPageResult[];
  scoreBreakdown: ScoreBreakdown;
  issues: GeneratedIssueAndFix['issue'][];
  fixes: GeneratedIssueAndFix['fix'][];
}

/**
 * Normalizes a URL for deduplication during crawling.
 */
function normalizeCrawlUrl(rawUrl: string, baseOrigin: string): string | null {
  try {
    const parsed = new URL(rawUrl, baseOrigin);

    // Same-origin restriction
    if (parsed.origin !== baseOrigin) {
      return null;
    }

    // Only HTTP/HTTPS
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }

    // Filter out common non-HTML extensions
    const nonHtmlExtensions = [
      '.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.ico',
      '.css', '.js', '.json', '.xml',
      '.pdf', '.zip', '.tar', '.gz', '.dmg', '.exe',
      '.mp3', '.mp4', '.avi', '.mov', '.webm',
      '.woff', '.woff2', '.ttf', '.eot'
    ];
    const pathLower = parsed.pathname.toLowerCase();
    if (nonHtmlExtensions.some((ext) => pathLower.endsWith(ext))) {
      return null;
    }

    // Strip hash fragment
    parsed.hash = '';

    // Standardize trailing slash: remove trailing slash if path is longer than /
    let cleaned = parsed.toString();
    if (cleaned.endsWith('/') && parsed.pathname !== '/') {
      cleaned = cleaned.slice(0, -1);
    }

    return cleaned;
  } catch {
    return null;
  }
}

/**
 * Executes a controlled crawl and accessibility audit of an external website.
 */
export async function crawlAndAuditWebsite(
  browser: Browser,
  startUrl: string,
  maxPages: number = 3,
  onProgress?: (step: string, progressPct: number) => void
): Promise<CrawlAuditResult> {
  const startTime = Date.now();
  const scanId = `scan-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  const parsedStart = new URL(startUrl);
  const baseOrigin = parsedStart.origin;

  const maxCrawlLimit = Math.min(10, Math.max(1, maxPages));
  const queue: string[] = [startUrl];
  const visited = new Set<string>();
  const discovered = new Set<string>([startUrl]);

  const pageResults: CrawlPageResult[] = [];
  const allIssues: GeneratedIssueAndFix['issue'][] = [];
  const allFixes: GeneratedIssueAndFix['fix'][] = [];

  const axeSource = getAxeSource();
  const allowLoopback = process.env.NODE_ENV === 'test';
  const context = await createAuditContext(browser, allowLoopback);

  onProgress?.('Initializing browser session and security sandbox...', 10);

  let issueCounter = 1;

  try {
    while (queue.length > 0 && visited.size < maxCrawlLimit) {
      const currentUrl = queue.shift()!;
      if (visited.has(currentUrl)) continue;

      visited.add(currentUrl);
      const pageIndex = visited.size;
      const progressPct = Math.round(15 + (pageIndex / maxCrawlLimit) * 70);

      onProgress?.(
        `Auditing page ${pageIndex} of max ${maxCrawlLimit}: ${new URL(currentUrl).pathname}`,
        progressPct
      );

      const pageStartTime = Date.now();
      let page: Page | null = null;

      try {
        page = await context.newPage();

        // 25 second timeout for navigation
        await page.goto(currentUrl, {
          waitUntil: 'domcontentloaded',
          timeout: 25000
        });

        // Small grace period for asynchronous DOM hydration
        await page.waitForTimeout(1000);

        // Inject axe-core into the active page DOM
        await page.evaluate(axeSource);

        // Execute axe-core analysis
        const axeResults = await page.evaluate(async () => {
          return await (window as any).axe.run({
            runOnly: {
              type: 'tag',
              values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']
            }
          });
        });

        const violations: AxeViolation[] = axeResults.violations || [];

        // Discover internal links for subsequent crawling
        if (visited.size < maxCrawlLimit) {
          const links: string[] = await page.evaluate(() => {
            const anchors = Array.from(document.querySelectorAll('a[href]'));
            return anchors.map((a) => (a as HTMLAnchorElement).href).filter(Boolean);
          });

          for (const rawLink of links) {
            const normalized = normalizeCrawlUrl(rawLink, baseOrigin);
            if (normalized && !discovered.has(normalized)) {
              discovered.add(normalized);
              queue.push(normalized);
            }
          }
        }

        // Process actual detected violations
        for (const violation of violations) {
          for (const node of violation.nodes) {
            const { issue, fix } = generateIssueAndFix(violation, node, currentUrl, issueCounter++);
            allIssues.push(issue);
            allFixes.push(fix);
          }
        }

        pageResults.push({
          url: currentUrl,
          pathname: new URL(currentUrl).pathname || '/',
          status: 'success',
          violationsCount: violations.reduce((acc, v) => acc + v.nodes.length, 0),
          durationMs: Date.now() - pageStartTime
        });
      } catch (pageErr: any) {
        pageResults.push({
          url: currentUrl,
          pathname: new URL(currentUrl).pathname || '/',
          status: 'failed',
          error: pageErr?.message || 'Page navigation timed out or failed to render',
          violationsCount: 0,
          durationMs: Date.now() - pageStartTime
        });
      } finally {
        if (page) {
          await page.close().catch(() => {});
        }
      }
    }
  } finally {
    await context.close().catch(() => {});
  }

  onProgress?.('Synthesizing WCAG compliance metrics and score...', 90);

  const successfulPages = pageResults.filter((p) => p.status === 'success').length;
  const failedPages = pageResults.filter((p) => p.status === 'failed').length;

  const scoreBreakdown = calculateAccessibilityScore(allIssues, successfulPages);

  onProgress?.('Audit complete. Persisting report records...', 100);

  return {
    scanId,
    websiteUrl: startUrl,
    domain: parsedStart.hostname,
    timestamp: new Date().toISOString(),
    durationMs: Date.now() - startTime,
    pagesScanned: successfulPages,
    pagesFailed: failedPages,
    pagesDiscovered: discovered.size,
    pagesList: pageResults,
    scoreBreakdown,
    issues: allIssues,
    fixes: allFixes
  };
}
