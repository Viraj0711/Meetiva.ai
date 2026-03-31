import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const Select = React.forwardRef<HTMLDivElement, SelectProps>(
  ({ options, value, onChange, placeholder = 'Select...', className, disabled = false }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find((opt) => opt.value === value);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionValue: string) => {
      onChange(optionValue);
      setIsOpen(false);
    };

    return (
      <div
        ref={containerRef}
        className={cn('relative w-full', className)}
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
