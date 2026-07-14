import React from 'react';

interface InputProps {
  placeholder?: string;
  type?: string;
  value?: string;
  onChange?: (v: string) => void;
  icon?: React.ElementType;
  className?: string;
}

export const Input: React.FC<InputProps> = ({
  placeholder, type = 'text', value, onChange, icon: Icon, className = '',
}) => {
  return (
    <div className={`relative ${className}`}>
      {Icon && (
        <Icon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64607A] pointer-events-none" />
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className={`w-full bg-white border border-[#E4E0F5] rounded-2xl py-3 pr-4
          ${Icon ? 'pl-10' : 'pl-4'} text-sm text-[#1D1B22] placeholder-[#64607A]
          outline-none focus:border-[#5B3FD6]/50 focus:ring-2 focus:ring-[#5B3FD6]/8
          transition-all duration-150`}
      />
    </div>
  );
};
