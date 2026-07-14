import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Check, Clock, Calendar, Upload } from 'lucide-react';
import { meetingService, actionItemService } from '@/services';
import { ActionItem } from '@/types';
import { useSubscription } from '@/hooks/useAuth';

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

const weekData = [
  { day: 'Mon', meetings: 3, mins: 145 },
  { day: 'Tue', meetings: 5, mins: 210 },
  { day: 'Wed', meetings: 2, mins: 90 },
  { day: 'Thu', meetings: 7, mins: 320 },
  { day: 'Fri', meetings: 4, mins: 175 },
  { day: 'Sat', meetings: 1, mins: 42 },
  { day: 'Sun', meetings: 0, mins: 0 },
];

function MiniBarChart({ data, metric }: { data: typeof weekData; metric: string }) {
  const [hovered, setHovered] = React.useState<number | null>(null);
  const values = data.map((d) => (d as any)[metric] as number);
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
          const val = (d as any)[metric] as number;
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
  const [chartMetric, setChartMetric] = useState('meetings');
  const { data: subscription } = useSubscription();
  const [stats, setStats] = useState({ totalMeetings: 0, completedActions: 0, averageDuration: 0, upcomingMeetings: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [meetingStats, actionItems] = await Promise.all([
          meetingService.getMeetingStats(),
          actionItemService.getActionItems({ limit: 100 }),
        ]);
        const items: ActionItem[] = actionItems.data || [];
        setStats({
          totalMeetings: meetingStats.total || 0,
          completedActions: items.filter((item: ActionItem) => item.status === 'completed').length,
          averageDuration: meetingStats.avgDuration || 0,
          upcomingMeetings: meetingStats.processingMeetings || 0,
        });
      } catch {
        // Use defaults
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const metricTiles = [
    { l: 'Total meetings',  v: String(stats.totalMeetings || 0), sub: '+3 this week', icon: FileText, accent: GRAD, glow: 'rgba(91,63,214,0.12)' },
    { l: 'Completed tasks', v: String(stats.completedActions || 0), sub: '+12 this week', icon: Check, accent: '#059669', glow: 'rgba(5,150,105,0.10)' },
    { l: 'Avg. duration',   v: stats.averageDuration ? `${Math.round(stats.averageDuration)}m` : '0m', sub: '-4m vs last week', icon: Clock, accent: '#F472B6', glow: 'rgba(244,114,182,0.12)' },
    { l: 'Upcoming',        v: String(stats.upcomingMeetings || 0), sub: '2 sessions tomorrow', icon: Calendar, accent: '#9A6130', glow: 'rgba(244,177,131,0.15)' },
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
                Track summaries, action items, and calendar sync in a workspace designed to feel edited, not assembled.
              </p>

              <div className="flex items-center gap-8 mb-7 pb-7 border-b border-[#E4E0F5]">
                {[
                  { l: 'Signal',     v: 'Live',  accent: '#F472B6' },
                  { l: 'Completion', v: subscription?.isSubscribed ? 'Pro' : 'Free', accent: GRAD },
                  { l: 'Open queue', v: String(stats.upcomingMeetings), accent: '#1D1B22' },
                ].map((s) => (
                  <div key={s.l}>
                    <div className="text-[10px] font-bold uppercase tracking-widest mb-1 text-[#64607A]">{s.l}</div>
                    <div className="text-xl font-bold" style={{ color: s.accent }}>{s.v}</div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <button onClick={() => navigate('/dashboard/upload')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs rounded-2xl font-bold text-white transition-all duration-150 hover:opacity-90 hover:scale-[1.015] active:scale-[0.985] cursor-pointer select-none"
                  style={{ background: `linear-gradient(135deg, ${GRAD}, ${GRAD2})`, boxShadow: `0 4px 16px rgba(91,63,214,0.35)` }}>
                  <Upload size={13} /> Upload meeting
                </button>
                <button onClick={() => navigate('/dashboard/meetings')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs rounded-2xl font-semibold bg-white border border-[#E4E0F5] transition-all duration-150 hover:border-[#B8ACEC] active:scale-[0.985] cursor-pointer select-none"
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
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                  </span>
                </div>
                <div className="text-sm font-semibold text-[#1D1B22] mb-3">What the workspace is doing</div>
                <div className="space-y-3">
                  {[
                    { l: 'AI summaries', d: 'New ones generated from recent calls' },
                    { l: 'Action queue', d: 'Priorities sorted by urgency' },
                    { l: 'Calendar sync', d: 'Follow-ups pushed live' },
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
                    style={{ width: `${Math.min(stats.completedActions > 0 ? Math.round((stats.completedActions / (stats.completedActions + stats.totalMeetings || 1)) * 100) : 0, 100)}%`, background: `linear-gradient(90deg, ${GRAD}, ${GRAD2})` }}
                  />
                </div>
                <div className="text-[10px] text-[#64607A] mt-1.5">
                  {stats.completedActions > 0 ? Math.round((stats.completedActions / (stats.completedActions + stats.totalMeetings || 1)) * 100) : 0}% complete
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
            <Tabs tabs={[{ id: 'meetings', label: 'Count' }, { id: 'mins', label: 'Duration' }]} active={chartMetric} onChange={setChartMetric} />
          </div>
          <MiniBarChart data={weekData} metric={chartMetric} />
        </div>

      </div>
    </div>
  );
};

export default DashboardHome;
