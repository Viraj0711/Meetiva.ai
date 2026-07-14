import React from 'react';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'className'> {
  icon?: React.ElementType;
  className?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  placeholder, type = 'text', value, onChange, onBlur, icon: Icon, className = '',
  id, name, disabled, error, ...rest
}, ref) => {

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
