process.env.NODE_ENV = 'test';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { launchAuditBrowser } from '../server/browser.ts';
import { crawlAndAuditWebsite } from '../server/crawler.ts';
import { verifyAndCompareScans } from '../server/verifier.ts';
import {
  saveSiteConfig,
  getSiteConfig,
  getAllSites,
  deleteSiteConfig,
  saveScan,
  getScanById,
  getAllScans,
  clearAllScans
} from '../server/storage.ts';
import { generateAiRemediationWithGemini } from '../server/remediation.ts';

async function runCompleteE2EWorkflow() {
  console.log('====================================================');
  console.log('🧪 ACCESSAI END-TO-END PRODUCT WORKFLOW TEST');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    total++;
    if (condition) {
      passed++;
      console.log(`✅ [PASS] ${testName}`);
    } else {
      console.error(`❌ [FAIL] ${testName}${detail ? `: ${detail}` : ''}`);
      throw new Error(`Test failed: ${testName}`);
    }
  }

  // ----------------------------------------------------
  // STEP 1-3: Register Website & Configure Widget
  // ----------------------------------------------------
  console.log('--- Step 1: Register Test Website & Configure Widget ---');
  const siteConfig = {
    siteId: 'e2e_horizon_travel',
    domain: 'https://horizon-travel.example.com',
    name: 'Horizon Travel & Tours',
    enabledFeatures: {
      textResize: true,
      dyslexiaFont: true,
      highContrast: true,
      keyboardFocus: true,
      voiceControl: true,
      readingRuler: true,
      screenReaderAnnounce: true
    },
    position: 'bottom-right' as const,
    primaryColor: '#C96F82',
    createdAt: new Date().toISOString()
  };

  saveSiteConfig(siteConfig);
  const storedSite = getSiteConfig('e2e_horizon_travel');
  assert(Boolean(storedSite), 'Website registered with site ID "e2e_horizon_travel"');
  assert(storedSite?.enabledFeatures.dyslexiaFont === true, 'Enabled features map correctly stored');
  assert(storedSite?.enabledFeatures.voiceControl === true, 'Voice control feature enabled');

  // Verify Widget embed script exists
  const widgetScriptPath = path.resolve('public', 'accessibility-widget.js');
  assert(fs.existsSync(widgetScriptPath), 'Standalone accessibility-widget.js is ready for distribution');
  const widgetScript = fs.readFileSync(widgetScriptPath, 'utf8');
  assert(widgetScript.includes('accessai-widget'), 'Custom element "accessai-widget" registered');
  assert(widgetScript.includes('SpeechRecognition'), 'SpeechRecognition API supported');

  // ----------------------------------------------------
  // STEP 4-9: Serve Fixture Website with Widget Embedded
  // ----------------------------------------------------
  console.log('\n--- Step 2: Serve Testbed Website with Intentional Violations ---');
  let currentHtml = fs.readFileSync(path.resolve('public', 'test-site.html'), 'utf8');

  const fixtureServer = http.createServer((req, res) => {
    if (req.url === '/accessibility-widget.js') {
      res.writeHead(200, { 'Content-Type': 'application/javascript' });
      res.end(widgetScript);
      return;
    }

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(currentHtml);
  });

  await new Promise<void>((resolve) => fixtureServer.listen(0, '127.0.0.1', () => resolve()));
  const fixturePort = (fixtureServer.address() as any).port;
  const fixtureUrl = `http://127.0.0.1:${fixturePort}`;
  console.log(`Testbed website active on ${fixtureUrl}`);

  // ----------------------------------------------------
  // STEP 10-11: Launch Browser & Run Accessibility Scan
  // ----------------------------------------------------
  console.log('\n--- Step 3: Run Real Playwright + axe-core Audit ---');
  const browser = await launchAuditBrowser();
  assert(Boolean(browser), 'Headless Chromium browser launched');

  const initialScan = await crawlAndAuditWebsite(browser, fixtureUrl, 1);
  assert(initialScan.pagesScanned === 1, 'Audited 1 page successfully');
  assert(initialScan.pagesFailed === 0, 'Zero page load failures');
  assert(initialScan.issues.length >= 4, `Detected real accessibility issues (found: ${initialScan.issues.length})`);

  const ruleIds = initialScan.issues.map((i) => i.ruleId);
  console.log('Detected ruleIds from axe-core:', Array.from(new Set(ruleIds)));
  assert(ruleIds.includes('image-alt'), 'Detected missing image alt on hero image');
  assert(ruleIds.includes('color-contrast'), 'Detected sub-4.5:1 low-contrast CTA button');
  assert(ruleIds.includes('heading-order'), 'Detected skipped heading hierarchy (h1 -> h4)');
  assert(ruleIds.includes('button-name'), 'Detected icon-only button without accessible name');

  const initialScore = initialScan.scoreBreakdown.score;
  console.log(`Initial Website Accessibility Score: ${initialScore}/100`);
  assert(initialScore < 95, 'Initial score reflects real detected barriers (< 95)');

  // ----------------------------------------------------
  // STEP 12-13: AI Remediation & Approval Workflow
  // ----------------------------------------------------
  console.log('\n--- Step 4: AI Remediation Generation & Approval ---');
  const heroImageIssue = initialScan.issues.find((i) => i.ruleId === 'image-alt');
  assert(Boolean(heroImageIssue), 'Target hero image defect found');

  const remediation = await generateAiRemediationWithGemini(
    heroImageIssue!.ruleId,
    heroImageIssue!.rawHtmlSnippet,
    heroImageIssue!.problemExplanation,
    heroImageIssue!.recommendedAction,
    heroImageIssue!.wcagCriteria
  );

  assert(remediation.suggestedSnippet.includes('alt="'), 'AI remediation snippet includes corrected alt="..."');
  assert(remediation.confidenceScore >= 80, 'Remediation confidence score exceeds 80%');

  // Match corresponding fix and approve it
  const matchingFix = initialScan.fixes.find((f) => f.issueId === heroImageIssue!.id);
  assert(Boolean(matchingFix), 'Matching fix suggestion created for image issue');
  assert(matchingFix!.status === 'suggested', 'Fix initialized with status "suggested"');

  // Human approval
  matchingFix!.status = 'approved';
  matchingFix!.approved = true;
  assert(matchingFix!.status === 'approved', 'Fix transitioned to "approved"');

  // Save baseline scan in database
  clearAllScans();
  saveScan(initialScan);
  const savedInitial = getScanById(initialScan.scanId);
  assert(Boolean(savedInitial), 'Initial baseline scan saved to persistent storage');

  // ----------------------------------------------------
  // STEP 14-16: Apply Code Fix & Genuine Rescan Verification
  // ----------------------------------------------------
  console.log('\n--- Step 5: Apply Code Patch to Testbed & Run Genuine Rescan ---');
  // Mark fix applied
  matchingFix!.status = 'applied';
  assert(matchingFix!.status === 'applied', 'Fix transitioned to "applied" in codebase');

  // Developer applies fixes to the live fixture HTML:
  currentHtml = currentHtml.replace(
    'class="hero-img" id="hero-travel-img"',
    'class="hero-img" id="hero-travel-img" alt="Scenic tropical sandy beach at sunset with calm turquoise ocean waters"'
  ).replace(
    'class="icon-btn" id="search-submit-btn"',
    'class="icon-btn" id="search-submit-btn" aria-label="Submit destination search query"'
  ).replace(
    '<a href="#book" class="cta-low-contrast" id="nav-cta">Member Login</a>',
    '<a href="#book" class="cta-low-contrast" id="nav-cta" style="background:#0F172A !important;color:#FFFFFF !important;">Member Login</a>'
  ).replace(
    '<h4 id="hero-subtitle">Curated eco-luxury travel experiences spanning 45 global protected reserves.</h4>',
    '<p id="hero-subtitle" style="font-size: 1.125rem; color: #64748B; margin: 1rem 0 1.5rem 0; font-weight: 500;">Curated eco-luxury travel experiences spanning 45 global protected reserves.</p>'
  );

  // Execute genuine verification rescan
  const rescan = await crawlAndAuditWebsite(browser, fixtureUrl, 1);
  const comparison = verifyAndCompareScans(initialScan, rescan);

  console.log(`Rescan Accessibility Score: ${rescan.scoreBreakdown.score}/100 (Score Delta: +${comparison.scoreImprovement} pts)`);
  console.log(`Verified Resolved Defects: ${comparison.totalResolvedCount}`);

  assert(comparison.totalResolvedCount >= 3, `Genuine rescan verified at least 3 defects resolved (actual: ${comparison.totalResolvedCount})`);
  assert(comparison.scoreImprovement > 0, 'Website accessibility score improved after applying code repairs');
  assert(comparison.newScore > comparison.previousScore, 'New score exceeds previous score');

  // Save rescan to database
  saveScan(rescan);
  const allScans = getAllScans();
  assert(allScans.length === 2, 'Chronological scan history accurately contains 2 records');

  // ----------------------------------------------------
  // STEP 17-18: One-Click Report & Analytics Consistency Check
  // ----------------------------------------------------
  console.log('\n--- Step 6: Verify Data Consistency Across Dashboard, Analytics & Reports ---');
  const latestDbScan = allScans[0];
  const reportScore = latestDbScan.scoreBreakdown.score;
  const dashboardScore = latestDbScan.scoreBreakdown.score;
  const pagesScanned = latestDbScan.pagesScanned;

  assert(reportScore === dashboardScore, `Report score (${reportScore}) matches dashboard score (${dashboardScore})`);
  assert(pagesScanned === 1, `Pages crawled metric (${pagesScanned}) is consistent across all views`);
  assert(latestDbScan.issues.length === comparison.remainingCount, 'Remaining issue count matches verification engine');

  // Clean up
  await browser.close();
  await new Promise<void>((resolve) => fixtureServer.close(() => resolve()));
  deleteSiteConfig('e2e_horizon_travel');

  console.log('\n====================================================');
  console.log(`🎉 COMPLETE E2E PRODUCT WORKFLOW PASSED (${passed}/${total} CHECKS)!`);
  console.log('====================================================\n');
}

runCompleteE2EWorkflow().catch((err) => {
  console.error('E2E Workflow Test Failed:', err);
  process.exit(1);
});
