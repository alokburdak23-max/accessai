import React from 'react';
import { Severity } from '../../types';

interface SeverityBadgeProps {
  severity: Severity;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({
  severity,
  size = 'md',
  showDot = true,
}) => {
  const config = {
    critical: {
      label: 'Critical',
      bg: 'bg-[#FFF5F6] border-[#F8E9ED] text-[#C94F55]',
      dot: 'bg-[#C94F55]'
    },
    serious: {
      label: 'Serious',
      bg: 'bg-[#FFF8F2] border-[#FDEEE2] text-[#D88A4C]',
      dot: 'bg-[#D88A4C]'
    },
    moderate: {
      label: 'Moderate',
      bg: 'bg-[#FEFBF2] border-[#FDF6E3] text-[#C5A64D]',
      dot: 'bg-[#C5A64D]'
    },
    minor: {
      label: 'Minor',
      bg: 'bg-[#F6F7F0] border-[#EEF0E3] text-[#7B8053]',
      dot: 'bg-[#7B8053]'
    }
  }[severity];

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-semibold',
    lg: 'text-sm px-3 py-1.5 font-semibold'
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${config.bg} ${sizeClasses}`}
    >
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      )}
      <span className="capitalize">{config.label}</span>
    </span>
  );
};
