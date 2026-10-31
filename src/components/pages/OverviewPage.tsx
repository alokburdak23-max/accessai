import React, { useState } from 'react';
import {
  Globe,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Plus,
  ArrowUpRight,
  ChevronRight,
  ShieldCheck,
  Calendar,
  Sparkles,
  Search,
  ExternalLink,
  Layers,
  ArrowRight
} from 'lucide-react';
import { ScoreGauge } from '../common/ScoreGauge';
import { SeverityBadge } from '../common/SeverityBadge';
import { Modal } from '../common/Modal';
import {
  AccessibilityIssue,
  AIRecommendation,
  PageId,
  RecentScanItem
} from '../../types';

interface OverviewPageProps {
  recentScans: RecentScanItem[];
  issues: AccessibilityIssue[];
  recommendations: AIRecommendation[];
  onNavigate: (page: PageId) => void;
  onSelectIssue?: (issue: AccessibilityIssue) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  recentScans,
  issues,
  recommendations,
  onNavigate,
  onSelectIssue
}) => {
  const [selectedIssueModal, setSelectedIssueModal] = useState<AccessibilityIssue | null>(null);

  // Derive dynamic statistics from actual scan records
  const totalWebsites = recentScans.length;
  const latestScan = recentScans.length > 0 ? recentScans[0] : null;
  const overallScore = latestScan ? latestScan.score : 0;

  const issuesDetected = issues.filter((i) => i.status !== 'resolved').length;
  const issuesResolved = issues.filter((i) => i.status === 'resolved').length;

  // Priority issues (Critical & Serious)
  const priorityIssues = issues
    .filter((i) => i.status !== 'resolved')
    .slice(0, 3);

  // If user has not performed any scan yet, display clean empty state
  if (recentScans.length === 0) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        {/* Welcome Section */}
        <section className="p-6 sm:p-8 rounded-2xl bg-white border border-[#EAEAE4] shadow-card relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#C96F82] via-[#EEF0E3] to-[#7B8053]" />

          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1 rounded-md bg-[#FFF5F6] text-[#C96F82] border border-[#F8E9ED]">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-[#A84F65]">
                Automated Accessibility Intelligence
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#292A27] tracking-tight">
              NETRA Accessibility Overview
            </h1>
            <p className="text-sm text-[#70716B] mt-2 leading-relaxed">
              Making the Digital World Accessible to Everyone. Understand your website accessibility barriers, verify WCAG 2.1 AA compliance, and generate code-level fixes powered by AccessAI.
            </p>
          </div>
        </section>

        {/* Empty State Banner */}
        <section className="p-10 sm:p-14 rounded-2xl bg-white border border-[#EAEAE4] shadow-card text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-[#FFF5F6] text-[#C96F82] border border-[#F8E9ED] flex items-center justify-center mx-auto shadow-sm">
            <Globe className="w-8 h-8" />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-xl font-extrabold text-[#292A27]">
              No websites scanned yet
            </h2>
            <p className="text-xs sm:text-sm text-[#70716B] leading-relaxed">
              Enter any public website URL to run an automated audit powered by Playwright and axe-core. Discover real accessibility barriers and generate AI code remediation.
            </p>
          </div>

          <button
            onClick={() => onNavigate('websites')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#C96F82] hover:bg-[#A84F65] text-white font-bold text-sm shadow-rose transition-all transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Scan Your First Website</span>
          </button>
        </section>

        {/* Feature Overview Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-[#EAEAE4] shadow-card space-y-2">
            <span className="text-xs font-bold text-[#A84F65] uppercase tracking-wider block">Images & Media</span>
            <h3 className="text-sm font-bold text-[#292A27]">Alternative Text Verification</h3>
            <p className="text-xs text-[#70716B] leading-relaxed">
              Detects missing alt attributes, non-descriptive labels, and unannounced vector graphics.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#EAEAE4] shadow-card space-y-2">
            <span className="text-xs font-bold text-[#7B8053] uppercase tracking-wider block">Color & Contrast</span>
            <h3 className="text-sm font-bold text-[#292A27]">Luminance Contrast Ratios</h3>
            <p className="text-xs text-[#70716B] leading-relaxed">
              Evaluates foreground and background color combinations against the 4.5:1 WCAG AA threshold.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#EAEAE4] shadow-card space-y-2">
            <span className="text-xs font-bold text-[#D88A4C] uppercase tracking-wider block">Forms & Controls</span>
            <h3 className="text-sm font-bold text-[#292A27]">Form Field Labeling</h3>
            <p className="text-xs text-[#70716B] leading-relaxed">
              Ensures every input, select, and textarea has a programmatic label for screen reader visitors.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#EAEAE4] shadow-card space-y-2">
            <span className="text-xs font-bold text-[#648568] uppercase tracking-wider block">Keyboard Access</span>
            <h3 className="text-sm font-bold text-[#292A27]">Focus Traversal & ARIA</h3>
            <p className="text-xs text-[#70716B] leading-relaxed">
              Verifies focus visibility, interactive roles, and ensures custom elements can be tabbed and activated.
            </p>
          </div>
        </section>
      </div>
    );
  }

  // Active Dashboard with Real Scan Records
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome Banner */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-7 rounded-2xl bg-white border border-[#EAEAE4] shadow-card relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#C96F82] via-[#EEF0E3] to-[#7B8053]" />

        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-[#648568]"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#A84F65]">
              Real Audit Results • {latestScan?.url}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#292A27] tracking-tight">
            NETRA Accessibility Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-[#70716B] mt-1 max-w-2xl leading-relaxed">
            Making the Digital World Accessible to Everyone. Continuous audit intelligence for your active domains powered by AccessAI.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('websites')}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#C96F82] hover:bg-[#A84F65] text-white font-semibold text-xs shadow-rose transition-all transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Scan Website</span>
          </button>
        </div>
      </section>

      {/* Primary Section: 4 Stat Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Latest Accessibility Score */}
        <div className="p-5 rounded-2xl bg-white border border-[#EAEAE4] hover:border-[#C96F82] transition-all shadow-card group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#70716B] uppercase tracking-wider">
              Latest Score
            </span>
            <div className="p-2 rounded-xl bg-[#FFF5F6] text-[#C96F82] border border-[#F8E9ED]">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-[#292A27] tracking-tight">
              {overallScore}<span className="text-sm font-medium text-[#70716B]">/100</span>
            </span>
            <span className="inline-flex items-center text-xs font-bold text-[#648568] gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" /> Latest Audit
            </span>
          </div>
          <p className="text-xs text-[#70716B] mt-1">
            Status: {overallScore >= 90 ? 'Optimal' : overallScore >= 70 ? 'Needs Improvement' : 'High Barrier Risk'}
          </p>
        </div>

        {/* Card 2: Total Websites Monitored */}
        <div className="p-5 rounded-2xl bg-white border border-[#EAEAE4] hover:border-[#7B8053] transition-all shadow-card group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#70716B] uppercase tracking-wider">
              Websites Audited
            </span>
            <div className="p-2 rounded-xl bg-[#F6F7F0] text-[#7B8053] border border-[#EEF0E3]">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-[#292A27] tracking-tight">{totalWebsites}</span>
            <span className="inline-flex items-center text-xs font-bold text-[#7B8053] gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" /> Active
            </span>
          </div>
          <p className="text-xs text-[#70716B] mt-1">In persistent storage</p>
        </div>

        {/* Card 3: Issues Detected */}
        <div className="p-5 rounded-2xl bg-white border border-[#EAEAE4] hover:border-[#C94F55] transition-all shadow-card group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#70716B] uppercase tracking-wider">
              Active Barriers
            </span>
            <div className="p-2 rounded-xl bg-[#FFF5F6] text-[#C94F55] border border-[#F8E9ED]">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-[#292A27] tracking-tight">{issuesDetected}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#FFF5F6] text-[#C94F55] border border-[#F8E9ED]">
              Unresolved
            </span>
          </div>
          <p className="text-xs text-[#70716B] mt-1">Detected by axe-core analysis</p>
        </div>

        {/* Card 4: Issues Resolved */}
        <div className="p-5 rounded-2xl bg-white border border-[#EAEAE4] hover:border-[#648568] transition-all shadow-card group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#70716B] uppercase tracking-wider">
              Verified Resolved
            </span>
            <div className="p-2 rounded-xl bg-[#F2F7F3] text-[#648568] border border-[#E2EDE4]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-[#292A27] tracking-tight">{issuesResolved}</span>
            <span className="text-xs font-bold text-[#648568]">
              Confirmed
            </span>
          </div>
          <p className="text-xs text-[#70716B] mt-1">Verified via rescan</p>
        </div>
      </section>

      {/* Main Accessibility Overview & Score Gauge */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#292A27]">Website Condition & Benchmark</h2>
          <div className="text-xs text-[#70716B] flex items-center gap-2">
            <span className="font-mono text-[11px] text-[#A84F65]">{latestScan?.url}</span>
          </div>
        </div>
        <ScoreGauge score={overallScore} maxScore={100} />
      </section>

      {/* Priority Issues Requiring Immediate Attention */}
      <section className="p-6 sm:p-7 rounded-2xl bg-white border border-[#EAEAE4] shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#EAEAE4]">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#C94F55]"></span>
              <h3 className="text-base font-bold text-[#292A27]">Priority Issues Requiring Immediate Attention</h3>
            </div>
            <p className="text-xs text-[#70716B] mt-0.5">
              Top severity barriers detected in the latest audit of {latestScan?.url}
            </p>
          </div>
          <button
            onClick={() => onNavigate('results')}
            className="text-xs font-bold text-[#A84F65] hover:text-[#C96F82] flex items-center gap-1"
          >
            <span>View All {issues.length} Issues</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {priorityIssues.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="w-10 h-10 text-[#648568] mx-auto opacity-40 mb-2" />
            <p className="text-xs text-[#70716B]">No critical barriers remaining in the current audit!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {priorityIssues.map((issue) => (
              <div
                key={issue.id}
                className="p-5 rounded-2xl bg-[#FAFAF8] border border-[#EAEAE4] hover:border-[#C96F82] transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <SeverityBadge severity={issue.severity} size="sm" />
                    <span className="text-[11px] font-mono text-[#70716B]">
                      {issue.elementCount} element
                    </span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-[#292A27] line-clamp-1">{issue.title}</h4>
                  <p className="text-xs text-[#70716B] mt-1.5 line-clamp-2 leading-relaxed">
                    {issue.problemExplanation}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#EAEAE4] flex items-center justify-between">
                  <span className="text-[11px] font-mono text-[#A84F65] font-semibold">
                    {issue.wcagCriteria}
                  </span>
                  <button
                    onClick={() => setSelectedIssueModal(issue)}
                    className="text-xs font-bold text-[#A84F65] hover:text-[#C96F82] flex items-center gap-1"
                  >
                    <span>View Details</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent Scans Table */}
      <section className="p-6 sm:p-7 rounded-2xl bg-white border border-[#EAEAE4] shadow-card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#EAEAE4]">
          <div>
            <h3 className="text-base font-bold text-[#292A27]">Recent Website Scans</h3>
            <p className="text-xs text-[#70716B]">Chronological log of verified accessibility audits</p>
          </div>
          <button
            onClick={() => onNavigate('websites')}
            className="text-xs font-bold text-[#A84F65] hover:text-[#C96F82]"
          >
            Manage Monitored Websites →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAFAF8] border-b border-[#EAEAE4] text-[#70716B] font-semibold">
              <tr>
                <th className="py-3 px-4">Website URL</th>
                <th className="py-3 px-4">Accessibility Score</th>
                <th className="py-3 px-4">Violations</th>
                <th className="py-3 px-4">Pages</th>
                <th className="py-3 px-4">Last Scanned</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEAE4]">
              {recentScans.map((scan) => (
                <tr key={scan.id} className="hover:bg-[#FAFAF8]/80 transition-colors">
                  <td className="py-3.5 px-4 font-medium text-[#292A27]">
                    <div className="flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-[#7B8053]" />
                      <span className="font-mono">{scan.url}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`font-black text-xs ${
                        scan.score >= 90
                          ? 'text-[#648568]'
                          : scan.score >= 70
                          ? 'text-[#C96F82]'
                          : 'text-[#C94F55]'
                      }`}
                    >
                      {scan.score}/100
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-[#292A27]">
                      {scan.issuesCount.total} detected
                    </span>
                    <span className="text-[11px] text-[#C94F55] block font-mono">
                      {scan.issuesCount.critical} critical
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-[#70716B]">
                    {scan.pagesScanned || 1} pages
                  </td>
                  <td className="py-3.5 px-4 text-[#70716B]">
                    {scan.lastScanned}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#F2F7F3] text-[#648568] border border-[#E2EDE4]">
                      <CheckCircle2 className="w-3 h-3" /> {scan.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => onNavigate('results')}
                      className="px-3 py-1.5 rounded-lg bg-[#FAFAF8] hover:bg-[#F6F7F0] text-[#292A27] font-semibold border border-[#EAEAE4] transition-colors"
                    >
                      View Results
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Quick Issue Detail Modal */}
      {selectedIssueModal && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedIssueModal(null)}
          title={selectedIssueModal.title}
          subtitle={`${selectedIssueModal.wcagCriteria} • ${selectedIssueModal.affectedPage}`}
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-2">
              <SeverityBadge severity={selectedIssueModal.severity} size="sm" />
              <span className="text-[#70716B] font-mono">Target: {selectedIssueModal.selector}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FFF5F6] border border-[#F8E9ED] text-[#A84F65] leading-relaxed">
              <strong className="block mb-1">Why this matters:</strong>
              {selectedIssueModal.whyItMatters}
            </div>

            <div className="p-3.5 rounded-xl bg-[#FAFAF8] border border-[#EAEAE4] text-[#292A27] leading-relaxed">
              <strong className="block mb-1">Recommended Action:</strong>
              {selectedIssueModal.recommendedAction}
            </div>

            <div className="pt-3 border-t border-[#EAEAE4] flex justify-end gap-2">
              <button
                onClick={() => setSelectedIssueModal(null)}
                className="px-4 py-2 rounded-xl bg-[#FAFAF8] text-[#70716B] font-semibold border border-[#EAEAE4]"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setSelectedIssueModal(null);
                  onNavigate('fixes');
                }}
                className="px-4 py-2 rounded-xl bg-[#C96F82] hover:bg-[#A84F65] text-white font-bold shadow-rose"
              >
                View AI Code Fix
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
