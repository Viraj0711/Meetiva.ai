import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', className }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className={cn('flex items-center justify-center', className)} role="status" aria-label="Loading">
      <div className={cn('flex items-center justify-center rounded-full p-1 bg-[rgba(255,255,255,0.02)]')}> 
        <Loader2 className={cn('animate-spin text-[var(--accent-hex)]', sizeClasses[size])} />
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default LoadingSpinner;
