import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  label?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, label, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-2 block text-sm font-medium text-[var(--muted-hex)]">
            {label}
            {props.required && <span className="ml-1 text-[var(--gold-hex)]">*</span>}
          </label>
        )}
        <textarea
          className={cn(
            'flex min-h-[100px] w-full rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] px-3 py-3 text-sm placeholder:text-[rgba(184,194,207,0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(124,92,255,0.12)] disabled:cursor-not-allowed disabled:opacity-50',
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
Textarea.displayName = 'Textarea';

export { Textarea };
