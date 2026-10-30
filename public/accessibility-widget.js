/**
 * AccessAI - Standalone Drop-in Accessibility Widget
 * PS 1.4: Accessibility Layer for Any Website
 * 
 * Embed syntax:
 * <script src="http://localhost:3000/accessibility-widget.js" data-site-id="YOUR_SITE_ID" defer></script>
 */
(function() {
  'use strict';

  // Prevent multiple injections
  if (document.querySelector('accessai-widget')) {
    return;
  }

  // Identify host script & configuration
  const currentScript = document.currentScript || (function() {
    const scripts = document.getElementsByTagName('script');
    for (let i = scripts.length - 1; i >= 0; i--) {
      if (scripts[i].src && scripts[i].src.indexOf('accessibility-widget.js') !== -1) {
        return scripts[i];
      }
    }
    return null;
  })();

  const siteId = (currentScript && currentScript.getAttribute('data-site-id')) || 'default-site';
  const apiOrigin = currentScript && currentScript.src ? new URL(currentScript.src).origin : window.location.origin;

  // Initial State from LocalStorage
  const STORAGE_KEY = 'accessai_preferences_' + siteId;
  const defaultPrefs = {
    fontSize: 100, // 100, 110, 120, 130
    dyslexiaFont: false,
    highContrast: false,
    focusRing: false,
    readingRuler: false,
    voiceControl: false
  };

  let preferences = Object.assign({}, defaultPrefs);
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      preferences = Object.assign({}, defaultPrefs, JSON.parse(saved));
    }
  } catch (e) {
    // LocalStorage might be disabled in private browsing
  }

  // Site Configuration
  let siteConfig = {
    position: 'bottom-right',
    primaryColor: '#C96F82',
    name: 'AccessAI Accessibility Layer',
    enabledFeatures: {
      textResize: true,
      dyslexiaFont: true,
      highContrast: true,
      keyboardFocus: true,
      voiceControl: true,
      readingRuler: true,
      screenReaderAnnounce: true
    }
  };

  let isOpen = false;
  let recognitionInstance = null;
  let voiceListening = false;
  let voiceLastSpoken = '';

  // Host CSS Styles Injection (applies styling to the host page when features are enabled)
  const hostStyleId = 'accessai-host-accessibility-styles';
  let hostStyleTag = document.getElementById(hostStyleId);
  if (!hostStyleTag) {
    hostStyleTag = document.createElement('style');
    hostStyleTag.id = hostStyleId;
    hostStyleTag.textContent = `
      /* AccessAI Host Page Overrides */
      html.accessai-font-110 { font-size: 110% !important; }
      html.accessai-font-120 { font-size: 120% !important; }
      html.accessai-font-130 { font-size: 130% !important; }

      html.accessai-dyslexia, html.accessai-dyslexia * {
        font-family: 'OpenDyslexic', 'Comic Sans MS', -apple-system, BlinkMacSystemFont, Arial, sans-serif !important;
        letter-spacing: 0.05em !important;
        line-height: 1.65 !important;
      }

      html.accessai-high-contrast {
        filter: contrast(115%) !important;
      }
      html.accessai-high-contrast body {
        background-color: #0F172A !important;
        color: #F8FAFC !important;
      }
      html.accessai-high-contrast p,
      html.accessai-high-contrast span,
      html.accessai-high-contrast li,
      html.accessai-high-contrast h1,
      html.accessai-high-contrast h2,
      html.accessai-high-contrast h3,
      html.accessai-high-contrast h4,
      html.accessai-high-contrast h5,
      html.accessai-high-contrast h6 {
        color: #F8FAFC !important;
      }
      html.accessai-high-contrast a {
        color: #FDE047 !important;
        text-decoration: underline !important;
      }
      html.accessai-high-contrast button,
      html.accessai-high-contrast input,
      html.accessai-high-contrast select,
      html.accessai-high-contrast textarea {
        background-color: #1E293B !important;
        color: #FFFFFF !important;
        border: 2px solid #FDE047 !important;
      }

      html.accessai-focus-ring *:focus-visible {
        outline: 3px solid #C96F82 !important;
        outline-offset: 3px !important;
        box-shadow: 0 0 0 5px rgba(201, 111, 130, 0.45) !important;
        transition: outline 0.1s ease !important;
      }

      #accessai-reading-ruler-bar {
        position: fixed;
        left: 0;
        right: 0;
        height: 32px;
        background-color: rgba(254, 240, 138, 0.28);
        border-top: 2px solid #EAB308;
        border-bottom: 2px solid #EAB308;
        pointer-events: none;
        z-index: 2147483646;
        display: none;
        transform: translateY(-50%);
        box-shadow: 0 0 12px rgba(234, 179, 8, 0.2);
      }
    `;
    document.head.appendChild(hostStyleTag);
  }

  // Reading ruler DOM element
  let rulerEl = document.getElementById('accessai-reading-ruler-bar');
  if (!rulerEl) {
    rulerEl = document.createElement('div');
    rulerEl.id = 'accessai-reading-ruler-bar';
    document.body.appendChild(rulerEl);
  }

  window.addEventListener('mousemove', function(e) {
    if (preferences.readingRuler && rulerEl) {
      rulerEl.style.top = e.clientY + 'px';
      rulerEl.style.display = 'block';
    }
  });

  // Apply Preferences to Host Document
  function applyHostPreferences() {
    const root = document.documentElement;

    // Font resizing
    root.classList.remove('accessai-font-110', 'accessai-font-120', 'accessai-font-130');
    if (preferences.fontSize === 110) root.classList.add('accessai-font-110');
    else if (preferences.fontSize === 120) root.classList.add('accessai-font-120');
    else if (preferences.fontSize === 130) root.classList.add('accessai-font-130');

    // Dyslexia
    if (preferences.dyslexiaFont) root.classList.add('accessai-dyslexia');
    else root.classList.remove('accessai-dyslexia');

    // High contrast
    if (preferences.highContrast) root.classList.add('accessai-high-contrast');
    else root.classList.remove('accessai-high-contrast');

    // Focus ring
    if (preferences.focusRing) root.classList.add('accessai-focus-ring');
    else root.classList.remove('accessai-focus-ring');

    // Reading ruler
    if (rulerEl) {
      rulerEl.style.display = preferences.readingRuler ? 'block' : 'none';
    }

    // Voice recognition
    if (preferences.voiceControl) {
      startVoiceControl();
    } else {
      stopVoiceControl();
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (e) {}
  }

  // Create Custom Element & Shadow DOM
  const widgetContainer = document.createElement('accessai-widget');
  widgetContainer.setAttribute('data-version', '1.4.0');
  const shadow = widgetContainer.attachShadow({ mode: 'open' });

  // Shadow Root Styles (Isolated, Rose/Olive/White palette)
  const shadowStyles = document.createElement('style');
  shadowStyles.textContent = `
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    /* Floating Launcher Button */
    .accessai-launcher {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 2147483647;
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: #C96F82;
      color: #FFFFFF;
      border: 2px solid #FFFFFF;
      box-shadow: 0 4px 20px rgba(201, 111, 130, 0.4), 0 2px 6px rgba(0, 0, 0, 0.1);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      outline: none;
    }

    .accessai-launcher.position-left {
      right: auto;
      left: 24px;
    }

    .accessai-launcher:hover {
      background: #A84F65;
      transform: scale(1.08) translateY(-2px);
      box-shadow: 0 8px 24px rgba(168, 79, 101, 0.45);
    }

    .accessai-launcher:focus-visible {
      outline: 3px solid #7B8053;
      outline-offset: 3px;
    }

    .accessai-launcher svg {
      width: 26px;
      height: 26px;
      fill: none;
      stroke: currentColor;
      stroke-width: 2.2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .accessai-badge {
      position: absolute;
      top: -3px;
      right: -3px;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #7B8053;
      color: #FFFFFF;
      font-size: 10px;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid #FFFFFF;
    }

    /* Accessibility Modal Panel */
    .accessai-panel-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(41, 42, 39, 0.35);
      backdrop-filter: blur(2px);
      z-index: 2147483646;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.25s ease;
    }

    .accessai-panel-backdrop.active {
      opacity: 1;
      pointer-events: auto;
    }

    .accessai-panel {
      position: fixed;
      bottom: 86px;
      right: 24px;
      z-index: 2147483647;
      width: 360px;
      max-width: calc(100vw - 32px);
      max-height: calc(100vh - 110px);
      background: #FFFFFF;
      border-radius: 20px;
      border: 1px solid #EAEAE4;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.14), 0 2px 8px rgba(0, 0, 0, 0.05);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      opacity: 0;
      transform: translateY(20px) scale(0.96);
      pointer-events: none;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .accessai-panel.position-left {
      right: auto;
      left: 24px;
    }

    .accessai-panel.active {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: auto;
    }

    /* Panel Header */
    .accessai-header {
      padding: 16px 20px;
      background: #FAFAF8;
      border-bottom: 1px solid #EAEAE4;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .accessai-brand {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .accessai-logo-icon {
      width: 28px;
      height: 28px;
      border-radius: 8px;
      background: #FFF5F6;
      border: 1px solid #F8E9ED;
      color: #C96F82;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .accessai-brand-text h2 {
      font-size: 15px;
      font-weight: 800;
      color: #292A27;
      letter-spacing: -0.01em;
    }

    .accessai-brand-text h2 span {
      color: #C96F82;
    }

    .accessai-brand-text p {
      font-size: 10px;
      color: #70716B;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .accessai-close-btn {
      width: 32px;
      height: 32px;
      border-radius: 10px;
      border: 1px solid #EAEAE4;
      background: #FFFFFF;
      color: #70716B;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .accessai-close-btn:hover {
      background: #FFF5F6;
      color: #C94F55;
      border-color: #F8E9ED;
    }

    /* Panel Body */
    .accessai-body {
      padding: 16px 20px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    /* Control Sections */
    .accessai-section {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .accessai-section-label {
      font-size: 11px;
      font-weight: 800;
      color: #70716B;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    /* Font Size Grid */
    .accessai-btn-group {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
      background: #FAFAF8;
      padding: 4px;
      border-radius: 12px;
      border: 1px solid #EAEAE4;
    }

    .accessai-scale-btn {
      padding: 8px 4px;
      border-radius: 8px;
      border: none;
      background: transparent;
      color: #70716B;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .accessai-scale-btn:hover {
      background: #FFFFFF;
      color: #292A27;
    }

    .accessai-scale-btn.active {
      background: #C96F82;
      color: #FFFFFF;
      box-shadow: 0 2px 6px rgba(201, 111, 130, 0.35);
    }

    /* Toggle Item */
    .accessai-toggle-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 14px;
      background: #FFFFFF;
      border: 1px solid #EAEAE4;
      border-radius: 12px;
      transition: all 0.15s ease;
      cursor: pointer;
    }

    .accessai-toggle-card:hover {
      border-color: #C96F82;
      background: #FFF5F6/30;
    }

    .accessai-toggle-card.active {
      border-color: #C96F82;
      background: #FFF5F6;
    }

    .accessai-toggle-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .accessai-toggle-icon {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: #F6F7F0;
      border: 1px solid #EEF0E3;
      color: #7B8053;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .accessai-toggle-card.active .accessai-toggle-icon {
      background: #C96F82;
      color: #FFFFFF;
      border-color: #C96F82;
    }

    .accessai-toggle-text h4 {
      font-size: 13px;
      font-weight: 700;
      color: #292A27;
    }

    .accessai-toggle-text p {
      font-size: 11px;
      color: #70716B;
    }

    .accessai-switch {
      position: relative;
      width: 40px;
      height: 22px;
      background: #EAEAE4;
      border-radius: 20px;
      transition: background 0.2s ease;
      flex-shrink: 0;
    }

    .accessai-toggle-card.active .accessai-switch {
      background: #C96F82;
    }

    .accessai-switch-thumb {
      position: absolute;
      top: 2px;
      left: 2px;
      width: 18px;
      height: 18px;
      background: #FFFFFF;
      border-radius: 50%;
      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
      transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .accessai-toggle-card.active .accessai-switch-thumb {
      transform: translateX(18px);
    }

    /* Voice Recognition Bar */
    .accessai-voice-status {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 10px;
      background: #F6F7F0;
      border: 1px solid #EEF0E3;
      font-size: 11px;
      color: #62683F;
    }

    .accessai-voice-pulse {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #7B8053;
      animation: voice-pulse 1.4s infinite;
    }

    @keyframes voice-pulse {
      0% { transform: scale(0.9); opacity: 0.7; }
      50% { transform: scale(1.4); opacity: 1; }
      100% { transform: scale(0.9); opacity: 0.7; }
    }

    /* Panel Footer */
    .accessai-footer {
      padding: 12px 20px;
      background: #FAFAF8;
      border-top: 1px solid #EAEAE4;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .accessai-reset-btn {
      background: transparent;
      border: none;
      color: #70716B;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 10px;
      border-radius: 8px;
      transition: all 0.15s ease;
    }

    .accessai-reset-btn:hover {
      background: #FFF5F6;
      color: #C94F55;
    }

    .accessai-compliance-pill {
      font-size: 10px;
      font-weight: 800;
      color: #7B8053;
      background: #F6F7F0;
      border: 1px solid #EEF0E3;
      padding: 4px 8px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
  `;

  shadow.appendChild(shadowStyles);

  // Template HTML
  const rootDiv = document.createElement('div');
  rootDiv.id = 'accessai-root';
  rootDiv.innerHTML = `
    <!-- ARIA Live Announcement Region -->
    <div id="accessai-announcer" class="sr-only" aria-live="polite" aria-atomic="true"></div>

    <!-- Backdrop -->
    <div class="accessai-panel-backdrop" id="accessai-backdrop"></div>

    <!-- Main Accessibility Launcher Trigger -->
    <button
      class="accessai-launcher ${siteConfig.position === 'bottom-left' ? 'position-left' : ''}"
      id="accessai-launcher"
      aria-label="Open AccessAI Accessibility Controls Menu (Shortcut: Alt+A)"
      aria-haspopup="dialog"
      aria-expanded="false"
    >
      <svg viewBox="0 0 24 24">
        <!-- Accessibility Universal Figure -->
        <circle cx="12" cy="4.5" r="2.5" />
        <path d="M4 8.5h16" />
        <path d="M12 8.5v8" />
        <path d="M8 21.5l4-5 4 5" />
      </svg>
      <div class="accessai-badge" id="accessai-active-count" style="display: none;">0</div>
    </button>

    <!-- Modal Panel -->
    <div
      class="accessai-panel ${siteConfig.position === 'bottom-left' ? 'position-left' : ''}"
      id="accessai-panel"
      role="dialog"
      aria-modal="true"
      aria-label="AccessAI Accessibility Settings"
    >
      <!-- Header -->
      <div class="accessai-header">
        <div class="accessai-brand">
          <div class="accessai-logo-icon">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <div class="accessai-brand-text">
            <h2>Access<span>AI</span></h2>
            <p>Accessibility Layer</p>
          </div>
        </div>
        <button class="accessai-close-btn" id="accessai-close" aria-label="Close accessibility menu (Escape)">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <!-- Body Controls -->
      <div class="accessai-body">
        <!-- 1. Text Resizing -->
        <div class="accessai-section">
          <div class="accessai-section-label">
            <span>Text Size Scaling</span>
            <span id="accessai-font-label">${preferences.fontSize}%</span>
          </div>
          <div class="accessai-btn-group" role="group" aria-label="Text size scaling">
            <button class="accessai-scale-btn ${preferences.fontSize === 100 ? 'active' : ''}" data-size="100">100%</button>
            <button class="accessai-scale-btn ${preferences.fontSize === 110 ? 'active' : ''}" data-size="110">110%</button>
            <button class="accessai-scale-btn ${preferences.fontSize === 120 ? 'active' : ''}" data-size="120">120%</button>
            <button class="accessai-scale-btn ${preferences.fontSize === 130 ? 'active' : ''}" data-size="130">130%</button>
          </div>
        </div>

        <!-- 2. High Contrast Mode -->
        <div class="accessai-toggle-card ${preferences.highContrast ? 'active' : ''}" id="card-contrast" role="button" tabindex="0" aria-pressed="${preferences.highContrast}">
          <div class="accessai-toggle-info">
            <div class="accessai-toggle-icon">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 2a10 10 0 0 1 0 20z" fill="currentColor"/>
              </svg>
            </div>
            <div class="accessai-toggle-text">
              <h4>High Contrast Mode</h4>
              <p>Crisp text on dark slate background</p>
            </div>
          </div>
          <div class="accessai-switch"><div class="accessai-switch-thumb"></div></div>
        </div>

        <!-- 3. Dyslexia-Friendly Font -->
        <div class="accessai-toggle-card ${preferences.dyslexiaFont ? 'active' : ''}" id="card-dyslexia" role="button" tabindex="0" aria-pressed="${preferences.dyslexiaFont}">
          <div class="accessai-toggle-info">
            <div class="accessai-toggle-icon">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="4 7 4 4 20 4 20 7"/>
                <line x1="9" y1="20" x2="15" y2="20"/>
                <line x1="12" y1="4" x2="12" y2="20"/>
              </svg>
            </div>
            <div class="accessai-toggle-text">
              <h4>Dyslexia-Friendly Font</h4>
              <p>Weighted letters & wider spacing</p>
            </div>
          </div>
          <div class="accessai-switch"><div class="accessai-switch-thumb"></div></div>
        </div>

        <!-- 4. Keyboard Focus Highlight Ring -->
        <div class="accessai-toggle-card ${preferences.focusRing ? 'active' : ''}" id="card-focus" role="button" tabindex="0" aria-pressed="${preferences.focusRing}">
          <div class="accessai-toggle-info">
            <div class="accessai-toggle-icon">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <line x1="6" y1="8" x2="6" y2="8"/>
                <line x1="10" y1="8" x2="10" y2="8"/>
                <line x1="14" y1="8" x2="14" y2="8"/>
                <line x1="18" y1="8" x2="18" y2="8"/>
                <line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
            </div>
            <div class="accessai-toggle-text">
              <h4>Visible Focus Ring</h4>
              <p>Prominent outline on active elements</p>
            </div>
          </div>
          <div class="accessai-switch"><div class="accessai-switch-thumb"></div></div>
        </div>

        <!-- 5. Reading Ruler Guide -->
        <div class="accessai-toggle-card ${preferences.readingRuler ? 'active' : ''}" id="card-ruler" role="button" tabindex="0" aria-pressed="${preferences.readingRuler}">
          <div class="accessai-toggle-info">
            <div class="accessai-toggle-icon">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </div>
            <div class="accessai-toggle-text">
              <h4>Reading Ruler</h4>
              <p>Spotlight bar following cursor</p>
            </div>
          </div>
          <div class="accessai-switch"><div class="accessai-switch-thumb"></div></div>
        </div>

        <!-- 6. Voice Navigation (Web Speech API) -->
        <div class="accessai-toggle-card ${preferences.voiceControl ? 'active' : ''}" id="card-voice" role="button" tabindex="0" aria-pressed="${preferences.voiceControl}">
          <div class="accessai-toggle-info">
            <div class="accessai-toggle-icon">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            </div>
            <div class="accessai-toggle-text">
              <h4>Voice Commands</h4>
              <p>Say "larger text", "contrast", "close"</p>
            </div>
          </div>
          <div class="accessai-switch"><div class="accessai-switch-thumb"></div></div>
        </div>

        <div id="accessai-voice-box" style="${preferences.voiceControl ? 'display: flex;' : 'display: none;'}" class="accessai-voice-status">
          <div class="accessai-voice-pulse"></div>
          <span id="accessai-voice-text">Listening for commands...</span>
        </div>
      </div>

      <!-- Footer -->
      <div class="accessai-footer">
        <button class="accessai-reset-btn" id="accessai-reset">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2">
            <polyline points="1 4 1 10 7 10"/>
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
          </svg>
          Reset All
        </button>
        <div class="accessai-compliance-pill">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          WCAG 2.1 AA
        </div>
      </div>
    </div>
  `;

  shadow.appendChild(rootDiv);
  document.body.appendChild(widgetContainer);

  // Announce to Screen Readers
  function announce(message) {
    const announcer = shadow.getElementById('accessai-announcer');
    if (announcer) {
      announcer.textContent = '';
      setTimeout(() => {
        announcer.textContent = message;
      }, 50);
    }
  }

  // Update Active Features Count Badge
  function updateBadge() {
    let count = 0;
    if (preferences.fontSize !== 100) count++;
    if (preferences.dyslexiaFont) count++;
    if (preferences.highContrast) count++;
    if (preferences.focusRing) count++;
    if (preferences.readingRuler) count++;
    if (preferences.voiceControl) count++;

    const badge = shadow.getElementById('accessai-active-count');
    if (badge) {
      if (count > 0) {
        badge.textContent = count;
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }
    }
  }

  // Toggle Panel Open/Close
  function togglePanel(open) {
    isOpen = typeof open === 'boolean' ? open : !isOpen;
    const panel = shadow.getElementById('accessai-panel');
    const backdrop = shadow.getElementById('accessai-backdrop');
    const launcher = shadow.getElementById('accessai-launcher');

    if (isOpen) {
      panel.classList.add('active');
      backdrop.classList.add('active');
      launcher.setAttribute('aria-expanded', 'true');
      announce('Accessibility controls panel opened.');
      shadow.getElementById('accessai-close').focus();
    } else {
      panel.classList.remove('active');
      backdrop.classList.remove('active');
      launcher.setAttribute('aria-expanded', 'false');
      announce('Accessibility controls panel closed.');
      launcher.focus();
    }
  }

  // Web Speech API Voice Recognition
  function startVoiceControl() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Web Speech API is not supported in this browser.');
      return;
    }

    if (recognitionInstance) {
      try { recognitionInstance.stop(); } catch(e) {}
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = function() {
        voiceListening = true;
        const vText = shadow.getElementById('accessai-voice-text');
        if (vText) vText.textContent = 'Listening for voice commands...';
      };

      recognition.onresult = function(event) {
        const lastResultIndex = event.results.length - 1;
        const transcript = event.results[lastResultIndex][0].transcript.trim().toLowerCase();
        handleVoiceCommand(transcript);
      };

      recognition.onerror = function(event) {
        if (event.error !== 'no-speech') {
          console.warn('Voice command recognition error:', event.error);
        }
      };

      recognition.onend = function() {
        if (preferences.voiceControl) {
          try { recognition.start(); } catch(e) {}
        }
      };

      recognition.start();
      recognitionInstance = recognition;
    } catch (e) {
      console.warn('Unable to initialize voice recognition:', e);
    }
  }

  function stopVoiceControl() {
    if (recognitionInstance) {
      try {
        recognitionInstance.stop();
      } catch(e) {}
      recognitionInstance = null;
    }
    voiceListening = false;
  }

  function handleVoiceCommand(cmd) {
    const vText = shadow.getElementById('accessai-voice-text');
    if (vText) vText.textContent = `Heard: "${cmd}"`;

    if (cmd.includes('open') || cmd.includes('accessibility') || cmd.includes('menu')) {
      togglePanel(true);
      announce('Accessibility panel opened via voice command.');
    } else if (cmd.includes('close') || cmd.includes('hide')) {
      togglePanel(false);
      announce('Accessibility panel closed via voice command.');
    } else if (cmd.includes('larger text') || cmd.includes('increase text') || cmd.includes('big text')) {
      const sizes = [100, 110, 120, 130];
      const idx = sizes.indexOf(preferences.fontSize);
      preferences.fontSize = sizes[Math.min(sizes.length - 1, idx + 1)];
      applyHostPreferences();
      updateUI();
      announce(`Text size increased to ${preferences.fontSize} percent.`);
    } else if (cmd.includes('smaller text') || cmd.includes('decrease text')) {
      const sizes = [100, 110, 120, 130];
      const idx = sizes.indexOf(preferences.fontSize);
      preferences.fontSize = sizes[Math.max(0, idx - 1)];
      applyHostPreferences();
      updateUI();
      announce(`Text size decreased to ${preferences.fontSize} percent.`);
    } else if (cmd.includes('contrast') || cmd.includes('dark mode')) {
      preferences.highContrast = !preferences.highContrast;
      applyHostPreferences();
      updateUI();
      announce(`High contrast ${preferences.highContrast ? 'enabled' : 'disabled'}.`);
    } else if (cmd.includes('dyslexia') || cmd.includes('font')) {
      preferences.dyslexiaFont = !preferences.dyslexiaFont;
      applyHostPreferences();
      updateUI();
      announce(`Dyslexia-friendly font ${preferences.dyslexiaFont ? 'enabled' : 'disabled'}.`);
    } else if (cmd.includes('focus') || cmd.includes('keyboard')) {
      preferences.focusRing = !preferences.focusRing;
      applyHostPreferences();
      updateUI();
      announce(`Focus ring highlight ${preferences.focusRing ? 'enabled' : 'disabled'}.`);
    } else if (cmd.includes('ruler') || cmd.includes('guide')) {
      preferences.readingRuler = !preferences.readingRuler;
      applyHostPreferences();
      updateUI();
      announce(`Reading ruler ${preferences.readingRuler ? 'enabled' : 'disabled'}.`);
    } else if (cmd.includes('reset') || cmd.includes('normal')) {
      preferences = Object.assign({}, defaultPrefs);
      applyHostPreferences();
      updateUI();
      announce('All accessibility adjustments have been reset.');
    }
  }

  // Update UI Elements inside Shadow DOM
  function updateUI() {
    // Font size buttons
    shadow.querySelectorAll('.accessai-scale-btn').forEach(btn => {
      const sz = parseInt(btn.getAttribute('data-size'), 10);
      btn.classList.toggle('active', preferences.fontSize === sz);
    });
    const fontLabel = shadow.getElementById('accessai-font-label');
    if (fontLabel) fontLabel.textContent = preferences.fontSize + '%';

    // Toggles
    const cardContrast = shadow.getElementById('card-contrast');
    if (cardContrast) {
      cardContrast.classList.toggle('active', preferences.highContrast);
      cardContrast.setAttribute('aria-pressed', String(preferences.highContrast));
    }

    const cardDyslexia = shadow.getElementById('card-dyslexia');
    if (cardDyslexia) {
      cardDyslexia.classList.toggle('active', preferences.dyslexiaFont);
      cardDyslexia.setAttribute('aria-pressed', String(preferences.dyslexiaFont));
    }

    const cardFocus = shadow.getElementById('card-focus');
    if (cardFocus) {
      cardFocus.classList.toggle('active', preferences.focusRing);
      cardFocus.setAttribute('aria-pressed', String(preferences.focusRing));
    }

    const cardRuler = shadow.getElementById('card-ruler');
    if (cardRuler) {
      cardRuler.classList.toggle('active', preferences.readingRuler);
      cardRuler.setAttribute('aria-pressed', String(preferences.readingRuler));
    }

    const cardVoice = shadow.getElementById('card-voice');
    if (cardVoice) {
      cardVoice.classList.toggle('active', preferences.voiceControl);
      cardVoice.setAttribute('aria-pressed', String(preferences.voiceControl));
    }

    const voiceBox = shadow.getElementById('accessai-voice-box');
    if (voiceBox) {
      voiceBox.style.display = preferences.voiceControl ? 'flex' : 'none';
    }

    updateBadge();
  }

  // Event Listeners inside Shadow DOM
  shadow.getElementById('accessai-launcher').addEventListener('click', () => togglePanel());
  shadow.getElementById('accessai-close').addEventListener('click', () => togglePanel(false));
  shadow.getElementById('accessai-backdrop').addEventListener('click', () => togglePanel(false));

  // Font size button clicks
  shadow.querySelectorAll('.accessai-scale-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const size = parseInt(e.currentTarget.getAttribute('data-size'), 10);
      preferences.fontSize = size;
      applyHostPreferences();
      updateUI();
      announce(`Text size adjusted to ${size} percent.`);
    });
  });

  // Toggle Card Clicks
  function setupToggleCard(id, prefKey, name) {
    const card = shadow.getElementById(id);
    if (!card) return;
    const toggle = () => {
      preferences[prefKey] = !preferences[prefKey];
      applyHostPreferences();
      updateUI();
      announce(`${name} ${preferences[prefKey] ? 'enabled' : 'disabled'}.`);
    };
    card.addEventListener('click', toggle);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle();
      }
    });
  }

  setupToggleCard('card-contrast', 'highContrast', 'High contrast mode');
  setupToggleCard('card-dyslexia', 'dyslexiaFont', 'Dyslexia-friendly font');
  setupToggleCard('card-focus', 'focusRing', 'Visible focus ring');
  setupToggleCard('card-ruler', 'readingRuler', 'Reading ruler');
  setupToggleCard('card-voice', 'voiceControl', 'Voice navigation commands');

  // Reset All
  shadow.getElementById('accessai-reset').addEventListener('click', () => {
    preferences = Object.assign({}, defaultPrefs);
    applyHostPreferences();
    updateUI();
    announce('All accessibility settings restored to default.');
  });

  // Global Keyboard Shortcuts
  window.addEventListener('keydown', (e) => {
    // Escape to close
    if (e.key === 'Escape' && isOpen) {
      togglePanel(false);
    }
    // Alt + A (or Ctrl + Alt + A) to toggle panel
    if ((e.altKey && (e.key === 'a' || e.key === 'A')) || (e.ctrlKey && e.altKey && (e.key === 'a' || e.key === 'A'))) {
      e.preventDefault();
      togglePanel();
    }
  });

  // Fetch Remote Configuration from API
  if (siteId && apiOrigin) {
    fetch(`${apiOrigin}/api/widget/config/${siteId}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.success) {
          siteConfig = Object.assign(siteConfig, data);
          if (siteConfig.position === 'bottom-left') {
            shadow.getElementById('accessai-launcher').classList.add('position-left');
            shadow.getElementById('accessai-panel').classList.add('position-left');
          }
          if (siteConfig.primaryColor) {
            shadow.getElementById('accessai-launcher').style.backgroundColor = siteConfig.primaryColor;
          }
        }
      })
      .catch(() => {
        // Safe offline fallback
      });
  }

  // Initialize
  applyHostPreferences();
  updateUI();
})();
