import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-semibold transition-all duration-300 ease-out transform-gpu will-change-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(124,92,255,0.28)] disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-[linear-gradient(135deg,var(--accent-hex),var(--accent-2-hex))] text-white shadow-[0_16px_50px_rgba(124,92,255,0.24)] hover:-translate-y-1 hover:shadow-[0_18px_60px_rgba(48,213,246,0.24)]',
        destructive: 'bg-[rgba(220,38,38,0.9)] text-white hover:brightness-95',
        outline: 'bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.09)] text-[var(--muted-hex)] hover:bg-[rgba(255,255,255,0.06)] hover:text-white',
        secondary: 'bg-[rgba(255,255,255,0.05)] text-white/90 hover:bg-[rgba(255,255,255,0.08)]',
        ghost: 'bg-transparent text-[var(--muted-hex)] hover:text-white hover:bg-[rgba(255,255,255,0.04)]',
        link: 'text-[var(--accent-hex)] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-11 px-5 py-3',
        sm: 'h-9 px-3 rounded-full',
        lg: 'h-12 px-8 text-lg',
        icon: 'h-10 w-10 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, disabled, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="mr-2 h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Loading...
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
