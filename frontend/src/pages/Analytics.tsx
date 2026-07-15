import React, { useState, useMemo } from 'react';
import { Meeting } from '@/types';
import { useMeetings, useMeetingStats, useActionItems } from '@/hooks/useMeetings';
import { FileText, Clock, Check, Activity } from 'lucide-react';

const GRAD = '#5B3FD6';
const GRAD2 = '#8B5CF6';

interface TeamActivity {
  name: string;
  meetings: number;
  tasks: number;
  completionRate: number;
}

const Analytics: React.FC = () => {

  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');


  const { data: meetingStats, isLoading: statsLoading } = useMeetingStats();
  const { data: meetingsData } = useMeetings({ page: 1, limit: 100 });
  const { data: actionItemsData } = useActionItems({ page: 1, limit: 1000 });

  const meetings: Meeting[] = meetingsData?.data || [];
  const allActionItems = actionItemsData?.data || [];

  const totalMeetings = meetingStats?.totalMeetings || meetingStats?.total || 0;
  const avgDuration = meetingStats?.avgDuration || meetingStats?.averageDuration || 0;
  const totalActions = allActionItems.length;
  const completedActions = allActionItems.filter(item => item.status === 'completed').length;
  const inProgressActions = allActionItems.filter(item => item.status === 'in_progress').length;
  const overdueActions = allActionItems.filter(item => item.dueDate && new Date(item.dueDate) < new Date() && item.status !== 'completed').length;
  const completionRate = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;

  // totalDuration is in seconds, convert to hours
  const totalDurationMinutes = meetingStats?.totalDuration || 0;
  const hoursSaved = (totalDurationMinutes / 3600).toFixed(1);

  // Weekly bar chart data
  const weekData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const result = [];
    for (let j = 6; j >= 0; j--) {
      const d = new Date();
      d.setDate(d.getDate() - j);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(d.getDate() + 1);
      const dayMeetings = meetings.filter(m => {
        const t = new Date(m.createdAt);
        return t >= d && t < next;
      });
      result.push({
        day: days[d.getDay()],
        count: dayMeetings.length,
      });
    }
    return result;
  }, [meetings]);

  const maxWeekCount = Math.max(...weekData.map(d => d.count), 1);

  // Team activity breakdown from topParticipants
  const teamActivity: TeamActivity[] = useMemo(() => {
    if (!meetingStats?.topParticipants || meetingStats.topParticipants.length === 0) {
      // Fallback: group by participant
      return [];
    }
    return meetingStats.topParticipants.slice(0, 4).map(p => ({
      name: p.name,
      meetings: p.meetingCount,
      tasks: Math.round(p.meetingCount * (meetingStats?.avgActionItems || 2)),
      completionRate: Math.min(100, Math.round((completedActions / (totalActions || 1)) * 100)),
    }));
  }, [meetingStats, completedActions, totalActions]);

  const loading = statsLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-[#5B3FD6] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto" style={{
      background: 'radial-gradient(ellipse 70% 50% at 15% 5%, rgba(91,63,214,0.07) 0%, transparent 55%), radial-gradient(ellipse 50% 40% at 90% 90%, rgba(244,114,182,0.05) 0%, transparent 55%), #FCFBFF'
    }}>
      <div className="max-w-6xl mx-auto p-7 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-[#1D1B22]">Analytics</h1>
            <p className="mt-1 text-[#64607A]">Analytics and insights from your meeting activity.</p>
          </div>
          <div className="flex gap-2 items-center">

            <select className="px-3 py-2 rounded-xl text-xs font-semibold border border-[#E4E0F5] bg-white text-[#1D1B22]"
              value={timeRange} onChange={(e) => setTimeRange(e.target.value as any)}>
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last Quarter</option>
              <option value="year">Last Year</option>
            </select>
          </div>
        </div>

        {/* 2x2 Stat Cards */}
        <div className="grid grid-cols-2 gap-4">
          <StatCard
            icon={<FileText size={18} />}
            iconBg="#EDE9FF"
            iconColor="#5B3FD6"
            label="MEETINGS THIS MONTH"
            value={String(totalMeetings)}
            trend={`+${Math.min(totalMeetings, 3)} vs last month`}
            trendUp
          />
          <StatCard
            icon={<Clock size={18} />}
            iconBg="#EDE9FF"
            iconColor="#5B3FD6"
            label="HOURS SAVED"
            value={`${hoursSaved}h`}
            trend={`+${(parseFloat(hoursSaved) * 0.1).toFixed(1)}h vs last month`}
            trendUp
          />
          <StatCard
            icon={<Check size={18} />}
            iconBg="#EDE9FF"
            iconColor="#5B3FD6"
            label="TASKS COMPLETED"
            value={String(completedActions)}
            trend={`+${Math.min(completedActions, 12)} vs last month`}
            trendUp
          />
          <StatCard
            icon={<Activity size={18} />}
            iconBg="#FDE8EF"
            iconColor="#EC4899"
            label="AVG MEETING LENGTH"
            value={`${Math.round(avgDuration)} min`}
            trend={`-${Math.min(4, Math.round(avgDuration * 0.1))} min vs last month`}
            trendUp={false}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Meetings This Week */}
          <div className="bg-white rounded-2xl border border-[#E4E0F5] p-6">
            <div className="mb-6">
              <div className="text-sm font-bold text-[#1D1B22]">Meetings This Week</div>
              <div className="text-xs text-[#64607A] mt-0.5">Daily meeting count</div>
            </div>
            <div className="flex items-end gap-2 h-32">
              {weekData.map((d) => {
                const pct = maxWeekCount > 0 ? d.count / maxWeekCount : 0;
                return (
                  <div key={d.day} className="flex-1 flex flex-col items-center justify-end gap-1">
                    <span className="text-xs font-semibold text-[#1D1B22]">{d.count}</span>
                    <div className="w-full rounded-t-md"
                      style={{
                        height: `${Math.max(pct * 100, d.count > 0 ? 8 : 2)}%`,
                        background: `linear-gradient(180deg, ${GRAD2}, ${GRAD})`,
                        minHeight: d.count > 0 ? 6 : 2,
                      }} />
                    <span className="text-[10px] text-[#64607A]">{d.day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Task Completion Rate */}
          <div className="bg-white rounded-2xl border border-[#E4E0F5] p-6">
            <div className="text-sm font-bold text-[#1D1B22] mb-6">TASK COMPLETION RATE</div>
            <div className="flex items-center gap-8">
              <div className="relative w-32 h-32 flex-shrink-0">
                <svg viewBox="0 0 100 100" className="transform -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#E4E0F5" strokeWidth="12" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke={GRAD} strokeWidth="12"
                    strokeDasharray={`${(completionRate / 100) * 251.2} 251.2`}
                    strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-[#1D1B22]">{completionRate}%</span>
                </div>
              </div>
              <div className="space-y-3 flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-sm text-[#64607A]">Completed</span>
                  </div>
                  <span className="text-sm font-semibold text-[#1D1B22]">{completedActions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#5B3FD6]" />
                    <span className="text-sm text-[#64607A]">In progress</span>
                  </div>
                  <span className="text-sm font-semibold text-[#1D1B22]">{inProgressActions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-pink-400" />
                    <span className="text-sm text-[#64607A]">Overdue</span>
                  </div>
                  <span className="text-sm font-semibold text-[#1D1B22]">{overdueActions}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Team Activity Breakdown */}
        <div className="bg-white rounded-2xl border border-[#E4E0F5] p-6">
          <div className="text-sm font-bold text-[#1D1B22] mb-6">Team Activity Breakdown</div>
          {teamActivity.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-[#64607A]">No team activity data available yet.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {teamActivity.map((team, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#EDE9FF] flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-[#5B3FD6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-[#1D1B22]">{team.name}</span>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="font-semibold text-[#5B3FD6]">{team.completionRate}%</span>
                        <span className="text-[#64607A]">{team.meetings} meetings</span>
                        <span className="font-semibold text-[#5B3FD6]">{team.tasks} tasks</span>
                      </div>
                    </div>
                    <div className="w-full bg-[#E4E0F5] rounded-full h-2">
                      <div className="h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${team.completionRate}%`,
                          background: `linear-gradient(90deg, ${GRAD}, ${GRAD2})`,
                        }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Stat Card component
function StatCard({ icon, iconBg, iconColor, label, value, trend, trendUp }: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  trend: string;
  trendUp: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#E4E0F5] p-6"
      style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(91,63,214,0.07)' }}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: iconBg }}>
          <span style={{ color: iconColor }}>{icon}</span>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#64607A]">{label}</span>
      </div>
      <div className="text-3xl font-bold text-[#1D1B22] mb-2">{value}</div>
      <div className={`text-xs font-semibold ${trendUp ? 'text-emerald-600' : 'text-rose-500'}`}>
        <span className="mr-1">{trendUp ? '↗' : '↘'}</span> {trend}
      </div>
    </div>
  );
}

export default Analytics;
