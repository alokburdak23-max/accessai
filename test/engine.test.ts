process.env.NODE_ENV = 'test';
import http from 'http';
import { validateScanUrl } from '../server/security.ts';
import { launchAuditBrowser } from '../server/browser.ts';
import { crawlAndAuditWebsite } from '../server/crawler.ts';
import { verifyAndCompareScans } from '../server/verifier.ts';
import {
  saveScan,
  getAllScans,
  getScanById,
  getMonitoredWebsites,
  getOverallStats,
  clearAllScans
} from '../server/storage.ts';

async function runTestSuite() {
  console.log('====================================================');
  console.log('🧪 ACCESSAI SCANNING ENGINE & INTEGRITY TEST SUITE');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`✅ [PASS] ${testName}`);
    } else {
      console.error(`❌ [FAIL] ${testName}${detail ? `: ${detail}` : ''}`);
      throw new Error(`Test failed: ${testName}`);
    }
  }

  // ----------------------------------------------------
  // TEST 1: URL Validation & Anti-SSRF Protections
  // ----------------------------------------------------
  console.log('--- Test Suite 1: Security & SSRF Protection ---');
  
  const invalid1 = await validateScanUrl('');
  assert(!invalid1.valid, 'Reject empty URL');

  const invalid2 = await validateScanUrl('ftp://example.com');
  assert(!invalid2.valid, 'Reject non-HTTP/HTTPS protocol (ftp://)');

  const invalid3 = await validateScanUrl('http://localhost:3000');
  assert(!invalid3.valid, 'Reject localhost URL');

  const invalid4 = await validateScanUrl('http://127.0.0.1:8080');
  assert(!invalid4.valid, 'Reject loopback IP (127.0.0.1)');

  const invalid5 = await validateScanUrl('http://169.254.169.254/latest/meta-data');
  assert(!invalid5.valid, 'Reject Cloud Metadata IP (169.254.169.254)');

  const invalid6 = await validateScanUrl('http://10.0.0.5/admin');
  assert(!invalid6.valid, 'Reject Private Class A IP (10.x.x.x)');

  const invalid7 = await validateScanUrl('http://192.168.1.1/router');
  assert(!invalid7.valid, 'Reject Private Class C IP (192.168.x.x)');

  const invalid8 = await validateScanUrl('http://user:pass@example.com');
  assert(!invalid8.valid, 'Reject embedded user credentials in URL');

  const validPublic = await validateScanUrl('example.com');
  console.log('validPublic result:', validPublic);
  assert(validPublic.valid && validPublic.normalizedUrl === 'https://example.com', 'Auto-prepend https:// and normalize public URL');

  // ----------------------------------------------------
  // TEST 2: Setting up Mock Multi-Page Website Fixture
  // ----------------------------------------------------
  console.log('\n--- Test Suite 2: Multi-Page Web Server Fixture ---');
  
  let page1AltFixed = false;
  let page1LabelFixed = false;

  const server = http.createServer((req, res) => {
    const url = req.url || '/';

    if (url === '/' || url === '/index.html') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <!DOCTYPE html>
        <html lang="en">
        <head><title>AccessAI Test Page</title></head>
        <body>
          <header>
            <nav>
              <a href="/about.html">About Us</a>
              <a href="/contact.html">Contact</a>
            </nav>
          </header>
          <main>
            <h1>Welcome to Testing Fixture</h1>
            <!-- Image with or without alt text -->
            ${page1AltFixed 
              ? '<img id="hero-img" src="hero.jpg" alt="A high-resolution dashboard preview">' 
              : '<img id="hero-img" src="hero.jpg">'}
            
            <!-- Button with low contrast -->
            <button id="contrast-btn" style="color: #999999; background-color: #ffffff;">Low Contrast Action</button>

            <!-- Form input with or without label -->
            ${page1LabelFixed
              ? '<label for="email-field">Your Email Address</label><input id="email-field" type="email">'
              : '<input id="email-field" type="email">'}
          </main>
        </body>
        </html>
      `);
      return;
    }

    if (url === '/about.html') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <!DOCTYPE html>
        <html lang="en">
        <head><title>About Us - AccessAI Test</title></head>
        <body>
          <main>
            <h1>About Us Page</h1>
            <p>We build accessible platforms.</p>
            <!-- Inaccessible link with no text -->
            <a id="empty-link" href="/contact.html"></a>
            <a href="/">Back Home</a>
          </main>
        </body>
        </html>
      `);
      return;
    }

    if (url === '/contact.html') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <!DOCTYPE html>
        <html lang="en">
        <head><title>Contact Us - AccessAI Test</title></head>
        <body>
          <main>
            <h1>Contact Form</h1>
            <form>
              <!-- Icon button without accessible name -->
              <button id="unnamed-icon-btn" type="submit"><svg width="16" height="16"></svg></button>
            </form>
          </main>
        </body>
        </html>
      `);
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  });

  // Listen on random port
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const address = server.address() as any;
  const fixturePort = address.port;
  const fixtureBaseUrl = `http://127.0.0.1:${fixturePort}`;
  console.log(`Local fixture server listening on ${fixtureBaseUrl}`);

  // ----------------------------------------------------
  // TEST 3: Browser Engine & Multi-Page Crawling
  // ----------------------------------------------------
  console.log('\n--- Test Suite 3: Real Browser Scanning & Multi-Page Crawl ---');

  const browser = await launchAuditBrowser();
  assert(Boolean(browser), 'Headless Chromium browser launched successfully');

  // We scan the fixture directly via browser engine
  const initialAudit = await crawlAndAuditWebsite(browser, fixtureBaseUrl, 3);
  console.log('initialAudit pageResults:', initialAudit.pagesList);

  assert(initialAudit.pagesScanned === 3, `Crawled 3 internal pages successfully (actual: ${initialAudit.pagesScanned})`);
  assert(initialAudit.pagesFailed === 0, 'Zero page load failures');
  assert(initialAudit.issues.length > 0, `Detected real accessibility violations (count: ${initialAudit.issues.length})`);

  // Verify specific axe-core violations were caught
  const ruleIds = initialAudit.issues.map((i) => i.ruleId);
  console.log('Detected axe-core rule violations:', Array.from(new Set(ruleIds)).join(', '));

  assert(ruleIds.includes('image-alt'), 'Detected missing image alt on hero image');
  assert(ruleIds.includes('color-contrast'), 'Detected sub-4.5:1 color contrast on button');
  assert(ruleIds.includes('label'), 'Detected unlabeled form input');
  assert(ruleIds.includes('button-name'), 'Detected unnamed button on contact form');

  // Verify scoring methodology
  const score1 = initialAudit.scoreBreakdown.score;
  console.log(`Initial Score calculated: ${score1}/100 (Status: ${initialAudit.scoreBreakdown.status})`);
  console.log(`Methodology formula: ${initialAudit.scoreBreakdown.methodology.formula}`);
  assert(score1 >= 15 && score1 <= 95, 'Score correctly calculated within expected bounds');

  // Verify AI Fix Generation
  assert(initialAudit.fixes.length === initialAudit.issues.length, 'Generated 1:1 AI Fix recommendations for each violation');
  const heroFix = initialAudit.fixes.find((f) => f.issueTitle.toLowerCase().includes('image') || f.originalSnippet.includes('hero.jpg'));
  assert(Boolean(heroFix), 'Generated AI Fix for hero image');
  assert(heroFix?.suggestedSnippet.includes('alt="'), 'AI fix snippet contains corrected alt="..." attribute');
  assert(heroFix?.status === 'suggested', 'Fix initialized with status "suggested"');

  // ----------------------------------------------------
  // TEST 4: Persistence in Database & Single Source of Truth
  // ----------------------------------------------------
  console.log('\n--- Test Suite 4: Database Persistence & Consistency ---');

  clearAllScans();
  assert(getAllScans().length === 0, 'Database reset cleanly (0 scans)');

  saveScan(initialAudit);
  assert(getAllScans().length === 1, 'Saved real scan to database (1 record)');

  const fetched = getScanById(initialAudit.scanId);
  assert(Boolean(fetched && fetched.scanId === initialAudit.scanId), 'Retrieved exact scan by ID from database');
  assert(fetched?.websiteUrl === fixtureBaseUrl, 'Stored website URL matches');
  assert(fetched?.scoreBreakdown.score === score1, 'Stored accessibility score matches');

  const monitored = getMonitoredWebsites();
  assert(monitored.length === 1, 'Monitored websites table reflects exactly 1 scanned domain');
  assert(monitored[0].url === fixtureBaseUrl, 'Monitored website URL matches');

  const stats = getOverallStats();
  assert(stats.totalWebsites === 1, 'Overall stats: exactly 1 website monitored');
  assert(stats.latestScore === score1, 'Overall stats: latest score matches scan');
  assert(stats.totalIssuesDetected === initialAudit.issues.length, 'Overall stats: issues detected matches audit');
  assert(stats.totalIssuesResolved === 0, 'Overall stats: 0 resolved before verification');

  // ----------------------------------------------------
  // TEST 5: Rescan & Real Verification Workflow
  // ----------------------------------------------------
  console.log('\n--- Test Suite 5: Rescan & Fix Verification ---');

  // Developer applies fixes to their website:
  page1AltFixed = true; // Added alt text
  page1LabelFixed = true; // Added label

  console.log('Simulating developer applying fixes (added alt text + associated form label)...');
  
  const rescanAudit = await crawlAndAuditWebsite(browser, fixtureBaseUrl, 3);
  const comparison = verifyAndCompareScans(initialAudit, rescanAudit);

  console.log(`Rescan Score: ${comparison.newScore}/100 (Delta: +${comparison.scoreImprovement} points)`);
  console.log(`Verified Resolved count: ${comparison.totalResolvedCount}`);
  console.log(`Remaining violations count: ${comparison.remainingCount}`);

  assert(comparison.totalResolvedCount >= 2, `Verified at least 2 issues resolved (actual: ${comparison.totalResolvedCount})`);
  assert(comparison.scoreImprovement > 0, `Score increased after applying fixes (+${comparison.scoreImprovement} pts)`);
  
  const resolvedRules = comparison.resolvedIssues.map((i: any) => i.ruleId);
  assert(resolvedRules.includes('image-alt'), 'Image-alt violation verified resolved by rescan!');
  assert(resolvedRules.includes('label'), 'Form label violation verified resolved by rescan!');

  // Save the verified rescan
  saveScan(rescanAudit);
  assert(getAllScans().length === 2, 'History now accurately contains 2 chronological scans');

  // Clean up
  await browser.close();
  await new Promise<void>((resolve) => server.close(() => resolve()));

  console.log('\n====================================================');
  console.log(`🎉 ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
  console.log('====================================================\n');
}

runTestSuite().catch((err) => {
  console.error('\n❌ TEST SUITE FAILED:', err);
  process.exit(1);
});
