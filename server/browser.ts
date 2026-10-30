import { chromium, type Browser, type BrowserContext, type Page } from 'playwright-core';
import fs from 'fs';
import path from 'path';
import { isPrivateIp } from './security.ts';
import { URL } from 'url';

let axeScriptCache: string | null = null;

/**
 * Returns the source code of axe.min.js for injection into inspected pages.
 */
export function getAxeSource(): string {
  if (axeScriptCache) return axeScriptCache;
  const axePath = path.resolve('node_modules/axe-core/axe.min.js');
  if (!fs.existsSync(axePath)) {
    throw new Error(`axe-core not found at ${axePath}. Ensure axe-core is installed.`);
  }
  axeScriptCache = fs.readFileSync(axePath, 'utf8');
  return axeScriptCache;
}

/**
 * Finds a suitable Chromium-based browser executable on the host.
 * Checks CHROMIUM_PATH env, Linux paths, Windows paths, and Playwright executable.
 */
export function getBrowserExecutablePath(): string {
  // 1. Explicit environment variables
  if (process.env.CHROMIUM_PATH && fs.existsSync(process.env.CHROMIUM_PATH)) {
    return process.env.CHROMIUM_PATH;
  }
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH && fs.existsSync(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH)) {
    return process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  }
  if (process.env.CHROME_BIN && fs.existsSync(process.env.CHROME_BIN)) {
    return process.env.CHROME_BIN;
  }

  // 2. Standard Linux / Docker paths (for Render deployment)
  const linuxCandidates = [
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/lib/chromium/chromium'
  ];
  for (const candidate of linuxCandidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  // 3. Windows paths (for local development)
  const windowsCandidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  for (const candidate of windowsCandidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  // 4. Playwright default bundled chromium fallback
  try {
    const pwPath = chromium.executablePath();
    if (pwPath && fs.existsSync(pwPath)) {
      return pwPath;
    }
  } catch {}

  throw new Error(
    'No supported Chromium browser found. Set CHROMIUM_PATH environment variable or ensure Chromium/Chrome is installed.'
  );
}

/**
 * Launches a safe headless Chromium instance with security sandboxing flags.
 */
export async function launchAuditBrowser(): Promise<Browser> {
  const executablePath = getBrowserExecutablePath();

  return await chromium.launch({
    executablePath,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-blink-features=AutomationControlled',
      '--no-first-run',
      '--no-default-browser-check'
    ]
  });
}

/**
 * Creates an isolated browser context with anti-SSRF redirect filtering and realistic headers.
 */
export async function createAuditContext(
  browser: Browser,
  allowLoopback: boolean = process.env.NODE_ENV === 'test'
): Promise<BrowserContext> {
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 AccessAI/1.0 (+https://accessai.io/bot; WCAG 2.1 AA Auditor)',
    viewport: { width: 1280, height: 800 },
    locale: 'en-US',
    ignoreHTTPSErrors: true
  });

  // Anti-SSRF request routing: abort requests directed to private IPs or dangerous schemes
  await context.route('**/*', (route) => {
    const request = route.request();
    const requestUrl = request.url();

    try {
      const parsed = new URL(requestUrl);
      const host = parsed.hostname.toLowerCase();

      // In production, block all local/private hosts from being fetched as subresources or redirects
      if (!allowLoopback) {
        if (
          host === 'localhost' ||
          host === '127.0.0.1' ||
          host === '0.0.0.0' ||
          host === '::1' ||
          isPrivateIp(host)
        ) {
          return route.abort('blockedbyclient');
        }
      }

      // Block non-web schemes (file/chrome/etc.)
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:' && parsed.protocol !== 'data:') {
        return route.abort('blockedbyclient');
      }

      return route.continue();
    } catch {
      return route.abort('failed');
    }
  });

  return context;
}
