import React from 'react';
import {
  Sparkles,
  Users,
  EyeOff,
  Keyboard,
  Sun,
  Brain,
  ArrowRight,
  Target
} from 'lucide-react';
import { PageId, UserImpactCategory } from '../../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface AIInsightsPageProps {
  onNavigate: (page: PageId) => void;
  userImpacts: UserImpactCategory[];
}

export const AIInsightsPage: React.FC<AIInsightsPageProps> = ({
  onNavigate,
  userImpacts
}) => {
  // Common root-cause patterns analyzed by NETRA (Powered by AccessAI)
  const commonProblems = [
    {
      title: 'Missing Image Text Alternatives',
      percentage: 34,
      count: '8 elements',
      rootCause: 'CMS media upload workflows omit required alt attribute inputs.',
      impactLevel: 'Critical'
    },
    {
      title: 'Insufficient Brand Typography Contrast',
      percentage: 28,
      count: '14 elements',
      rootCause: 'Low contrast design token used on promotional banner backgrounds (<4.5:1 ratio).',
      impactLevel: 'Serious'
    },
    {
      title: 'Unlabeled Form Controls & Search Trigger',
      percentage: 22,
      count: '6 elements',
      rootCause: 'Icon-only buttons missing aria-label or accessible text fallback.',
      impactLevel: 'Serious'
    },
    {
      title: 'Non-Semantic Interactive Divs',
      percentage: 16,
      count: '4 elements',
      rootCause: 'Drop-down menus authored using <div> instead of <button> or ARIA combobox.',
      impactLevel: 'Critical'
    }
  ];

  // Improvement opportunities roadmap
  const improvementMilestones = [
    {
      phase: 'Phase 1: Quick Fixes (Sprint 1)',
      scoreGain: '+14 pts',
      targetScore: '90/100',
      description: 'Inject alt text across 8 hero assets and apply contrast token fixes to buttons.',
      status: 'Ready to deploy',
      actionPage: 'fixes' as PageId
    },
    {
      phase: 'Phase 2: Form & Input Labels',
      scoreGain: '+5 pts',
      targetScore: '95/100',
      description: 'Bind explicit label elements and aria-labelledby on checkout & newsletter forms.',
      status: 'In progress',
      actionPage: 'results' as PageId
    },
    {
      phase: 'Phase 3: Keyboard Traps & Focus Rings',
      scoreGain: '+5 pts',
      targetScore: '100/100',
      description: 'Standardize focus rings and replace 4 custom interactive divs with native semantic buttons.',
      status: 'Pending review',
      actionPage: 'fixes' as PageId
    }
  ];

  const userImpactChartData = userImpacts.map((u) => ({
    name: u.group.split(' ')[0],
    fullName: u.group,
    count: u.barrierCount,
    severity: u.severityLevel
  }));

  const iconMap: Record<string, React.ElementType> = {
    EyeOff: EyeOff,
    Keyboard: Keyboard,
    Sun: Sun,
    Brain: Brain
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Banner */}
      <section className="p-6 sm:p-7 rounded-2xl bg-white border border-[#EAEAE4] shadow-card relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#C96F82] via-[#EEF0E3] to-[#7B8053]" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1 rounded-md bg-[#FFF5F6] text-[#C96F82] border border-[#F8E9ED]">
                <Sparkles className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-[#A84F65]">
                AI Synthesis & Intelligence
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#292A27] tracking-tight">
              AI Insights & User Impact
            </h1>
            <p className="text-sm text-[#70716B] mt-2 max-w-2xl leading-relaxed">
              Synthesized analysis highlighting root cause patterns, human assistive user impact, and a clear roadmap to 90+ accessibility compliance.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-4 rounded-xl bg-[#FFF5F6] border border-[#F8E9ED] text-center shadow-card">
              <span className="text-xs font-semibold text-[#70716B] block">Projected Uplift</span>
              <span className="text-2xl font-extrabold text-[#A84F65]">
                +24 Points
              </span>
              <span className="text-[10px] text-[#7B8053] font-bold block">76 → 100 Potential</span>
            </div>
          </div>
        </div>
      </section>

      {/* Section 1: Potential User Impact Breakdown */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-[#292A27] flex items-center gap-2">
              <Users className="w-5 h-5 text-[#C96F82]" />
              Potential Human User Impact
            </h3>
            <p className="text-xs text-[#70716B]">
              How current WCAG non-compliance barriers specifically restrict real users with varying abilities
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                    {impact.barrierCount} barriers affecting this group
                  </div>

                  <p className="text-xs text-[#70716B] mt-2.5 leading-relaxed">
                    {impact.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#EAEAE4] flex items-center justify-between text-[11px] text-[#70716B]">
                  <span>Priority Remediation</span>
                  <button
                    onClick={() => onNavigate('results')}
                    className="text-[#A84F65] hover:text-[#C96F82] font-bold flex items-center gap-1"
                  >
                    <span>View list</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 2: Most Common Accessibility Problems */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 p-6 sm:p-7 rounded-2xl bg-white border border-[#EAEAE4] shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#EAEAE4]">
            <div>
              <h3 className="text-base font-bold text-[#292A27]">Most Common Accessibility Patterns</h3>
              <p className="text-xs text-[#70716B]">
                Systemic patterns causing repeated failures across pages
              </p>
            </div>
            <span className="text-xs text-[#7B8053] font-bold bg-[#F6F7F0] px-2.5 py-0.5 rounded-full border border-[#EEF0E3]">
              4 Primary Causes
            </span>
          </div>

          <div className="space-y-4">
            {commonProblems.map((prob) => (
              <div
                key={prob.title}
                className="p-4 rounded-xl bg-[#FAFAF8] border border-[#EAEAE4] space-y-2 hover:border-[#C96F82] transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#292A27]">{prob.title}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white text-[#70716B] border border-[#EAEAE4] font-semibold">
                      {prob.count}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-[#A84F65]">
                    {prob.percentage}% of issues
                  </span>
                </div>

                {/* Progress bar in Rose & Olive */}
                <div className="w-full h-1.5 bg-[#F0EDE9] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#C96F82] to-[#7B8053] rounded-full"
                    style={{ width: `${prob.percentage}%` }}
                  />
                </div>

                <p className="text-xs text-[#70716B]">
                  <strong className="text-[#292A27]">Root Cause:</strong> {prob.rootCause}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* User Group Barrier Chart */}
        <div className="lg:col-span-5 p-6 sm:p-7 rounded-2xl bg-white border border-[#EAEAE4] shadow-card flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-[#EAEAE4]">
              <h3 className="text-base font-bold text-[#292A27]">Barriers By User Ability</h3>
              <p className="text-xs text-[#70716B]">Count of blockers by user group</p>
            </div>

            <div className="h-56 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={userImpactChartData} margin={{ top: 10, right: 10, left: -15, bottom: 20 }}>
                  <XAxis dataKey="name" stroke="#999A92" fontSize={11} angle={-15} textAnchor="end" />
                  <YAxis stroke="#999A92" fontSize={11} />
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
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={32}>
                    {userImpactChartData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={['#C96F82', '#7B8053', '#A84F65', '#648568'][index % 4]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F6F7F0] border border-[#EEF0E3] text-xs text-[#62683F] leading-relaxed">
            <span className="font-bold text-[#292A27]">AI Observation:</span> Resolving screen reader & keyboard navigation items eliminates over 62% of critical user blockers.
          </div>
        </div>
      </section>

      {/* Section 3: Improvement Opportunities & Uplift Roadmap */}
      <section className="p-6 sm:p-7 rounded-2xl bg-white border border-[#EAEAE4] shadow-card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#EAEAE4]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#F6F7F0] text-[#7B8053] border border-[#EEF0E3]">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#292A27]">Accessibility Improvement Roadmap</h3>
              <p className="text-xs text-[#70716B]">
                Sequenced implementation strategy to elevate your compliance from 76 to 100
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {improvementMilestones.map((milestone, idx) => (
            <div
              key={milestone.phase}
              className="p-5 rounded-2xl bg-[#FAFAF8] border border-[#EAEAE4] hover:border-[#C96F82] transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between text-xs font-bold mb-2">
                  <span className="text-[#A84F65]">Step {idx + 1}</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#F2F7F3] text-[#648568] border border-[#E2EDE4] font-extrabold">
                    {milestone.scoreGain}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-[#292A27]">{milestone.phase}</h4>
                <div className="text-xs text-[#70716B] mt-0.5">
                  Milestone Target: <strong className="text-[#A84F65]">{milestone.targetScore}</strong>
                </div>

                <p className="text-xs text-[#70716B] mt-2.5 leading-relaxed">
                  {milestone.description}
                </p>
              </div>

              <div className="pt-3 border-t border-[#EAEAE4] flex items-center justify-between">
                <span className="text-[11px] text-[#70716B] font-mono font-medium">{milestone.status}</span>
                <button
                  onClick={() => onNavigate(milestone.actionPage)}
                  className="inline-flex items-center gap-1 text-xs text-[#A84F65] hover:text-[#C96F82] font-bold"
                >
                  <span>Execute Fixes</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
