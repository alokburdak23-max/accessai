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
  if (window.__accessaiWidgetLoaded || document.querySelector('accessai-widget')) {
    return;
  }
  window.__accessaiWidgetLoaded = true;

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
  let currentWidgetView = 'main'; // 'main' | 'voice'
  let selectedLanguage = 'en-US';
  let recognitionInstance = null;
  let voiceListening = false;
  let voiceState = 'ready'; // 'ready' | 'requesting_permission' | 'listening' | 'processing' | 'executed' | 'permission_denied' | 'unsupported' | 'error'
  let isExplicitlyStopped = false;
  let voiceFeedbackTimer = null;
  let voiceLastSpoken = '';

  // Host CSS Styles Injection (applies styling to the host page when features are enabled)
  const hostStyleId = 'accessai-host-accessibility-styles';
  let hostStyleTag = document.getElementById(hostStyleId);
  if (!hostStyleTag) {
    hostStyleTag = document.createElement('style');
    hostStyleTag.id = hostStyleId;
    hostStyleTag.textContent = `
      /* AccessAI Host Page Overrides */
      @font-face {
        font-family: 'OpenDyslexic';
        src: url('https://cdn.jsdelivr.net/npm/opendyslexic@0.1.1/OpenDyslexic-Regular.otf') format('opentype');
        font-display: swap;
      }

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
    if (document.body) {
      document.body.appendChild(rulerEl);
    }
  }

  window.addEventListener('mousemove', function(e) {
    if (preferences.readingRuler && rulerEl) {
      rulerEl.style.top = e.clientY + 'px';
      rulerEl.style.display = 'block';
    }
  });

  // Apply Preferences to Host Document
  function applyHostPreferences(options) {
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

    // Voice recognition (reconcile unless explicitly told to skip voice lifecycle)
    if (!options || !options.skipVoice) {
      if (preferences.voiceControl) {
        startVoiceControl();
      } else {
        stopVoiceControl(true);
      }
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

    @media (max-width: 480px) {
      .accessai-launcher {
        bottom: 16px;
        right: 16px;
        width: 48px;
        height: 48px;
      }
      .accessai-panel {
        bottom: 74px;
        right: 12px;
        left: 12px;
        width: auto;
        max-width: calc(100vw - 24px);
        max-height: calc(100vh - 90px);
      }
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

    /* Voice Status Badges */
    .accessai-status-badge {
      font-size: 9px;
      font-weight: 800;
      padding: 2px 7px;
      border-radius: 9999px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      display: inline-flex;
      align-items: center;
      line-height: 1.2;
    }
    .status-ready {
      background: #F6F7F0;
      color: #7B8053;
      border: 1px solid #EEF0E3;
    }
    .status-requesting {
      background: #FFF8F2;
      color: #D88A4C;
      border: 1px solid #FDEEE2;
      animation: status-blink 0.9s infinite alternate;
    }
    .status-listening {
      background: #FFF5F6;
      color: #C96F82;
      border: 1px solid #F8E9ED;
    }
    .status-processing {
      background: #EEF2FF;
      color: #4F46E5;
      border: 1px solid #E0E7FF;
    }
    .status-executed {
      background: #F2F7F3;
      color: #648568;
      border: 1px solid #E2EDE4;
    }
    .status-denied {
      background: #FFF5F6;
      color: #C94F55;
      border: 1px solid #F8E9ED;
    }
    .status-unsupported {
      background: #F1F5F9;
      color: #64748B;
      border: 1px solid #CBD5E1;
    }
    .status-error {
      background: #FFF8F2;
      color: #D88A4C;
      border: 1px solid #FDEEE2;
    }

    @keyframes status-blink {
      0% { opacity: 0.6; }
      100% { opacity: 1; }
    }

    /* Voice Recognition Bar */
    .accessai-voice-status {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 10px 12px;
      border-radius: 12px;
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      font-size: 11px;
      color: #334155;
      transition: all 0.2s ease;
    }

    .accessai-voice-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .accessai-voice-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
      min-width: 0;
    }

    .accessai-voice-pulse {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .pulse-idle {
      background: #94A3B8;
    }
    .pulse-listening {
      background: #C96F82;
      animation: voice-pulse 1.3s infinite;
    }
    .pulse-processing {
      background: #4F46E5;
      animation: voice-pulse 0.7s infinite;
    }
    .pulse-executed {
      background: #648568;
    }
    .pulse-error {
      background: #C94F55;
    }

    .accessai-voice-message {
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: #1E293B;
    }

    .accessai-voice-stop-btn {
      background: #FFFFFF;
      border: 1px solid #CBD5E1;
      color: #C94F55;
      font-size: 10px;
      font-weight: 700;
      padding: 4px 8px;
      border-radius: 6px;
      cursor: pointer;
      flex-shrink: 0;
      transition: all 0.15s ease;
    }
    .accessai-voice-stop-btn:hover {
      background: #FFF5F6;
      border-color: #F8E9ED;
      color: #A84F65;
    }

    .accessai-voice-hints {
      font-size: 10px;
      color: #64748B;
      border-top: 1px dashed #E2E8F0;
      padding-top: 4px;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    @keyframes voice-pulse {
      0% { transform: scale(0.9); opacity: 0.7; }
      50% { transform: scale(1.4); opacity: 1; }
      100% { transform: scale(0.9); opacity: 0.7; }
    }

    /* Menu Group & Submenu View Styles */
    .accessai-view {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .accessai-menu-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .accessai-menu-group-header {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      font-weight: 800;
      color: #7B8053;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding: 0 4px;
    }

    .accessai-menu-chevron {
      display: flex;
      align-items: center;
      color: #C96F82;
      font-size: 11px;
      font-weight: 700;
    }

    .accessai-back-btn {
      background: transparent;
      border: none;
      color: #62683F;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      border-radius: 6px;
      transition: background 0.15s;
    }
    .accessai-back-btn:hover {
      background: #EEF0E3;
      color: #292A27;
    }

    .accessai-action-btn-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    .accessai-voice-start-btn {
      background: #C96F82;
      color: #FFFFFF;
      border: 1px solid #C96F82;
      font-size: 11px;
      font-weight: 700;
      padding: 8px 12px;
      border-radius: 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: all 0.15s ease;
    }
    .accessai-voice-start-btn:hover {
      background: #A84F65;
    }

    .accessai-voice-stop-btn-lg {
      background: #FFFFFF;
      color: #C94F55;
      border: 1px solid #CBD5E1;
      font-size: 11px;
      font-weight: 700;
      padding: 8px 12px;
      border-radius: 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: all 0.15s ease;
    }
    .accessai-voice-stop-btn-lg:hover {
      background: #FFF5F6;
      border-color: #F8E9ED;
    }

    .accessai-select {
      width: 100%;
      font-size: 11px;
      font-weight: 600;
      padding: 6px 10px;
      background: #FFFFFF;
      border: 1px solid #CBD5E1;
      border-radius: 8px;
      color: #292A27;
      outline: none;
    }
    .accessai-select:focus {
      border-color: #C96F82;
    }

    .accessai-command-grid {
      display: flex;
      flex-direction: column;
      gap: 8px;
      font-size: 11px;
    }

    .accessai-command-card {
      background: #FAFAF8;
      border: 1px solid #EEF0E3;
      border-radius: 10px;
      padding: 8px 12px;
    }

    .accessai-command-card h5 {
      font-size: 10px;
      font-weight: 800;
      color: #7B8053;
      margin-bottom: 4px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .accessai-command-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 3px;
      color: #292A27;
      font-size: 10.5px;
    }

    .accessai-command-list li code {
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      padding: 1px 4px;
      border-radius: 4px;
      font-family: monospace;
      font-weight: 700;
      color: #C96F82;
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

      <!-- Body Controls with 2-level progressive navigation -->
      <div class="accessai-body">
        <!-- VIEW 1: MAIN ACCESSIBILITY CATEGORIES MENU -->
        <div id="accessai-main-view" class="accessai-view">
          
          <!-- Category 1: Visual Adjustments -->
          <div class="accessai-menu-group">
            <div class="accessai-menu-group-header">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 0 20z" fill="currentColor"/></svg>
              <span>Visual Adjustments</span>
            </div>

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
          </div>

          <!-- Category 2: Navigation Assistance -->
          <div class="accessai-menu-group">
            <div class="accessai-menu-group-header">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="2" y="4" width="20" height="16" rx="2"/><line x1="6" y1="8" x2="6" y2="8"/><line x1="10" y1="8" x2="10" y2="8"/><line x1="14" y1="8" x2="14" y2="8"/></svg>
              <span>Navigation Assistance</span>
            </div>

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
                  <p>Prominent outline on active keyboard elements</p>
                </div>
              </div>
              <div class="accessai-switch"><div class="accessai-switch-thumb"></div></div>
            </div>
          </div>

          <!-- Category 3: Reading Assistance -->
          <div class="accessai-menu-group">
            <div class="accessai-menu-group-header">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>
              <span>Reading Assistance</span>
            </div>

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
                  <p>OpenDyslexic typography with weighted bases</p>
                </div>
              </div>
              <div class="accessai-switch"><div class="accessai-switch-thumb"></div></div>
            </div>

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
                  <h4>Reading Ruler Guide</h4>
                  <p>Spotlight reading bar following cursor</p>
                </div>
              </div>
              <div class="accessai-switch"><div class="accessai-switch-thumb"></div></div>
            </div>
          </div>

          <!-- Category 4: Voice Control (Dedicated First-Level Item) -->
          <div class="accessai-menu-group">
            <div class="accessai-menu-group-header">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
              <span>Voice Control</span>
            </div>

            <div class="accessai-toggle-card ${preferences.voiceControl ? 'active' : ''}" id="menu-item-voice" role="button" tabindex="0" aria-haspopup="true" aria-label="Open Voice Control submenu">
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
                  <div style="display:flex;align-items:center;gap:6px;">
                    <h4>Voice Control</h4>
                    <span id="accessai-voice-badge-menu" class="accessai-status-badge status-ready">Ready</span>
                  </div>
                  <p id="accessai-voice-desc-menu">Operate website using spoken commands</p>
                </div>
              </div>
              <div class="accessai-menu-chevron">
                <span style="font-size:11px;font-weight:700;margin-right:4px;">Open &rarr;</span>
              </div>
            </div>
          </div>

          <!-- Category 5: Screen Reader Support -->
          <div class="accessai-menu-group">
            <div class="accessai-menu-group-header">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>
              <span>Screen Reader Support</span>
            </div>

            <div class="accessai-toggle-card active" id="card-screen-reader" role="region" aria-label="Screen Reader Support status">
              <div class="accessai-toggle-info">
                <div class="accessai-toggle-icon">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>
                  </svg>
                </div>
                <div class="accessai-toggle-text">
                  <h4>Screen Reader Announcements</h4>
                  <p>Polite live updates for NVDA, JAWS & VoiceOver</p>
                </div>
              </div>
              <span class="accessai-status-badge status-executed">Active</span>
            </div>
          </div>

          <!-- Category 6: Reset Accessibility Settings -->
          <div class="accessai-menu-group">
            <div class="accessai-menu-group-header">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
              <span>Reset Settings</span>
            </div>

            <button type="button" id="menu-reset-all" class="accessai-toggle-card" style="width:100%;text-align:left;cursor:pointer;">
              <div class="accessai-toggle-info">
                <div class="accessai-toggle-icon" style="background:#FFF5F6;color:#C94F55;border-color:#F8E9ED;">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="1 4 1 10 7 10"/>
                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
                  </svg>
                </div>
                <div class="accessai-toggle-text">
                  <h4>Reset Accessibility Settings</h4>
                  <p>Restore original fonts, contrast & scaling</p>
                </div>
              </div>
              <span style="font-size:11px;font-weight:700;color:#C94F55;">Reset</span>
            </button>
          </div>
        </div>

        <!-- VIEW 2: DEDICATED VOICE CONTROL SUBMENU VIEW -->
        <div id="accessai-voice-view" class="accessai-view" style="display: none;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
            <button type="button" id="accessai-voice-back-btn" class="accessai-back-btn" aria-label="Return to main accessibility menu">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
              <span>&larr; Back to Main Menu</span>
            </button>
            <span class="accessai-compliance-pill">Voice Control</span>
          </div>

          <!-- Live Status Bar -->
          <div id="accessai-voice-box" class="accessai-voice-status">
            <div class="accessai-voice-header">
              <div class="accessai-voice-indicator">
                <div class="accessai-voice-pulse pulse-idle" id="accessai-voice-pulse-dot"></div>
                <span id="accessai-voice-text" class="accessai-voice-message">Voice Navigation Ready</span>
              </div>
              <span id="accessai-voice-badge" class="accessai-status-badge status-ready">Ready</span>
            </div>
            <div class="accessai-voice-hints">
              <span id="accessai-voice-mic-status">Microphone Permission: Ready on Demand</span>
            </div>
          </div>

          <!-- Main Actions: Start & Stop -->
          <div class="accessai-action-btn-row">
            <button type="button" id="accessai-voice-start-btn" class="accessai-voice-start-btn">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
              <span>Start Listening</span>
            </button>
            <button type="button" id="accessai-voice-stop-btn" class="accessai-voice-stop-btn-lg">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="6" y="6" width="12" height="12" rx="2"/>
              </svg>
              <span>Stop Listening</span>
            </button>
          </div>

          <!-- Language Selector -->
          <div>
            <label for="accessai-voice-lang" style="font-size:10px;font-weight:800;color:#70716B;display:block;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.04em;">
              Spoken Language & Regional Accent:
            </label>
            <select id="accessai-voice-lang" class="accessai-select">
              <option value="en-US">English (United States) - en-US</option>
              <option value="en-GB">English (United Kingdom) - en-GB</option>
              <option value="es-ES">Español (España) - es-ES</option>
              <option value="fr-FR">Français (France) - fr-FR</option>
              <option value="de-DE">Deutsch (Deutschland) - de-DE</option>
              <option value="hi-IN">हिन्दी (India) - hi-IN</option>
            </select>
          </div>

          <!-- Voice Command Guide -->
          <div class="accessai-command-grid">
            <div class="accessai-command-card">
              <h5>Visual Controls</h5>
              <ul class="accessai-command-list">
                <li>• Say <code>"Increase text size"</code> or <code>"Decrease text size"</code></li>
                <li>• Say <code>"Enable high contrast"</code> or <code>"Disable high contrast"</code></li>
                <li>• Say <code>"Enable dyslexia font"</code> or <code>"Disable dyslexia font"</code></li>
                <li>• Say <code>"Enable focus indicators"</code> or <code>"Enable reading ruler"</code></li>
                <li>• Say <code>"Reset accessibility settings"</code></li>
              </ul>
            </div>

            <div class="accessai-command-card">
              <h5>Page Navigation</h5>
              <ul class="accessai-command-list">
                <li>• Say <code>"Scroll down"</code> or <code>"Scroll up"</code></li>
                <li>• Say <code>"Go to top"</code> or <code>"Go to bottom"</code></li>
                <li>• Say <code>"Open [link name]"</code> (e.g. "Open destinations")</li>
                <li>• Say <code>"Stop listening"</code></li>
              </ul>
            </div>

            <div class="accessai-command-card">
              <h5>Widget Controls</h5>
              <ul class="accessai-command-list">
                <li>• Say <code>"Open accessibility settings"</code></li>
                <li>• Say <code>"Close accessibility settings"</code></li>
                <li>• Say <code>"Start listening"</code> or <code>"Stop listening"</code></li>
              </ul>
            </div>
          </div>
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

  function mountWidget() {
    if (!document.body) return;
    if (rulerEl && !document.getElementById('accessai-reading-ruler-bar')) {
      document.body.appendChild(rulerEl);
    }
    if (!document.querySelector('accessai-widget')) {
      document.body.appendChild(widgetContainer);
    }
  }

  if (document.body) {
    mountWidget();
  } else {
    document.addEventListener('DOMContentLoaded', mountWidget);
  }

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

  // Switch between Main Menu View and Voice Control Submenu View
  function switchWidgetView(view) {
    currentWidgetView = view;
    const mainView = shadow.getElementById('accessai-main-view');
    const voiceView = shadow.getElementById('accessai-voice-view');
    if (view === 'voice') {
      if (mainView) mainView.style.display = 'none';
      if (voiceView) {
        voiceView.style.display = 'flex';
        shadow.getElementById('accessai-voice-back-btn')?.focus();
      }
      announce('Voice control submenu opened.');
    } else {
      if (voiceView) voiceView.style.display = 'none';
      if (mainView) {
        mainView.style.display = 'flex';
        shadow.getElementById('menu-item-voice')?.focus();
      }
      announce('Returned to main accessibility menu.');
    }
  }

  // Voice State Definitions & UI Updater
  const VOICE_STATES = {
    ready: {
      badgeText: 'Ready',
      badgeClass: 'status-ready',
      pulseClass: 'pulse-idle',
      defaultMsg: 'Voice Navigation Ready'
    },
    requesting_permission: {
      badgeText: 'Requesting permission',
      badgeClass: 'status-requesting',
      pulseClass: 'pulse-listening',
      defaultMsg: 'Requesting microphone permission...'
    },
    listening: {
      badgeText: 'Listening',
      badgeClass: 'status-listening',
      pulseClass: 'pulse-listening',
      defaultMsg: 'Listening for voice commands...'
    },
    processing: {
      badgeText: 'Processing command',
      badgeClass: 'status-processing',
      pulseClass: 'pulse-processing',
      defaultMsg: 'Processing speech command...'
    },
    executed: {
      badgeText: 'Command executed',
      badgeClass: 'status-executed',
      pulseClass: 'pulse-executed',
      defaultMsg: 'Command executed successfully'
    },
    permission_denied: {
      badgeText: 'Permission denied',
      badgeClass: 'status-denied',
      pulseClass: 'pulse-error',
      defaultMsg: 'Microphone permission was denied by browser'
    },
    unsupported: {
      badgeText: 'Browser unsupported',
      badgeClass: 'status-unsupported',
      pulseClass: 'pulse-idle',
      defaultMsg: 'Speech recognition is not supported in this browser'
    },
    error: {
      badgeText: 'Recognition error',
      badgeClass: 'status-error',
      pulseClass: 'pulse-error',
      defaultMsg: 'Speech recognition error occurred'
    }
  };

  function setVoiceState(stateKey, customMsg) {
    voiceState = stateKey;
    const def = VOICE_STATES[stateKey] || VOICE_STATES.ready;
    const badge = shadow.getElementById('accessai-voice-badge');
    const menuBadge = shadow.getElementById('accessai-voice-badge-menu');
    const menuDesc = shadow.getElementById('accessai-voice-desc-menu');
    const text = shadow.getElementById('accessai-voice-text');
    const dot = shadow.getElementById('accessai-voice-pulse-dot');
    const micStatus = shadow.getElementById('accessai-voice-mic-status');
    const startBtn = shadow.getElementById('accessai-voice-start-btn');
    const stopBtn = shadow.getElementById('accessai-voice-stop-btn');

    if (badge) {
      badge.textContent = def.badgeText;
      badge.className = 'accessai-status-badge ' + def.badgeClass;
    }
    if (menuBadge) {
      menuBadge.textContent = def.badgeText;
      menuBadge.className = 'accessai-status-badge ' + def.badgeClass;
    }

    const message = customMsg || def.defaultMsg;

    if (text) {
      text.textContent = message;
    }

    if (dot) {
      dot.className = 'accessai-voice-pulse ' + def.pulseClass;
    }

    if (menuDesc) {
      if (stateKey === 'listening') {
        menuDesc.textContent = 'Listening actively for voice commands';
      } else if (stateKey === 'permission_denied') {
        menuDesc.textContent = 'Microphone permission denied';
      } else if (stateKey === 'unsupported') {
        menuDesc.textContent = 'Web Speech API unavailable';
      } else {
        menuDesc.textContent = 'Operate website using spoken commands';
      }
    }

    if (micStatus) {
      if (stateKey === 'listening') {
        micStatus.textContent = 'Microphone Permission: Granted & Active';
        micStatus.style.color = '#648568';
      } else if (stateKey === 'permission_denied') {
        micStatus.textContent = 'Microphone Permission: Blocked / Denied by Browser';
        micStatus.style.color = '#C94F55';
      } else if (stateKey === 'requesting_permission') {
        micStatus.textContent = 'Microphone Permission: Prompt Requested (Click Allow)';
        micStatus.style.color = '#D88A4C';
      } else if (stateKey === 'unsupported') {
        micStatus.textContent = 'Microphone Permission: Web Speech API Unsupported';
        micStatus.style.color = '#64748B';
      } else {
        micStatus.textContent = 'Microphone Permission: Ready on Demand';
        micStatus.style.color = '#70716B';
      }
    }

    if (startBtn && stopBtn) {
      if (stateKey === 'listening' || stateKey === 'requesting_permission' || stateKey === 'processing') {
        startBtn.style.opacity = '0.5';
        startBtn.style.pointerEvents = 'none';
        stopBtn.style.opacity = '1';
        stopBtn.style.pointerEvents = 'auto';
      } else {
        startBtn.style.opacity = '1';
        startBtn.style.pointerEvents = 'auto';
        stopBtn.style.opacity = '0.5';
        stopBtn.style.pointerEvents = 'none';
      }
    }
  }

  // Web Speech API Voice Recognition
  function startVoiceControl() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Web Speech API is not supported in this browser.');
      preferences.voiceControl = false;
      setVoiceState('unsupported');
      updateUI();
      return;
    }

    isExplicitlyStopped = false;

    // If instance is already active and listening, avoid recreating
    if (recognitionInstance && (voiceState === 'listening' || voiceState === 'requesting_permission')) {
      return;
    }

    if (recognitionInstance) {
      try { recognitionInstance.abort(); } catch(e) {}
      recognitionInstance = null;
    }

    setVoiceState('requesting_permission', 'Requesting microphone permission...');

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = selectedLanguage;
      recognition.maxAlternatives = 1;

      recognition.onstart = function() {
        voiceListening = true;
        isExplicitlyStopped = false;
        preferences.voiceControl = true;
        setVoiceState('listening', 'Listening for voice commands...');
      };

      recognition.onresult = function(event) {
        if (!event.results || event.results.length === 0) return;
        const lastResultIndex = event.results.length - 1;
        const transcript = event.results[lastResultIndex][0].transcript.trim().toLowerCase();
        handleVoiceCommand(transcript);
      };

      recognition.onerror = function(event) {
        if (event.error === 'no-speech') {
          return;
        }

        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          isExplicitlyStopped = true;
          preferences.voiceControl = false;
          setVoiceState('permission_denied', 'Microphone permission denied. Enable mic in browser settings.');
          updateUI();
          announce('Microphone permission denied.');
          return;
        }

        if (event.error === 'audio-capture') {
          isExplicitlyStopped = true;
          preferences.voiceControl = false;
          setVoiceState('error', 'No microphone detected on this device.');
          updateUI();
          announce('No microphone detected.');
          return;
        }

        if (event.error === 'aborted') {
          return;
        }

        setVoiceState('error', `Recognition error: ${event.error}`);
      };

      recognition.onend = function() {
        voiceListening = false;
        // Only restart if voiceControl is still true, not explicitly stopped, and not in an error state
        if (preferences.voiceControl && !isExplicitlyStopped && voiceState !== 'permission_denied' && voiceState !== 'unsupported') {
          setTimeout(() => {
            if (preferences.voiceControl && !isExplicitlyStopped) {
              try {
                recognition.start();
              } catch(e) {}
            }
          }, 300);
        }
      };

      recognition.start();
      recognitionInstance = recognition;
    } catch (e) {
      console.warn('Unable to initialize voice recognition:', e);
      preferences.voiceControl = false;
      setVoiceState('error', 'Unable to start speech recognition.');
      updateUI();
    }
  }

  function stopVoiceControl(explicit) {
    if (explicit) {
      isExplicitlyStopped = true;
    }
    clearTimeout(voiceFeedbackTimer);
    if (recognitionInstance) {
      try {
        recognitionInstance.abort();
      } catch(e) {}
      recognitionInstance = null;
    }
    voiceListening = false;
  }

  function handleVoiceCommand(cmd) {
    setVoiceState('processing', `Processing: "${cmd}"`);

    let recognized = true;

    // 1. Navigation Commands
    if (cmd.includes('scroll down') || cmd.includes('move down') || cmd.includes('page down')) {
      window.scrollBy({ top: 450, behavior: 'smooth' });
      setVoiceState('executed', 'Executed: Scrolled down page');
      announce('Scrolled down page.');
    } else if (cmd.includes('scroll up') || cmd.includes('move up') || cmd.includes('page up')) {
      window.scrollBy({ top: -450, behavior: 'smooth' });
      setVoiceState('executed', 'Executed: Scrolled up page');
      announce('Scrolled up page.');
    } else if (cmd.includes('go to top') || cmd.includes('scroll to top') || cmd.includes('top of page')) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setVoiceState('executed', 'Executed: Scrolled to top of page');
      announce('Scrolled to top of page.');
    } else if (cmd.includes('go to bottom') || cmd.includes('scroll to bottom') || cmd.includes('bottom of page')) {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      setVoiceState('executed', 'Executed: Scrolled to bottom of page');
      announce('Scrolled to bottom of page.');
    } else if (cmd.startsWith('open link ') || (cmd.startsWith('open ') && !cmd.includes('settings') && !cmd.includes('panel') && !cmd.includes('menu') && !cmd.includes('accessibility'))) {
      const targetQuery = cmd.replace(/^open link /, '').replace(/^open /, '').trim();
      if (targetQuery.length > 1) {
        const clickable = Array.from(document.querySelectorAll('a[href], button, [role="button"], [role="link"], nav button'));
        const matched = clickable.find(l => {
          const txt = (l.textContent || '').trim().toLowerCase();
          const aria = (l.getAttribute('aria-label') || '').trim().toLowerCase();
          const title = (l.getAttribute('title') || '').trim().toLowerCase();
          return txt.includes(targetQuery) || aria.includes(targetQuery) || title.includes(targetQuery);
        });

        if (matched) {
          setVoiceState('executed', `Executed: Opening "${targetQuery}"`);
          announce(`Opening ${targetQuery}.`);
          setTimeout(() => {
            matched.click();
          }, 700);
          return;
        } else {
          setVoiceState('listening', `Target matching "${targetQuery}" not found`);
          announce(`Target ${targetQuery} not found on this page.`);
        }
      }
    } 
    // 2. Widget Controls
    else if (cmd.includes('open accessibility settings') || cmd.includes('open settings') || cmd.includes('open accessibility') || cmd.includes('open menu') || cmd.includes('show panel')) {
      togglePanel(true);
      setVoiceState('executed', 'Executed: Accessibility settings opened');
    } else if (cmd.includes('close accessibility settings') || cmd.includes('close settings') || cmd.includes('close accessibility') || cmd.includes('close menu') || cmd.includes('hide settings')) {
      togglePanel(false);
      setVoiceState('executed', 'Executed: Accessibility settings closed');
    } else if (cmd.includes('stop listening') || cmd.includes('stop voice') || cmd.includes('turn off voice')) {
      stopVoiceControl(true);
      preferences.voiceControl = false;
      applyHostPreferences({ skipVoice: true });
      updateUI();
      setVoiceState('ready', 'Voice navigation stopped');
      announce('Voice navigation stopped.');
      return;
    } else if (cmd.includes('start listening')) {
      startVoiceControl();
      setVoiceState('listening', 'Voice navigation active and listening');
      announce('Voice navigation listening.');
      return;
    } 
    // 3. Visual Controls
    else if (cmd.includes('increase text size') || cmd.includes('increase text') || cmd.includes('larger text') || cmd.includes('bigger text') || cmd.includes('make text bigger') || cmd.includes('zoom in')) {
      const sizes = [100, 110, 120, 130];
      const idx = sizes.indexOf(preferences.fontSize);
      preferences.fontSize = sizes[Math.min(sizes.length - 1, idx + 1)];
      applyHostPreferences({ skipVoice: true });
      updateUI();
      setVoiceState('executed', `Executed: Text size increased to ${preferences.fontSize}%`);
      announce(`Text size increased to ${preferences.fontSize} percent.`);
    } else if (cmd.includes('decrease text size') || cmd.includes('decrease text') || cmd.includes('smaller text') || cmd.includes('make text smaller') || cmd.includes('zoom out')) {
      const sizes = [100, 110, 120, 130];
      const idx = sizes.indexOf(preferences.fontSize);
      preferences.fontSize = sizes[Math.max(0, idx - 1)];
      applyHostPreferences({ skipVoice: true });
      updateUI();
      setVoiceState('executed', `Executed: Text size decreased to ${preferences.fontSize}%`);
      announce(`Text size decreased to ${preferences.fontSize} percent.`);
    } else if (cmd.includes('disable high contrast') || cmd.includes('turn off high contrast') || cmd.includes('contrast off') || cmd.includes('dark mode off')) {
      preferences.highContrast = false;
      applyHostPreferences({ skipVoice: true });
      updateUI();
      setVoiceState('executed', 'Executed: High contrast disabled');
      announce('High contrast mode disabled.');
    } else if (cmd.includes('enable high contrast') || cmd.includes('turn on high contrast') || cmd.includes('high contrast on') || cmd.includes('dark mode on') || cmd.includes('contrast')) {
      preferences.highContrast = true;
      applyHostPreferences({ skipVoice: true });
      updateUI();
      setVoiceState('executed', 'Executed: High contrast enabled');
      announce('High contrast mode enabled.');
    } else if (cmd.includes('disable dyslexia font') || cmd.includes('disable dyslexia-friendly font') || cmd.includes('disable dyslexia mode') || cmd.includes('turn off dyslexia font')) {
      preferences.dyslexiaFont = false;
      applyHostPreferences({ skipVoice: true });
      updateUI();
      setVoiceState('executed', 'Executed: Dyslexia font disabled');
      announce('Dyslexia font disabled.');
    } else if (cmd.includes('enable dyslexia font') || cmd.includes('enable dyslexia-friendly font') || cmd.includes('enable dyslexia mode') || cmd.includes('turn on dyslexia font') || cmd.includes('dyslexia')) {
      preferences.dyslexiaFont = true;
      applyHostPreferences({ skipVoice: true });
      updateUI();
      setVoiceState('executed', 'Executed: Dyslexia font enabled');
      announce('Dyslexia font enabled.');
    } else if (cmd.includes('disable focus indicators') || cmd.includes('disable focus ring') || cmd.includes('turn off focus')) {
      preferences.focusRing = false;
      applyHostPreferences({ skipVoice: true });
      updateUI();
      setVoiceState('executed', 'Executed: Focus indicators disabled');
      announce('Focus ring disabled.');
    } else if (cmd.includes('enable focus indicators') || cmd.includes('enable focus ring') || cmd.includes('turn on focus') || cmd.includes('focus ring') || cmd.includes('focus')) {
      preferences.focusRing = true;
      applyHostPreferences({ skipVoice: true });
      updateUI();
      setVoiceState('executed', 'Executed: Focus indicators enabled');
      announce('Focus ring enabled.');
    } else if (cmd.includes('disable reading ruler') || cmd.includes('turn off reading ruler') || cmd.includes('ruler off')) {
      preferences.readingRuler = false;
      applyHostPreferences({ skipVoice: true });
      updateUI();
      setVoiceState('executed', 'Executed: Reading ruler disabled');
      announce('Reading ruler disabled.');
    } else if (cmd.includes('enable reading ruler') || cmd.includes('turn on reading ruler') || cmd.includes('reading ruler on') || cmd.includes('reading ruler') || cmd.includes('ruler')) {
      preferences.readingRuler = true;
      applyHostPreferences({ skipVoice: true });
      updateUI();
      setVoiceState('executed', 'Executed: Reading ruler enabled');
      announce('Reading ruler enabled.');
    } else if (cmd.includes('reset accessibility settings') || cmd.includes('reset settings') || cmd.includes('reset all') || cmd.includes('normal')) {
      preferences.fontSize = 100;
      preferences.dyslexiaFont = false;
      preferences.highContrast = false;
      preferences.focusRing = false;
      preferences.readingRuler = false;
      // Keep voice active so user can continue issuing voice commands
      applyHostPreferences({ skipVoice: true });
      updateUI();
      setVoiceState('executed', 'Executed: Reset settings to default');
      announce('All accessibility settings restored to default.');
    } else {
      recognized = false;
      setVoiceState('listening', `Heard: "${cmd}" (check Voice Command Guide)`);
    }

    if (recognized) {
      clearTimeout(voiceFeedbackTimer);
      voiceFeedbackTimer = setTimeout(() => {
        if (preferences.voiceControl && !isExplicitlyStopped) {
          setVoiceState('listening');
        }
      }, 2200);
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

    const menuItemVoice = shadow.getElementById('menu-item-voice');
    if (menuItemVoice) {
      menuItemVoice.classList.toggle('active', preferences.voiceControl);
      menuItemVoice.setAttribute('aria-pressed', String(preferences.voiceControl));
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
      applyHostPreferences({ skipVoice: true });
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
      applyHostPreferences({ skipVoice: true });
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

  // First-Level Voice Control Menu Item Click
  const voiceMenuItem = shadow.getElementById('menu-item-voice');
  if (voiceMenuItem) {
    voiceMenuItem.addEventListener('click', () => {
      switchWidgetView('voice');
    });
    voiceMenuItem.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        switchWidgetView('voice');
      }
    });
  }

  // Voice Submenu Back Button
  const voiceBackBtn = shadow.getElementById('accessai-voice-back-btn');
  if (voiceBackBtn) {
    voiceBackBtn.addEventListener('click', () => {
      switchWidgetView('main');
    });
  }

  // Voice Submenu Start Listening Button
  const voiceStartBtn = shadow.getElementById('accessai-voice-start-btn');
  if (voiceStartBtn) {
    voiceStartBtn.addEventListener('click', () => {
      preferences.voiceControl = true;
      startVoiceControl();
      applyHostPreferences({ skipVoice: true });
      updateUI();
      announce('Voice navigation activated. Listening for commands.');
    });
  }

  // Voice Submenu Stop Listening Button
  const voiceStopBtn = shadow.getElementById('accessai-voice-stop-btn');
  if (voiceStopBtn) {
    voiceStopBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      preferences.voiceControl = false;
      stopVoiceControl(true);
      applyHostPreferences({ skipVoice: true });
      updateUI();
      setVoiceState('ready', 'Voice navigation stopped');
      announce('Voice navigation stopped.');
    });
  }

  // Language Selector
  const voiceLangSelect = shadow.getElementById('accessai-voice-lang');
  if (voiceLangSelect) {
    voiceLangSelect.addEventListener('change', (e) => {
      selectedLanguage = e.target.value;
      announce(`Voice language set to ${selectedLanguage}.`);
      if (preferences.voiceControl) {
        stopVoiceControl(false);
        startVoiceControl();
      }
    });
  }

  // Menu Reset All & Footer Reset
  const resetHandler = () => {
    preferences = Object.assign({}, defaultPrefs);
    stopVoiceControl(true);
    setVoiceState('ready');
    applyHostPreferences({ skipVoice: true });
    updateUI();
    announce('All accessibility settings restored to default.');
  };

  const footerReset = shadow.getElementById('accessai-reset');
  if (footerReset) footerReset.addEventListener('click', resetHandler);

  const menuReset = shadow.getElementById('menu-reset-all');
  if (menuReset) menuReset.addEventListener('click', resetHandler);

  // Global Keyboard Shortcuts
  window.addEventListener('keydown', (e) => {
    // Escape key handling
    if (e.key === 'Escape' && isOpen) {
      if (currentWidgetView === 'voice') {
        switchWidgetView('main');
      } else {
        togglePanel(false);
      }
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
  const initialSpeechCheck = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!initialSpeechCheck) {
    setVoiceState('unsupported');
  } else {
    setVoiceState('ready');
  }

  // Never auto-start microphone on cold page load without user gesture
  preferences.voiceControl = false;
  applyHostPreferences({ skipVoice: true });
  updateUI();

  // Expose clean public interface on window for programmatic control & testing
  window.AccessAI = {
    toggle: () => togglePanel(),
    open: () => togglePanel(true),
    close: () => togglePanel(false),
    getPreferences: () => Object.assign({}, preferences),
    switchView: (view) => switchWidgetView(view),
    isVoiceListening: () => voiceListening,
    getVoiceState: () => voiceState,
    handleVoiceCommand: (cmd) => handleVoiceCommand(cmd)
  };
})();
