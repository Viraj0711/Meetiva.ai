import React from 'react';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-gradient-primary text-primary-foreground hover:opacity-90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400',
        link: 'text-primary underline-offset-4 hover:underline',
        accent: 'bg-gradient-accent text-white hover:opacity-90',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

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
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'default' | 'destructive';
  type?: 'button' | 'submit';
  disabled?: boolean;
  isLoading?: boolean;
  title?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children, onClick, size = 'md', className = '', variant = 'primary', type = 'button', disabled, isLoading, title,
}) => {
  const content = (
    <>
      {isLoading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      )}
      {children}
    </>
  );

  const common = 'inline-flex items-center gap-2 font-bold transition-all duration-150 cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl';

  if (variant === 'destructive') {
    return (
      <button
        type={type}
        disabled={disabled || isLoading}
        onClick={isLoading ? undefined : onClick}
        title={title}
        className={`${common} bg-[rgba(220,38,38,0.9)] text-white hover:opacity-90 active:scale-[0.985] ${sizeMap[size]} ${className}`}
      >
        {content}
      </button>
    );
  }

  if (variant === 'secondary') {
    return (
      <button
        type={type}
        disabled={disabled || isLoading}
        onClick={isLoading ? undefined : onClick}
        title={title}
        className={`${common} bg-white border border-[#E4E0F5] hover:border-[#B8ACEC] active:scale-[0.985] ${sizeMap[size]} ${className}`}
        style={{ color: GRAD }}
        onMouseEnter={e => { if (!disabled && !isLoading) (e.currentTarget as HTMLElement).style.background = '#EDE9FF'; }}
        onMouseLeave={e => { if (!disabled && !isLoading) (e.currentTarget as HTMLElement).style.background = 'white'; }}
      >
        {content}
      </button>
    );
  }

  if (variant === 'ghost') {
    return (
      <button
        type={type}
        disabled={disabled || isLoading}
        onClick={isLoading ? undefined : onClick}
        title={title}
        className={`${common} px-4 py-2.5 rounded-xl text-sm font-medium text-[#64607A] hover:text-[#1D1B22] active:scale-[0.985] ${className}`}
        onMouseEnter={e => { if (!disabled && !isLoading) (e.currentTarget as HTMLElement).style.background = '#EDE9FF'; }}
        onMouseLeave={e => { if (!disabled && !isLoading) (e.currentTarget as HTMLElement).style.background = ''; }}
      >
        {content}
      </button>
    );
  }

  if (variant === 'outline') {
    return (
      <button
        type={type}
        disabled={disabled || isLoading}
        onClick={isLoading ? undefined : onClick}
        title={title}
        className={`${common} bg-white border-2 border-[#5B3FD6] text-[#5B3FD6] hover:bg-[#5B3FD6] hover:text-white active:scale-[0.985] ${sizeMap[size]} ${className}`}
      >
        {content}
      </button>
    );
  }

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={isLoading ? undefined : onClick}
      title={title}
      className={`${common} text-white hover:opacity-90 hover:scale-[1.015] active:scale-[0.985] ${sizeMap[size]} ${className}`}
      style={{ background: `linear-gradient(135deg, ${GRAD}, ${GRAD2})`, boxShadow: `0 4px 16px rgba(91,63,214,0.35)` }}
    >
      {content}
    </button>
  );
};
