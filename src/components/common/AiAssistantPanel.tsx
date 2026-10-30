import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Sparkles,
  X,
  Send,
  Copy,
  Check,
  Download,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Brain,
  Layers,
  Code2,
  HelpCircle,
  Cpu,
  RefreshCw,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { AccessibilityIssue, FixSuggestion, FixStatus, PageId, ToastMessage } from '../../types';
import { api } from '../../services/api';

interface AiAssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeScan: any;
  issues: AccessibilityIssue[];
  fixes: FixSuggestion[];
  onUpdateFixStatus?: (fixId: string, status: FixStatus) => void;
  onNavigate?: (page: PageId) => void;
  onAddToast: (toast: Omit<ToastMessage, 'id'>) => void;
}

type PanelTab = 'overview' | 'explain' | 'chat';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  provider?: string;
  isAiGenerated?: boolean;
  timestamp: string;
}

export const AiAssistantPanel: React.FC<AiAssistantPanelProps> = ({
  isOpen,
  onClose,
  activeScan,
  issues,
  fixes,
  onUpdateFixStatus,
  onNavigate,
  onAddToast
}) => {
  const [activeTab, setActiveTab] = useState<PanelTab>('overview');
  const [aiSettings, setAiSettings] = useState<{ isConfigured: boolean; model?: string }>({
    isConfigured: false
  });

  // Explain Issues state
  const [selectedIssueId, setSelectedIssueId] = useState<string>('');
  const [isExplaining, setIsExplaining] = useState<boolean>(false);
  const [explanationData, setExplanationData] = useState<any>(null);
  const [explainError, setExplainError] = useState<string | null>(null);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isAsking, setIsAsking] = useState<boolean>(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load AI configuration status on open
  useEffect(() => {
    if (isOpen) {
      api.getAiSettings()
        .then((data) => setAiSettings(data))
        .catch(() => setAiSettings({ isConfigured: false }));
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Set default selected issue when issues list loads
  useEffect(() => {
    if (issues && issues.length > 0 && !selectedIssueId) {
      setSelectedIssueId(issues[0].id);
    }
  }, [issues, selectedIssueId]);

  // Derive Audit Metrics
  const metrics = useMemo(() => {
    const criticalCount = issues.filter((i) => i.severity === 'critical').length;
    const seriousCount = issues.filter((i) => i.severity === 'serious').length;
    const moderateCount = issues.filter((i) => i.severity === 'moderate').length;
    const minorCount = issues.filter((i) => i.severity === 'minor').length;
    const totalViolations = issues.length;
    const score = activeScan?.scoreBreakdown?.score ?? 78;

    // Categories breakdown
    const categoryMap: Record<string, number> = {};
    issues.forEach((i) => {
      categoryMap[i.category] = (categoryMap[i.category] || 0) + 1;
    });

    const categories = Object.entries(categoryMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return {
      score,
      criticalCount,
      seriousCount,
      moderateCount,
      minorCount,
      totalViolations,
      categories
    };
  }, [issues, activeScan]);

  // Prioritize Top 5 Fixes
  const prioritizedFixes = useMemo(() => {
    return [...issues]
      .sort((a, b) => {
        const severityScore: Record<string, number> = {
          critical: 4,
          serious: 3,
          moderate: 2,
          minor: 1
        };
        const diff = (severityScore[b.severity] || 1) - (severityScore[a.severity] || 1);
        if (diff !== 0) return diff;
        return (b.elementCount || 1) - (a.elementCount || 1);
      })
      .slice(0, 5);
  }, [issues]);

  // Selected issue object
  const currentIssue = useMemo(() => {
    return issues.find((i) => i.id === selectedIssueId) || issues[0] || null;
  }, [issues, selectedIssueId]);

  // Matching fix for selected issue
  const matchingFix = useMemo(() => {
    if (!currentIssue) return null;
    return (
      fixes.find(
        (f) =>
          f.issueId === currentIssue.id ||
          (f.issueTitle && f.issueTitle.toLowerCase() === currentIssue.title.toLowerCase())
      ) || null
    );
  }, [fixes, currentIssue]);

  // Trigger Issue Explanation
  const handleFetchExplanation = async (issueToExplain: AccessibilityIssue) => {
    try {
      setIsExplaining(true);
      setExplainError(null);
      const res = await api.explainIssue({
        ruleId: issueToExplain.ruleId || issueToExplain.category,
        issueTitle: issueToExplain.title,
        severity: issueToExplain.severity,
        category: issueToExplain.category,
        wcagCriteria: issueToExplain.wcagCriteria,
        affectedElement: issueToExplain.affectedElement
      });

      if (res && res.explanation) {
        setExplanationData(res.explanation);
      }
    } catch (err: any) {
      setExplainError(err.message || 'Failed to generate issue explanation');
    } finally {
      setIsExplaining(false);
    }
  };

  // Automatically fetch explanation when selected issue changes in Explain tab
  useEffect(() => {
    if (activeTab === 'explain' && currentIssue) {
      handleFetchExplanation(currentIssue);
    }
  }, [activeTab, selectedIssueId]);

  // Send message in Ask AccessAI
  const handleSendMessage = async (promptText?: string) => {
    const question = (promptText || inputText).trim();
    if (!question || isAsking) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: question,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages((prev) => [...prev, userMsg]);
    if (!promptText) setInputText('');
    setIsAsking(true);

    try {
      const scanContext = {
        websiteUrl: activeScan?.websiteUrl || 'Scanned Site',
        score: metrics.score,
        totalViolations: metrics.totalViolations,
        criticalCount: metrics.criticalCount,
        seriousCount: metrics.seriousCount,
        moderateCount: metrics.moderateCount,
        minorCount: metrics.minorCount,
        issues: issues.map((i) => ({
          id: i.id,
          ruleId: i.ruleId,
          title: i.title,
          severity: i.severity,
          category: i.category,
          wcagCriteria: i.wcagCriteria,
          affectedElement: i.affectedElement
        }))
      };

      const res = await api.askAi(question, scanContext);

      const aiMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: res.answer || 'Analysis complete.',
        provider: res.provider,
        isAiGenerated: res.isAiGenerated,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChatMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        sender: 'assistant',
        text: `⚠️ **Unable to complete inquiry**: ${err.message || 'Network error'}. Please check your connection or backend status.`,
        isAiGenerated: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsAsking(false);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    onAddToast({ title: 'Copied to Clipboard', message: 'Code patch copied to your clipboard.', type: 'info' });
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const downloadPatch = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onAddToast({ title: 'Download Started', message: `Saved patch to ${filename}`, type: 'success' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#292A27]/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Drawer */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-2xl bg-white shadow-2xl border-l border-[#EAEAE4] flex flex-col transform transition-transform duration-300 ease-out">
          
          {/* Header */}
          <div className="p-5 border-b border-[#EAEAE4] bg-[#FAFAF8] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFF5F6] border border-[#F8E9ED] flex items-center justify-center text-[#C96F82] shadow-sm">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-[#292A27]">AccessAI Assistant</h3>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      aiSettings.isConfigured
                        ? 'bg-[#EEF2FF] text-[#4F46E5] border border-[#E0E7FF]'
                        : 'bg-[#F6F7F0] text-[#7B8053] border border-[#EEF0E3]'
                    }`}
                  >
                    <Cpu className="w-3 h-3" />
                    {aiSettings.isConfigured ? 'Gemini 1.5 Flash' : 'Audit Engine Fallback'}
                  </span>
                </div>
                <p className="text-xs text-[#70716B] truncate max-w-xs sm:max-w-md">
                  Active Target: <span className="font-semibold text-[#292A27]">{activeScan?.websiteUrl || 'No active website scan'}</span>
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-[#70716B] hover:text-[#292A27] hover:bg-[#EEF0E3] rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-[#C96F82]"
              aria-label="Close AI Assistant panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-[#EAEAE4] bg-white px-5">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'overview'
                  ? 'border-[#C96F82] text-[#C96F82]'
                  : 'border-transparent text-[#70716B] hover:text-[#292A27]'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              AI Overview & Priorities
            </button>
            <button
              onClick={() => setActiveTab('explain')}
              className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'explain'
                  ? 'border-[#C96F82] text-[#C96F82]'
                  : 'border-transparent text-[#70716B] hover:text-[#292A27]'
              }`}
            >
              <Brain className="w-3.5 h-3.5" />
              Explain & Generate Fix
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'chat'
                  ? 'border-[#C96F82] text-[#C96F82]'
                  : 'border-transparent text-[#70716B] hover:text-[#292A27]'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              Ask AccessAI
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">

            {/* TAB 1: OVERVIEW & PRIORITIZATION */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Score & Metrics Summary */}
                <div className="p-4 rounded-2xl bg-[#FAFAF8] border border-[#EAEAE4]">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-[#70716B] uppercase tracking-wider">
                      Audit Health Summary
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#FFF5F6] text-[#A84F65] border border-[#F8E9ED]">
                      WCAG 2.1 AA Analysis
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-white rounded-xl border border-[#EEF0E3]">
                      <span className="text-[11px] text-[#70716B] block">Score</span>
                      <span className="text-xl font-black text-[#292A27]">{metrics.score}/100</span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-[#EEF0E3]">
                      <span className="text-[11px] text-[#70716B] block">Violations</span>
                      <span className="text-xl font-black text-[#C94F55]">{metrics.totalViolations}</span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-[#EEF0E3]">
                      <span className="text-[11px] text-[#70716B] block">Critical</span>
                      <span className="text-xl font-black text-[#C94F55]">{metrics.criticalCount}</span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-[#EEF0E3]">
                      <span className="text-[11px] text-[#70716B] block">Serious</span>
                      <span className="text-xl font-black text-[#D88A4C]">{metrics.seriousCount}</span>
                    </div>
                  </div>

                  {/* Category Distribution */}
                  {metrics.categories.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-[#EAEAE4]">
                      <span className="text-[11px] font-bold text-[#70716B] block mb-2">
                        Most Affected Accessibility Categories:
                      </span>
                      <div className="space-y-1.5">
                        {metrics.categories.slice(0, 4).map((cat) => (
                          <div key={cat.name} className="flex items-center justify-between text-xs">
                            <span className="text-[#292A27] font-medium">{cat.name}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-2 bg-[#EEF0E3] rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-[#C96F82] rounded-full"
                                  style={{
                                    width: `${Math.min(100, (cat.count / Math.max(1, metrics.totalViolations)) * 100)}%`
                                  }}
                                />
                              </div>
                              <span className="text-[11px] font-bold text-[#70716B] w-6 text-right">
                                {cat.count}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* AI Prioritized Top 5 Fixes */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-[#292A27] flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-[#7B8053]" />
                      Top 5 Prioritized Remediations
                    </h4>
                    <span className="text-xs text-[#70716B]">Severity + Impact Ordered</span>
                  </div>

                  {prioritizedFixes.length === 0 ? (
                    <div className="p-6 text-center rounded-2xl bg-[#FAFAF8] border border-[#EAEAE4]">
                      <Check className="w-8 h-8 text-[#648568] mx-auto mb-2" />
                      <p className="text-sm font-bold text-[#292A27]">No Accessibility Violations!</p>
                      <p className="text-xs text-[#70716B] mt-1">
                        Your website conforms cleanly to WCAG 2.1 specifications.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {prioritizedFixes.map((item, idx) => (
                        <div
                          key={item.id}
                          className="p-3.5 bg-white rounded-xl border border-[#EAEAE4] hover:border-[#C96F82] transition-colors shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2.5">
                              <span className="w-5 h-5 rounded-full bg-[#F6F7F0] border border-[#EEF0E3] text-[#7B8053] text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                                {idx + 1}
                              </span>
                              <div>
                                <h5 className="text-xs font-bold text-[#292A27]">{item.title}</h5>
                                <p className="text-[11px] text-[#70716B] mt-0.5 line-clamp-1">
                                  {item.problemExplanation || item.title}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                                      item.severity === 'critical'
                                        ? 'bg-[#FFF5F6] text-[#C94F55]'
                                        : item.severity === 'serious'
                                        ? 'bg-[#FFF8F2] text-[#D88A4C]'
                                        : 'bg-[#F6F7F0] text-[#7B8053]'
                                    }`}
                                  >
                                    {item.severity}
                                  </span>
                                  <span className="text-[10px] text-[#70716B]">{item.wcagCriteria}</span>
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={() => {
                                setSelectedIssueId(item.id);
                                setActiveTab('explain');
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-[#F6F7F0] hover:bg-[#EEF0E3] text-[#62683F] hover:text-[#292A27] text-xs font-bold flex items-center gap-1 transition-colors shrink-0"
                            >
                              <span>Fix</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Consultation CTA */}
                <div className="p-4 rounded-xl bg-[#F6F7F0] border border-[#EEF0E3] flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-[#292A27]">Need advice on your audit?</h5>
                    <p className="text-[11px] text-[#70716B] mt-0.5">
                      Ask AccessAI how to boost your score to {Math.min(100, metrics.score + 15)}+.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setActiveTab('chat');
                      handleSendMessage('How can I improve my accessibility score?');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#7B8053] hover:bg-[#62683F] text-white text-xs font-bold shadow-sm transition-colors"
                  >
                    Ask AI
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: EXPLAIN ISSUES & AI FIX GENERATOR */}
            {activeTab === 'explain' && (
              <div className="space-y-5">
                {/* Issue Selector Dropdown */}
                <div>
                  <label className="block text-xs font-bold text-[#292A27] mb-1.5">
                    Select Accessibility Defect to Analyze:
                  </label>
                  <select
                    value={selectedIssueId}
                    onChange={(e) => setSelectedIssueId(e.target.value)}
                    className="w-full text-xs font-medium bg-[#FAFAF8] border border-[#EAEAE4] rounded-xl px-3 py-2.5 text-[#292A27] focus:outline-none focus:ring-2 focus:ring-[#C96F82]"
                  >
                    {issues.map((iss) => (
                      <option key={iss.id} value={iss.id}>
                        [{iss.severity.toUpperCase()}] {iss.title} ({iss.wcagCriteria})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selected Issue Card */}
                {currentIssue ? (
                  <div className="space-y-4">
                    {/* Explanation Section */}
                    <div className="p-4 bg-[#FAFAF8] rounded-2xl border border-[#EAEAE4] space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#292A27] flex items-center gap-1.5">
                          <Brain className="w-4 h-4 text-[#C96F82]" />
                          AI Technical Diagnosis
                        </span>
                        {isExplaining && (
                          <span className="text-[11px] text-[#7B8053] flex items-center gap-1 font-bold animate-pulse">
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            Analyzing with AI...
                          </span>
                        )}
                      </div>

                      {explainError && (
                        <div className="p-3 bg-[#FFF5F6] border border-[#F8E9ED] rounded-xl text-xs text-[#C94F55]">
                          {explainError}
                        </div>
                      )}

                      {explanationData ? (
                        <div className="space-y-2.5 text-xs">
                          <div>
                            <span className="font-bold text-[#292A27] block text-[11px] uppercase tracking-wider text-[#70716B]">
                              What this means:
                            </span>
                            <p className="text-[#292A27] mt-0.5">{explanationData.whatItMeans}</p>
                          </div>
                          <div>
                            <span className="font-bold text-[#292A27] block text-[11px] uppercase tracking-wider text-[#70716B]">
                              Why it matters:
                            </span>
                            <p className="text-[#70716B] mt-0.5">{explanationData.whyItMatters}</p>
                          </div>
                          <div>
                            <span className="font-bold text-[#292A27] block text-[11px] uppercase tracking-wider text-[#70716B]">
                              Affected Users:
                            </span>
                            <p className="text-[#62683F] font-semibold mt-0.5">
                              {explanationData.affectedUsers}
                            </p>
                          </div>
                          <div>
                            <span className="font-bold text-[#292A27] block text-[11px] uppercase tracking-wider text-[#70716B]">
                              WCAG Criterion:
                            </span>
                            <span className="inline-block mt-0.5 px-2 py-0.5 bg-white border border-[#EAEAE4] rounded font-bold text-[#292A27]">
                              {explanationData.wcagCriterion}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-[#70716B]">{currentIssue.problemExplanation || currentIssue.title}</p>
                      )}
                    </div>

                    {/* Affected Element / Original Code */}
                    {currentIssue.affectedElement && (
                      <div className="p-4 bg-white rounded-2xl border border-[#EAEAE4]">
                        <span className="text-xs font-bold text-[#70716B] block mb-2">
                          Original Failing Element in DOM:
                        </span>
                        <pre className="p-3 bg-[#1E293B] text-[#F8FAFC] rounded-xl text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all">
                          {currentIssue.affectedElement}
                        </pre>
                      </div>
                    )}

                    {/* AI Fix Generator */}
                    <div className="p-4 bg-white rounded-2xl border border-[#C96F82]/30 bg-[#FFF5F6]/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-[#A84F65] flex items-center gap-1.5">
                          <Code2 className="w-4 h-4 text-[#C96F82]" />
                          Remediated Accessible Code Snippet:
                        </span>
                        {matchingFix && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              matchingFix.status === 'verified'
                                ? 'bg-[#F2F7F3] text-[#648568]'
                                : matchingFix.status === 'approved'
                                ? 'bg-[#EEF2FF] text-[#4F46E5]'
                                : 'bg-[#FFF8F2] text-[#D88A4C]'
                            }`}
                          >
                            Status: {matchingFix.status}
                          </span>
                        )}
                      </div>

                      <pre className="p-3 bg-[#0F172A] text-[#A7F3D0] rounded-xl text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all">
                        {matchingFix?.suggestedSnippet ||
                          explanationData?.codeExample ||
                          currentIssue.affectedElement ||
                          '<!-- Ready for remediation -->'}
                      </pre>

                      {/* Action buttons */}
                      <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-[#F8E9ED]">
                        <button
                          onClick={() => {
                            const code =
                              matchingFix?.suggestedSnippet || explanationData?.codeExample || '';
                            copyToClipboard(code, 'explainer-code');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#F6F7F0] border border-[#CBD5E1] text-[#292A27] text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                        >
                          {copiedCodeId === 'explainer-code' ? (
                            <Check className="w-3.5 h-3.5 text-[#648568]" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-[#70716B]" />
                          )}
                          <span>Copy Code</span>
                        </button>

                        <button
                          onClick={() => {
                            const code =
                              matchingFix?.suggestedSnippet || explanationData?.codeExample || '';
                            downloadPatch(
                              `accessai-fix-${currentIssue.ruleId || 'remediation'}.html`,
                              code
                            );
                          }}
                          className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#F6F7F0] border border-[#CBD5E1] text-[#292A27] text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                        >
                          <Download className="w-3.5 h-3.5 text-[#70716B]" />
                          <span>Download Patch</span>
                        </button>

                        {matchingFix && onUpdateFixStatus && matchingFix.status === 'suggested' && (
                          <button
                            onClick={() => {
                              onUpdateFixStatus(matchingFix.id, 'approved');
                              onAddToast({
                                title: 'Fix Approved',
                                message: `Approved remediation for "${matchingFix.issueTitle}". Ready for developer deployment.`,
                                type: 'success'
                              });
                            }}
                            className="px-4 py-1.5 rounded-xl bg-[#C96F82] hover:bg-[#A84F65] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-rose-sm ml-auto"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve Fix</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center rounded-2xl bg-[#FAFAF8] border border-[#EAEAE4]">
                    <AlertTriangle className="w-8 h-8 text-[#D88A4C] mx-auto mb-2" />
                    <p className="text-sm font-bold text-[#292A27]">No Issue Selected</p>
                    <p className="text-xs text-[#70716B] mt-1">
                      Choose an accessibility defect from the list above to view analysis.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: ASK ACCESSAI CONVERSATIONAL INTERFACE */}
            {activeTab === 'chat' && (
              <div className="flex flex-col h-full space-y-4">
                {/* Suggested Prompts */}
                <div>
                  <span className="text-[11px] font-bold text-[#70716B] uppercase tracking-wider block mb-2">
                    Quick Accessibility Questions:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'What are the biggest accessibility problems on my website?',
                      'How can I improve my accessibility score?',
                      'Which problems affect visually impaired users?',
                      'Explain my WCAG violations.',
                      'What should I fix first?'
                    ].map((prompt, i) => (
                      <button
                        key={i}
                        onClick={() => handleSendMessage(prompt)}
                        className="text-[11px] font-semibold text-[#292A27] bg-[#FAFAF8] hover:bg-[#F6F7F0] border border-[#EAEAE4] hover:border-[#7B8053] px-2.5 py-1.5 rounded-lg transition-colors text-left"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message Log */}
                <div className="flex-1 bg-[#FAFAF8] border border-[#EAEAE4] rounded-2xl p-4 overflow-y-auto space-y-3 min-h-[280px] max-h-[420px]">
                  {chatMessages.length === 0 ? (
                    <div className="text-center py-10 px-4">
                      <Sparkles className="w-8 h-8 text-[#C96F82] mx-auto mb-2 opacity-80" />
                      <h4 className="text-sm font-bold text-[#292A27]">
                        AccessAI Accessibility Consultant
                      </h4>
                      <p className="text-xs text-[#70716B] max-w-sm mx-auto mt-1">
                        Ask any question about your website’s accessibility barriers, WCAG 2.1 compliance, or remediation strategies.
                      </p>
                    </div>
                  ) : (
                    chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${
                          msg.sender === 'user' ? 'items-end' : 'items-start'
                        }`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl p-3.5 text-xs shadow-sm ${
                            msg.sender === 'user'
                              ? 'bg-[#C96F82] text-white rounded-br-none'
                              : 'bg-white text-[#292A27] border border-[#EAEAE4] rounded-bl-none'
                          }`}
                        >
                          <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
                        </div>

                        <div className="flex items-center gap-2 mt-1 px-1">
                          <span className="text-[10px] text-[#70716B]">{msg.timestamp}</span>
                          {msg.sender === 'assistant' && (
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                msg.isAiGenerated
                                  ? 'bg-[#EEF2FF] text-[#4F46E5]'
                                  : 'bg-[#F6F7F0] text-[#7B8053]'
                              }`}
                            >
                              {msg.provider === 'google-gemini'
                                ? 'Gemini 1.5 Flash'
                                : 'Deterministic Audit Engine'}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}

                  {isAsking && (
                    <div className="flex items-center gap-2 p-3 bg-white rounded-2xl border border-[#EAEAE4] text-xs text-[#7B8053] animate-pulse">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>AccessAI is evaluating your audit context...</span>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Chat Input Bar */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Ask about contrast, screen readers, WCAG, or fixes..."
                    disabled={isAsking}
                    className="flex-1 text-xs bg-[#FAFAF8] border border-[#EAEAE4] rounded-xl px-4 py-3 text-[#292A27] focus:outline-none focus:ring-2 focus:ring-[#C96F82] disabled:opacity-60"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim() || isAsking}
                    className="px-4 py-3 rounded-xl bg-[#C96F82] hover:bg-[#A84F65] disabled:bg-[#EAEAE4] text-white disabled:text-[#70716B] text-xs font-bold flex items-center justify-center transition-colors shadow-rose-sm"
                    aria-label="Send message to AccessAI"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Footer note */}
          <div className="p-3 border-t border-[#EAEAE4] bg-[#FAFAF8] text-[11px] text-[#70716B] flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-[#7B8053]" />
              Secure Audit Context (Zero credentials or API keys exposed)
            </span>
            <span>AccessAI v1.4.0</span>
          </div>
        </div>
      </div>
    </div>
  );
};
