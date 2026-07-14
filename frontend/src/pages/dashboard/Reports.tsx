import React from 'react';
import { toast } from 'sonner';
import { FileText, Clock, CheckSquare, TrendingUp, Activity, Users } from 'lucide-react';

const GRAD = '#5B3FD6';
const GRAD2 = '#8B5CF6';
const CARD_SHADOW = '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(91,63,214,0.07), inset 0 1px 0 rgba(255,255,255,0.95)';
const MESH_BG: React.CSSProperties = {
  background:
    'radial-gradient(ellipse 70% 50% at 15% 5%, rgba(91,63,214,0.07) 0%, transparent 55%),' +
    'radial-gradient(ellipse 50% 40% at 90% 90%, rgba(244,114,182,0.05) 0%, transparent 55%),' +
    '#FCFBFF',
};

const REPORT_METRICS = [
  { label: 'Meetings This Month', value: '24', change: '+3', up: true, icon: FileText, color: GRAD },
  { label: 'Hours Saved', value: '18.4h', change: '+2.1h', up: true, icon: Clock, color: '#8B5CF6' },
  { label: 'Tasks Completed', value: '67', change: '+12', up: true, icon: CheckSquare, color: '#059669' },
  { label: 'Avg Meeting Length', value: '38 min', change: '-4 min', up: true, icon: Activity, color: '#F472B6' },
];

const WEEKLY_MEETINGS = [
  { day: 'Mon', count: 3 },
  { day: 'Tue', count: 5 },
  { day: 'Wed', count: 2 },
  { day: 'Thu', count: 6 },
  { day: 'Fri', count: 4 },
];

const TEAM_ACTIVITY = [
  { team: 'Product', meetings: 9, tasks: 24, completion: 88 },
  { team: 'Engineering', meetings: 7, tasks: 31, completion: 74 },
  { team: 'Design', meetings: 5, tasks: 12, completion: 92 },
  { team: 'Customer', meetings: 3, tasks: 8, completion: 100 },
];

const DashboardReports: React.FC = () => {
  const maxCount = Math.max(...WEEKLY_MEETINGS.map(w => w.count));

  return (
    <div className="flex-1 overflow-y-auto" style={MESH_BG}>
      <div className="max-w-[860px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-7">
          <div>
            <h1 className="text-xl font-bold text-[#1D1B22] tracking-tight">Reports</h1>
            <p className="text-sm font-normal text-[#64607A] mt-1">Analytics and insights from your meeting activity.</p>
          </div>
          <button onClick={() => toast.success('Report generated', { description: 'Your analytics report is ready.' })}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white"
            style={{ background: `linear-gradient(135deg, ${GRAD}, ${GRAD2})`, boxShadow: `0 4px 16px rgba(91,63,214,0.30)` }}>
            <TrendingUp size={13} /> Download Report
          </button>
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {REPORT_METRICS.map(m => (
            <div key={m.label} className="bg-white rounded-2xl p-5 flex items-start gap-4"
              style={{ border: '1px solid rgba(91,63,214,0.10)', boxShadow: CARD_SHADOW }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${m.color}14` }}>
                <m.icon size={18} style={{ color: m.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-widest text-[#64607A] mb-1">{m.label}</p>
                <p className="text-2xl font-bold text-[#1D1B22] tracking-tight">{m.value}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp size={11} style={{ color: m.up ? '#059669' : '#DC2626' }} />
                  <span className="text-[11px] font-semibold" style={{ color: m.up ? '#059669' : '#DC2626' }}>{m.change} vs last month</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-5 gap-4 mb-6">
          {/* Bar chart */}
          <div className="col-span-3 bg-white rounded-2xl p-5"
            style={{ border: '1px solid rgba(91,63,214,0.10)', boxShadow: CARD_SHADOW }}>
            <p className="text-[13px] font-bold text-[#1D1B22] mb-0.5">Meetings This Week</p>
            <p className="text-[11px] text-[#64607A] mb-5">Daily meeting count</p>
            <div className="flex items-end gap-3 h-32">
              {WEEKLY_MEETINGS.map(w => (
                <div key={w.day} className="flex-1 flex flex-col items-center gap-1.5">
                  <span className="text-[11px] font-bold text-[#1D1B22]">{w.count}</span>
                  <div className="w-full rounded-t-lg transition-all"
                    style={{
                      height: `${(w.count / maxCount) * 80}%`,
                      minHeight: 8,
                      background: `linear-gradient(180deg, ${GRAD}, ${GRAD2})`,
                      opacity: 0.85,
                    }} />
                  <span className="text-[11px] text-[#64607A]">{w.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Task completion ring */}
          <div className="col-span-2 bg-white rounded-2xl p-5 flex flex-col justify-between"
            style={{ border: '1px solid rgba(91,63,214,0.10)', boxShadow: CARD_SHADOW }}>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#64607A] mb-3">Task Completion Rate</p>
              <div className="relative flex items-center justify-center h-24">
                <svg width={88} height={88} viewBox="0 0 88 88">
                  <circle cx="44" cy="44" r="36" fill="none" stroke="#EDE9FF" strokeWidth="8" />
                  <circle cx="44" cy="44" r="36" fill="none"
                    stroke={GRAD} strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 36 * 0.82} ${2 * Math.PI * 36}`}
                    transform="rotate(-90 44 44)" />
                  <text x="44" y="49" textAnchor="middle" fontSize="16" fontWeight="700" fill="#1D1B22">82%</text>
                </svg>
              </div>
            </div>
            <div className="space-y-1.5 mt-2">
              {[{ label: 'Completed', val: 67, color: '#059669' }, { label: 'In progress', val: 11, color: GRAD }, { label: 'Overdue', val: 4, color: '#F472B6' }].map(s => (
                <div key={s.label} className="flex items-center justify-between text-[12px]">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                    <span className="text-[#64607A]">{s.label}</span>
                  </div>
                  <span className="font-bold text-[#1D1B22]">{s.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Team breakdown table */}
        <div className="bg-white rounded-2xl overflow-hidden"
          style={{ border: '1px solid rgba(91,63,214,0.10)', boxShadow: CARD_SHADOW }}>
          <div className="px-5 py-4 border-b border-[#F0EDF9]">
            <p className="text-[13px] font-bold text-[#1D1B22]">Team Activity Breakdown</p>
          </div>
          <div className="divide-y divide-[#F0EDF9]">
            {TEAM_ACTIVITY.map(t => (
              <div key={t.team} className="px-5 py-3.5 flex items-center gap-4">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${GRAD}18, ${GRAD2}18)` }}>
                  <Users size={14} style={{ color: GRAD }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-[#1D1B22]">{t.team}</span>
                    <span className="text-xs font-bold text-[#1D1B22]">{t.completion}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#EDE9FF] overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${t.completion}%`, background: `linear-gradient(90deg, ${GRAD}, ${GRAD2})` }} />
                  </div>
                </div>
                <div className="flex items-center gap-4 text-[12px] text-[#64607A] flex-shrink-0">
                  <span><strong className="text-[#1D1B22]">{t.meetings}</strong> meetings</span>
                  <span><strong className="text-[#1D1B22]">{t.tasks}</strong> tasks</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardReports;
