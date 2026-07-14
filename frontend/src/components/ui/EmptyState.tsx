import React from 'react';

const GRAD = '#4B2E83';

interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  desc: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, desc, action }) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#EDE9FF] flex items-center justify-center mb-5">
        <Icon size={24} style={{ color: GRAD }} />
      </div>
      <div className="font-semibold text-[#1D1B22] mb-2">{title}</div>
      <div className="text-sm font-normal text-[#64607A] max-w-xs leading-relaxed mb-6">{desc}</div>
      {action}
    </div>
  );
};
