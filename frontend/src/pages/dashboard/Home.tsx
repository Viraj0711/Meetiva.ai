import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Check, Clock, Calendar, Upload } from 'lucide-react';
import { Task, Meeting } from '@/types';
import { useSubscription } from '@/hooks/useAuth';
import { useMeetings, useMeetingStats, useTasks } from '@/hooks/useMeetings';


const GRAD = '#5B3FD6';
const GRAD2 = '#8B5CF6';
const CARD_SHADOW = '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(91,63,214,0.07), inset 0 1px 0 rgba(255,255,255,0.95)';
const DOT_GRID: React.CSSProperties = {
  backgroundImage: 'radial-gradient(circle, rgba(91,63,214,0.08) 1.5px, transparent 1.5px)',
  backgroundSize: '26px 26px',
};
const BLOB_LAVENDER = 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 68%)';
const BLOB_ROSE = 'radial-gradient(circle, rgba(244,114,182,0.09) 0%, transparent 68%)';
const MESH_BG: React.CSSProperties = {
  background:
    'radial-gradient(ellipse 70% 50% at 15% 5%, rgba(91,63,214,0.07) 0%, transparent 55%),' +
    'radial-gradient(ellipse 50% 40% at 90% 90%, rgba(244,114,182,0.05) 0%, transparent 55%),' +
    '#FCFBFF',
};

// Build last-7-days chart data from meetings array
const buildWeekData = (meetings: Meeting[]) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const next = new Date(d); next.setDate(d.getDate() + 1);
    const dayMeetings = meetings.filter(m => {
      const t = new Date(m.createdAt);
      return t >= d && t < next;
    });
    result.push({
      day: days[d.getDay()],
      meetings: dayMeetings.length,
      mins: Math.round(dayMeetings.reduce((s, m) => s + (m.duration || 0), 0) / 60),
    });
  }
  return result;
};

type WeekDay = { day: string; meetings: number; mins: number };

function MiniBarChart({ data, metric }: { data: WeekDay[]; metric: 'meetings' | 'mins' }) {
  const [hovered, setHovered] = React.useState<number | null>(null);
  const values = data.map((d) => d[metric]);
  const max = Math.max(...values, 1);

  return (
    <div className="relative w-full" style={{ height: 150 }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${data.length * 48} 150`} preserveAspectRatio="none">
        {[0, 25, 50, 75, 100].map((pct) => (
          <line key={pct} x1={28} x2={data.length * 48}
            y1={10 + (1 - pct / 100) * 110} y2={10 + (1 - pct / 100) * 110}
            stroke="#EDE9FF" strokeWidth={1}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex items-end gap-1 px-7 pb-6 pt-2">
        {data.map((d, i) => {
          const val = d[metric];
          const pct = max > 0 ? val / max : 0;
          return (
            <div key={d.day} className="flex-1 flex flex-col items-center justify-end gap-1 cursor-default"
              onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}
            >
              {hovered === i && (
                <div className="absolute -translate-y-full mb-1 z-10 px-2 py-1 rounded-lg text-[11px] font-semibold text-[#1D1B22] bg-white border border-[#E4E0F5] whitespace-nowrap pointer-events-none"
                  style={{ boxShadow: '0 2px 8px rgba(91,63,214,0.12)' }}>
                  {val} {metric}
                </div>
              )}
              <div className="w-full rounded-t-md transition-all duration-150"
                style={{
                  height: `${Math.max(pct * 100, pct > 0 ? 6 : 2)}%`,
                  background: hovered === i ? '#4C35B8' : `linear-gradient(180deg, ${GRAD2}, ${GRAD})`,
                  opacity: hovered !== null && hovered !== i ? 0.5 : 1,
                  minHeight: val > 0 ? 4 : 2,
                }}
              />
              <span className="text-[10px] text-[#64607A] select-none">{d.day}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Tabs({ tabs, active, onChange }: { tabs: { id: string; label: string }[]; active: string; onChange: (id: string) => void }) {
  return (
    <div className="inline-flex items-center bg-[#EDE9FF] rounded-2xl p-1 gap-0.5">
      {tabs.map((t) => (
        <button key={t.id} onClick={() => onChange(t.id)}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${active === t.id ? 'bg-white text-[#1D1B22] shadow-sm' : 'text-[#64607A] hover:text-[#1D1B22]'}`}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

const DashboardHome: React.FC = () => {
  const navigate = useNavigate();
  const [chartMetric, setChartMetric] = useState<'meetings' | 'mins'>('meetings');
  const { data: subscription } = useSubscription();
  const { data: meetingStats, isLoading: statsLoading } = useMeetingStats();
  const { data: meetingsData } = useMeetings({ page: 1, limit: 50 });
  const { data: tasksData } = useTasks({ page: 1, limit: 100 });

  const loading = statsLoading;
  const meetings: Meeting[] = meetingsData?.data || [];
  const allTasks: Task[] = tasksData?.data || [];
  const completedActions = allTasks.filter((item: Task) => item.status === 'completed').length;
  const totalTasks = allTasks.length;
  const processingMeetings = meetingStats?.processingMeetings || 0;
  const avgDuration = meetingStats?.avgDuration || meetingStats?.averageDuration || 0;
  const totalMeetings = meetingStats?.totalMeetings || meetingStats?.total || 0;
  const weekData = useMemo(() => buildWeekData(meetings), [meetings]);

  const metricTiles = [
    { l: 'Total meetings',  v: String(totalMeetings), sub: totalMeetings > 0 ? `${totalMeetings} total in workspace` : 'No meetings yet', icon: FileText, accent: GRAD, glow: 'rgba(91,63,214,0.12)' },
    { l: 'Completed tasks', v: String(completedActions), sub: totalTasks > 0 ? `${completedActions}/${totalTasks} tasks done` : 'No tasks yet', icon: Check, accent: '#059669', glow: 'rgba(5,150,105,0.10)' },
    { l: 'Avg. duration',   v: avgDuration ? `${Math.round(avgDuration)}m` : '0m', sub: totalMeetings > 0 ? `Across ${totalMeetings} meetings` : 'No duration data', icon: Clock, accent: '#F472B6', glow: 'rgba(244,114,182,0.12)' },
    { l: 'Processing',      v: String(processingMeetings), sub: processingMeetings > 0 ? 'Meetings in queue' : 'All caught up', icon: Calendar, accent: '#9A6130', glow: 'rgba(244,177,131,0.15)' },
  ];

  return (
    <div className="flex-1 overflow-y-auto" style={MESH_BG}>
      <div className="max-w-5xl mx-auto p-7 space-y-5">
        {/* Hero card */}
        <div className="relative rounded-3xl overflow-hidden bg-white border border-[#E4E0F5]"
          style={{ boxShadow: CARD_SHADOW }}>
          <div className="h-[3px] w-full" style={{ background: 'linear-gradient(90deg, #5B3FD6 0%, #8B5CF6 50%, #F472B6 100%)' }} />
          <div className="absolute inset-0 pointer-events-none" style={{ ...DOT_GRID, opacity: 0.3 }} />
          <div className="absolute -top-16 right-0 w-[380px] h-[380px] pointer-events-none" style={{ background: BLOB_LAVENDER }} />
          <div className="absolute bottom-0 -left-12 w-[260px] h-[260px] pointer-events-none" style={{ background: BLOB_ROSE }} />

          <div className="relative grid grid-cols-1 lg:grid-cols-3">
            <div className="lg:col-span-2 p-8 border-b lg:border-b-0 lg:border-r border-[#E4E0F5]">
              <div className="text-[10px] font-bold uppercase tracking-[0.12em] mb-4 text-[#64607A]">
                Intelligent command center
              </div>
              <h1 className="text-[26px] font-bold text-[#1D1B22] leading-tight tracking-[-0.02em] mb-2">
                Your meeting intelligence<br />is alive.
              </h1>
              <p className="text-sm font-normal text-[#64607A] leading-relaxed mb-7 max-w-sm">
                Track summaries, tasks, and calendar sync in a workspace designed to feel edited, not assembled.
              </p>

              <div className="flex items-center gap-8 mb-7 pb-7 border-b border-[#E4E0F5]">
                {[
                  { l: 'Status',     v: totalMeetings > 0 ? 'Active' : 'Standby',  accent: totalMeetings > 0 ? '#10B981' : '#F472B6' },
                  { l: 'Completion', v: subscription?.isSubscribed ? 'Pro' : 'Free', accent: GRAD },
                  { l: 'Open queue', v: String(processingMeetings), accent: '#1D1B22' },
                ].map((s) => (
                  <div key={s.l}>
                    <div className="text-[10px] font-bold uppercase tracking-widest mb-1 text-[#64607A]">{s.l}</div>
                    <div className="text-xl font-bold" style={{ color: s.accent }}>{s.v}</div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <button onClick={() => navigate('/dashboard/upload')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs rounded-full font-bold text-white transition-all duration-150 hover:opacity-90 hover:scale-[1.015] active:scale-[0.985] cursor-pointer select-none"
                  style={{ background: `linear-gradient(135deg, ${GRAD}, ${GRAD2})`, boxShadow: `0 4px 16px rgba(91,63,214,0.35)` }}>
                  <Upload size={13} /> Upload meeting
                </button>
                <button onClick={() => navigate('/dashboard/meetings')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs rounded-full font-semibold bg-white border border-[#E4E0F5] transition-all duration-150 hover:border-[#B8ACEC] active:scale-[0.985] cursor-pointer select-none"
                  style={{ color: GRAD }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#EDE9FF'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'white'; }}>
                  Open meetings
                </button>
              </div>
            </div>

            <div className="flex flex-col divide-y divide-[#E4E0F5]">
              <div className="p-6 flex-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs font-bold uppercase tracking-widest text-[#1D1B22]">Live Summary</div>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ${totalMeetings > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${totalMeetings > 0 ? 'bg-emerald-500' : 'bg-gray-400'}`} /> {totalMeetings > 0 ? 'Active' : 'Standby'}
                  </span>
                </div>
                <div className="text-sm font-semibold text-[#1D1B22] mb-3">What the workspace is doing</div>
                <div className="space-y-3">
                  {[
                    { l: 'Meetings', d: totalMeetings > 0 ? `${totalMeetings} meetings in workspace` : 'No meetings yet' },
                    { l: 'Action queue', d: totalTasks > 0 ? `${completedActions}/${totalTasks} tasks completed` : 'No tasks yet' },
                    { l: 'Processing', d: processingMeetings > 0 ? `${processingMeetings} meetings being processed` : 'All meetings processed' },
                  ].map((row) => (
                    <div key={row.l} className="flex gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 bg-[#F472B6]" />
                      <div>
                        <div className="text-xs font-semibold text-[#1D1B22]">{row.l}</div>
                        <div className="text-[11px] text-[#64607A] mt-0.5 leading-snug">{row.d}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6">
                <div className="text-[10px] font-bold uppercase tracking-[0.12em] mb-1 text-[#64607A]">Top Focus</div>
                <div className="text-sm font-bold text-[#1D1B22]">Current workstream</div>
                <div className="h-1.5 bg-[#EDE9FF] rounded-full overflow-hidden mt-3">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(totalTasks > 0 ? Math.round((completedActions / (totalTasks + totalMeetings || 1)) * 100) : 0, 100)}%`, background: `linear-gradient(90deg, ${GRAD}, ${GRAD2})` }}
                  />
                </div>
                <div className="text-[10px] text-[#64607A] mt-1.5">
                  {totalTasks > 0 ? `${completedActions}/${totalTasks} tasks completed` : 'No tasks yet'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4 metric tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {metricTiles.map((s) => (
            <div key={s.l} className="group relative bg-white rounded-2xl overflow-hidden border border-[#E4E0F5] p-5 transition-all duration-200 hover:-translate-y-0.5"
              style={{ boxShadow: CARD_SHADOW }}
              onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 28px ${s.glow}, ${CARD_SHADOW}`}
              onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.boxShadow = CARD_SHADOW}
            >
              <div className="absolute top-0 left-0 right-0 h-[2.5px]" style={{ background: s.accent }} />
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4 transition-transform duration-200 group-hover:scale-105"
                style={{ background: `${s.accent}12`, boxShadow: `0 2px 8px ${s.glow}` }}>
                <s.icon size={15} style={{ color: s.accent }} />
              </div>
              <div className="text-2xl font-bold tracking-tight leading-none mb-1" style={{ color: s.accent }}>{loading ? '...' : s.v}</div>
              <div className="text-xs text-[#64607A] mb-1.5">{s.l}</div>
              <div className="text-[10px] font-semibold text-emerald-600">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="bg-white rounded-3xl border border-[#E4E0F5] p-6 relative overflow-hidden"
          style={{ boxShadow: CARD_SHADOW }}>
          <div className="absolute inset-0 pointer-events-none" style={{ ...DOT_GRID, opacity: 0.18 }} />
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="text-sm font-bold text-[#1D1B22]">Meeting activity</div>
              <div className="text-xs text-[#64607A] mt-0.5">Last 7 days</div>
            </div>
            <Tabs tabs={[{ id: 'meetings', label: 'Count' }, { id: 'mins', label: 'Duration' }]} active={chartMetric} onChange={(id) => setChartMetric(id as 'meetings' | 'mins')} />
          </div>
          <MiniBarChart data={weekData} metric={chartMetric} />
          {weekData.every(d => d.meetings === 0) && meetings.length === 0 && (
            <div className="text-center py-4">
              <div className="text-xs text-[#64607A]">No meeting data available yet. Upload a meeting to get started.</div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default DashboardHome;
