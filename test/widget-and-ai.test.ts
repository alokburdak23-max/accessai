import fs from 'fs';
import path from 'path';
import {
  saveSiteConfig,
  getSiteConfig,
  getAllSites,
  deleteSiteConfig,
  getGeminiApiKey,
  setGeminiApiKey
} from '../server/storage.ts';
import { generateAiRemediationWithGemini } from '../server/remediation.ts';

async function runWidgetAndAiTestSuite() {
  console.log('====================================================');
  console.log('🧪 ACCESSAI WIDGET & AI REMEDIATION TEST SUITE');
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
  // TEST 1: Standalone Accessibility Widget Script Verification
  // ----------------------------------------------------
  console.log('--- Test Suite 1: Standalone Accessibility Widget File ---');
  const widgetPath = path.resolve('public', 'accessibility-widget.js');
  assert(fs.existsSync(widgetPath), 'public/accessibility-widget.js file exists');

  const widgetContent = fs.readFileSync(widgetPath, 'utf8');
  assert(widgetContent.length > 1000, 'Widget script is populated (> 1KB bundle)');
  assert(widgetContent.includes('attachShadow({ mode: \'open\' })'), 'Uses Shadow DOM for CSS isolation');
  assert(widgetContent.includes('accessai-font-110'), 'Supports text resizing styling');
  assert(widgetContent.includes('accessai-dyslexia'), 'Supports dyslexia font stack');
  assert(widgetContent.includes('accessai-high-contrast'), 'Supports high contrast dark mode');
  assert(widgetContent.includes('accessai-focus-ring'), 'Supports visible focus ring');
  assert(widgetContent.includes('accessai-reading-ruler-bar'), 'Supports reading ruler guide');
  assert(widgetContent.includes('handleVoiceCommand'), 'Implements voice command processor');
  assert(widgetContent.includes('SpeechRecognition'), 'Supports Web Speech API');
  assert(widgetContent.includes('aria-live'), 'Screen reader ARIA live region included');
  assert(widgetContent.includes('localStorage'), 'Persists visitor accessibility preferences');

  // ----------------------------------------------------
  // TEST 2: Widget Site Registration & Configuration Storage
  // ----------------------------------------------------
  console.log('\n--- Test Suite 2: Widget Configuration Storage ---');
  const testSite = {
    siteId: 'test_store_123',
    domain: 'https://test-store.example.com',
    name: 'Test Store Online',
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

  saveSiteConfig(testSite);
  const retrieved = getSiteConfig('test_store_123');
  assert(!!retrieved, 'Persisted widget site config found');
  assert(retrieved?.domain === 'https://test-store.example.com', 'Stored domain matches');
  assert(retrieved?.primaryColor === '#C96F82', 'Stored primary color matches');
  assert(retrieved?.enabledFeatures?.dyslexiaFont === true, 'Enabled features map preserved');

  const allSites = getAllSites();
  assert(allSites.some(s => s.siteId === 'test_store_123'), 'Site listed in getAllSites()');

  const deleted = deleteSiteConfig('test_store_123');
  assert(deleted, 'Successfully deleted test site');
  assert(!getSiteConfig('test_store_123'), 'Deleted site no longer exists in DB');

  // ----------------------------------------------------
  // TEST 3: AI Settings & Remediation Engine
  // ----------------------------------------------------
  console.log('\n--- Test Suite 3: AI Settings & Heuristic Fallback ---');
  setGeminiApiKey('test_fake_api_key_for_unit_tests');
  assert(getGeminiApiKey() === 'test_fake_api_key_for_unit_tests', 'Gemini API key saved & retrieved');
  setGeminiApiKey(''); // Reset to empty

  // Test Image Alt Fix Remediation
  const imgRemediation = await generateAiRemediationWithGemini(
    'image-alt',
    '<img src="/logo.png" class="header-logo">',
    'Images must have alternate text',
    'Add an alt attribute',
    'WCAG 1.1.1 Non-text Content (Level A)'
  );
  assert(imgRemediation.suggestedSnippet.includes('alt="'), 'Image fix generates alt attribute');
  assert(imgRemediation.confidenceScore > 80, 'Confidence score exceeds 80%');
  assert(typeof imgRemediation.whatIsWrong === 'string', 'Generated clear whatIsWrong explanation');
  assert(typeof imgRemediation.howSolutionFixesIt === 'string', 'Generated actionable howSolutionFixesIt');

  // Test Form Label Fix Remediation
  const formRemediation = await generateAiRemediationWithGemini(
    'label',
    '<input type="text" name="search" placeholder="Search...">',
    'Form elements must have labels',
    'Associate label with input',
    'WCAG 3.3.2 Labels or Instructions (Level A)'
  );
  assert(formRemediation.suggestedSnippet.includes('<label'), 'Form input fix associates label');

  // Test Button Name Fix Remediation
  const btnRemediation = await generateAiRemediationWithGemini(
    'button-name',
    '<button class="icon-btn"><svg></svg></button>',
    'Buttons must have discernible text',
    'Add accessible name',
    'WCAG 4.1.2 Name, Role, Value (Level A)'
  );
  assert(btnRemediation.suggestedSnippet.includes('aria-label="'), 'Button fix adds aria-label');

  console.log('\n====================================================');
  console.log(`🎉 ALL ${passed}/${total} WIDGET & AI TESTS PASSED!`);
  console.log('====================================================\n');
}

runWidgetAndAiTestSuite().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
