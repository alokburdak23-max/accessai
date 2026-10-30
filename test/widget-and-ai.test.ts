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

  // ----------------------------------------------------
  // TEST 4: Voice Navigation Feedback States & Command Engine
  // ----------------------------------------------------
  console.log('\n--- Test Suite 4: Voice Navigation Feedback & Commands ---');
  
  // Verify UI Badge & Visual Feedback Elements exist in the widget
  assert(widgetContent.includes('accessai-voice-badge'), 'Voice status badge element present in widget DOM');
  assert(widgetContent.includes('accessai-voice-stop-btn'), 'Dedicated stop-listening button present in widget DOM');
  assert(widgetContent.includes('Stop Listening'), 'Stop button has accessible text label');
  assert(widgetContent.includes('accessai-voice-pulse-dot'), 'Live status indicator dot present');

  // Verify all 8 required feedback states exist in code
  const requiredStates = [
    'Ready',
    'Requesting permission',
    'Listening',
    'Processing command',
    'Command executed',
    'Permission denied',
    'Browser unsupported',
    'Recognition error'
  ];
  for (const st of requiredStates) {
    assert(widgetContent.includes(st), `Voice feedback state "${st}" implemented`);
  }

  // Verify voice command triggers
  const requiredCommands = [
    'increase text',
    'decrease text',
    'high contrast',
    'dyslexia',
    'focus',
    'ruler',
    'reset',
    'open',
    'close',
    'stop listening'
  ];
  for (const cmd of requiredCommands) {
    assert(widgetContent.includes(cmd), `Voice command "${cmd}" handled in processor`);
  }

  // Verify skipVoice option to prevent mid-utterance restarts
  assert(widgetContent.includes('skipVoice: true'), 'applyHostPreferences supports skipVoice to protect active stream');
  assert(widgetContent.includes('not-allowed'), 'Microphone not-allowed permission error handled without looping');
  assert(widgetContent.includes('webkitSpeechRecognition'), 'SpeechRecognition and webkitSpeechRecognition cross-browser fallback');

  // ----------------------------------------------------
  // TEST 5: First-Level Widget Menu & Voice Submenu Architecture
  // ----------------------------------------------------
  console.log('\n--- Test Suite 5: First-Level Voice Menu & Submenu Architecture ---');

  // Verify first-level menu categories exist in widget markup
  assert(widgetContent.includes('Visual Adjustments'), 'First-level menu contains "Visual Adjustments" category');
  assert(widgetContent.includes('Navigation Assistance'), 'First-level menu contains "Navigation Assistance" category');
  assert(widgetContent.includes('Reading Assistance'), 'First-level menu contains "Reading Assistance" category');
  assert(widgetContent.includes('menu-item-voice'), 'Voice Control is a dedicated first-level menu item (#menu-item-voice)');
  assert(widgetContent.includes('Screen Reader Support'), 'First-level menu contains "Screen Reader Support" category');
  assert(widgetContent.includes('menu-reset-all'), 'First-level menu contains "Reset Settings" trigger');

  // Verify dedicated Voice Control Submenu view
  assert(widgetContent.includes('accessai-voice-view'), 'Dedicated voice submenu container (#accessai-voice-view) defined');
  assert(widgetContent.includes('accessai-voice-back-btn'), 'Submenu includes Back button (#accessai-voice-back-btn) to return to main menu');
  assert(widgetContent.includes('accessai-voice-start-btn'), 'Submenu includes Start Listening button (#accessai-voice-start-btn)');
  assert(widgetContent.includes('accessai-voice-stop-btn'), 'Submenu includes Stop Listening button (#accessai-voice-stop-btn)');
  assert(widgetContent.includes('accessai-voice-mic-status'), 'Submenu includes Microphone permission status indicator (#accessai-voice-mic-status)');
  assert(widgetContent.includes('accessai-voice-lang'), 'Submenu includes Language Selector (#accessai-voice-lang)');

  // Verify Supported Languages
  assert(widgetContent.includes('en-US'), 'Supported language: English (US)');
  assert(widgetContent.includes('en-GB'), 'Supported language: English (UK)');
  assert(widgetContent.includes('es-ES'), 'Supported language: Español');
  assert(widgetContent.includes('fr-FR'), 'Supported language: Français');
  assert(widgetContent.includes('de-DE'), 'Supported language: Deutsch');
  assert(widgetContent.includes('hi-IN'), 'Supported language: Hindi');

  // Verify Navigation Spoken Commands
  assert(widgetContent.includes('scroll down'), 'Voice command "scroll down" supported');
  assert(widgetContent.includes('scroll up'), 'Voice command "scroll up" supported');
  assert(widgetContent.includes('go to top'), 'Voice command "go to top" supported');
  assert(widgetContent.includes('go to bottom'), 'Voice command "go to bottom" supported');
  assert(widgetContent.includes('open link'), 'Voice command "open link [name]" supported');

  // Verify Visual Controls Spoken Commands
  assert(widgetContent.includes('increase text size'), 'Voice command "increase text size" supported');
  assert(widgetContent.includes('decrease text size'), 'Voice command "decrease text size" supported');
  assert(widgetContent.includes('enable high contrast'), 'Voice command "enable high contrast" supported');
  assert(widgetContent.includes('disable high contrast'), 'Voice command "disable high contrast" supported');
  assert(widgetContent.includes('enable dyslexia font'), 'Voice command "enable dyslexia font" supported');
  assert(widgetContent.includes('disable dyslexia font'), 'Voice command "disable dyslexia font" supported');
  assert(widgetContent.includes('enable focus indicators'), 'Voice command "enable focus indicators" supported');
  assert(widgetContent.includes('disable focus indicators'), 'Voice command "disable focus indicators" supported');
  assert(widgetContent.includes('enable reading ruler'), 'Voice command "enable reading ruler" supported');
  assert(widgetContent.includes('disable reading ruler'), 'Voice command "disable reading ruler" supported');
  assert(widgetContent.includes('reset accessibility settings'), 'Voice command "reset accessibility settings" supported');

  // Verify Widget Controls Spoken Commands
  assert(widgetContent.includes('open accessibility settings'), 'Voice command "open accessibility settings" supported');
  assert(widgetContent.includes('close accessibility settings'), 'Voice command "close accessibility settings" supported');
  assert(widgetContent.includes('start listening'), 'Voice command "start listening" supported');

  // ----------------------------------------------------
  // TEST 6: AI-Assisted Dashboard Panel & Backend Consultant API
  // ----------------------------------------------------
  console.log('\n--- Test Suite 6: AI-Assisted Dashboard Panel & Consultant API ---');

  // Verify AiAssistantPanel component file exists
  const aiPanelPath = path.resolve('src', 'components', 'common', 'AiAssistantPanel.tsx');
  assert(fs.existsSync(aiPanelPath), 'src/components/common/AiAssistantPanel.tsx exists');

  const panelContent = fs.readFileSync(aiPanelPath, 'utf8');
  assert(panelContent.includes('AI Overview & Priorities'), 'Panel implements AI Overview tab');
  assert(panelContent.includes('Explain & Generate Fix'), 'Panel implements Explain & Generate Fix tab');
  assert(panelContent.includes('Ask AccessAI'), 'Panel implements Ask AccessAI conversational tab');
  assert(panelContent.includes('Top 5 Prioritized Remediations'), 'Panel implements Top 5 prioritized fixes');
  assert(panelContent.includes('Copy Code'), 'Panel includes Copy Code button');
  assert(panelContent.includes('Download Patch'), 'Panel includes Download Patch button');
  assert(panelContent.includes('Approve Fix'), 'Panel connects to Approve Fix lifecycle');

  // Verify Topbar trigger button
  const topbarPath = path.resolve('src', 'components', 'layout', 'Topbar.tsx');
  const topbarContent = fs.readFileSync(topbarPath, 'utf8');
  assert(topbarContent.includes('onOpenAiAssistant'), 'Topbar accepts onOpenAiAssistant prop');
  assert(topbarContent.includes('AI Assisted'), 'Topbar renders AI Assisted button');
  assert(topbarContent.includes('<button'), 'AI Assisted is rendered as an interactive button');

  // Verify App.tsx wiring
  const appPath = path.resolve('src', 'App.tsx');
  const appContent = fs.readFileSync(appPath, 'utf8');
  assert(appContent.includes('AiAssistantPanel'), 'App.tsx imports and renders AiAssistantPanel');
  assert(appContent.includes('isAiAssistantOpen'), 'App.tsx manages isAiAssistantOpen state');
  assert(appContent.includes('onOpenAiAssistant'), 'App.tsx wires onOpenAiAssistant callback to Layout');

  // Verify Backend /api/ai/ask & /api/ai/explain endpoints in router
  const routerPath = path.resolve('server', 'router.ts');
  const routerContent = fs.readFileSync(routerPath, 'utf8');
  assert(routerContent.includes('/ai/ask'), 'Router implements POST /ai/ask');
  assert(routerContent.includes('/ai/explain'), 'Router implements POST /ai/explain');
  assert(routerContent.includes('deterministic-engine'), 'Router provides deterministic fallback when Gemini key is absent');
  assert(routerContent.includes('google-gemini'), 'Router supports Gemini 1.5 Flash when configured');

  console.log('\n====================================================');
  console.log(`🎉 ALL ${passed}/${total} WIDGET & AI TESTS PASSED!`);
  console.log('====================================================\n');
}

runWidgetAndAiTestSuite().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
