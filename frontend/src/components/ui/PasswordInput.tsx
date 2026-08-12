import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'className' | 'type'> {
  icon?: React.ElementType;
  className?: string;
  error?: string;
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    { placeholder, value, onChange, onBlur, icon: Icon, className = '', id, name, disabled, error, ...rest },
    ref
  ) => {
    const [visible, setVisible] = useState(false);

    return (
      <div className={`relative ${className}`}>
        {Icon && (
          <Icon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64607A] pointer-events-none" />
        )}
        <input
          id={id}
          name={name}
          ref={ref}
          type={visible ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          disabled={disabled}
          onChange={onChange}
          onBlur={onBlur}
          {...rest}
          className={`w-full bg-white border rounded-2xl py-3 pr-11 text-sm text-[#1D1B22] placeholder-[#64607A] outline-none transition-all duration-150
            ${Icon ? 'pl-10' : 'pl-4'}
            ${error ? 'border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-400/20' : 'border-[#E4E0F5] focus:border-[#5B3FD6]/50 focus:ring-2 focus:ring-[#5B3FD6]/8'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
        <button
          type="button"
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          title={visible ? 'Hide password' : 'Show password'}
          onClick={() => setVisible((v) => !v)}
          disabled={disabled}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-[#64607A] hover:text-[#5B3FD6] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5B3FD6]/30 transition-colors cursor-pointer"
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
        {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';
