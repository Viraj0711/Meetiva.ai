import React from 'react';

interface TextareaProps {
  placeholder?: string;
  value?: string;
  onChange?: (v: string) => void;
  rows?: number;
  className?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  placeholder, value, onChange, rows = 3, className = '',
}) => {
  return (
    <textarea
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      rows={rows}
      className={`w-full bg-white border border-[#E4E0F5] rounded-2xl py-3 px-4 text-sm text-[#1D1B22] placeholder-[#64607A] outline-none focus:border-[#5B3FD6]/50 focus:ring-2 focus:ring-[#5B3FD6]/8 transition-all duration-150 resize-none ${className}`}
    />
  );
};
