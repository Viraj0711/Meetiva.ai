import React from 'react';

interface SelectProps {
  value?: string;
  onChange?: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
}

export const Select: React.FC<SelectProps> = ({
  value, onChange, options, placeholder, className = '',
}) => {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full bg-white border border-[#E4E0F5] rounded-2xl py-3 px-4 text-sm text-[#1D1B22] outline-none focus:border-[#5B3FD6]/50 focus:ring-2 focus:ring-[#5B3FD6]/8 transition-all duration-150 appearance-none cursor-pointer"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364607A' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 1rem center',
          backgroundSize: '16px',
        }}
      >
        {/* Select Trigger */}
        <button
          ref={ref as any}
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-[10px]',
            'bg-white border border-[#DDE6F0] text-[#333333]',
            'transition-all duration-200 ease-in-out',
            'focus:outline-none focus:ring-2 focus:ring-[rgba(47,128,237,0.15)] focus:border-[#2F80ED]',
            !disabled && 'hover:bg-[#F2F7FD] hover:border-[#2F80ED] cursor-pointer',
            disabled && 'opacity-50 cursor-not-allowed bg-gray-50',
            isOpen && 'border-[#2F80ED] ring-2 ring-[rgba(47,128,237,0.15)]'
          )}
        >
          <span className={cn('text-sm', !selectedOption && 'text-[#828282]')}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown
            className={cn(
              'h-4 w-4 text-[#828282] transition-transform duration-200',
              isOpen && 'transform rotate-180'
            )}
          />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div
            className={cn(
              'absolute z-50 w-full mt-1 py-1',
              'bg-white border border-[#DDE6F0] rounded-[10px]',
              'shadow-lg max-h-60 overflow-auto',
              'animate-in fade-in-0 zoom-in-95 duration-100'
            )}
          >
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    'w-full flex items-center justify-between gap-2 px-3 py-2',
                    'text-sm text-left transition-all duration-200 ease-in-out',
                    'hover:bg-[#F2F7FD] hover:text-[#2F80ED]',
                    isSelected && 'bg-[#E6F0FA] text-[#2F80ED] font-medium',
                    !isSelected && 'text-[#333333]'
                  )}
                >
                  <span>{option.label}</span>
                  {isSelected && <Check className="h-4 w-4" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export { Select };
