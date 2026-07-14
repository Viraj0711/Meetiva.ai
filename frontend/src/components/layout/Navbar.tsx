import React from 'react';
import { Search, Bell } from 'lucide-react';
import { toast } from 'sonner';

const TopBar: React.FC = () => {
  return (
    <div className="h-14 flex-shrink-0 border-b border-[#E4E0F5] px-6 flex items-center justify-between"
      style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)', boxShadow: '0 1px 0 rgba(91,63,214,0.04)' }}>
      {/* Pulsing status pill */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#E4E0F5] bg-white"
        style={{ boxShadow: '0 1px 4px rgba(91,63,214,0.06)' }}>
        <span className="relative w-2 h-2 flex-shrink-0">
          <span className="absolute inset-0 rounded-full" style={{ background: '#F472B6', animation: 'pulse-ring 1.8s ease-out infinite' }} />
          <span className="relative block w-2 h-2 rounded-full" style={{ background: '#F472B6' }} />
        </span>
        <span className="text-xs font-semibold text-[#64607A]">Live workspace pulse</span>
      </div>

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

        {/* Bell */}
        <button
          onClick={() => toast.info('No new notifications', { description: "You're all caught up." })}
          className="relative w-8 h-8 rounded-xl flex items-center justify-center hover:bg-[#FCFBFF] transition-colors border border-[#E4E0F5]"
        >
          <Bell size={15} className="text-[#64607A]" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#F472B6]" />
        </button>
      </div>
    </div>
  );
};

export default TopBar;
