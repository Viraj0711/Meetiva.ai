import React from 'react';

type BadgeColor = 'purple' | 'rose' | 'amber' | 'green' | 'gray';

const colorMap: Record<BadgeColor, string> = {
  purple: 'bg-[#5B3FD6]/10 text-[#5B3FD6]',
  rose: 'bg-[#F472B6]/12 text-[#C4177E]',
  amber: 'bg-[#F4B183]/20 text-[#9A6130]',
  green: 'bg-emerald-50 text-emerald-700',
  gray: 'bg-[#EDE9FF] text-[#64607A]',
};

interface BadgeProps {
  children: React.ReactNode;
  color?: BadgeColor;
  variant?: string;
  className?: string;
}

const statusColorMap: Record<string, BadgeColor> = {
  completed: 'green',
  'in-progress': 'purple',
  pending: 'amber',
  cancelled: 'gray',
  live: 'green',
  high: 'rose',
  medium: 'amber',
  low: 'gray',
};

export const Badge: React.FC<BadgeProps> = ({ children, color, variant, className = '' }) => {
  const resolved = color || (variant ? (statusColorMap[variant] || 'purple') : 'purple');
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide ${colorMap[resolved]} ${className}`}>
      {children}
    </span>
  );
};

type StatusType = 'completed' | 'in-progress' | 'pending' | 'live';

const statusMap: Record<StatusType, { label: string; cls: string }> = {
  completed: { label: 'Completed', cls: 'bg-emerald-50 text-emerald-700' },
  'in-progress': { label: 'In Progress', cls: 'bg-[#5B3FD6]/10 text-[#5B3FD6]' },
  pending: { label: 'Pending', cls: 'bg-[#EDE9FF] text-[#64607A]' },
  live: { label: '● Live', cls: 'bg-emerald-50 text-emerald-600' },
};

export const StatusBadge: React.FC<{ status: StatusType }> = ({ status }) => {
  const map = statusMap[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${map.cls}`}>
      {map.label}
    </span>
  );
};
