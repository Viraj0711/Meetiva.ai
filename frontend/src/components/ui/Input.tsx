import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, label, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-2 block text-sm font-medium text-[var(--muted-hex)]">
            {label}
            {props.required && <span className="ml-1 text-[var(--gold-hex)]">*</span>}
          </label>
        )}
        <input
          type={type}
          className={cn(
            'flex h-12 w-full rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] px-3 py-2 text-sm placeholder:text-[rgba(184,194,207,0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(124,92,255,0.18)] focus-visible:translate-y-0.5 transition-shadow disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-[rgba(220,38,38,0.9)] focus-visible:ring-[rgba(220,38,38,0.12)]',
            className
          )}
          ref={ref}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${props.id}-error` : undefined}
          {...props}
        />
        {error && (
          <p id={`${props.id}-error`} className="mt-1 text-sm text-[rgba(220,38,38,0.9)]" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
