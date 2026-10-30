import React, { useState, useEffect } from 'react';
import {
  Code2,
  Copy,
  Check,
  Globe,
  Sliders,
  Sparkles,
  Eye,
  Type,
  Sun,
  Keyboard,
  Mic,
  BookmarkCheck,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Trash2,
  Layers,
  ArrowRight
} from 'lucide-react';
import { PageId, ToastMessage } from '../../types';
import { api } from '../../services/api';

interface WidgetPageProps {
  onNavigate: (page: PageId) => void;
  onAddToast: (toast: Omit<ToastMessage, 'id'>) => void;
  currentSiteUrl?: string;
}

export const WidgetPage: React.FC<WidgetPageProps> = ({
  onNavigate,
  onAddToast,
  currentSiteUrl
}) => {
  const [siteId, setSiteId] = useState<string>('site_primary_portal');
  const [domain, setDomain] = useState<string>(currentSiteUrl || 'https://my-store.io');
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'html' | 'react' | 'wordpress' | 'shopify'>('html');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [widgetEnabled, setWidgetEnabled] = useState<boolean>(true);
  const [isValidatingDomain, setIsValidatingDomain] = useState<boolean>(false);
  const [domainValidated, setDomainValidated] = useState<boolean | null>(null);

  const handleGenerateSiteId = () => {
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const hostClean = domain ? domain.replace(/^https?:\/\//, '').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 12) : 'site';
    const newId = `${hostClean}_${randomSuffix}`;
    setSiteId(newId);
    onAddToast({
      type: 'info',
      title: 'New Site ID Generated',
      message: `Assigned identifier: ${newId}`
    });
  };

  const handleValidateDomain = () => {
    try {
      setIsValidatingDomain(true);
      const urlToTest = domain.startsWith('http') ? domain : `https://${domain}`;
      const parsed = new URL(urlToTest);
      if (!parsed.hostname || parsed.hostname.length < 3) {
        throw new Error('Invalid domain name format');
      }
      setDomain(urlToTest);
      setDomainValidated(true);
      onAddToast({
        type: 'success',
        title: 'Domain Validated',
        message: `${parsed.hostname} conforms to W3C URL format.`
      });
    } catch {
      setDomainValidated(false);
      onAddToast({
        type: 'warning',
        title: 'Invalid Domain',
        message: 'Please provide a valid URL (e.g. https://your-website.com)'
      });
    } finally {
      setIsValidatingDomain(false);
    }
  };

  // Widget settings
  const [position, setPosition] = useState<'bottom-right' | 'bottom-left'>('bottom-right');
  const [primaryColor, setPrimaryColor] = useState<string>('#C96F82');
  const [features, setFeatures] = useState({
    textResize: true,
    dyslexiaFont: true,
    highContrast: true,
    keyboardFocus: true,
    voiceControl: true,
    readingRuler: true,
    screenReaderAnnounce: true
  });

  // Playground simulation state
  const [simTextScale, setSimTextScale] = useState<number>(100);
  const [simDyslexia, setSimDyslexia] = useState<boolean>(false);
  const [simContrast, setSimContrast] = useState<boolean>(false);
  const [simFocusRing, setSimFocusRing] = useState<boolean>(false);

  // Load site config if available
  useEffect(() => {
    api.getWidgetConfig(siteId)
      .then((res) => {
        if (res && res.success) {
          if (res.domain && res.domain !== 'default') setDomain(res.domain);
          if (res.position) setPosition(res.position);
          if (res.primaryColor) setPrimaryColor(res.primaryColor);
          if (res.enabledFeatures) setFeatures(res.enabledFeatures);
        }
      })
      .catch(() => {});
  }, [siteId]);

  const scriptTagCode = `<script src="${window.location.origin}/accessibility-widget.js" data-site-id="${siteId}" defer></script>`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(scriptTagCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    onAddToast({
      type: 'success',
      title: 'Embed Snippet Copied!',
      message: 'Paste this <script> tag before the closing </body> tag of any website.'
    });
  };

  const handleSaveConfig = async () => {
    try {
      setIsSaving(true);
      await api.saveWidgetConfig({
        siteId,
        domain,
        position,
        primaryColor,
        enabledFeatures: features
      });
      onAddToast({
        type: 'success',
        title: 'Widget Settings Saved',
        message: 'Your visitors will immediately receive the updated accessibility controls.'
      });
    } catch (err: any) {
      onAddToast({
        type: 'error',
        title: 'Save Failed',
        message: err.message || 'Could not persist widget configuration.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleFeature = (key: keyof typeof features) => {
    setFeatures((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-16">
      {/* Page Header */}
      <div className="p-6 sm:p-7 rounded-2xl bg-white border border-[#EAEAE4] shadow-card relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#C96F82] via-[#EEF0E3] to-[#7B8053]" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="p-1 rounded-md bg-[#FFF5F6] text-[#C96F82] border border-[#F8E9ED]">
                <Layers className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-[#A84F65]">
                PS 1.4 Accessibility Layer for Any Website
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#292A27] tracking-tight">
              Standalone Accessibility Widget
            </h1>
            <p className="text-xs sm:text-sm text-[#70716B] mt-1 max-w-2xl leading-relaxed">
              Equip any external website with an interactive accessibility suite using Shadow DOM isolation. Visitors can scale text, toggle dyslexia fonts, enable high contrast, and navigate using voice recognition.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleSaveConfig}
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C96F82] hover:bg-[#A84F65] text-white text-xs font-bold shadow-rose transition-all disabled:opacity-60"
            >
              <BookmarkCheck className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Configuration & Embed Snippet */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Site Registration & Controls (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Site Identification Card */}
          <div className="p-6 rounded-2xl bg-white border border-[#EAEAE4] shadow-card space-y-4">
            <div className="flex items-center justify-between border-b border-[#EAEAE4] pb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#7B8053]" />
                <h3 className="text-sm font-bold text-[#292A27]">Registered Target Domain</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setWidgetEnabled((prev) => !prev)}
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border transition-colors ${
                    widgetEnabled
                      ? 'bg-[#F2F7F3] text-[#648568] border-[#E2EDE4]'
                      : 'bg-[#FFF5F6] text-[#C94F55] border-[#F8E9ED]'
                  }`}
                >
                  {widgetEnabled ? '● Widget Active' : '○ Widget Disabled'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#292A27]">Target Website URL</label>
                  <button
                    type="button"
                    onClick={handleValidateDomain}
                    disabled={isValidatingDomain}
                    className="text-[10px] font-bold text-[#A84F65] hover:underline"
                  >
                    {isValidatingDomain ? 'Validating...' : 'Validate Domain'}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={domain}
                    onChange={(e) => {
                      setDomain(e.target.value);
                      setDomainValidated(null);
                    }}
                    placeholder="https://example.com"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#FAFAF8] border border-[#EAEAE4] focus:outline-none focus:border-[#C96F82] focus:ring-1 focus:ring-[#C96F82] text-[#292A27]"
                  />
                  {domainValidated === true && (
                    <span className="absolute right-2.5 top-2 text-[#648568] text-xs font-bold">✓</span>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#292A27]">Site ID Identifier</label>
                  <button
                    type="button"
                    onClick={handleGenerateSiteId}
                    className="text-[10px] font-bold text-[#7B8053] hover:underline"
                  >
                    Generate ID
                  </button>
                </div>
                <input
                  type="text"
                  value={siteId}
                  onChange={(e) => setSiteId(e.target.value)}
                  placeholder="site_ab1234"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#FAFAF8] border border-[#EAEAE4] font-mono text-[#70716B] focus:outline-none focus:border-[#C96F82] focus:ring-1 focus:ring-[#C96F82]"
                />
              </div>
            </div>
          </div>

          {/* Visitor-Facing Feature Toggles */}
          <div className="p-6 rounded-2xl bg-white border border-[#EAEAE4] shadow-card space-y-4">
            <div className="flex items-center justify-between border-b border-[#EAEAE4] pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#C96F82]" />
                <h3 className="text-sm font-bold text-[#292A27]">Enabled Visitor Controls</h3>
              </div>
              <span className="text-xs text-[#70716B]">Customizable per domain</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Text Resizing */}
              <div
                onClick={() => toggleFeature('textResize')}
                className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                  features.textResize
                    ? 'bg-[#FFF5F6] border-[#F8E9ED]'
                    : 'bg-[#FAFAF8] border-[#EAEAE4] opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-[#EAEAE4] flex items-center justify-center text-[#C96F82]">
                    <Type className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#292A27]">Text Resizing</h4>
                    <p className="text-[11px] text-[#70716B]">100% to 130% scaling</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={features.textResize}
                  onChange={() => {}}
                  className="rounded text-[#C96F82] focus:ring-[#C96F82]"
                />
              </div>

              {/* Dyslexia Font */}
              <div
                onClick={() => toggleFeature('dyslexiaFont')}
                className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                  features.dyslexiaFont
                    ? 'bg-[#FFF5F6] border-[#F8E9ED]'
                    : 'bg-[#FAFAF8] border-[#EAEAE4] opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-[#EAEAE4] flex items-center justify-center text-[#C96F82]">
                    <Type className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#292A27]">Dyslexia Font</h4>
                    <p className="text-[11px] text-[#70716B]">High-legibility typography</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={features.dyslexiaFont}
                  onChange={() => {}}
                  className="rounded text-[#C96F82] focus:ring-[#C96F82]"
                />
              </div>

              {/* High Contrast */}
              <div
                onClick={() => toggleFeature('highContrast')}
                className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                  features.highContrast
                    ? 'bg-[#F6F7F0] border-[#EEF0E3]'
                    : 'bg-[#FAFAF8] border-[#EAEAE4] opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-[#EAEAE4] flex items-center justify-center text-[#7B8053]">
                    <Sun className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#292A27]">High Contrast</h4>
                    <p className="text-[11px] text-[#70716B]">Dark slate high-luminance</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={features.highContrast}
                  onChange={() => {}}
                  className="rounded text-[#7B8053] focus:ring-[#7B8053]"
                />
              </div>

              {/* Focus Ring */}
              <div
                onClick={() => toggleFeature('keyboardFocus')}
                className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                  features.keyboardFocus
                    ? 'bg-[#F6F7F0] border-[#EEF0E3]'
                    : 'bg-[#FAFAF8] border-[#EAEAE4] opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-[#EAEAE4] flex items-center justify-center text-[#7B8053]">
                    <Keyboard className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#292A27]">Visible Focus Ring</h4>
                    <p className="text-[11px] text-[#70716B]">Enhanced focus indicator</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={features.keyboardFocus}
                  onChange={() => {}}
                  className="rounded text-[#7B8053] focus:ring-[#7B8053]"
                />
              </div>

              {/* Voice Control */}
              <div
                onClick={() => toggleFeature('voiceControl')}
                className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                  features.voiceControl
                    ? 'bg-[#FFF5F6] border-[#F8E9ED]'
                    : 'bg-[#FAFAF8] border-[#EAEAE4] opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-[#EAEAE4] flex items-center justify-center text-[#C96F82]">
                    <Mic className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#292A27]">Voice Navigation</h4>
                    <p className="text-[11px] text-[#70716B]">Web Speech API recognition</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={features.voiceControl}
                  onChange={() => {}}
                  className="rounded text-[#C96F82] focus:ring-[#C96F82]"
                />
              </div>

              {/* Reading Ruler */}
              <div
                onClick={() => toggleFeature('readingRuler')}
                className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                  features.readingRuler
                    ? 'bg-[#F6F7F0] border-[#EEF0E3]'
                    : 'bg-[#FAFAF8] border-[#EAEAE4] opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-[#EAEAE4] flex items-center justify-center text-[#7B8053]">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#292A27]">Reading Ruler</h4>
                    <p className="text-[11px] text-[#70716B]">Cursor-following spotlight</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={features.readingRuler}
                  onChange={() => {}}
                  className="rounded text-[#7B8053] focus:ring-[#7B8053]"
                />
              </div>
            </div>

            {/* Appearance & Position */}
            <div className="pt-3 border-t border-[#EAEAE4] grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-[#292A27]">Launcher Position</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPosition('bottom-right')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      position === 'bottom-right'
                        ? 'bg-[#C96F82] text-white border-[#C96F82] shadow-sm'
                        : 'bg-[#FAFAF8] text-[#70716B] border-[#EAEAE4]'
                    }`}
                  >
                    Bottom Right
                  </button>
                  <button
                    onClick={() => setPosition('bottom-left')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      position === 'bottom-left'
                        ? 'bg-[#C96F82] text-white border-[#C96F82] shadow-sm'
                        : 'bg-[#FAFAF8] text-[#70716B] border-[#EAEAE4]'
                    }`}
                  >
                    Bottom Left
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-[#292A27]">Widget Primary Color</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPrimaryColor('#C96F82')}
                    className={`w-8 h-8 rounded-full border-2 transition-transform ${
                      primaryColor === '#C96F82' ? 'scale-110 border-[#292A27]' : 'border-white'
                    }`}
                    style={{ backgroundColor: '#C96F82' }}
                    title="Rose"
                  />
                  <button
                    onClick={() => setPrimaryColor('#7B8053')}
                    className={`w-8 h-8 rounded-full border-2 transition-transform ${
                      primaryColor === '#7B8053' ? 'scale-110 border-[#292A27]' : 'border-white'
                    }`}
                    style={{ backgroundColor: '#7B8053' }}
                    title="Olive"
                  />
                  <button
                    onClick={() => setPrimaryColor('#292A27')}
                    className={`w-8 h-8 rounded-full border-2 transition-transform ${
                      primaryColor === '#292A27' ? 'scale-110 border-[#C96F82]' : 'border-white'
                    }`}
                    style={{ backgroundColor: '#292A27' }}
                    title="Slate"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Copy Snippet & Integration (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Quick Embed Snippet Card */}
          <div className="p-6 rounded-2xl bg-white border border-[#EAEAE4] shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-[#C96F82]" />
                <h3 className="text-sm font-bold text-[#292A27]">Drop-in Installation Snippet</h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FFF5F6] text-[#A84F65] border border-[#F8E9ED]">
                Zero Dependencies
              </span>
            </div>

            <p className="text-xs text-[#70716B] leading-relaxed">
              Add this single script tag to any HTML page before the closing <code className="text-[#A84F65] font-mono">&lt;/body&gt;</code> tag. It loads as an asynchronous standalone module.
            </p>

            <div className="relative group">
              <pre className="p-4 rounded-xl bg-[#292A27] text-white font-mono text-[11px] overflow-x-auto leading-relaxed border border-[#3A3B37]">
                <code>{scriptTagCode}</code>
              </pre>

              <button
                onClick={handleCopyCode}
                className="absolute top-2.5 right-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C96F82] hover:bg-[#A84F65] text-white text-[11px] font-bold shadow-sm transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Platform Integration Guide Tabs */}
            <div className="pt-2 space-y-3">
              <div className="flex items-center gap-2 border-b border-[#EAEAE4] pb-2 text-xs font-semibold">
                <button
                  onClick={() => setActiveTab('html')}
                  className={`pb-1 transition-colors ${
                    activeTab === 'html'
                      ? 'text-[#C96F82] border-b-2 border-[#C96F82] font-bold'
                      : 'text-[#70716B] hover:text-[#292A27]'
                  }`}
                >
                  HTML / Webflow
                </button>
                <button
                  onClick={() => setActiveTab('react')}
                  className={`pb-1 transition-colors ${
                    activeTab === 'react'
                      ? 'text-[#C96F82] border-b-2 border-[#C96F82] font-bold'
                      : 'text-[#70716B] hover:text-[#292A27]'
                  }`}
                >
                  Next.js / React
                </button>
                <button
                  onClick={() => setActiveTab('wordpress')}
                  className={`pb-1 transition-colors ${
                    activeTab === 'wordpress'
                      ? 'text-[#C96F82] border-b-2 border-[#C96F82] font-bold'
                      : 'text-[#70716B] hover:text-[#292A27]'
                  }`}
                >
                  WordPress
                </button>
                <button
                  onClick={() => setActiveTab('shopify')}
                  className={`pb-1 transition-colors ${
                    activeTab === 'shopify'
                      ? 'text-[#C96F82] border-b-2 border-[#C96F82] font-bold'
                      : 'text-[#70716B] hover:text-[#292A27]'
                  }`}
                >
                  Shopify
                </button>
              </div>

              <div className="text-xs text-[#70716B] leading-relaxed bg-[#FAFAF8] p-3.5 rounded-xl border border-[#EAEAE4]">
                {activeTab === 'html' && (
                  <p>
                    Paste the tag directly inside your website template file right before the closing <code className="font-mono text-[#A84F65]">&lt;/body&gt;</code> tag. It will automatically initialize without conflicting with your stylesheet.
                  </p>
                )}
                {activeTab === 'react' && (
                  <p>
                    In Next.js, add <code className="font-mono text-[#A84F65]">&lt;Script src="..." strategy="afterInteractive" data-site-id="{siteId}" /&gt;</code> inside your root layout or document.
                  </p>
                )}
                {activeTab === 'wordpress' && (
                  <p>
                    Navigate to <strong>Appearance → Theme File Editor → footer.php</strong> or use a header/footer injection plugin (e.g. WPCode) to insert the script globally across all posts and pages.
                  </p>
                )}
                {activeTab === 'shopify' && (
                  <p>
                    In Shopify Admin, open <strong>Online Store → Themes → Edit Code</strong>, select <code className="font-mono text-[#A84F65]">theme.liquid</code>, and paste the code right above <code className="font-mono text-[#A84F65]">&lt;/body&gt;</code>.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Verification & Compliance Assurance */}
          <div className="p-6 rounded-2xl bg-[#F6F7F0] border border-[#EEF0E3] space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#7B8053]" />
              <h4 className="text-xs font-bold text-[#292A27]">Complies with International Standards</h4>
            </div>
            <p className="text-xs text-[#70716B] leading-relaxed">
              The AccessAI accessibility layer delivers immediate usability enhancements for visitors with low vision, motor impairments, dyslexia, and ADHD, supporting ADA Title III, Section 508, and EAA requirements.
            </p>
            <div className="pt-1 flex items-center gap-2 text-[11px] font-semibold text-[#7B8053]">
              <span>Keyboard Shortcut:</span>
              <kbd className="px-2 py-0.5 rounded bg-white border border-[#EEF0E3] font-mono text-[#292A27]">Alt + A</kbd>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Live Playground Simulation */}
      <div className="p-6 sm:p-7 rounded-2xl bg-white border border-[#EAEAE4] shadow-card space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EAEAE4] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#C96F82]" />
              <h3 className="text-base font-bold text-[#292A27]">Live Interactive Accessibility Playground</h3>
            </div>
            <p className="text-xs text-[#70716B] mt-0.5">
              Simulate how the accessibility controls transform content on your host pages in real time.
            </p>
          </div>

          {/* Quick simulator controls */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSimTextScale((prev) => (prev >= 130 ? 100 : prev + 10))}
              className="px-3 py-1.5 rounded-lg bg-[#FAFAF8] hover:bg-[#FFF5F6] border border-[#EAEAE4] text-xs font-semibold text-[#292A27] transition-colors"
            >
              Zoom: {simTextScale}%
            </button>
            <button
              onClick={() => setSimDyslexia((prev) => !prev)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                simDyslexia
                  ? 'bg-[#FFF5F6] text-[#A84F65] border-[#F8E9ED]'
                  : 'bg-[#FAFAF8] text-[#70716B] border-[#EAEAE4]'
              }`}
            >
              Dyslexia Font: {simDyslexia ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={() => setSimContrast((prev) => !prev)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                simContrast
                  ? 'bg-[#292A27] text-[#FDE047] border-[#3A3B37]'
                  : 'bg-[#FAFAF8] text-[#70716B] border-[#EAEAE4]'
              }`}
            >
              High Contrast: {simContrast ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={() => setSimFocusRing((prev) => !prev)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                simFocusRing
                  ? 'bg-[#F6F7F0] text-[#7B8053] border-[#EEF0E3]'
                  : 'bg-[#FAFAF8] text-[#70716B] border-[#EAEAE4]'
              }`}
            >
              Focus Ring: {simFocusRing ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Preview Container */}
        <div
          className={`p-6 sm:p-8 rounded-xl border transition-all duration-300 ${
            simContrast
              ? 'bg-[#0F172A] text-[#F8FAFC] border-[#38BDF8]'
              : 'bg-[#FAFAF8] text-[#292A27] border-[#EAEAE4]'
          }`}
          style={{
            fontSize: `${simTextScale}%`,
            fontFamily: simDyslexia
              ? "'OpenDyslexic', 'Comic Sans MS', sans-serif"
              : 'inherit',
            letterSpacing: simDyslexia ? '0.04em' : 'normal',
            lineHeight: simDyslexia ? '1.7' : 'normal'
          }}
        >
          <div className="max-w-3xl space-y-4">
            <span
              className={`inline-block px-2.5 py-0.5 text-xs font-bold rounded-full ${
                simContrast
                  ? 'bg-[#1E293B] text-[#FDE047] border border-[#FDE047]'
                  : 'bg-[#FFF5F6] text-[#A84F65] border border-[#F8E9ED]'
              }`}
            >
              Simulated Host Page Element
            </span>

            <h2 className="text-xl sm:text-2xl font-black">
              Empowering Every Visitor With Modern Accessibility
            </h2>

            <p className={simContrast ? 'text-[#CBD5E1]' : 'text-[#70716B]'}>
              This preview demonstrator reflects the live transformations applied to the host website when a visitor opens the AccessAI widget. Visitors can dynamically scale typography up to 130%, switch to weighted dyslexia-friendly glyphs, enforce dark high-contrast modes, and speak voice commands.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  simContrast
                    ? 'bg-[#1E293B] text-[#FDE047] border-2 border-[#FDE047]'
                    : 'bg-[#C96F82] text-white hover:bg-[#A84F65]'
                } ${
                  simFocusRing
                    ? 'ring-4 ring-[#C96F82]/50 outline-2 outline-[#C96F82]'
                    : ''
                }`}
              >
                Sample Interactive Action
              </button>

              <input
                type="text"
                placeholder="Simulated accessible form input..."
                className={`px-3.5 py-2 text-xs rounded-xl border focus:outline-none ${
                  simContrast
                    ? 'bg-[#1E293B] text-white border-[#FDE047] placeholder-slate-400'
                    : 'bg-white text-[#292A27] border-[#EAEAE4]'
                } ${
                  simFocusRing
                    ? 'ring-4 ring-[#C96F82]/50 outline-2 outline-[#C96F82]'
                    : ''
                }`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default WidgetPage;
