import React from 'react';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive: 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'text-foreground',
        success: 'border-transparent bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
        warning: 'border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
        info: 'border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

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
