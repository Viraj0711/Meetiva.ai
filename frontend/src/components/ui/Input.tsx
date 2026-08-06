import React from 'react';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'className'> {
  icon?: React.ElementType;
  className?: string;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, label, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-2 block text-sm font-medium text-foreground">
            {label}
            {props.required && <span className="ml-1 text-destructive">*</span>}
          </label>
        )}
        <input
          type={type}
          className={cn(
            'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-destructive focus-visible:ring-destructive',
            className
          )}
          ref={ref}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${props.id}-error` : undefined}
          {...props}
        />
        {error && (
          <p id={`${props.id}-error`} className="mt-1 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

  return (
    <div className={`relative ${className}`}>
      {Icon && (
        <Icon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64607A] pointer-events-none" />
      )}
      <input
        id={id}
        name={name}
        ref={ref}
        type={type}
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        onChange={onChange}
        onBlur={onBlur}
        {...rest}
        className={`w-full bg-white border rounded-2xl py-3 pr-4 text-sm text-[#1D1B22] placeholder-[#64607A] outline-none transition-all duration-150
          ${Icon ? 'pl-10' : 'pl-4'}
          ${error ? 'border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-400/20' : 'border-[#E4E0F5] focus:border-[#5B3FD6]/50 focus:ring-2 focus:ring-[#5B3FD6]/8'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      />
      {error && (
        <p className="mt-1 text-xs text-red-400">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
