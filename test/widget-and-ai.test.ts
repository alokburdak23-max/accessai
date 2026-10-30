import fs from 'fs';
import path from 'path';
import http from 'http';
import { launchAuditBrowser } from '../server/browser.ts';
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

  // ----------------------------------------------------
  // TEST 7: Floating Accessibility Launcher in Main AccessAI Application
  // ----------------------------------------------------
  console.log('\n--- Test Suite 7: Floating Accessibility Launcher in Main AccessAI Application ---');

  // 1. Verify index.html embeds the standalone accessibility widget
  const indexPath = path.resolve('index.html');
  assert(fs.existsSync(indexPath), 'index.html file exists');
  const indexContent = fs.readFileSync(indexPath, 'utf8');
  assert(indexContent.includes('accessibility-widget.js'), 'index.html embeds accessibility-widget.js');
  assert(indexContent.includes('data-site-id='), 'index.html defines data-site-id attribute for widget initialization');
  assert(indexContent.includes('defer'), 'index.html uses defer for non-blocking asynchronous execution');

  // 2. Verify App.tsx contains single initialization safeguard
  assert(appContent.includes('accessai-widget'), 'App.tsx verifies accessai-widget custom element presence');
  assert(appContent.includes('accessibility-widget.js'), 'App.tsx includes widget initialization safeguard');

  // 3. Verify public/accessibility-widget.js duplicate injection prevention
  assert(widgetContent.includes('__accessaiWidgetLoaded'), 'Widget includes global __accessaiWidgetLoaded guard preventing multiple loads');
  assert(widgetContent.includes('mountWidget'), 'Widget includes safe mountWidget lifecycle for DOM readiness');

  // 4. Verify ToastContainer is offset to prevent overlapping launcher button
  const toastContainerPath = path.resolve('src', 'components', 'common', 'ToastContainer.tsx');
  assert(fs.existsSync(toastContainerPath), 'src/components/common/ToastContainer.tsx exists');
  const toastContent = fs.readFileSync(toastContainerPath, 'utf8');
  assert(toastContent.includes('bottom-24'), 'ToastContainer offset (bottom-24) to float safely above launcher button');

  // 5. Verify AiAssistantPanel sits cleanly above launcher when opened
  assert(panelContent.includes('z-[2147483648]'), 'AiAssistantPanel has high z-index (z-[2147483648]) to prevent launcher interference when open');

  // 6. Verify Widget includes responsive mobile layout rules
  assert(widgetContent.includes('@media (max-width: 480px)'), 'Widget includes responsive @media (max-width: 480px) mobile rules');

  // 7. Verify Voice command handles dashboard buttons as well as anchor links
  assert(widgetContent.includes('button, [role="button"]'), 'Voice navigation commands can activate dashboard buttons & links');

  // 8. Verify public window.AccessAI interface is exported
  assert(widgetContent.includes('window.AccessAI'), 'Widget exports window.AccessAI programmatic interface');

  // 9. Real Browser Automation: Test Floating Launcher & Voice Submenu on Live AccessAI Application
  console.log('\n--- Step: Real Browser Automation of Main Dashboard & Widget ---');
  const distDir = path.resolve('dist');
  assert(fs.existsSync(distDir), 'Production dist directory exists for live testing');

  const appServer = http.createServer((req, res) => {
    let reqPath = req.url === '/' ? 'index.html' : req.url!.split('?')[0].replace(/^\//, '');
    let filePath = path.join(distDir, reqPath);
    if (!fs.existsSync(filePath)) {
      filePath = path.join(distDir, 'index.html');
    }
    const ext = path.extname(filePath);
    const contentTypeMap: Record<string, string> = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.svg': 'image/svg+xml'
    };

    res.writeHead(200, { 'Content-Type': contentTypeMap[ext] || 'application/octet-stream' });
    res.end(fs.readFileSync(filePath));
  });

  await new Promise<void>((resolve) => appServer.listen(0, '127.0.0.1', () => resolve()));
  const appPort = (appServer.address() as any).port;
  const appUrl = `http://127.0.0.1:${appPort}`;

  const browser = await launchAuditBrowser();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(appUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  // Verify accessai-widget element exists
  const widgetCount = await page.evaluate(() => document.querySelectorAll('accessai-widget').length);
  assert(widgetCount === 1, 'Floating accessai-widget custom element mounted exactly once on main dashboard');

  // Verify Shadow DOM launcher is visible and styled with Rose theme
  const launcherInfo = await page.evaluate(() => {
    const widget = document.querySelector('accessai-widget');
    if (!widget || !widget.shadowRoot) return null;
    const launcher = widget.shadowRoot.getElementById('accessai-launcher');
    if (!launcher) return null;
    const rect = launcher.getBoundingClientRect();
    const style = window.getComputedStyle(launcher);
    return {
      visible: rect.width > 0 && rect.height > 0,
      width: rect.width,
      height: rect.height,
      position: style.position,
      bottom: style.bottom,
      right: style.right
    };
  });
  assert(Boolean(launcherInfo && launcherInfo.visible), 'Floating launcher button is rendered and visible');
  assert(launcherInfo?.position === 'fixed', 'Launcher button uses position: fixed');

  // Click launcher and verify panel opens
  await page.evaluate(() => {
    const widget = document.querySelector('accessai-widget');
    const launcher = widget?.shadowRoot?.getElementById('accessai-launcher');
    launcher?.click();
  });
  await page.waitForTimeout(400);

  const panelIsOpen = await page.evaluate(() => {
    const widget = document.querySelector('accessai-widget');
    const panel = widget?.shadowRoot?.getElementById('accessai-panel');
    return panel?.classList.contains('active');
  });
  assert(Boolean(panelIsOpen), 'Clicking launcher opens the accessibility panel (.active)');

  // Verify all 6 first-level items in main view
  const menuItems = await page.evaluate(() => {
    const widget = document.querySelector('accessai-widget');
    const mainView = widget?.shadowRoot?.getElementById('accessai-main-view');
    const text = mainView?.textContent || '';
    return {
      visual: text.includes('Visual Adjustments'),
      nav: text.includes('Navigation Assistance'),
      reading: text.includes('Reading Assistance'),
      voice: text.includes('Voice Control'),
      reader: text.includes('Screen Reader Support'),
      reset: text.includes('Reset')
    };
  });
  assert(menuItems.visual, 'Menu includes Visual Adjustments');
  assert(menuItems.nav, 'Menu includes Navigation Assistance');
  assert(menuItems.reading, 'Menu includes Reading Assistance');
  assert(menuItems.voice, 'Menu includes Voice Control');
  assert(menuItems.reader, 'Menu includes Screen Reader Support');
  assert(menuItems.reset, 'Menu includes Reset Settings');

  // Click Voice Control and verify Voice submenu opens
  await page.evaluate(() => {
    const widget = document.querySelector('accessai-widget');
    const voiceItem = widget?.shadowRoot?.getElementById('menu-item-voice');
    voiceItem?.click();
  });
  await page.waitForTimeout(300);

  const voiceSubmenuActive = await page.evaluate(() => {
    const widget = document.querySelector('accessai-widget');
    const mainView = widget?.shadowRoot?.getElementById('accessai-main-view');
    const voiceView = widget?.shadowRoot?.getElementById('accessai-voice-view');
    return mainView?.style.display === 'none' && (voiceView?.style.display === 'flex' || voiceView?.style.display === 'block');
  });
  assert(Boolean(voiceSubmenuActive), 'Clicking Voice Control opens dedicated Voice Submenu');

  // Verify Start Listening and Stop Listening buttons in submenu
  const voiceButtonsExist = await page.evaluate(() => {
    const widget = document.querySelector('accessai-widget');
    const startBtn = widget?.shadowRoot?.getElementById('accessai-voice-start-btn');
    const stopBtn = widget?.shadowRoot?.getElementById('accessai-voice-stop-btn');
    return Boolean(startBtn && stopBtn);
  });
  assert(voiceButtonsExist, 'Voice Submenu contains Start and Stop listening buttons');

  // Click Back button and verify returns to main view
  await page.evaluate(() => {
    const widget = document.querySelector('accessai-widget');
    const backBtn = widget?.shadowRoot?.getElementById('accessai-voice-back-btn');
    backBtn?.click();
  });
  await page.waitForTimeout(300);

  const returnedToMain = await page.evaluate(() => {
    const widget = document.querySelector('accessai-widget');
    const mainView = widget?.shadowRoot?.getElementById('accessai-main-view');
    const voiceView = widget?.shadowRoot?.getElementById('accessai-voice-view');
    return (mainView?.style.display === 'flex' || mainView?.style.display === 'block') && voiceView?.style.display === 'none';
  });
  assert(Boolean(returnedToMain), 'Clicking Back returns to main accessibility view');

  // Click Close button and verify panel closes
  await page.evaluate(() => {
    const widget = document.querySelector('accessai-widget');
    const closeBtn = widget?.shadowRoot?.getElementById('accessai-close');
    closeBtn?.click();
  });
  await page.waitForTimeout(300);

  const panelClosed = await page.evaluate(() => {
    const widget = document.querySelector('accessai-widget');
    const panel = widget?.shadowRoot?.getElementById('accessai-panel');
    return !panel?.classList.contains('active');
  });
  assert(Boolean(panelClosed), 'Clicking Close button closes the accessibility panel');

  // Test Voice command simulation via public window.AccessAI
  await page.evaluate(() => {
    (window as any).AccessAI.handleVoiceCommand('increase text size');
  });
  const textScaleApplied = await page.evaluate(() => {
    return document.documentElement.classList.contains('accessai-font-110');
  });
  assert(textScaleApplied, 'Voice command "increase text size" scaled page typography (accessai-font-110)');

  await page.evaluate(() => {
    (window as any).AccessAI.handleVoiceCommand('enable high contrast');
  });
  const contrastApplied = await page.evaluate(() => {
    return document.documentElement.classList.contains('accessai-high-contrast');
  });
  assert(contrastApplied, 'Voice command "enable high contrast" activated high-contrast mode');

  await page.evaluate(() => {
    (window as any).AccessAI.handleVoiceCommand('reset accessibility settings');
  });
  const resetApplied = await page.evaluate(() => {
    return !document.documentElement.classList.contains('accessai-font-110') &&
           !document.documentElement.classList.contains('accessai-high-contrast');
  });
  assert(resetApplied, 'Voice command "reset accessibility settings" cleanly restored defaults');

  await browser.close();
  appServer.close();

  console.log('\n====================================================');
  console.log(`🎉 ALL ${passed}/${total} WIDGET & AI TESTS PASSED!`);
  console.log('====================================================\n');
}

runWidgetAndAiTestSuite().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
