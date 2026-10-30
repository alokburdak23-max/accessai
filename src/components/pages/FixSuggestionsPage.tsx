import React, { useState } from 'react';
import {
  Wrench,
  CheckCircle2,
  FileCode,
  Sparkles,
  Info,
  ExternalLink,
  Check,
  X,
  Clock,
  Maximize2,
  CheckCheck,
  RefreshCw,
  Bot
} from 'lucide-react';
import { SeverityBadge } from '../common/SeverityBadge';
import { CodeBlock } from '../common/CodeBlock';
import { Modal } from '../common/Modal';
import { FixSuggestion, FixStatus, IssueCategory, PageId, ToastMessage } from '../../types';
import { api } from '../../services/api';

interface FixSuggestionsPageProps {
  fixes: FixSuggestion[];
  onUpdateFixStatus: (fixId: string, newStatus: FixStatus) => void;
  onNavigate: (page: PageId) => void;
  onAddToast: (toast: Omit<ToastMessage, 'id'>) => void;
  onTriggerRescan?: () => void;
}

export const FixSuggestionsPage: React.FC<FixSuggestionsPageProps> = ({
  fixes,
  onUpdateFixStatus,
  onNavigate,
  onAddToast,
  onTriggerRescan
}) => {
  const [selectedCategory, setSelectedCategory] = useState<IssueCategory | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<FixStatus | 'all'>('all');
  const [confirmRejectModalId, setConfirmRejectModalId] = useState<string | null>(null);
  const [expandedCodeModalFix, setExpandedCodeModalFix] = useState<FixSuggestion | null>(null);
  const [loadingFixId, setLoadingFixId] = useState<string | null>(null);
  const [enhancedFixes, setEnhancedFixes] = useState<Record<string, Partial<FixSuggestion>>>({});

  const handleEnhanceWithGemini = async (fix: FixSuggestion) => {
    try {
      setLoadingFixId(fix.id);
      const remediation = await api.generateAiRemediation({
        ruleId: fix.category,
        rawHtml: fix.originalSnippet || fix.affectedElement,
        description: fix.whatIsWrong,
        helpText: fix.howSolutionFixesIt,
        wcagCriteria: fix.wcagCriteria
      });

      if (remediation) {
        setEnhancedFixes((prev) => ({
          ...prev,
          [fix.id]: {
            suggestedSnippet: remediation.suggestedSnippet,
            diffSummary: remediation.diffSummary,
            whatIsWrong: remediation.whatIsWrong,
            whyItIsWrong: remediation.whyItIsWrong,
            howSolutionFixesIt: remediation.howSolutionFixesIt,
            isAiGenerated: true,
            confidenceScore: remediation.confidenceScore
          }
        }));

        onAddToast({
          type: 'success',
          title: 'Gemini AI Remediation Generated',
          message: `Code fix upgraded with ${remediation.confidenceScore}% confidence reasoning.`
        });
      }
    } catch (err: any) {
      onAddToast({
        type: 'error',
        title: 'AI Generation Failed',
        message: err.message || 'Could not contact Gemini AI service.'
      });
    } finally {
      setLoadingFixId(null);
    }
  };

  const categories: (IssueCategory | 'all')[] = [
    'all',
    'Images & Media',
    'Color & Contrast',
    'Forms & Controls',
    'Keyboard & Navigation'
  ];

  const filteredFixes = fixes.filter((fix) => {
    const matchesCategory =
      selectedCategory === 'all' || fix.category === selectedCategory;
    const matchesStatus =
      filterStatus === 'all' || fix.status === filterStatus;
    return matchesCategory && matchesStatus;
  });

  // Dynamic counts for status pills
  const statusCounts = {
    suggested: fixes.filter((f) => f.status === 'suggested').length,
    approved: fixes.filter((f) => f.status === 'approved').length,
    applied: fixes.filter((f) => f.status === 'applied').length,
    verified: fixes.filter((f) => f.status === 'verified').length,
    rejected: fixes.filter((f) => f.status === 'rejected').length
  };

  const getStatusBadge = (status: FixStatus) => {
    switch (status) {
      case 'suggested':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FAFAF8] text-[#70716B] border border-[#EAEAE4]">
            <Clock className="w-3 h-3 text-[#999A92]" /> Suggested (Pending Review)
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FFF5F6] text-[#A84F65] border border-[#F8E9ED]">
            <Check className="w-3 h-3 text-[#C96F82]" /> Approved for PR
          </span>
        );
      case 'applied':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#F6F7F0] text-[#62683F] border border-[#EEF0E3]">
            <CheckCircle2 className="w-3 h-3 text-[#7B8053]" /> Applied in Staging
          </span>
        );
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#F2F7F3] text-[#648568] border border-[#E2EDE4]">
            <CheckCheck className="w-3 h-3 text-[#648568]" /> Verified Compliant
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FFF5F6] text-[#C94F55] border border-[#F8E9ED]">
            <X className="w-3 h-3 text-[#C94F55]" /> Rejected / Dismissed
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-7 rounded-2xl bg-white border border-[#EAEAE4] shadow-card relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#C96F82] via-[#EEF0E3] to-[#7B8053]" />

        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1 rounded-md bg-[#FFF5F6] text-[#C96F82] border border-[#F8E9ED]">
              <Wrench className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#A84F65]">
              Remediation Engineering
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#292A27] tracking-tight">
            AI Code Fix Suggestions
          </h1>
          <p className="text-xs sm:text-sm text-[#70716B] mt-1 max-w-2xl leading-relaxed">
            Review proposed accessible markup solutions, inspect side-by-side code diffs, and manage your remediation review lifecycle.
          </p>
        </div>

        {/* Workflow Lifecycle Summary */}
        <div className="flex items-center gap-2 p-3 rounded-xl bg-[#FAFAF8] border border-[#EAEAE4] text-xs">
          <div className="text-center px-2">
            <span className="text-[#999A92] block text-[10px] font-bold">1. SUGGESTED</span>
            <span className="text-sm font-extrabold text-[#292A27]">{statusCounts.suggested}</span>
          </div>
          <span className="text-[#EAEAE4]">→</span>
          <div className="text-center px-2">
            <span className="text-[#A84F65] block text-[10px] font-bold">2. APPROVED</span>
            <span className="text-sm font-extrabold text-[#A84F65]">{statusCounts.approved}</span>
          </div>
          <span className="text-[#EAEAE4]">→</span>
          <div className="text-center px-2">
            <span className="text-[#62683F] block text-[10px] font-bold">3. APPLIED</span>
            <span className="text-sm font-extrabold text-[#62683F]">{statusCounts.applied}</span>
          </div>
          <span className="text-[#EAEAE4]">→</span>
          <div className="text-center px-2">
            <span className="text-[#648568] block text-[10px] font-bold">4. VERIFIED</span>
            <span className="text-sm font-extrabold text-[#648568]">{statusCounts.verified}</span>
          </div>
        </div>
      </div>

      {/* Safety Guarantee Banner */}
      <div className="p-4 rounded-xl bg-white border border-[#EAEAE4] shadow-card flex items-start gap-3">
        <Info className="w-4 h-4 text-[#7B8053] mt-0.5 flex-shrink-0" />
        <div className="text-xs text-[#70716B] leading-relaxed">
          <strong className="text-[#292A27]">Review & Verification Protocol:</strong> Approving a fix does not modify live external websites. Code repairs are reviewed here, copied or merged into your git repository, and subsequently verified during your next diagnostic scan.
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-white border border-[#EAEAE4] shadow-card">
        {/* Status Lifecycle Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[#70716B] font-bold mr-1">Lifecycle State:</span>
          {(['all', 'suggested', 'approved', 'applied', 'verified', 'rejected'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1 rounded-lg capitalize font-semibold transition-colors ${
                filterStatus === st
                  ? 'bg-[#C96F82] text-white shadow-rose-sm'
                  : 'bg-[#FAFAF8] text-[#70716B] hover:text-[#292A27] border border-[#EAEAE4]'
              }`}
            >
              <span>{st}</span>
              {st !== 'all' && (
                <span className="ml-1.5 opacity-80 font-mono">({statusCounts[st]})</span>
              )}
            </button>
          ))}
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[#70716B] font-semibold mr-1">Category:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#7B8053] text-white'
                  : 'bg-[#FAFAF8] hover:bg-[#F6F7F0] text-[#70716B] border border-[#EAEAE4]'
              }`}
            >
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Fix Suggestions List */}
      <div className="space-y-6">
        {fixes.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white border border-[#EAEAE4] shadow-card space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FFF5F6] text-[#C96F82] border border-[#F8E9ED] flex items-center justify-center mx-auto">
              <Wrench className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#292A27]">No AI Fixes Generated Yet</h3>
            <p className="text-xs sm:text-sm text-[#70716B] max-w-md mx-auto leading-relaxed">
              Run an accessibility audit on your website to detect accessibility violations and generate concrete HTML/ARIA code remediation suggestions.
            </p>
            <button
              onClick={() => onNavigate('websites')}
              className="px-5 py-2.5 rounded-xl bg-[#C96F82] hover:bg-[#A84F65] text-white text-xs font-bold shadow-rose"
            >
              Scan a Website
            </button>
          </div>
        ) : filteredFixes.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white border border-[#EAEAE4] text-[#70716B] text-xs shadow-card space-y-2">
            <CheckCircle2 className="w-8 h-8 text-[#648568] mx-auto" />
            <p className="font-bold text-[#292A27]">No code fixes found for selected filter.</p>
            <p>Try switching the lifecycle state or category filter to inspect other proposed remediations.</p>
          </div>
        ) : (
          filteredFixes.map((fix) => {
            const currentFix: FixSuggestion = { ...fix, ...(enhancedFixes[fix.id] || {}) };
            return (
              <div
                key={currentFix.id}
                className="p-6 sm:p-7 rounded-2xl bg-white border border-[#EAEAE4] hover:border-[#C96F82] shadow-card space-y-4 transition-all"
              >
              {/* Card Header & Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#EAEAE4]">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <SeverityBadge severity={currentFix.severity} size="sm" />
                    <span className="text-xs font-mono font-semibold text-[#A84F65]">{currentFix.wcagCriteria}</span>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#F6F7F0] text-[#62683F] font-semibold border border-[#EEF0E3]">
                      {currentFix.category}
                    </span>
                    {currentFix.isAiGenerated ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#FFF5F6] text-[#C96F82] border border-[#F8E9ED]">
                        <Sparkles className="w-3 h-3 text-[#C96F82]" /> Gemini AI ({currentFix.confidenceScore || 94}%)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#FAFAF8] text-[#70716B] border border-[#EAEAE4]">
                        Heuristic Rule
                      </span>
                    )}
                    {getStatusBadge(currentFix.status)}
                  </div>
                  <h3 className="text-base font-bold text-[#292A27] mt-1">
                    {currentFix.issueTitle}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-[#70716B] font-mono">
                    <FileCode className="w-3.5 h-3.5 text-[#7B8053]" />
                    <span>Target File: {currentFix.filePath}</span>
                  </div>
                </div>

                {/* Interactive Lifecycle Workflow Buttons */}
                <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                  {/* AI Enhance with Gemini Button */}
                  {currentFix.status === 'suggested' && (
                    <button
                      onClick={() => handleEnhanceWithGemini(currentFix)}
                      disabled={loadingFixId === currentFix.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFF5F6] hover:bg-[#F8E9ED] text-[#A84F65] border border-[#F8E9ED] text-xs font-bold transition-all disabled:opacity-60"
                      title="Run Gemini 1.5 Flash AI to generate a contextual, production-ready code remediation"
                    >
                      <Sparkles className={`w-3.5 h-3.5 text-[#C96F82] ${loadingFixId === currentFix.id ? 'animate-spin' : ''}`} />
                      <span>{loadingFixId === currentFix.id ? 'Enhancing...' : 'AI Enhance'}</span>
                    </button>
                  )}

                  {/* Approve Action */}
                  {currentFix.status !== 'approved' && currentFix.status !== 'applied' && currentFix.status !== 'verified' && (
                    <button
                      onClick={() => {
                        onUpdateFixStatus(currentFix.id, 'approved');
                        onAddToast({
                          type: 'success',
                          title: 'Fix Approved',
                          message: `Marked "${currentFix.issueTitle}" as approved for code integration.`
                        });
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#C96F82] hover:bg-[#A84F65] text-white text-xs font-bold shadow-rose-sm transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve Fix</span>
                    </button>
                  )}

                  {/* Mark Applied Action */}
                  {currentFix.status === 'approved' && (
                    <button
                      onClick={() => {
                        onUpdateFixStatus(currentFix.id, 'applied');
                        onAddToast({
                          type: 'info',
                          title: 'Marked as Applied',
                          message: `Fix applied to repository staging. Ready for re-scan verification.`
                        });
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#7B8053] hover:bg-[#62683F] text-white text-xs font-bold shadow-sm transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Applied in Codebase</span>
                    </button>
                  )}

                  {/* Live Rescan to Verify (Strict Integrity - No Fake Manual Override) */}
                  {currentFix.status === 'applied' && (
                    <button
                      onClick={() => {
                        if (onTriggerRescan) {
                          onTriggerRescan();
                          onAddToast({
                            type: 'info',
                            title: 'Initiating Verification Rescan',
                            message: 'Executing live Playwright + axe-core audit to verify resolution.'
                          });
                        } else {
                          onNavigate('websites');
                          onAddToast({
                            type: 'info',
                            title: 'Verification Requires Rescan',
                            message: 'Please initiate a rescan in My Websites to verify that the issue has been resolved in the DOM.'
                          });
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#7B8053] hover:bg-[#62683F] text-white text-xs font-bold shadow-sm transition-all"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Run Rescan to Verify</span>
                    </button>
                  )}

                  {/* Verified Status Pill */}
                  {currentFix.status === 'verified' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F2F7F3] text-[#648568] border border-[#E2EDE4] text-xs font-bold">
                      <CheckCheck className="w-4 h-4 text-[#648568]" />
                      <span>Verified Compliant</span>
                    </span>
                  )}

                  {/* Reject / Dismiss Action */}
                  {currentFix.status !== 'rejected' && currentFix.status !== 'verified' && (
                    <button
                      onClick={() => setConfirmRejectModalId(currentFix.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#FAFAF8] hover:bg-[#FFF5F6] text-[#70716B] hover:text-[#C94F55] border border-[#EAEAE4] text-xs font-semibold transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Dismiss</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Remediation Explanation (What, Why, How) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-[#FAFAF8] border border-[#EAEAE4] space-y-1">
                  <span className="text-[11px] font-bold text-[#70716B] uppercase tracking-wider block">
                    1. What is Wrong
                  </span>
                  <p className="text-xs text-[#292A27] leading-relaxed">
                    {currentFix.whatIsWrong}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#FFF5F6] border border-[#F8E9ED] space-y-1">
                  <span className="text-[11px] font-bold text-[#A84F65] uppercase tracking-wider block">
                    2. Why it is Wrong
                  </span>
                  <p className="text-xs text-[#292A27] leading-relaxed">
                    {currentFix.whyItIsWrong}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F6F7F0] border border-[#EEF0E3] space-y-1">
                  <span className="text-[11px] font-bold text-[#62683F] uppercase tracking-wider block">
                    3. How Solution Fixes It
                  </span>
                  <p className="text-xs text-[#292A27] leading-relaxed">
                    {currentFix.howSolutionFixesIt}
                  </p>
                </div>
              </div>

              {/* Side-by-Side Code Comparison */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
                {/* Left: Current Inaccessible Code */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-[#70716B]">
                    <span className="font-bold text-[#C94F55]">LEFT: Current Inaccessible Code</span>
                    <span className="text-[10px] font-mono text-[#999A92]">Inspected HTML</span>
                  </div>
                  <CodeBlock
                    code={currentFix.originalSnippet}
                    language="tsx"
                    title="Current Code"
                    type="original"
                    onCopySuccess={() =>
                      onAddToast({ type: 'info', title: 'Original code copied' })
                    }
                  />
                </div>

                {/* Right: AI Suggested Corrected Code */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-[#70716B]">
                    <span className="font-bold text-[#62683F] flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-[#7B8053]" /> RIGHT: AI Suggested Corrected Code
                    </span>
                    <span className="text-[10px] font-mono font-bold text-[#648568]">WCAG Compliant</span>
                  </div>
                  <CodeBlock
                    code={currentFix.suggestedSnippet}
                    language="tsx"
                    title="Suggested Replacement"
                    type="suggested"
                    onCopySuccess={() =>
                      onAddToast({
                        type: 'success',
                        title: 'Repaired snippet copied to clipboard!',
                        message: 'Ready to paste into your codebase.'
                      })
                    }
                  />
                </div>
              </div>

              {/* Diff Summary & Expand Option */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[11px] text-[#70716B]">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-[#292A27]">Diff Summary:</span>
                  <code className="text-[#70716B] font-mono bg-[#FAFAF8] px-2 py-0.5 rounded border border-[#EAEAE4]">
                    {currentFix.diffSummary.replace('\n', ' • ')}
                  </code>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setExpandedCodeModalFix(currentFix)}
                    className="inline-flex items-center gap-1 text-[#A84F65] hover:text-[#C96F82] font-semibold"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Compare Expanded View</span>
                  </button>

                  <button
                    onClick={() => onNavigate('results')}
                    className="text-[#7B8053] hover:underline font-semibold flex items-center gap-1"
                  >
                    <span>View Issue Rule</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>

      {/* Confirmation Dialog for Rejecting / Dismissing */}
      {confirmRejectModalId && (
        <Modal
          isOpen={!!confirmRejectModalId}
          onClose={() => setConfirmRejectModalId(null)}
          title="Dismiss Fix Suggestion?"
          subtitle="You can always re-activate this suggestion from the Rejected filter."
        >
          <div className="space-y-4">
            <p className="text-xs text-[#70716B] leading-relaxed">
              Dismissing marks this recommendation as rejected. The underlying rule violation will remain logged in your audit report until remediated.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmRejectModalId(null)}
                className="px-4 py-2 rounded-xl bg-[#FAFAF8] text-xs font-semibold text-[#70716B] border border-[#EAEAE4]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onUpdateFixStatus(confirmRejectModalId, 'rejected');
                  setConfirmRejectModalId(null);
                  onAddToast({
                    type: 'info',
                    title: 'Fix Dismissed',
                    message: 'Suggestion moved to Rejected list.'
                  });
                }}
                className="px-4 py-2 rounded-xl bg-[#C94F55] text-white text-xs font-bold shadow-sm"
              >
                Confirm Dismiss
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Full Expanded Code Modal */}
      {expandedCodeModalFix && (
        <Modal
          isOpen={!!expandedCodeModalFix}
          onClose={() => setExpandedCodeModalFix(null)}
          title={`Full Code Inspection: ${expandedCodeModalFix.issueTitle}`}
          subtitle={`File target: ${expandedCodeModalFix.filePath}`}
          maxWidth="max-w-4xl"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-xs font-bold text-[#C94F55] block mb-1.5">Original Code:</span>
                <CodeBlock
                  code={expandedCodeModalFix.originalSnippet}
                  language="tsx"
                  title="Original Snippet"
                  type="original"
                  onCopySuccess={() => onAddToast({ type: 'info', title: 'Copied' })}
                />
              </div>
              <div>
                <span className="text-xs font-bold text-[#648568] block mb-1.5">Suggested Replacement:</span>
                <CodeBlock
                  code={expandedCodeModalFix.suggestedSnippet}
                  language="tsx"
                  title="Corrected Snippet"
                  type="suggested"
                  onCopySuccess={() => onAddToast({ type: 'success', title: 'Copied' })}
                />
              </div>
            </div>
            <div className="flex justify-end pt-3 border-t border-[#EAEAE4]">
              <button
                onClick={() => setExpandedCodeModalFix(null)}
                className="px-4 py-2 rounded-xl bg-[#C96F82] text-white text-xs font-bold shadow-rose-sm"
              >
                Done
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
