import React from 'react';

const GRAD = '#5B3FD6';
const GRAD2 = '#8B5CF6';

interface ProgressBarProps {
  value: number;
  className?: string;
  indicatorClassName?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ value, className = '', indicatorClassName = '' }) => {
  return (
    <div className={`h-1.5 bg-[#EDE9FF] rounded-full overflow-hidden ${className}`}>
      <div
        className={`h-full rounded-full transition-all duration-500 ${indicatorClassName}`}
        style={{ width: `${Math.min(value, 100)}%`, background: `linear-gradient(90deg, ${GRAD}, ${GRAD2})` }}
      />
    </div>
  );
};

export { ProgressBar };
export const Progress = ProgressBar;
