import React, { useState, useEffect } from 'react';
import {
  Settings,
  User,
  Cpu,
  Sliders,
  Bell,
  Palette,
  Eye,
  EyeOff,
  Save,
  Shield,
  Key
} from 'lucide-react';
import { UserSettings, ToastMessage } from '../../types';
import { api } from '../../services/api';

interface SettingsPageProps {
  settings: UserSettings;
  onSaveSettings: (newSettings: UserSettings) => void;
  onAddToast: (toast: Omit<ToastMessage, 'id'>) => void;
  isDemoMode?: boolean;
  onToggleDemoMode?: (active: boolean) => void;
  onClearAllScans?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  onSaveSettings,
  onAddToast,
  isDemoMode = false,
  onToggleDemoMode,
  onClearAllScans
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'ai' | 'scanning' | 'notifications' | 'appearance' | 'data'>('profile');
  const [formData, setFormData] = useState<UserSettings>(settings);
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyMasked, setApiKeyMasked] = useState('AIzaSy••••••••••••••••••••••••');

  useEffect(() => {
    api.getAiSettings()
      .then((ai) => {
        if (ai && ai.isConfigured && ai.maskedKey) {
          setApiKeyMasked(ai.maskedKey);
        }
      })
      .catch(() => {});
  }, []);

  const handleSave = async (sectionName: string) => {
    onSaveSettings(formData);
    if (sectionName === 'AI Provider' && apiKeyMasked && !apiKeyMasked.includes('•••')) {
      try {
        await api.saveAiApiKey(apiKeyMasked);
      } catch (e) {}
    }
    onAddToast({
      type: 'success',
      title: 'Settings Saved',
      message: `${sectionName} preferences successfully updated.`
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-7 rounded-2xl bg-white border border-[#EAEAE4] shadow-card relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#C96F82] via-[#EEF0E3] to-[#7B8053]" />

        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1 rounded-md bg-[#FFF5F6] text-[#C96F82] border border-[#F8E9ED]">
              <Settings className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#A84F65]">
              Configuration Center
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#292A27] tracking-tight">
            Platform Settings
          </h1>
          <p className="text-xs sm:text-sm text-[#70716B] mt-1 max-w-2xl leading-relaxed">
            Manage your personal profile, AI remediation model providers, WCAG compliance parameters, and audit notifications.
          </p>
        </div>
      </div>

      {/* Tabs Navigation in Rose & Olive */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#EAEAE4] pb-3">
        {[
          { id: 'profile', label: 'User Profile', icon: User },
          { id: 'ai', label: 'AI Provider & Models', icon: Cpu },
          { id: 'scanning', label: 'Scanning Preferences', icon: Sliders },
          { id: 'notifications', label: 'Notifications', icon: Bell },
          { id: 'appearance', label: 'Appearance', icon: Palette },
          { id: 'data', label: 'Data & Demo Mode', icon: Shield }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                isActive
                  ? 'bg-[#C96F82] text-white shadow-rose-sm'
                  : 'bg-white text-[#70716B] hover:text-[#292A27] hover:bg-[#FAFAF8] border border-[#EAEAE4]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: User Profile */}
      {activeTab === 'profile' && (
        <section className="p-6 sm:p-7 rounded-2xl bg-white border border-[#EAEAE4] shadow-card space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#EAEAE4]">
            <div>
              <h3 className="text-base font-bold text-[#292A27]">Profile Details</h3>
              <p className="text-xs text-[#70716B]">Manage user credentials and enterprise affiliation</p>
            </div>
            <button
              onClick={() => handleSave('Profile')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C96F82] hover:bg-[#A84F65] text-white text-xs font-bold shadow-rose-sm transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#292A27] mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={formData.profile.fullName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    profile: { ...formData.profile, fullName: e.target.value }
                  })
                }
                className="w-full px-3.5 py-2.5 bg-[#FAFAF8] border border-[#EAEAE4] rounded-xl text-sm text-[#292A27] focus:outline-none focus:ring-2 focus:ring-[#C96F82]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#292A27] mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={formData.profile.email}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    profile: { ...formData.profile, email: e.target.value }
                  })
                }
                className="w-full px-3.5 py-2.5 bg-[#FAFAF8] border border-[#EAEAE4] rounded-xl text-sm text-[#292A27] focus:outline-none focus:ring-2 focus:ring-[#C96F82]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#292A27] mb-1.5">
                Job Title / Role
              </label>
              <input
                type="text"
                value={formData.profile.role}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    profile: { ...formData.profile, role: e.target.value }
                  })
                }
                className="w-full px-3.5 py-2.5 bg-[#FAFAF8] border border-[#EAEAE4] rounded-xl text-sm text-[#292A27] focus:outline-none focus:ring-2 focus:ring-[#C96F82]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#292A27] mb-1.5">
                Organization / Company
              </label>
              <input
                type="text"
                value={formData.profile.company}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    profile: { ...formData.profile, company: e.target.value }
                  })
                }
                className="w-full px-3.5 py-2.5 bg-[#FAFAF8] border border-[#EAEAE4] rounded-xl text-sm text-[#292A27] focus:outline-none focus:ring-2 focus:ring-[#C96F82]"
              />
            </div>
          </div>
        </section>
      )}

      {/* Tab 6: Data & Demo Mode */}
      {activeTab === 'data' && (
        <section className="p-6 sm:p-7 rounded-2xl bg-white border border-[#EAEAE4] shadow-card space-y-6">
          <div className="pb-4 border-b border-[#EAEAE4]">
            <h3 className="text-base font-bold text-[#292A27]">Audit Storage & Demonstration Mode</h3>
            <p className="text-xs text-[#70716B]">Manage local persistent storage and toggle demonstration test data</p>
          </div>

          <div className="space-y-4">
            {/* Demo Mode Toggle Card */}
            <div className="p-5 rounded-2xl bg-[#FAFAF8] border border-[#EAEAE4] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${isDemoMode ? 'bg-[#D88A4C]' : 'bg-[#648568]'}`} />
                  <h4 className="text-sm font-bold text-[#292A27]">
                    Demonstration Mode: {isDemoMode ? 'Active' : 'Inactive (Real Auditing Mode)'}
                  </h4>
                </div>
                <p className="text-xs text-[#70716B] max-w-xl leading-relaxed">
                  When enabled, NETRA displays synthetic demonstration records (acme-store.io) for feature exploration. In real mode (default), only actual website scans from persistent storage are shown.
                </p>
              </div>

              {onToggleDemoMode && (
                <button
                  type="button"
                  onClick={() => onToggleDemoMode(!isDemoMode)}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all whitespace-nowrap ${
                    isDemoMode
                      ? 'bg-[#C96F82] hover:bg-[#A84F65] text-white shadow-rose'
                      : 'bg-white hover:bg-[#F6F7F0] text-[#7B8053] border border-[#EEF0E3]'
                  }`}
                >
                  {isDemoMode ? 'Disable Demo (Show Real Scans)' : 'Enable Demonstration Data'}
                </button>
              )}
            </div>

            {/* Storage Info Card */}
            <div className="p-5 rounded-2xl bg-white border border-[#EAEAE4] space-y-3">
              <h4 className="text-sm font-bold text-[#292A27]">Persistent Storage Location</h4>
              <p className="text-xs text-[#70716B] leading-relaxed">
                Scan records, verified fix statuses, and audit histories are persistently stored in JSON format at:
              </p>
              <code className="text-xs font-mono text-[#A84F65] bg-[#FFF5F6] px-3 py-1.5 rounded-lg border border-[#F8E9ED] block">
                data/accessai-db.json
              </code>
            </div>

            {/* Reset / Clear Data */}
            <div className="p-5 rounded-2xl bg-[#FFF5F6] border border-[#F8E9ED] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-[#C94F55]">Reset Audit Database</h4>
                <p className="text-xs text-[#A84F65] mt-0.5">
                  Clears all stored website scans, detected issues, and verified fixes from local storage.
                </p>
              </div>

              {onClearAllScans && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to clear all stored scan records? This cannot be undone.')) {
                      onClearAllScans();
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-[#FFF5F6] text-[#C94F55] font-bold text-xs border border-[#C94F55]/40 transition-colors whitespace-nowrap"
                >
                  Clear All Scan Data
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Tab 2: AI Provider Configuration */}
      {activeTab === 'ai' && (
        <section className="p-6 sm:p-7 rounded-2xl bg-white border border-[#EAEAE4] shadow-card space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#EAEAE4]">
            <div>
              <h3 className="text-base font-bold text-[#292A27] flex items-center gap-2">
                <Cpu className="w-5 h-5 text-[#C96F82]" />
                AI Remediation Provider Configuration
              </h3>
              <p className="text-xs text-[#70716B]">
                Configure underlying LLM models that synthesize accessible code snippets
              </p>
            </div>
            <button
              onClick={() => handleSave('AI Provider')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C96F82] hover:bg-[#A84F65] text-white text-xs font-bold shadow-rose-sm transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save AI Config</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#292A27] mb-1.5">
                AI Provider
              </label>
              <select
                value={formData.aiProvider.provider}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    aiProvider: {
                      ...formData.aiProvider,
                      provider: e.target.value as any
                    }
                  })
                }
                className="w-full px-3.5 py-2.5 bg-[#FAFAF8] border border-[#EAEAE4] rounded-xl text-sm text-[#292A27] focus:outline-none focus:ring-2 focus:ring-[#C96F82]"
              >
                <option value="anthropic">Anthropic (Claude 3.5 Sonnet)</option>
                <option value="openai">OpenAI (GPT-4o)</option>
                <option value="google-gemini">Google Cloud (Gemini 1.5 Pro)</option>
                <option value="local-llm">Self-Hosted Local LLM (Ollama / vLLM)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#292A27] mb-1.5">
                Model Identifier
              </label>
              <input
                type="text"
                value={formData.aiProvider.model}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    aiProvider: { ...formData.aiProvider, model: e.target.value }
                  })
                }
                className="w-full px-3.5 py-2.5 bg-[#FAFAF8] border border-[#EAEAE4] rounded-xl text-sm text-[#292A27] font-mono focus:outline-none focus:ring-2 focus:ring-[#C96F82]"
              />
            </div>
          </div>

          {/* Secure API Key field (Masked, no secret leakage) */}
          <div className="p-4 rounded-xl bg-[#FAFAF8] border border-[#EAEAE4] space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#292A27] flex items-center gap-2">
                <Key className="w-3.5 h-3.5 text-[#C96F82]" />
                Provider API Key
              </label>
              <span className="text-[11px] text-[#648568] flex items-center gap-1 font-mono font-semibold">
                <Shield className="w-3 h-3" /> Stored in encrypted server vault
              </span>
            </div>

            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKeyMasked}
                onChange={(e) => setApiKeyMasked(e.target.value)}
                placeholder="sk-..."
                className="w-full pr-10 px-3.5 py-2.5 bg-white border border-[#EAEAE4] rounded-xl text-sm text-[#292A27] font-mono focus:outline-none focus:ring-2 focus:ring-[#C96F82]"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#70716B] hover:text-[#292A27]"
                aria-label="Toggle API key visibility"
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-[#70716B]">
              Keys are strictly routed through the future FastAPI proxy backend and are never committed to version control.
            </p>
          </div>

          {/* Temperature Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#292A27]">
                Fix Sampling Temperature: {formData.aiProvider.temperature}
              </span>
              <span className="text-[#70716B] font-mono">0.0 (Deterministic) - 1.0 (Creative)</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={formData.aiProvider.temperature}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  aiProvider: {
                    ...formData.aiProvider,
                    temperature: parseFloat(e.target.value)
                  }
                })
              }
              className="w-full accent-[#C96F82]"
            />
          </div>

          {/* Custom Prompt Guidelines */}
          <div>
            <label className="block text-xs font-bold text-[#292A27] mb-1.5">
              Custom AI Remediation Guidelines
            </label>
            <textarea
              rows={3}
              value={formData.aiProvider.customPromptGuidelines}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  aiProvider: {
                    ...formData.aiProvider,
                    customPromptGuidelines: e.target.value
                  }
                })
              }
              className="w-full px-3.5 py-2.5 bg-[#FAFAF8] border border-[#EAEAE4] rounded-xl text-xs text-[#292A27] focus:outline-none focus:ring-2 focus:ring-[#C96F82]"
            />
          </div>
        </section>
      )}

      {/* Tab 6: Data & Demo Mode */}
      {activeTab === 'data' && (
        <section className="p-6 sm:p-7 rounded-2xl bg-white border border-[#EAEAE4] shadow-card space-y-6">
          <div className="pb-4 border-b border-[#EAEAE4]">
            <h3 className="text-base font-bold text-[#292A27]">Audit Storage & Demonstration Mode</h3>
            <p className="text-xs text-[#70716B]">Manage local persistent storage and toggle demonstration test data</p>
          </div>

          <div className="space-y-4">
            {/* Demo Mode Toggle Card */}
            <div className="p-5 rounded-2xl bg-[#FAFAF8] border border-[#EAEAE4] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${isDemoMode ? 'bg-[#D88A4C]' : 'bg-[#648568]'}`} />
                  <h4 className="text-sm font-bold text-[#292A27]">
                    Demonstration Mode: {isDemoMode ? 'Active' : 'Inactive (Real Auditing Mode)'}
                  </h4>
                </div>
                <p className="text-xs text-[#70716B] max-w-xl leading-relaxed">
                  When enabled, NETRA displays synthetic demonstration records (acme-store.io) for feature exploration. In real mode (default), only actual website scans from persistent storage are shown.
                </p>
              </div>

              {onToggleDemoMode && (
                <button
                  type="button"
                  onClick={() => onToggleDemoMode(!isDemoMode)}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all whitespace-nowrap ${
                    isDemoMode
                      ? 'bg-[#C96F82] hover:bg-[#A84F65] text-white shadow-rose'
                      : 'bg-white hover:bg-[#F6F7F0] text-[#7B8053] border border-[#EEF0E3]'
                  }`}
                >
                  {isDemoMode ? 'Disable Demo (Show Real Scans)' : 'Enable Demonstration Data'}
                </button>
              )}
            </div>

            {/* Storage Info Card */}
            <div className="p-5 rounded-2xl bg-white border border-[#EAEAE4] space-y-3">
              <h4 className="text-sm font-bold text-[#292A27]">Persistent Storage Location</h4>
              <p className="text-xs text-[#70716B] leading-relaxed">
                Scan records, verified fix statuses, and audit histories are persistently stored in JSON format at:
              </p>
              <code className="text-xs font-mono text-[#A84F65] bg-[#FFF5F6] px-3 py-1.5 rounded-lg border border-[#F8E9ED] block">
                data/accessai-db.json
              </code>
            </div>

            {/* Reset / Clear Data */}
            <div className="p-5 rounded-2xl bg-[#FFF5F6] border border-[#F8E9ED] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-[#C94F55]">Reset Audit Database</h4>
                <p className="text-xs text-[#A84F65] mt-0.5">
                  Clears all stored website scans, detected issues, and verified fixes from local storage.
                </p>
              </div>

              {onClearAllScans && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to clear all stored scan records? This cannot be undone.')) {
                      onClearAllScans();
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-[#FFF5F6] text-[#C94F55] font-bold text-xs border border-[#C94F55]/40 transition-colors whitespace-nowrap"
                >
                  Clear All Scan Data
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Tab 3: Scanning Preferences */}
      {activeTab === 'scanning' && (
        <section className="p-6 sm:p-7 rounded-2xl bg-white border border-[#EAEAE4] shadow-card space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#EAEAE4]">
            <div>
              <h3 className="text-base font-bold text-[#292A27]">Scanning & WCAG Compliance Engine</h3>
              <p className="text-xs text-[#70716B]">Configure audit standards and crawl depths</p>
            </div>
            <button
              onClick={() => handleSave('Scanning')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C96F82] hover:bg-[#A84F65] text-white text-xs font-bold shadow-rose-sm transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Scanning Preferences</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#292A27] mb-1.5">
                Target Compliance Standard
              </label>
              <select
                value={formData.scanning.wcagStandard}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    scanning: {
                      ...formData.scanning,
                      wcagStandard: e.target.value as any
                    }
                  })
                }
                className="w-full px-3.5 py-2.5 bg-[#FAFAF8] border border-[#EAEAE4] rounded-xl text-sm text-[#292A27] focus:outline-none focus:ring-2 focus:ring-[#C96F82]"
              >
                <option value="WCAG 2.1 AA">WCAG 2.1 Level AA (Industry Standard)</option>
                <option value="WCAG 2.1 AAA">WCAG 2.1 Level AAA (Highest Rigor)</option>
                <option value="WCAG 2.2 AA">WCAG 2.2 Level AA (Latest Spec 2024+)</option>
                <option value="Section 508">US Section 508 (Federal Compliance)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#292A27] mb-1.5">
                Automated Audit Crawl Depth
              </label>
              <select
                value={formData.scanning.crawlDepth}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    scanning: {
                      ...formData.scanning,
                      crawlDepth: e.target.value as any
                    }
                  })
                }
                className="w-full px-3.5 py-2.5 bg-[#FAFAF8] border border-[#EAEAE4] rounded-xl text-sm text-[#292A27] focus:outline-none focus:ring-2 focus:ring-[#C96F82]"
              >
                <option value="single">Single Target Landing Page</option>
                <option value="deep-3">Deep Crawl (Up to 3 levels, ~25 pages)</option>
                <option value="full-domain">Complete Domain Map (~100+ pages)</option>
              </select>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.scanning.includeHiddenElements}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    scanning: {
                      ...formData.scanning,
                      includeHiddenElements: e.target.checked
                    }
                  })
                }
                className="w-4 h-4 rounded text-[#C96F82] focus:ring-[#C96F82] border-[#EAEAE4]"
              />
              <span className="text-xs text-[#292A27]">
                Inspect off-screen / visually hidden DOM nodes (modals, collapse elements)
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.scanning.checkColorContrastOnly}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    scanning: {
                      ...formData.scanning,
                      checkColorContrastOnly: e.target.checked
                    }
                  })
                }
                className="w-4 h-4 rounded text-[#C96F82] focus:ring-[#C96F82] border-[#EAEAE4]"
              />
              <span className="text-xs text-[#292A27]">
                Fast Mode: Only run Color Contrast & Alt Text heuristics
              </span>
            </label>
          </div>
        </section>
      )}

      {/* Tab 6: Data & Demo Mode */}
      {activeTab === 'data' && (
        <section className="p-6 sm:p-7 rounded-2xl bg-white border border-[#EAEAE4] shadow-card space-y-6">
          <div className="pb-4 border-b border-[#EAEAE4]">
            <h3 className="text-base font-bold text-[#292A27]">Audit Storage & Demonstration Mode</h3>
            <p className="text-xs text-[#70716B]">Manage local persistent storage and toggle demonstration test data</p>
          </div>

          <div className="space-y-4">
            {/* Demo Mode Toggle Card */}
            <div className="p-5 rounded-2xl bg-[#FAFAF8] border border-[#EAEAE4] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${isDemoMode ? 'bg-[#D88A4C]' : 'bg-[#648568]'}`} />
                  <h4 className="text-sm font-bold text-[#292A27]">
                    Demonstration Mode: {isDemoMode ? 'Active' : 'Inactive (Real Auditing Mode)'}
                  </h4>
                </div>
                <p className="text-xs text-[#70716B] max-w-xl leading-relaxed">
                  When enabled, NETRA displays synthetic demonstration records (acme-store.io) for feature exploration. In real mode (default), only actual website scans from persistent storage are shown.
                </p>
              </div>

              {onToggleDemoMode && (
                <button
                  type="button"
                  onClick={() => onToggleDemoMode(!isDemoMode)}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all whitespace-nowrap ${
                    isDemoMode
                      ? 'bg-[#C96F82] hover:bg-[#A84F65] text-white shadow-rose'
                      : 'bg-white hover:bg-[#F6F7F0] text-[#7B8053] border border-[#EEF0E3]'
                  }`}
                >
                  {isDemoMode ? 'Disable Demo (Show Real Scans)' : 'Enable Demonstration Data'}
                </button>
              )}
            </div>

            {/* Storage Info Card */}
            <div className="p-5 rounded-2xl bg-white border border-[#EAEAE4] space-y-3">
              <h4 className="text-sm font-bold text-[#292A27]">Persistent Storage Location</h4>
              <p className="text-xs text-[#70716B] leading-relaxed">
                Scan records, verified fix statuses, and audit histories are persistently stored in JSON format at:
              </p>
              <code className="text-xs font-mono text-[#A84F65] bg-[#FFF5F6] px-3 py-1.5 rounded-lg border border-[#F8E9ED] block">
                data/accessai-db.json
              </code>
            </div>

            {/* Reset / Clear Data */}
            <div className="p-5 rounded-2xl bg-[#FFF5F6] border border-[#F8E9ED] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-[#C94F55]">Reset Audit Database</h4>
                <p className="text-xs text-[#A84F65] mt-0.5">
                  Clears all stored website scans, detected issues, and verified fixes from local storage.
                </p>
              </div>

              {onClearAllScans && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to clear all stored scan records? This cannot be undone.')) {
                      onClearAllScans();
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-[#FFF5F6] text-[#C94F55] font-bold text-xs border border-[#C94F55]/40 transition-colors whitespace-nowrap"
                >
                  Clear All Scan Data
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Tab 4: Notifications */}
      {activeTab === 'notifications' && (
        <section className="p-6 sm:p-7 rounded-2xl bg-white border border-[#EAEAE4] shadow-card space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#EAEAE4]">
            <div>
              <h3 className="text-base font-bold text-[#292A27]">Alerts & Notification Triggers</h3>
              <p className="text-xs text-[#70716B]">Control when NETRA notifies team members</p>
            </div>
            <button
              onClick={() => handleSave('Notifications')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C96F82] hover:bg-[#A84F65] text-white text-xs font-bold shadow-rose-sm transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Alerts</span>
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-start justify-between p-4 rounded-xl bg-[#FAFAF8] border border-[#EAEAE4]">
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-[#292A27]">Critical Issue Alerts</h4>
                <p className="text-xs text-[#70716B]">
                  Receive instant notifications when a new scan discovers Level A critical blockers.
                </p>
              </div>
              <input
                type="checkbox"
                checked={formData.notifications.emailOnCriticalIssues}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    notifications: {
                      ...formData.notifications,
                      emailOnCriticalIssues: e.target.checked
                    }
                  })
                }
                className="w-5 h-5 rounded text-[#C96F82] focus:ring-[#C96F82] border-[#EAEAE4] mt-1 accent-[#C96F82]"
              />
            </div>

            <div className="flex items-start justify-between p-4 rounded-xl bg-[#FAFAF8] border border-[#EAEAE4]">
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-[#292A27]">Weekly Executive Digest</h4>
                <p className="text-xs text-[#70716B]">
                  Receive an automated score trend report every Monday morning.
                </p>
              </div>
              <input
                type="checkbox"
                checked={formData.notifications.weeklyDigest}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    notifications: {
                      ...formData.notifications,
                      weeklyDigest: e.target.checked
                    }
                  })
                }
                className="w-5 h-5 rounded text-[#C96F82] focus:ring-[#C96F82] border-[#EAEAE4] mt-1 accent-[#C96F82]"
              />
            </div>

            <div className="flex items-start justify-between p-4 rounded-xl bg-[#FAFAF8] border border-[#EAEAE4]">
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-[#292A27]">Fix Approval Notifications</h4>
                <p className="text-xs text-[#70716B]">
                  Notify engineers when code repairs are approved for GitHub Pull Request generation.
                </p>
              </div>
              <input
                type="checkbox"
                checked={formData.notifications.fixApprovalAlerts}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    notifications: {
                      ...formData.notifications,
                      fixApprovalAlerts: e.target.checked
                    }
                  })
                }
                className="w-5 h-5 rounded text-[#C96F82] focus:ring-[#C96F82] border-[#EAEAE4] mt-1 accent-[#C96F82]"
              />
            </div>
          </div>
        </section>
      )}

      {/* Tab 6: Data & Demo Mode */}
      {activeTab === 'data' && (
        <section className="p-6 sm:p-7 rounded-2xl bg-white border border-[#EAEAE4] shadow-card space-y-6">
          <div className="pb-4 border-b border-[#EAEAE4]">
            <h3 className="text-base font-bold text-[#292A27]">Audit Storage & Demonstration Mode</h3>
            <p className="text-xs text-[#70716B]">Manage local persistent storage and toggle demonstration test data</p>
          </div>

          <div className="space-y-4">
            {/* Demo Mode Toggle Card */}
            <div className="p-5 rounded-2xl bg-[#FAFAF8] border border-[#EAEAE4] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${isDemoMode ? 'bg-[#D88A4C]' : 'bg-[#648568]'}`} />
                  <h4 className="text-sm font-bold text-[#292A27]">
                    Demonstration Mode: {isDemoMode ? 'Active' : 'Inactive (Real Auditing Mode)'}
                  </h4>
                </div>
                <p className="text-xs text-[#70716B] max-w-xl leading-relaxed">
                  When enabled, NETRA displays synthetic demonstration records (acme-store.io) for feature exploration. In real mode (default), only actual website scans from persistent storage are shown.
                </p>
              </div>

              {onToggleDemoMode && (
                <button
                  type="button"
                  onClick={() => onToggleDemoMode(!isDemoMode)}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all whitespace-nowrap ${
                    isDemoMode
                      ? 'bg-[#C96F82] hover:bg-[#A84F65] text-white shadow-rose'
                      : 'bg-white hover:bg-[#F6F7F0] text-[#7B8053] border border-[#EEF0E3]'
                  }`}
                >
                  {isDemoMode ? 'Disable Demo (Show Real Scans)' : 'Enable Demonstration Data'}
                </button>
              )}
            </div>

            {/* Storage Info Card */}
            <div className="p-5 rounded-2xl bg-white border border-[#EAEAE4] space-y-3">
              <h4 className="text-sm font-bold text-[#292A27]">Persistent Storage Location</h4>
              <p className="text-xs text-[#70716B] leading-relaxed">
                Scan records, verified fix statuses, and audit histories are persistently stored in JSON format at:
              </p>
              <code className="text-xs font-mono text-[#A84F65] bg-[#FFF5F6] px-3 py-1.5 rounded-lg border border-[#F8E9ED] block">
                data/accessai-db.json
              </code>
            </div>

            {/* Reset / Clear Data */}
            <div className="p-5 rounded-2xl bg-[#FFF5F6] border border-[#F8E9ED] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-[#C94F55]">Reset Audit Database</h4>
                <p className="text-xs text-[#A84F65] mt-0.5">
                  Clears all stored website scans, detected issues, and verified fixes from local storage.
                </p>
              </div>

              {onClearAllScans && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to clear all stored scan records? This cannot be undone.')) {
                      onClearAllScans();
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-[#FFF5F6] text-[#C94F55] font-bold text-xs border border-[#C94F55]/40 transition-colors whitespace-nowrap"
                >
                  Clear All Scan Data
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Tab 5: Appearance */}
      {activeTab === 'appearance' && (
        <section className="p-6 sm:p-7 rounded-2xl bg-white border border-[#EAEAE4] shadow-card space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#EAEAE4]">
            <div>
              <h3 className="text-base font-bold text-[#292A27]">Dashboard Appearance & Theme</h3>
              <p className="text-xs text-[#70716B]">Rose, Olive and White design system configuration</p>
            </div>
            <button
              onClick={() => handleSave('Appearance')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C96F82] hover:bg-[#A84F65] text-white text-xs font-bold shadow-rose-sm transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Theme</span>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#292A27] mb-2">
                Active Theme Palette
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl border-2 border-[#C96F82] bg-[#FFF5F6] text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-3 h-3 rounded-full bg-[#C96F82]" />
                    <span className="w-3 h-3 rounded-full bg-[#7B8053]" />
                    <span className="text-xs font-bold text-[#A84F65]">Rose & Olive (Active)</span>
                  </div>
                  <p className="text-[11px] text-[#70716B]">Primary Rose #C96F82 with Supporting Olive #7B8053</p>
                </div>

                <div className="p-4 rounded-xl border border-[#EAEAE4] bg-[#FAFAF8] text-left opacity-75">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-3 h-3 rounded-full bg-[#A84F65]" />
                    <span className="w-3 h-3 rounded-full bg-[#62683F]" />
                    <span className="text-xs font-bold text-[#292A27]">Deep Rose Focus</span>
                  </div>
                  <p className="text-[11px] text-[#70716B]">High-contrast editorial variant</p>
                </div>

                <div className="p-4 rounded-xl border border-[#EAEAE4] bg-[#FAFAF8] text-left opacity-75">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-3 h-3 rounded-full bg-[#7B8053]" />
                    <span className="w-3 h-3 rounded-full bg-[#C96F82]" />
                    <span className="text-xs font-bold text-[#292A27]">Olive Forward</span>
                  </div>
                  <p className="text-[11px] text-[#70716B]">Supporting nature & health tone</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#292A27] mb-2">
                Layout Density
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    setFormData({
                      ...formData,
                      appearance: {
                        ...formData.appearance,
                        density: 'comfortable'
                      }
                    })
                  }
                  className={`px-4 py-2 rounded-xl border text-xs font-bold transition-colors ${
                    formData.appearance.density === 'comfortable'
                      ? 'bg-[#C96F82] text-white border-[#C96F82] shadow-rose-sm'
                      : 'bg-white text-[#70716B] border-[#EAEAE4] hover:bg-[#FAFAF8]'
                  }`}
                >
                  Comfortable
                </button>
                <button
                  onClick={() =>
                    setFormData({
                      ...formData,
                      appearance: {
                        ...formData.appearance,
                        density: 'compact'
                      }
                    })
                  }
                  className={`px-4 py-2 rounded-xl border text-xs font-bold transition-colors ${
                    formData.appearance.density === 'compact'
                      ? 'bg-[#C96F82] text-white border-[#C96F82] shadow-rose-sm'
                      : 'bg-white text-[#70716B] border-[#EAEAE4] hover:bg-[#FAFAF8]'
                  }`}
                >
                  Compact
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Tab 6: Data & Demo Mode */}
      {activeTab === 'data' && (
        <section className="p-6 sm:p-7 rounded-2xl bg-white border border-[#EAEAE4] shadow-card space-y-6">
          <div className="pb-4 border-b border-[#EAEAE4]">
            <h3 className="text-base font-bold text-[#292A27]">Audit Storage & Demonstration Mode</h3>
            <p className="text-xs text-[#70716B]">Manage local persistent storage and toggle demonstration test data</p>
          </div>

          <div className="space-y-4">
            {/* Demo Mode Toggle Card */}
            <div className="p-5 rounded-2xl bg-[#FAFAF8] border border-[#EAEAE4] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${isDemoMode ? 'bg-[#D88A4C]' : 'bg-[#648568]'}`} />
                  <h4 className="text-sm font-bold text-[#292A27]">
                    Demonstration Mode: {isDemoMode ? 'Active' : 'Inactive (Real Auditing Mode)'}
                  </h4>
                </div>
                <p className="text-xs text-[#70716B] max-w-xl leading-relaxed">
                  When enabled, NETRA displays synthetic demonstration records (acme-store.io) for feature exploration. In real mode (default), only actual website scans from persistent storage are shown.
                </p>
              </div>

              {onToggleDemoMode && (
                <button
                  type="button"
                  onClick={() => onToggleDemoMode(!isDemoMode)}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all whitespace-nowrap ${
                    isDemoMode
                      ? 'bg-[#C96F82] hover:bg-[#A84F65] text-white shadow-rose'
                      : 'bg-white hover:bg-[#F6F7F0] text-[#7B8053] border border-[#EEF0E3]'
                  }`}
                >
                  {isDemoMode ? 'Disable Demo (Show Real Scans)' : 'Enable Demonstration Data'}
                </button>
              )}
            </div>

            {/* Storage Info Card */}
            <div className="p-5 rounded-2xl bg-white border border-[#EAEAE4] space-y-3">
              <h4 className="text-sm font-bold text-[#292A27]">Persistent Storage Location</h4>
              <p className="text-xs text-[#70716B] leading-relaxed">
                Scan records, verified fix statuses, and audit histories are persistently stored in JSON format at:
              </p>
              <code className="text-xs font-mono text-[#A84F65] bg-[#FFF5F6] px-3 py-1.5 rounded-lg border border-[#F8E9ED] block">
                data/accessai-db.json
              </code>
            </div>

            {/* Reset / Clear Data */}
            <div className="p-5 rounded-2xl bg-[#FFF5F6] border border-[#F8E9ED] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-[#C94F55]">Reset Audit Database</h4>
                <p className="text-xs text-[#A84F65] mt-0.5">
                  Clears all stored website scans, detected issues, and verified fixes from local storage.
                </p>
              </div>

              {onClearAllScans && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to clear all stored scan records? This cannot be undone.')) {
                      onClearAllScans();
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-[#FFF5F6] text-[#C94F55] font-bold text-xs border border-[#C94F55]/40 transition-colors whitespace-nowrap"
                >
                  Clear All Scan Data
                </button>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
