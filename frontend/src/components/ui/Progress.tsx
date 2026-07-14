import React from 'react';

const GRAD = '#4B2E83';
const GRAD2 = '#8B5CF6';

interface ProgressBarProps {
  value: number;
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ value, className = '' }) => {
  return (
    <div className={`h-1.5 bg-[#EDE9FF] rounded-full overflow-hidden ${className}`}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(value, 100)}%`, background: `linear-gradient(90deg, ${GRAD}, ${GRAD2})` }}
      />
    </div>
  );
};

export { ProgressBar };
export const Progress = ProgressBar;
