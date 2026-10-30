import React from 'react';
import { AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';

interface ScoreGaugeProps {
  score: number;
  maxScore?: number;
  size?: number;
  strokeWidth?: number;
  showExplanation?: boolean;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({
  score,
  maxScore = 100,
  size = 190,
  strokeWidth = 12,
  showExplanation = true
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(score / maxScore, 0), 1);
  const strokeDashoffset = circumference - progress * circumference;

  let statusLabel = 'Needs Improvement';
  let statusBadgeClass = 'text-[#D88A4C] bg-[#FFF8F2] border-[#FDEEE2]';
  let gradientStart = '#C96F82'; // Rose
  let gradientEnd = '#7B8053';   // Olive
  let StatusIcon = AlertTriangle;

  if (score >= 90) {
    statusLabel = 'Optimal Accessibility';
    statusBadgeClass = 'text-[#648568] bg-[#F2F7F3] border-[#E2EDE4]';
    gradientStart = '#7B8053';
    gradientEnd = '#648568';
    StatusIcon = CheckCircle2;
  } else if (score >= 70) {
    statusLabel = 'Needs Improvement';
    statusBadgeClass = 'text-[#C96F82] bg-[#FFF5F6] border-[#F8E9ED]';
    gradientStart = '#C96F82';
    gradientEnd = '#7B8053';
    StatusIcon = AlertTriangle;
  } else {
    statusLabel = 'High Barrier Risk';
    statusBadgeClass = 'text-[#C94F55] bg-[#FFF5F6] border-[#F8E9ED]';
    gradientStart = '#C94F55';
    gradientEnd = '#C96F82';
    StatusIcon = AlertCircle;
  }

  return (
    <div className="flex flex-col md:flex-row items-center gap-6 p-6 sm:p-7 rounded-2xl bg-white border border-[#EAEAE4] shadow-card">
      {/* Circular Gauge */}
      <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
        <svg
          className="transform -rotate-90 origin-center"
          width={size}
          height={size}
        >
          <defs>
            <linearGradient id="roseOliveScoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={gradientStart} />
              <stop offset="100%" stopColor={gradientEnd} />
            </linearGradient>
          </defs>
          {/* Subtle Background Ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#F0EDE9"
            strokeWidth={strokeWidth}
          />
          {/* Active Gradient Ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="url(#roseOliveScoreGradient)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center score readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-4xl font-extrabold text-[#292A27] tracking-tight">
            {score}
          </span>
          <span className="text-xs font-semibold text-[#70716B] uppercase tracking-wider mt-0.5">
            / {maxScore}
          </span>
          <span className="text-[11px] text-[#A84F65] font-mono mt-0.5 font-medium">WCAG 2.1 AA</span>
        </div>
      </div>

      {/* Details & Explanation */}
      <div className="flex-1 text-center md:text-left space-y-3">
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
          <span className="text-xs font-semibold text-[#70716B] uppercase tracking-wider">
            Overall Accessibility Score
          </span>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusBadgeClass}`}>
            <StatusIcon className="w-3.5 h-3.5" />
            {statusLabel}
          </span>
        </div>

        <h3 className="text-xl sm:text-2xl font-bold text-[#292A27]">
          Score: <span className="text-[#A84F65]">{score}/{maxScore}</span>
        </h3>

        {showExplanation && (
          <p className="text-sm text-[#70716B] leading-relaxed max-w-xl">
            Your website has accessibility barriers that may affect users with different abilities. Resolving critical contrast and keyboard traps will quickly bring your site into the 90+ compliant range.
          </p>
        )}

        <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-[#70716B]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#648568]"></span>
            <span>90–100: Optimal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#C96F82]"></span>
            <span>70–89: Needs Improvement</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#C94F55]"></span>
            <span>&lt;70: Critical Barriers</span>
          </div>
        </div>
      </div>
    </div>
  );
};
