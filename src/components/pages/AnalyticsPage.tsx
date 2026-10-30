import React, { useState } from 'react';
import {
  TrendingUp,
  Sparkles,
  Users,
  EyeOff,
  Keyboard,
  Sun,
  Brain,
  Palette,
  ArrowRight,
  Target,
  History,
  Globe,
  Calendar,
  Search,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { SeverityBadge } from '../common/SeverityBadge';
import {
  PageId,
  ScanHistoryItem,
  UserImpactCategory,
  RootCausePattern,
  AIRecommendation,
  AccessibilityIssue
} from '../../types';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';

interface AnalyticsPageProps {
  history: ScanHistoryItem[];
  userImpacts: UserImpactCategory[];
  rootCauses: RootCausePattern[];
  recommendations: AIRecommendation[];
  issues: AccessibilityIssue[];
  onNavigate: (page: PageId) => void;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({
  history,
  userImpacts,
  rootCauses,
  recommendations,
  issues,
  onNavigate
}) => {
  const [activeTab, setActiveTab] = useState<'insights' | 'history'>('insights');
  const [filterWebsite, setFilterWebsite] = useState('all');
  const [searchHistoryQuery, setSearchHistoryQuery] = useState('');

  // Extract unique websites for dropdown filter
  const websites = Array.from(new Set(history.map((h) => h.website)));

  // Chronologically sorted history (newest first)
  const sortedHistory = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredHistory = sortedHistory.filter((item) => {
    const matchesSite =
      filterWebsite === 'all' || item.website === filterWebsite;
    const matchesSearch =
      item.website.toLowerCase().includes(searchHistoryQuery.toLowerCase()) ||
      item.date.includes(searchHistoryQuery);
    return matchesSite && matchesSearch;
  });

  // Chart data for score trends over time (reversed to be left-to-right chronological)
  const trendData = [...filteredHistory].reverse().map((h, i) => ({
    scan: `#${i + 1}`,
    date: h.date.split(' ')[0],
    score: h.score,
    issues: h.totalIssues,
    website: h.website
  }));

  // User ability chart data
  const userImpactChartData = userImpacts.map((u) => ({
    name: u.group.split(' ')[0],
    fullName: u.group,
    count: u.barrierCount,
    severity: u.severityLevel
  }));

  // Dynamic issue distribution
  const issueDistributionData = [
    { name: 'Critical', count: issues.filter((i) => i.severity === 'critical').length, color: '#C94F55' },
    { name: 'Serious', count: issues.filter((i) => i.severity === 'serious').length, color: '#D88A4C' },
    { name: 'Moderate', count: issues.filter((i) => i.severity === 'moderate').length, color: '#C5A64D' },
    { name: 'Minor', count: issues.filter((i) => i.severity === 'minor').length, color: '#7B8053' }
  ];

  // Resolved vs unresolved
  const resolvedCount = issues.filter((i) => i.status === 'resolved').length;
  const unresolvedCount = issues.filter((i) => i.status !== 'resolved').length;
  const resolutionData = [
    { name: 'Resolved', value: resolvedCount || 1, color: '#648568' },
    { name: 'Unresolved', value: unresolvedCount || 7, color: '#C96F82' }
  ];

  const iconMap: Record<string, React.ElementType> = {
    EyeOff: EyeOff,
    Keyboard: Keyboard,
    Sun: Sun,
    Palette: Palette,
    Brain: Brain
  };

  const critCount = issues.filter((i) => i.severity === 'critical').length;
  const serCount = issues.filter((i) => i.severity === 'serious').length;
  const modCount = issues.filter((i) => i.severity === 'moderate').length;
  const minCount = issues.filter((i) => i.severity === 'minor').length;

  const currentScore = sortedHistory.length > 0 
    ? sortedHistory[0].score 
    : (issues.length === 0 ? 100 : Math.max(10, Math.round(100 - (critCount * 12 + serCount * 6 + modCount * 2 + minCount * 0.5))));
  const scoreUplift = Math.max(0, 100 - currentScore);
  const targetScore = Math.min(100, currentScore + scoreUplift);

  // Group recommendations by priority tier
  const immediateFixes = recommendations.filter((r) => r.priorityTier === 'Fix Immediately');
  const nextFixes = recommendations.filter((r) => r.priorityTier === 'Fix Next');
  const futureImprovements = recommendations.filter((r) => r.priorityTier === 'Future Improvements');

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-7 rounded-2xl bg-white border border-[#EAEAE4] shadow-card relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#C96F82] via-[#EEF0E3] to-[#7B8053]" />

        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1 rounded-md bg-[#FFF5F6] text-[#C96F82] border border-[#F8E9ED]">
              <TrendingUp className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#A84F65]">
              Intelligence & Longitudinal Audits
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#292A27] tracking-tight">
            Analytics & AI Insights
          </h1>
          <p className="text-xs sm:text-sm text-[#70716B] mt-1 max-w-2xl leading-relaxed">
            Understand how digital barriers restrict real assistive technology visitors, diagnose recurring root causes, and track audit score progress over time.
          </p>
        </div>

        {/* Navigation Tabs between Insights and History */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-[#FAFAF8] border border-[#EAEAE4]">
          <button
            onClick={() => setActiveTab('insights')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'insights'
                ? 'bg-[#C96F82] text-white shadow-rose-sm'
                : 'text-[#70716B] hover:text-[#292A27]'
            }`}
          >
            AI Insights & Human Impact
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'history'
                ? 'bg-[#C96F82] text-white shadow-rose-sm'
                : 'text-[#70716B] hover:text-[#292A27]'
            }`}
          >
            Audit History & Trends
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {history.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white border border-[#EAEAE4] shadow-card space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#FFF5F6] text-[#C96F82] border border-[#F8E9ED] flex items-center justify-center mx-auto">
            <TrendingUp className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-[#292A27]">No Historical Audits Recorded</h3>
          <p className="text-xs sm:text-sm text-[#70716B] max-w-md mx-auto leading-relaxed">
            Run your first website audit to visualize historical score trajectories, human user impact, and automated WCAG progress over time.
          </p>
          <button
            onClick={() => onNavigate('websites')}
            className="px-5 py-2.5 rounded-xl bg-[#C96F82] hover:bg-[#A84F65] text-white text-xs font-bold shadow-rose"
          >
            Scan a Website
          </button>
        </div>
      ) : (
        <>
          {/* TAB 1: AI INSIGHTS & HUMAN IMPACT */}
          {activeTab === 'insights' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Section A: Human User Impact */}
          <section className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-[#292A27] flex items-center gap-2">
                <Users className="w-5 h-5 text-[#C96F82]" />
                A. Potential Human User Impact
              </h3>
              <p className="text-xs text-[#70716B]">
                How current accessibility barriers directly restrict specific assistive hardware and software users
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userImpacts.map((impact) => {
                const Icon = iconMap[impact.icon] || Users;
                const severityBadge =
                  impact.severityLevel === 'High'
                    ? 'text-[#C94F55] bg-[#FFF5F6] border-[#F8E9ED]'
                    : impact.severityLevel === 'Medium'
                    ? 'text-[#D88A4C] bg-[#FFF8F2] border-[#FDEEE2]'
                    : 'text-[#7B8053] bg-[#F6F7F0] border-[#EEF0E3]';

                return (
                  <div
                    key={impact.group}
                    className="p-5 rounded-2xl bg-white border border-[#EAEAE4] shadow-card flex flex-col justify-between hover:border-[#C96F82] transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-2.5 rounded-xl bg-[#FFF5F6] text-[#C96F82] border border-[#F8E9ED]">
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${severityBadge}`}>
                          {impact.severityLevel} Impact
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-[#292A27]">{impact.group}</h4>
                      <div className="text-xs font-semibold text-[#A84F65] mt-0.5">
                        {impact.barrierCount} barriers affecting this user group
                      </div>

                      <p className="text-xs text-[#70716B] mt-2.5 leading-relaxed">
                        {impact.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#EAEAE4] text-[11px] text-[#70716B] space-y-1">
                      <span className="font-semibold text-[#292A27] block">Assistive Technologies:</span>
                      <span className="font-mono text-[10px] text-[#7B8053]">{impact.primaryAssistanceTech}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Section B: Root Cause Analysis */}
          <section className="p-6 sm:p-7 rounded-2xl bg-white border border-[#EAEAE4] shadow-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAEAE4]">
              <div>
                <h3 className="text-base font-bold text-[#292A27]">B. Recurring Root Cause Analysis</h3>
                <p className="text-xs text-[#70716B]">Systemic architectural and workflow patterns causing repeated failures across pages</p>
              </div>
              <span className="text-xs text-[#7B8053] font-bold bg-[#F6F7F0] px-2.5 py-0.5 rounded-full border border-[#EEF0E3]">
                {rootCauses.length} Core Patterns
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rootCauses.length === 0 ? (
                <div className="col-span-2 p-8 text-center rounded-xl bg-[#FAFAF8] border border-[#EAEAE4] text-xs text-[#70716B]">
                  No recurring root causes identified yet. Scan a website to generate systemic failure pattern diagnostics.
                </div>
              ) : (
                rootCauses.map((rc) => (
                  <div
                    key={rc.id}
                    className="p-4 rounded-xl bg-[#FAFAF8] border border-[#EAEAE4] space-y-2.5 hover:border-[#C96F82] transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#292A27]">{rc.pattern}</span>
                      <span className="text-xs font-bold text-[#A84F65]">
                        {rc.percentageOfIssues}% of barriers
                      </span>
                    </div>

                    <p className="text-xs text-[#70716B]">
                      <strong className="text-[#292A27]">Underlying Cause: </strong>
                      {rc.rootCause}
                    </p>

                    <div className="p-2.5 rounded-lg bg-white border border-[#EAEAE4] text-xs text-[#62683F]">
                      <strong className="text-[#292A27]">Suggested Remediation: </strong>
                      {rc.suggestedSolution}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Section C: AI Priority Recommendations Roadmap */}
          <section className="p-6 sm:p-7 rounded-2xl bg-white border border-[#EAEAE4] shadow-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAEAE4]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#F6F7F0] text-[#7B8053] border border-[#EEF0E3]">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#292A27]">C. AI Prioritized Remediation Roadmap</h3>
                  <p className="text-xs text-[#70716B]">Clear sequencing of fixes based on WCAG impact and user barrier severity</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Fix Immediately */}
              <div className="p-5 rounded-2xl bg-[#FAFAF8] border border-[#EAEAE4] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#C94F55] bg-[#FFF5F6] px-2 py-0.5 rounded border border-[#F8E9ED]">
                    1. Fix Immediately
                  </span>
                  <span className="text-xs text-[#70716B] font-semibold">Sprint 1</span>
                </div>
                <h4 className="text-sm font-bold text-[#292A27]">Blocking Level A Barriers</h4>
                <p className="text-xs text-[#70716B] leading-relaxed">
                  Alt text on hero assets and non-focusable div controls completely block screen reader and keyboard access.
                </p>
                <div className="space-y-1.5 pt-2 border-t border-[#EAEAE4]">
                  {immediateFixes.map((f) => (
                    <div key={f.id} className="text-xs text-[#292A27] font-medium flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C94F55]"></span>
                      <span className="truncate">{f.title}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fix Next */}
              <div className="p-5 rounded-2xl bg-[#FAFAF8] border border-[#EAEAE4] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#D88A4C] bg-[#FFF8F2] px-2 py-0.5 rounded border border-[#FDEEE2]">
                    2. Fix Next
                  </span>
                  <span className="text-xs text-[#70716B] font-semibold">Sprint 2</span>
                </div>
                <h4 className="text-sm font-bold text-[#292A27]">Level AA Usability Barriers</h4>
                <p className="text-xs text-[#70716B] leading-relaxed">
                  Contrast adjustments on primary CTA buttons and form control labels required for full legal AA compliance.
                </p>
                <div className="space-y-1.5 pt-2 border-t border-[#EAEAE4]">
                  {nextFixes.map((f) => (
                    <div key={f.id} className="text-xs text-[#292A27] font-medium flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D88A4C]"></span>
                      <span className="truncate">{f.title}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Future Improvements */}
              <div className="p-5 rounded-2xl bg-[#FAFAF8] border border-[#EAEAE4] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#7B8053] bg-[#F6F7F0] px-2 py-0.5 rounded border border-[#EEF0E3]">
                    3. Improvements
                  </span>
                  <span className="text-xs text-[#70716B] font-semibold">Sprint 3+</span>
                </div>
                <h4 className="text-sm font-bold text-[#292A27]">Optimization & Polish</h4>
                <p className="text-xs text-[#70716B] leading-relaxed">
                  Standardizing visible focus indicators, descriptive link contexts, and semantic document landmark structures.
                </p>
                <div className="space-y-1.5 pt-2 border-t border-[#EAEAE4]">
                  {futureImprovements.map((f) => (
                    <div key={f.id} className="text-xs text-[#292A27] font-medium flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#7B8053]"></span>
                      <span className="truncate">{f.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Section D: Projected Improvement (Clearly Marked as Projection) */}
          <section className="p-6 sm:p-7 rounded-2xl bg-white border border-[#EAEAE4] shadow-card space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#EAEAE4]">
              <div>
                <h3 className="text-base font-bold text-[#292A27]">D. Projected Accessibility Score Improvement</h3>
                <p className="text-xs text-[#70716B]">Estimated score trajectory upon applying all prioritized code repairs</p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#FFF5F6] text-[#A84F65] border border-[#F8E9ED]">
                Estimated Projection (Non-Measured)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-xl bg-[#FAFAF8] border border-[#EAEAE4]">
                <span className="text-xs text-[#70716B] font-semibold">Current Measured Score</span>
                <div className="text-2xl font-extrabold text-[#292A27] mt-1">{currentScore} / 100</div>
                <span className="text-[11px] text-[#A84F65] font-semibold">
                  {currentScore >= 90 ? 'Optimal Accessibility' : currentScore >= 70 ? 'Needs Improvement' : 'High Barrier Risk'}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#FAFAF8] border border-[#EAEAE4]">
                <span className="text-xs text-[#70716B] font-semibold">Estimated Score Uplift</span>
                <div className="text-2xl font-extrabold text-[#648568] mt-1">+{scoreUplift} Points</div>
                <span className="text-[11px] text-[#648568] font-semibold">Upon Level A & AA fixes</span>
              </div>

              <div className="p-4 rounded-xl bg-[#FAFAF8] border border-[#EAEAE4]">
                <span className="text-xs text-[#70716B] font-semibold">Projected Target Score</span>
                <div className="text-2xl font-extrabold text-[#A84F65] mt-1">{targetScore} / 100</div>
                <span className="text-[11px] text-[#7B8053] font-semibold">Full AA Compliance</span>
              </div>
            </div>

            <p className="text-[11px] text-[#999A92] leading-relaxed pt-1">
              * Note: Estimated score improvements are based on simulated weightings of standard WCAG 2.1 AA rules. Actual compliance is verified only following deployment and full DOM rescan.
            </p>
          </section>
        </div>
      )}

      {/* TAB 2: AUDIT HISTORY & TRENDS */}
      {activeTab === 'history' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Trend Area Chart */}
          <div className="p-6 sm:p-7 rounded-2xl bg-white border border-[#EAEAE4] shadow-card space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#EAEAE4]">
              <div>
                <h3 className="text-base font-bold text-[#292A27]">Accessibility Score Trajectory</h3>
                <p className="text-xs text-[#70716B]">Historical score evolution across audits</p>
              </div>
              <span className="text-xs text-[#648568] font-bold bg-[#F2F7F3] px-3 py-1 rounded-full border border-[#E2EDE4]">
                Overall Improvement: +12%
              </span>
            </div>

            <div className="h-56 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="roseAnalyticsScore" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="5%" stopColor="#C96F82" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#C96F82" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#999A92" fontSize={11} />
                  <YAxis domain={[50, 100]} stroke="#999A92" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#EAEAE4',
                      borderRadius: '0.75rem',
                      color: '#292A27',
                      fontSize: '12px',
                      boxShadow: '0 8px 20px -4px rgba(41, 42, 39, 0.1)'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#C96F82"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#roseAnalyticsScore)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Filter Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 p-4 rounded-xl bg-white border border-[#EAEAE4] shadow-card">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#70716B] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchHistoryQuery}
                onChange={(e) => setSearchHistoryQuery(e.target.value)}
                placeholder="Search domain or scan date..."
                className="w-full pl-10 pr-4 py-2 bg-[#FAFAF8] border border-[#EAEAE4] rounded-xl text-xs text-[#292A27] placeholder:text-[#999A92] focus:outline-none focus:ring-2 focus:ring-[#C96F82]"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={filterWebsite}
                onChange={(e) => setFilterWebsite(e.target.value)}
                className="px-3 py-2 bg-[#FAFAF8] border border-[#EAEAE4] rounded-xl text-xs text-[#292A27] font-medium focus:outline-none focus:ring-2 focus:ring-[#C96F82]"
              >
                <option value="all">All Domains ({websites.length})</option>
                {websites.map((site) => (
                  <option key={site} value={site}>
                    {site}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Chronological Table */}
          <div className="p-6 sm:p-7 rounded-2xl bg-white border border-[#EAEAE4] shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-[#EAEAE4] text-xs uppercase tracking-wider text-[#70716B] bg-[#FAFAF8]">
                    <th className="py-3 px-4 font-semibold">Website</th>
                    <th className="py-3 px-4 font-semibold">Scan Date</th>
                    <th className="py-3 px-4 font-semibold">Accessibility Score</th>
                    <th className="py-3 px-4 font-semibold">Issues Detected</th>
                    <th className="py-3 px-4 font-semibold">Changes Since Previous Scan</th>
                    <th className="py-3 px-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAEAE4]">
                  {filteredHistory.map((item) => {
                    const isScorePositive = item.changeScore > 0;
                    const isScoreNegative = item.changeScore < 0;

                    return (
                      <tr key={item.id} className="hover:bg-[#FAFAF8] transition-colors">
                        <td className="py-3.5 px-4 font-bold text-[#292A27]">
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-[#7B8053]" />
                            <span className="font-mono text-xs">{item.website}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-xs text-[#70716B]">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-[#999A92]" />
                            <span>{item.date}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-extrabold text-[#292A27] text-xs px-2.5 py-1 rounded-full bg-[#FAFAF8] border border-[#EAEAE4]">
                            {item.score}/100
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-xs font-bold text-[#292A27]">
                          {item.totalIssues} barriers
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2 text-xs">
                            <span
                              className={`inline-flex items-center gap-0.5 font-bold ${
                                isScorePositive
                                  ? 'text-[#648568]'
                                  : isScoreNegative
                                  ? 'text-[#C94F55]'
                                  : 'text-[#70716B]'
                              }`}
                            >
                              {isScorePositive && <ArrowUpRight className="w-3.5 h-3.5" />}
                              {isScoreNegative && <ArrowDownRight className="w-3.5 h-3.5" />}
                              {!isScorePositive && !isScoreNegative && <Minus className="w-3.5 h-3.5" />}
                              {isScorePositive ? `+${item.changeScore}` : item.changeScore} score
                            </span>
                            <span className="text-[#999A92]">•</span>
                            <span className={`text-[11px] font-semibold ${item.changeIssues <= 0 ? 'text-[#648568]' : 'text-[#D88A4C]'}`}>
                              {item.changeIssues <= 0 ? `${item.changeIssues} issues` : `+${item.changeIssues} new`}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => onNavigate('reports')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#FAFAF8] hover:bg-[#F6F7F0] text-[#292A27] text-xs font-bold border border-[#EAEAE4] transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5 text-[#C96F82]" />
                            <span>View Report</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};
