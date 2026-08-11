import { useState, useEffect } from "react";
import {
  Brain,
  Users,
  CheckCircle,
  Clock,
  BarChart3,
  Calendar,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { meetingsApi, MeetingsStats, Meeting, PaginatedResponse } from "@/lib/api";
import { SvgBarChart } from "@/components/charts";

function DashKPI({ label, value, sub, icon: Icon }: {
  label: string; value: string; sub: string; icon: React.ElementType;
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#E5F4F7] p-5 shadow-sm hover:shadow-md hover:border-[#C8E8F2] transition-all duration-200 cursor-default">
      <div className="flex items-start justify-between mb-3">
        <div className="w-8 h-8 rounded-xl bg-[#F0FAFE] flex items-center justify-center border border-[#E0F3F8]">
          <Icon size={14} className="text-[#06B6D4]" />
        </div>
      </div>
      <p className="text-[10.5px] font-semibold text-[#94A3B8] uppercase tracking-[0.12em] mb-1.5">{label}</p>
      <p className="text-[22px] font-extrabold text-[#0F172A] leading-none tracking-tight mb-2">{value}</p>
      <p className="text-[11px] font-mono text-[#94A3B8] truncate">{sub}</p>
    </div>
  );
}

const statusDot = (s: string) =>
  s === "completed" ? "bg-emerald-400" :
  s === "processing" ? "bg-amber-400" : "bg-slate-300";

const statusLabel = (s: string) =>
  s === "completed" ? "text-emerald-600 bg-emerald-50 border-emerald-100" :
  s === "processing" ? "text-amber-600 bg-amber-50 border-amber-100" :
    "text-slate-500 bg-slate-50 border-slate-100";

const priorityColor = (p: string) =>
  p === "high" ? "text-red-600 bg-red-50 border-red-100" :
  p === "medium" ? "text-amber-600 bg-amber-50 border-amber-100" :
    "text-slate-500 bg-slate-50 border-slate-100";

function formatDuration(seconds: number | null): string {
  if (seconds === null) return "--";
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

export { AiUsage };
export default function AiUsage() {
  const [stats, setStats] = useState<MeetingsStats | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, meetingsRes] = await Promise.all([
        meetingsApi.stats(),
        meetingsApi.list(1, 10),
      ]);
      setStats(statsRes);
      setMeetings(meetingsRes.data);
      setPagination(meetingsRes.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const trendData = stats?.trends ?? [];
  const topParticipants = stats?.topParticipants ?? [];

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-[#06B6D4]" />
          <p className="text-[13px] text-[#94A3B8] font-mono">Loading AI usage data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <p className="text-[14px] text-red-500">{error}</p>
          <button onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#06B6D4] text-white text-[12px] font-semibold hover:bg-[#0891B2] transition-colors cursor-pointer">
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      </div>
    );
  }

  const isEmpty = meetings.length === 0 && !stats;

  return (
    <div className="h-full overflow-y-auto scrollbar-hide">
      <div className="px-10 py-9 space-y-8 max-w-[1480px]">

        {/* Page header */}
        <div className="flex items-end justify-between gap-6">
          <div>
            <h1 className="text-[30px] font-bold text-[#0F172A] tracking-[-0.025em] leading-none"
              style={{ fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
              AI Usage
            </h1>
            <p className="text-[13px] text-[#64748B] mt-2.5">
              Platform-wide AI consumption &middot; Live
            </p>
          </div>
          <button onClick={fetchData}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#E5F4F7] bg-white text-[12px] text-[#475569] hover:border-[#C8E8F2] transition-colors cursor-pointer">
            <RefreshCw size={12} />
            <span className="font-medium">Refresh</span>
          </button>
        </div>

        {isEmpty ? (
          <div className="bg-white border border-[#E5F4F7] rounded-2xl p-16 text-center">
            <Brain size={48} className="mx-auto text-[#CBD5E1] mb-4" />
            <p className="text-[16px] font-semibold text-[#0F172A] mb-2">No meetings yet</p>
            <p className="text-[13px] text-[#94A3B8]">Create your first meeting to start tracking AI usage.</p>
          </div>
        ) : (
          <>
            {/* KPI cards */}
            <div className="grid grid-cols-5 gap-4">
              <DashKPI label="Total Meetings" value={String(stats?.totalMeetings ?? 0)} sub="All time" icon={BarChart3} />
              <DashKPI label="Completed" value={String(stats?.completedMeetings ?? 0)} sub="Finished successfully" icon={CheckCircle} />
              <DashKPI label="Processing" value={String(stats?.processingMeetings ?? 0)} sub="In progress" icon={Clock} />
              <DashKPI label="Avg Duration" value={formatDuration(stats?.avgDuration ?? null)} sub="Per meeting" icon={Calendar} />
              <DashKPI label="Avg Tasks" value={String(stats?.avgTasks ?? 0)} sub="Per meeting" icon={Users} />
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-2 gap-5">
              {/* Trends bar chart */}
              <div className="bg-white border border-[#E5F4F7] rounded-2xl p-7">
                <p className="text-[10.5px] font-mono font-semibold text-[#9CA3AF] uppercase tracking-[0.12em] mb-1.5">Meeting Trends</p>
                <p className="text-[20px] font-bold text-[#0F172A] tracking-[-0.02em] mb-6">Monthly Activity</p>
                {trendData.length > 0 ? (
                  <SvgBarChart data={trendData} dataKey="count" color="#06B6D4" uid="ai-trends-bar" />
                ) : (
                  <div className="flex items-center justify-center h-[160px]">
                    <p className="text-[12px] text-[#94A3B8]">No trend data available</p>
                  </div>
                )}
              </div>

              {/* Top Participants */}
              <div className="bg-white border border-[#E5F4F7] rounded-2xl p-7">
                <p className="text-[10.5px] font-mono font-semibold text-[#9CA3AF] uppercase tracking-[0.12em] mb-1.5">Top Participants</p>
                <p className="text-[20px] font-bold text-[#0F172A] tracking-[-0.02em] mb-6">Most Active</p>
                {topParticipants.length > 0 ? (
                  <div className="space-y-3">
                    {topParticipants.slice(0, 5).map((p, i) => {
                      const maxCount = topParticipants[0]?.meetingCount ?? 1;
                      const pct = (p.meetingCount / maxCount) * 100;
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-[12px] font-mono text-[#94A3B8] w-5 text-right">{i + 1}</span>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[12.5px] text-[#374151] font-medium truncate max-w-[180px]">{p.name}</span>
                              <span className="text-[11px] font-mono text-[#94A3B8]">{p.meetingCount} meetings</span>
                            </div>
                            <div className="w-full h-1.5 bg-[#EDF7F9] rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-[#06B6D4]" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[160px]">
                    <p className="text-[12px] text-[#94A3B8]">No participant data available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Meetings table */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[10.5px] font-mono font-semibold text-[#9CA3AF] uppercase tracking-[0.12em] mb-1">Recent Meetings</p>
                  <p className="text-[18px] font-bold text-[#0F172A] tracking-[-0.02em]">All Sessions</p>
                </div>
              </div>

              <div className="bg-white border border-[#E5F4F7] rounded-2xl overflow-hidden">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-[#EDF7F9] bg-[#F9FCFD]">
                      {(["Title", "Status", "Priority", "Duration", "Participants", "Date"] as const).map(h => (
                        <th key={h} className="px-5 py-3.5 text-left text-[10.5px] font-mono font-semibold text-[#9CA3AF] uppercase tracking-[0.12em] whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {meetings.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-16 text-center">
                          <p className="text-[13px] text-[#94A3B8]">No meetings found.</p>
                        </td>
                      </tr>
                    ) : (
                      meetings.map((m, idx) => {
                        const isLast = idx === meetings.length - 1;
                        return (
                          <tr key={m.id}
                            className={`transition-colors hover:bg-[#FAFCFD] ${isLast ? "" : "border-b border-[#F0F9FB]"}`}>
                            <td className="px-5 py-3.5 max-w-[240px]">
                              <span className="text-[12.5px] text-[#374151] truncate block font-medium">{m.title}</span>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-1.5">
                                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusDot(m.status)}`} />
                                <span className={`text-[10.5px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded-md border ${statusLabel(m.status)}`}>
                                  {m.status}
                                </span>
                              </div>
                            </td>
                            <td className="px-5 py-3.5">
                              <span className={`text-[10.5px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded-md border ${priorityColor(m.priority)}`}>
                                {m.priority}
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              <span className="text-[12px] font-mono tabular-nums text-[#475569]">{formatDuration(m.duration)}</span>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-1">
                                <Users size={11} className="text-[#94A3B8]" />
                                <span className="text-[12px] font-mono text-[#475569]">{m.participants.length}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3.5">
                              <span className="text-[11.5px] font-mono text-[#94A3B8]">
                                {new Date(m.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>

                <div className="flex items-center justify-between px-5 py-3.5 border-t border-[#EDF7F9]">
                  <span className="text-[11.5px] font-mono text-[#94A3B8]">
                    Showing {meetings.length} of {pagination.total} meetings
                  </span>
                  <button onClick={fetchData}
                    className="flex items-center gap-1.5 text-[11.5px] font-mono text-[#94A3B8] hover:text-[#06B6D4] transition-colors cursor-pointer">
                    <RefreshCw size={11} /> Refresh
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
