import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Wrench,
  Tag,
  ExternalLink,
  Code2,
  Info,
  Check
} from 'lucide-react';
import { SeverityBadge } from '../common/SeverityBadge';
import { CodeBlock } from '../common/CodeBlock';
import { AccessibilityIssue, IssueCategory, PageId, Severity, ToastMessage } from '../../types';

interface IssuesPageProps {
  issues: AccessibilityIssue[];
  onNavigate: (page: PageId) => void;
  onAddToast: (toast: Omit<ToastMessage, 'id'>) => void;
  onNavigateToFix?: (issueId: string) => void;
  onToggleResolveIssue?: (issueId: string) => void;
}

export const IssuesPage: React.FC<IssuesPageProps> = ({
  issues,
  onNavigate,
  onAddToast,
  onNavigateToFix,
  onToggleResolveIssue
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<Severity | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<IssueCategory | 'all'>('all');
  const [selectedWcag, setSelectedWcag] = useState<string>('all');
  const [expandedIssueIds, setExpandedIssueIds] = useState<Record<string, boolean>>({});

  // Toggle Level 2 Technical Details
  const toggleExpand = (id: string) => {
    setExpandedIssueIds((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const expandAll = () => {
    const allExpanded: Record<string, boolean> = {};
    issues.forEach((i) => (allExpanded[i.id] = true));
    setExpandedIssueIds(allExpanded);
  };

  const collapseAll = () => {
    setExpandedIssueIds({});
  };

  // Extract unique WCAG criteria for dropdown filter
  const wcagList = useMemo(() => {
    const set = new Set<string>();
    issues.forEach((i) => set.add(i.wcagCriteria));
    return Array.from(set);
  }, [issues]);

  const categories: (IssueCategory | 'all')[] = [
    'all',
    'Images & Media',
    'Color & Contrast',
    'Forms & Controls',
    'Keyboard & Navigation',
    'Semantics & Structure'
  ];

  // Filtered issues
  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      const matchesSearch =
        issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.problemExplanation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.recommendedAction.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.affectedPage.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.selector.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSeverity =
        selectedSeverity === 'all' || issue.severity === selectedSeverity;

      const matchesCategory =
        selectedCategory === 'all' || issue.category === selectedCategory;

      const matchesWcag =
        selectedWcag === 'all' || issue.wcagCriteria === selectedWcag;

      return matchesSearch && matchesSeverity && matchesCategory && matchesWcag;
    });
  }, [issues, searchQuery, selectedSeverity, selectedCategory, selectedWcag]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedSeverity('all');
    setSelectedCategory('all');
    setSelectedWcag('all');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-7 rounded-2xl bg-white border border-[#EAEAE4] shadow-card relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#C96F82] via-[#EEF0E3] to-[#7B8053]" />

        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#A84F65]">
              Diagnostic Findings
            </span>
            <span className="text-[#999A92]">•</span>
            <span className="text-xs text-[#70716B]">
              Showing {filteredIssues.length} of {issues.length} detected barriers
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#292A27] tracking-tight">
            Scan Results & Accessibility Issues
          </h1>
          <p className="text-xs sm:text-sm text-[#70716B] mt-1 max-w-3xl leading-relaxed">
            Plain-language barrier explanations for designers and managers, with expandable technical markup specifications for engineers.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={expandAll}
            className="px-3 py-1.5 rounded-lg bg-[#FAFAF8] hover:bg-[#F6F7F0] text-xs font-semibold text-[#70716B] border border-[#EAEAE4]"
          >
            Expand All Details
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-1.5 rounded-lg bg-[#FAFAF8] hover:bg-[#F6F7F0] text-xs font-semibold text-[#70716B] border border-[#EAEAE4]"
          >
            Collapse All
          </button>
          <button
            onClick={() => onNavigate('fixes')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C96F82] hover:bg-[#A84F65] text-white text-xs font-bold shadow-rose-sm transition-colors"
          >
            <Wrench className="w-4 h-4" />
            <span>Go to AI Fixes</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-5 rounded-2xl bg-white border border-[#EAEAE4] shadow-card space-y-4">
        {/* Search & Criteria Dropdown */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#70716B] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by issue title, problem, selector, or affected page..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#FAFAF8] border border-[#EAEAE4] rounded-xl text-xs sm:text-sm text-[#292A27] placeholder:text-[#999A92] focus:outline-none focus:ring-2 focus:ring-[#C96F82]"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedWcag}
              onChange={(e) => setSelectedWcag(e.target.value)}
              className="px-3 py-2.5 bg-[#FAFAF8] border border-[#EAEAE4] rounded-xl text-xs text-[#292A27] font-medium focus:outline-none focus:ring-2 focus:ring-[#C96F82]"
            >
              <option value="all">All WCAG Rules</option>
              {wcagList.map((crit) => (
                <option key={crit} value={crit}>
                  {crit}
                </option>
              ))}
            </select>

            {(searchQuery || selectedSeverity !== 'all' || selectedCategory !== 'all' || selectedWcag !== 'all') && (
              <button
                onClick={resetFilters}
                className="px-3 py-2.5 rounded-xl bg-[#FAFAF8] hover:bg-[#F6F7F0] text-[#70716B] hover:text-[#292A27] border border-[#EAEAE4] text-xs font-semibold transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Severity Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#EAEAE4]">
          <span className="text-xs font-semibold text-[#70716B] flex items-center gap-1.5 mr-1">
            <Filter className="w-3.5 h-3.5" /> Severity:
          </span>

          {(['all', 'critical', 'serious', 'moderate', 'minor'] as const).map((sev) => {
            const isActive = selectedSeverity === sev;
            const count =
              sev === 'all'
                ? issues.length
                : issues.filter((i) => i.severity === sev).length;

            return (
              <button
                key={sev}
                onClick={() => setSelectedSeverity(sev)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors capitalize flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#C96F82] text-white shadow-rose-sm'
                    : 'bg-[#FAFAF8] hover:bg-[#F6F7F0] text-[#70716B] border border-[#EAEAE4]'
                }`}
              >
                <span>{sev}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-[#A84F65] text-white' : 'bg-white text-[#70716B] border border-[#EAEAE4]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#EAEAE4]">
          <span className="text-xs font-semibold text-[#70716B] flex items-center gap-1.5 mr-1">
            <Tag className="w-3.5 h-3.5 text-[#7B8053]" /> Category:
          </span>

          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[#7B8053] text-white'
                    : 'bg-[#FAFAF8] hover:bg-[#F6F7F0] text-[#70716B] border border-[#EAEAE4]'
                }`}
              >
                {cat === 'all' ? 'All Categories' : cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Issues List with Progressive Disclosure */}
      {issues.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white border border-[#EAEAE4] shadow-card space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#FFF5F6] text-[#C96F82] border border-[#F8E9ED] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-[#292A27]">No Accessibility Issues Recorded</h3>
          <p className="text-xs sm:text-sm text-[#70716B] max-w-md mx-auto leading-relaxed">
            You have not audited any website yet, or your scanned web pages passed all automated WCAG 2.1 AA checks.
          </p>
          <button
            onClick={() => onNavigate('websites')}
            className="px-5 py-2.5 rounded-xl bg-[#C96F82] hover:bg-[#A84F65] text-white text-xs font-bold shadow-rose"
          >
            Scan a Website
          </button>
        </div>
      ) : filteredIssues.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white border border-[#EAEAE4] shadow-card space-y-3">
          <CheckCircle2 className="w-10 h-10 text-[#648568] mx-auto" />
          <h4 className="text-base font-bold text-[#292A27]">No Issues Match Selected Filters</h4>
          <p className="text-xs text-[#70716B] max-w-sm mx-auto">
            Try adjusting your search query, severity, or category filter to inspect other recorded issues.
          </p>
          <button
            onClick={resetFilters}
            className="px-4 py-2 rounded-xl bg-[#C96F82] hover:bg-[#A84F65] text-white text-xs font-bold shadow-rose-sm"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredIssues.map((issue) => {
            const isExpanded = !!expandedIssueIds[issue.id];

            return (
              <div
                key={issue.id}
                className="rounded-2xl bg-white border border-[#EAEAE4] shadow-card overflow-hidden transition-all hover:border-[#C96F82]"
              >
                {/* LEVEL 1: Simple Explanation Header & Summary */}
                <div className="p-6 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <SeverityBadge severity={issue.severity} size="sm" />
                      <span className="text-xs font-mono font-semibold text-[#A84F65] bg-[#FFF5F6] px-2 py-0.5 rounded border border-[#F8E9ED]">
                        {issue.wcagCriteria}
                      </span>
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#F6F7F0] text-[#62683F] font-semibold border border-[#EEF0E3]">
                        {issue.category}
                      </span>
                      <span className="text-xs text-[#70716B]">
                        Affected page: <strong className="font-mono text-[#292A27]">{issue.affectedPage}</strong>
                      </span>
                      <span className="text-xs text-[#70716B]">
                        • <strong className="text-[#292A27]">{issue.elementCount} elements</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {issue.status === 'resolved' && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-[#F2F7F3] text-[#648568] border border-[#E2EDE4]">
                          <Check className="w-3.5 h-3.5" /> Resolved
                        </span>
                      )}

                      <button
                        onClick={() => {
                          if (onNavigateToFix) {
                            onNavigateToFix(issue.id);
                          } else {
                            onNavigate('fixes');
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#C96F82] hover:bg-[#A84F65] text-white text-xs font-bold shadow-rose-sm transition-colors"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        <span>Fix Code</span>
                      </button>
                    </div>
                  </div>

                  {/* Human-Readable Title */}
                  <h3 className="text-base font-bold text-[#292A27]">
                    {issue.title}
                  </h3>

                  {/* Plain English Problem & Recommended Action */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div className="p-3.5 rounded-xl bg-[#FFF5F6] border border-[#F8E9ED] space-y-1">
                      <h4 className="text-xs font-bold text-[#A84F65] uppercase tracking-wider flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5" /> Why This Matters
                      </h4>
                      <p className="text-xs text-[#292A27] leading-relaxed">
                        {issue.whyItMatters}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#F6F7F0] border border-[#EEF0E3] space-y-1">
                      <h4 className="text-xs font-bold text-[#62683F] uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#648568]" /> Recommended Action
                      </h4>
                      <p className="text-xs text-[#292A27] leading-relaxed">
                        {issue.recommendedAction}
                      </p>
                    </div>
                  </div>

                  {/* Expand / Collapse Toggle for Level 2 */}
                  <div className="pt-2 flex items-center justify-between">
                    <button
                      onClick={() => toggleExpand(issue.id)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#A84F65] hover:text-[#C96F82] transition-colors"
                      aria-expanded={isExpanded}
                    >
                      <span>{isExpanded ? 'Hide Technical Details' : 'Show Technical Details (DOM, Selector & Snippet)'}</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    <span className="text-[11px] text-[#999A92]">
                      Detected on {issue.detectedAt}
                    </span>
                  </div>
                </div>

                {/* LEVEL 2: Technical Details (Expandable) */}
                {isExpanded && (
                  <div className="border-t border-[#EAEAE4] bg-[#FAFAF8] p-6 space-y-4 animate-in slide-in-from-top-2 duration-200">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#EAEAE4] text-xs">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-[#70716B]">WCAG Specification:</span>
                        <span className="font-mono font-bold text-[#292A27]">{issue.wcagCriteria} (Level {issue.wcagLevel})</span>
                      </div>
                      {issue.docUrl && (
                        <a
                          href={issue.docUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[#A84F65] hover:underline font-semibold"
                        >
                          <span>Official W3C Documentation</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>

                    {/* Selector & Technical Explanation */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#70716B]">CSS Selector:</span>
                        <code className="text-xs font-mono bg-white px-2.5 py-1 rounded-md text-[#292A27] border border-[#EAEAE4] truncate">
                          {issue.selector}
                        </code>
                      </div>
                      <p className="text-xs text-[#70716B] leading-relaxed">
                        <strong className="text-[#292A27]">Technical Explanation: </strong>
                        {issue.technicalExplanation}
                      </p>
                    </div>

                    {/* Inspected Markup Snippet */}
                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-[#292A27]">Current Inspected HTML Element:</span>
                      <CodeBlock
                        code={issue.rawHtmlSnippet}
                        language="html"
                        title="Inspected DOM Node"
                        type="original"
                        onCopySuccess={() =>
                          onAddToast({ type: 'info', title: 'Markup snippet copied to clipboard' })
                        }
                      />
                    </div>

                    {/* Suggested Correction Preview */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#62683F] flex items-center gap-1.5">
                          <Code2 className="w-3.5 h-3.5 text-[#7B8053]" /> Suggested Code-Level Correction:
                        </span>
                        <button
                          onClick={() => {
                            if (onNavigateToFix) {
                              onNavigateToFix(issue.id);
                            } else {
                              onNavigate('fixes');
                            }
                          }}
                          className="text-xs font-bold text-[#A84F65] hover:underline"
                        >
                          Open in Fix Editor →
                        </button>
                      </div>
                      <CodeBlock
                        code={issue.suggestedFixSnippet}
                        language="html"
                        title="AI Recommended Replacement"
                        type="suggested"
                        onCopySuccess={() =>
                          onAddToast({ type: 'success', title: 'Corrected snippet copied!' })
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
