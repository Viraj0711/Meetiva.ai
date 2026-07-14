import React from 'react';

const GRAD = '#4B2E83';
const GRAD2 = '#8B5CF6';

type Size = 'sm' | 'md' | 'lg';

const sizeMap: Record<Size, string> = {
  sm: 'px-4 py-2.5 text-xs',
  md: 'px-6 py-3 text-sm',
  lg: 'px-8 py-4 text-base',
};

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  size?: Size;
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  type?: 'button' | 'submit';
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children, onClick, size = 'md', className = '', variant = 'primary', type = 'button', disabled,
}) => {
  if (variant === 'secondary') {
    return (
      <button
        type={type}
        disabled={disabled}
        onClick={onClick}
        className={`inline-flex items-center gap-2 rounded-2xl font-semibold bg-white border border-[#E4E0F5] transition-all duration-150 hover:border-[#B8ACEC] active:scale-[0.985] cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed ${sizeMap[size]} ${className}`}
        style={{ color: GRAD }}
        onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLElement).style.background = '#EDE9FF'; }}
        onMouseLeave={e => { if (!disabled) (e.currentTarget as HTMLElement).style.background = 'white'; }}
      >
        {children}
      </button>
    );
  }

  if (variant === 'ghost') {
    return (
      <button
        type={type}
        disabled={disabled}
        onClick={onClick}
        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-[#64607A] transition-all duration-150 hover:text-[#1D1B22] active:scale-[0.985] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLElement).style.background = '#EDE9FF'; }}
        onMouseLeave={e => { if (!disabled) (e.currentTarget as HTMLElement).style.background = ''; }}
      >
        {children}
      </button>
    );
  }

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-2xl font-bold text-white transition-all duration-150 hover:opacity-90 hover:scale-[1.015] active:scale-[0.985] cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed ${sizeMap[size]} ${className}`}
      style={{ background: `linear-gradient(135deg, ${GRAD}, ${GRAD2})`, boxShadow: `0 4px 16px rgba(91,63,214,0.35)` }}
    >
      {children}
    </button>
  );
};
