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
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className={cn(
            'w-full flex items-center justify-between gap-2 px-3 py-3 rounded-xl',
            'bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] text-[var(--muted-hex)]',
            'transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[rgba(124,92,255,0.12)]',
            !disabled && 'hover:bg-[rgba(255,255,255,0.03)] cursor-pointer',
            disabled && 'opacity-50 cursor-not-allowed',
            isOpen && 'ring-2 ring-[rgba(124,92,255,0.12)]'
          )}
        >
          <span className={cn('text-sm', !selectedOption && 'text-[rgba(184,194,207,0.6)]')}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown
            className={cn(
              'h-4 w-4 text-[var(--muted-hex)] transition-transform duration-200',
              isOpen && 'transform rotate-180'
            )}
          />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div
            role="listbox"
            className={cn(
              'absolute z-50 w-full mt-2 py-2',
              'bg-[rgba(15,23,32,0.95)] border border-[rgba(255,255,255,0.04)] rounded-xl',
              'shadow-[0_20px_60px_rgba(2,6,23,0.6)] max-h-60 overflow-auto',
              'animate-in fade-in-0 zoom-in-95 duration-150'
            )}
          >
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    'w-full flex items-center justify-between gap-2 px-4 py-2',
                    'text-sm text-left transition-all duration-150 ease-in-out',
                    'hover:bg-[rgba(255,255,255,0.02)] hover:text-white',
                    isSelected ? 'bg-[rgba(124,92,255,0.12)] text-white font-medium' : 'text-[var(--muted-hex)]'
                  )}
                >
                  <span>{option.label}</span>
                  {isSelected && <Check className="h-4 w-4 text-white" />}
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


