import React from 'react';

interface TabsProps {
  tabs: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, active, onChange }) => {
  return (
    <div className="inline-flex items-center bg-[#EDE9FF] rounded-2xl p-1 gap-0.5">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
            active === t.id
              ? 'bg-white text-[#1D1B22] shadow-sm'
              : 'text-[#64607A] hover:text-[#1D1B22]'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
};
