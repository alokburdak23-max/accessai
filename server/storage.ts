import fs from 'fs';
import path from 'path';
import { type CrawlAuditResult } from './crawler.ts';

export interface WidgetSiteConfig {
  siteId: string;
  domain: string;
  name?: string;
  enabledFeatures: {
    textResize: boolean;
    dyslexiaFont: boolean;
    highContrast: boolean;
    keyboardFocus: boolean;
    voiceControl: boolean;
    readingRuler: boolean;
    screenReaderAnnounce: boolean;
  };
  position: 'bottom-right' | 'bottom-left';
  primaryColor: string;
  allowedOrigins?: string[];
  createdAt: string;
}

export interface StorageData {
  scans: CrawlAuditResult[];
  demoMode: boolean;
  sites: WidgetSiteConfig[];
  geminiApiKey?: string;
  lastUpdated: string;
}

const DATA_DIR = path.resolve(process.env.DATA_DIR || 'data');
const DB_FILE = path.join(DATA_DIR, 'accessai-db.json');

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * Reads database state from disk.
 * If file does not exist, copies seed data if available, or returns empty state.
 */
export function readDatabase(): StorageData {
  ensureDataDir();
  if (!fs.existsSync(DB_FILE)) {
    // Check if initial seed database exists in project ./data/accessai-db.json
    const defaultSeedPath = path.resolve('data', 'accessai-db.json');
    if (defaultSeedPath !== DB_FILE && fs.existsSync(defaultSeedPath)) {
      try {
        const seedRaw = fs.readFileSync(defaultSeedPath, 'utf8');
        fs.writeFileSync(DB_FILE, seedRaw, 'utf8');
        console.log(`Initialized persistent database at ${DB_FILE} from seed`);
        const parsed = JSON.parse(seedRaw);
        if (!Array.isArray(parsed.sites)) parsed.sites = [];
        if (!parsed.geminiApiKey) parsed.geminiApiKey = process.env.GEMINI_API_KEY || '';
        return parsed;
      } catch (seedErr) {
        console.warn('Failed to copy seed database, initializing fresh:', seedErr);
      }
    }

    const initialData: StorageData = {
      scans: [],
      demoMode: false,
      sites: [],
      geminiApiKey: process.env.GEMINI_API_KEY || '',
      lastUpdated: new Date().toISOString()
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf8');
    return initialData;
  }

  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.sites)) {
      parsed.sites = [];
    }
    if (!parsed.geminiApiKey) {
      parsed.geminiApiKey = process.env.GEMINI_API_KEY || '';
    }
    return parsed;
  } catch (err) {
    console.error('Failed to parse database, resetting to empty:', err);
    const resetData: StorageData = {
      scans: [],
      demoMode: false,
      sites: [],
      geminiApiKey: process.env.GEMINI_API_KEY || '',
      lastUpdated: new Date().toISOString()
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(resetData, null, 2), 'utf8');
    return resetData;
  }
}

/**
 * Writes database state to disk.
 */
export function writeDatabase(data: StorageData): void {
  ensureDataDir();
  data.lastUpdated = new Date().toISOString();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * Retrieves all stored scans, sorted newest first.
 */
export function getAllScans(): CrawlAuditResult[] {
  const db = readDatabase();
  return db.scans.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

/**
 * Retrieves a single scan by ID.
 */
export function getScanById(scanId: string): CrawlAuditResult | undefined {
  const db = readDatabase();
  return db.scans.find((s) => s.scanId === scanId);
}

/**
 * Saves a new scan or replaces an existing one.
 */
export function saveScan(newScan: CrawlAuditResult): void {
  const db = readDatabase();
  const existingIdx = db.scans.findIndex((s) => s.scanId === newScan.scanId);
  if (existingIdx >= 0) {
    db.scans[existingIdx] = newScan;
  } else {
    db.scans.unshift(newScan);
  }
  writeDatabase(db);
}

/**
 * Deletes a scan by ID.
 */
export function deleteScan(scanId: string): boolean {
  const db = readDatabase();
  const initialLen = db.scans.length;
  db.scans = db.scans.filter((s) => s.scanId !== scanId);
  if (db.scans.length !== initialLen) {
    writeDatabase(db);
    return true;
  }
  return false;
}

/**
 * Updates a fix suggestion status across scans.
 */
export function updateFixStatus(
  fixId: string,
  status: 'suggested' | 'approved' | 'rejected' | 'applied' | 'verified'
): boolean {
  const db = readDatabase();
  let found = false;

  for (const scan of db.scans) {
    for (const fix of scan.fixes) {
      if (fix.id === fixId) {
        fix.status = status;
        fix.approved = status === 'approved' || status === 'applied' || status === 'verified';
        found = true;

        // If verified, mark corresponding issue as resolved
        if (status === 'verified') {
          for (const iss of scan.issues) {
            if (iss.id === fix.issueId) {
              iss.status = 'resolved';
            }
          }
        }
      }
    }
  }

  if (found) {
    writeDatabase(db);
  }
  return found;
}

/**
 * Computes monitored websites list derived from actual scans.
 */
export function getMonitoredWebsites(): any[] {
  const db = readDatabase();
  const map = new Map<string, any>();

  // Process scans from oldest to newest so latest scan values override
  const chronoSorted = [...db.scans].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  for (const scan of chronoSorted) {
    const existing = map.get(scan.websiteUrl);
    const score = scan.scoreBreakdown.score;
    const issuesCount = scan.issues.filter((i) => i.status !== 'resolved').length;
    const previousScore = existing ? existing.score : score;
    const scoreDelta = score - previousScore;

    map.set(scan.websiteUrl, {
      url: scan.websiteUrl,
      domain: scan.domain,
      score,
      status: scan.scoreBreakdown.status,
      issuesCount,
      pagesCount: scan.pagesScanned,
      lastScanned: new Date(scan.timestamp).toISOString().replace('T', ' ').slice(0, 16),
      scanId: scan.scanId,
      scoreDelta
    });
  }

  return Array.from(map.values()).reverse();
}

/**
 * Computes overall aggregated dashboard statistics from actual scan records.
 */
export function getOverallStats() {
  const db = readDatabase();
  const scans = db.scans;

  if (scans.length === 0) {
    return {
      totalWebsites: 0,
      latestScore: 0,
      totalIssuesDetected: 0,
      totalIssuesResolved: 0,
      hasScans: false
    };
  }

  const websites = getMonitoredWebsites();
  const latestScan = getAllScans()[0];

  let totalIssuesDetected = 0;
  let totalIssuesResolved = 0;

  // Count active violations and resolved items from all latest site audits
  scans.forEach((s) => {
    s.issues.forEach((iss) => {
      if (iss.status === 'resolved') {
        totalIssuesResolved++;
      } else {
        totalIssuesDetected++;
      }
    });
  });

  return {
    totalWebsites: websites.length,
    latestScore: latestScan ? latestScan.scoreBreakdown.score : 0,
    totalIssuesDetected,
    totalIssuesResolved,
    hasScans: true,
    latestScanId: latestScan?.scanId
  };
}

/**
 * Sets or retrieves demo mode flag.
 */
export function isDemoMode(): boolean {
  return readDatabase().demoMode;
}

export function setDemoMode(active: boolean): void {
  const db = readDatabase();
  db.demoMode = active;
  writeDatabase(db);
}

/**
 * Clears all real data (resets to 0 scans).
 */
export function clearAllScans(): void {
  const db = readDatabase();
  db.scans = [];
  writeDatabase(db);
}

/**
 * Retrieves all registered widget sites.
 */
export function getAllSites(): WidgetSiteConfig[] {
  const db = readDatabase();
  return db.sites || [];
}

/**
 * Gets site configuration by siteId.
 */
export function getSiteConfig(siteId: string): WidgetSiteConfig | undefined {
  const db = readDatabase();
  return (db.sites || []).find((s) => s.siteId === siteId);
}

/**
 * Saves or updates a widget site configuration.
 */
export function saveSiteConfig(config: WidgetSiteConfig): void {
  const db = readDatabase();
  if (!db.sites) db.sites = [];
  const idx = db.sites.findIndex((s) => s.siteId === config.siteId);
  if (idx >= 0) {
    db.sites[idx] = config;
  } else {
    db.sites.push(config);
  }
  writeDatabase(db);
}

/**
 * Deletes a registered site.
 */
export function deleteSiteConfig(siteId: string): boolean {
  const db = readDatabase();
  if (!db.sites) return false;
  const initialLen = db.sites.length;
  db.sites = db.sites.filter((s) => s.siteId !== siteId);
  if (db.sites.length !== initialLen) {
    writeDatabase(db);
    return true;
  }
  return false;
}

/**
 * Gets the configured Gemini API key.
 */
export function getGeminiApiKey(): string {
  const db = readDatabase();
  return db.geminiApiKey || process.env.GEMINI_API_KEY || '';
}

/**
 * Sets the Gemini API key.
 */
export function setGeminiApiKey(apiKey: string): void {
  const db = readDatabase();
  db.geminiApiKey = apiKey.trim();
  writeDatabase(db);
}
