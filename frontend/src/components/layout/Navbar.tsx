import React from 'react';
import { Search } from 'lucide-react';

const TopBar: React.FC = () => {
  return (
    <div className="h-14 flex-shrink-0 border-b border-[#E4E0F5] px-6 flex items-center justify-between"
      style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)', boxShadow: '0 1px 0 rgba(91,63,214,0.04)' }}>
      <div />

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative w-64">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64607A] pointer-events-none" />
          <input
            placeholder="Search meetings, summaries, tasks…"
            className="w-full bg-[#FCFBFF] border border-[#E4E0F5] rounded-xl py-2 pl-8 pr-4
              text-xs text-[#1D1B22] placeholder-[#64607A] outline-none
              focus:border-[#5B3FD6]/40 focus:ring-2 focus:ring-[#5B3FD6]/6 transition-all"
          />
        </div>
      </div>
    </div>
  );
};

export default TopBar;
