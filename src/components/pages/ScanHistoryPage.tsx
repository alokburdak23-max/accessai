import React, { useState } from 'react';
import {
  History,
  Globe,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  FileText,
  Search,
  Calendar
} from 'lucide-react';
import { PageId, ScanHistoryItem } from '../../types';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface ScanHistoryPageProps {
  history: ScanHistoryItem[];
  onNavigate: (page: PageId) => void;
  onSelectScanReport?: (scan: ScanHistoryItem) => void;
}

export const ScanHistoryPage: React.FC<ScanHistoryPageProps> = ({
  history,
  onNavigate
}) => {
  const [filterWebsite, setFilterWebsite] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Extract unique websites for dropdown filter
  const websites = Array.from(new Set(history.map((h) => h.website)));

  const filteredHistory = history.filter((item) => {
    const matchesSite =
      filterWebsite === 'all' || item.website === filterWebsite;
    const matchesSearch =
      item.website.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.date.includes(searchQuery);
    return matchesSite && matchesSearch;
  });

  // Trend data for the chart (reversed chronologically)
  const trendData = [...filteredHistory].reverse().map((h, i) => ({
    scan: `#${i + 1}`,
    date: h.date.split(' ')[0],
    score: h.score,
    issues: h.totalIssues,
    website: h.website
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-7 rounded-2xl bg-white border border-[#EAEAE4] shadow-card relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#C96F82] via-[#EEF0E3] to-[#7B8053]" />

        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1 rounded-md bg-[#FFF5F6] text-[#C96F82] border border-[#F8E9ED]">
              <History className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#A84F65]">
              Audit Timeline
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#292A27] tracking-tight">
            Scan History & Progress Logs
          </h1>
          <p className="text-xs sm:text-sm text-[#70716B] mt-1 max-w-2xl leading-relaxed">
            Track historical compliance trends, audit score evolutions, and issue delta statistics over time.
          </p>
        </div>

        <button
          onClick={() => onNavigate('websites')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C96F82] hover:bg-[#A84F65] text-white text-xs font-bold shadow-rose-sm transition-all"
        >
          <span>Run New Audit</span>
        </button>
      </div>

      {/* Progress Chart */}
      <div className="p-6 sm:p-7 rounded-2xl bg-white border border-[#EAEAE4] shadow-card space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#EAEAE4]">
          <div>
            <h3 className="text-base font-bold text-[#292A27]">Accessibility Score Trajectory</h3>
            <p className="text-xs text-[#70716B]">Score progress across historical audit iterations</p>
          </div>
          <span className="text-xs text-[#648568] font-bold bg-[#F2F7F3] px-3 py-1 rounded-full border border-[#E2EDE4]">
            Overall Trend: +12% Improvement
          </span>
        </div>

        <div className="h-48 w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="roseScoreColor" x1="0%" y1="0%" x2="0%" y2="100%">
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
                fill="url(#roseScoreColor)"
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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

      {/* History Table */}
      <div className="p-6 sm:p-7 rounded-2xl bg-white border border-[#EAEAE4] shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-[#EAEAE4] text-xs uppercase tracking-wider text-[#70716B] bg-[#FAFAF8]">
                <th className="py-3 px-4 font-semibold">Website</th>
                <th className="py-3 px-4 font-semibold">Date & Time</th>
                <th className="py-3 px-4 font-semibold">Accessibility Score</th>
                <th className="py-3 px-4 font-semibold">Total Issues</th>
                <th className="py-3 px-4 font-semibold">Changes Since Last Scan</th>
                <th className="py-3 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEAE4]">
              {filteredHistory.map((item) => {
                const isScorePositive = item.changeScore > 0;
                const isScoreNegative = item.changeScore < 0;

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-[#FAFAF8] transition-colors group"
                  >
                    <td className="py-3.5 px-4 font-bold text-[#292A27] flex items-center gap-2">
                      <Globe className="w-4 h-4 text-[#7B8053] flex-shrink-0" />
                      <span className="font-mono text-xs">{item.website}</span>
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
                        {/* Score delta */}
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

                        {/* Issues delta */}
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
  );
};
