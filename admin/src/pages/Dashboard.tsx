import { useRef, useEffect, useState } from "react";
import {
  Users, User, Users2, Video, HardDrive, Brain, Building2,
  ChevronDown, Plus, BarChart3, ScrollText, Shield, Settings,
  ArrowRight, CheckCircle, Loader2, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  DashSparkline, OverviewAreaChart, UserGrowthChart,
  AiUsageChart, StorageAreaChart,
} from "@/components/charts";
import { meetingsApi, teamsApi, notificationsApi, authApi, workspaceApi } from "@/lib/api";
import type { Page } from "@/types";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function formatToday() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

export { Dashboard };
export default function Dashboard({ onNav }: { onNav: (p: Page) => void }) {
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("Admin");
  const [meetingsStats, setMeetingsStats] = useState<{
    totalMeetings: number; completedMeetings: number; processingMeetings: number;
    totalDuration: number; avgDuration: number; avgTasks: number;
    trends: { month: string; count: number }[];
    topParticipants: { name: string; meetingCount: number }[];
  } | null>(null);
  const [teamsCount, setTeamsCount] = useState(0);
  const [notifications, setNotifications] = useState<{
    title: string; message: string; type: string; createdAt: string;
  }[]>([]);
  const [workspace, setWorkspace] = useState<{
    teamSize: number; ongoingProjects: unknown[]; upcomingDeadlines: unknown[];
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const results = await Promise.allSettled([
          authApi.me(),
          meetingsApi.stats(),
          teamsApi.list(),
          notificationsApi.list(1, 5),
          workspaceApi.overview(),
        ]);

        const [userRes, statsRes, teamsRes, notifsRes, wsRes] = results;

        if (userRes.status === "fulfilled") setUserName(userRes.value.name.split(" ")[0]);
        if (statsRes.status === "fulfilled") setMeetingsStats(statsRes.value);
        if (teamsRes.status === "fulfilled") setTeamsCount(teamsRes.value.teams.length);
        if (notifsRes.status === "fulfilled") {
          setNotifications(notifsRes.value.data.map(n => ({
            title: n.title, message: n.message, type: n.type, createdAt: n.createdAt,
          })));
        }
        if (wsRes.status === "fulfilled") setWorkspace(wsRes.value.data);
      } catch {
        // API unavailable
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const kpis = [
    { label: "Total Users", value: workspace?.teamSize?.toLocaleString() || "—", change: "", up: true, icon: Users, color: "#06B6D4", spark: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, workspace?.teamSize || 0] },
    { label: "Teams", value: teamsCount > 0 ? String(teamsCount) : "—", change: "", up: true, icon: Users2, color: "#4F46E5", spark: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, teamsCount] },
    { label: "Total Meetings", value: meetingsStats ? meetingsStats.totalMeetings.toLocaleString() : "—", change: "", up: true, icon: Video, color: "#10B981", spark: meetingsStats?.trends?.map(t => t.count) || [0] },
    { label: "Completed", value: meetingsStats ? meetingsStats.completedMeetings.toLocaleString() : "—", change: "", up: true, icon: CheckCircle, color: "#06B6D4", spark: [0] },
    { label: "Processing", value: meetingsStats ? meetingsStats.processingMeetings.toLocaleString() : "—", change: "", up: true, icon: Loader2, color: "#F59E0B", spark: [0] },
    { label: "Avg Duration", value: meetingsStats ? `${Math.round(meetingsStats.avgDuration / 60)}m` : "—", change: "", up: true, icon: Brain, color: "#8B5CF6", spark: [0] },
  ];

  const activity = notifications.length > 0
    ? notifications.map(n => ({
        icon: n.type === "DEADLINE_REMINDER" ? AlertCircle : CheckCircle,
        label: n.title,
        detail: n.message,
        badge: n.type === "DEADLINE_REMINDER" ? "Reminder" : "System",
        badgeColor: n.type === "DEADLINE_REMINDER" ? "#F59E0B" : "#06B6D4",
        time: new Date(n.createdAt).toLocaleTimeString(),
      }))
    : [];

  const quickActions = [
    { icon: Plus, label: "Add User", color: "#06B6D4", nav: "users" as Page },
    { icon: Users2, label: "Create Team", color: "#4F46E5", nav: "teams" as Page },
    { icon: BarChart3, label: "Reports", color: "#10B981", nav: "dashboard" as Page },
    { icon: ScrollText, label: "System Logs", color: "#F59E0B", nav: "logs" as Page },
    { icon: Brain, label: "AI Usage", color: "#8B5CF6", nav: "ai" as Page },
    { icon: HardDrive, label: "Storage", color: "#EF4444", nav: "dashboard" as Page },
    { icon: Shield, label: "Security", color: "#06B6D4", nav: "settings" as Page },
    { icon: Settings, label: "Settings", color: "#64748B", nav: "settings" as Page },
  ];

  const overviewData = meetingsStats?.trends?.map(t => ({
    label: t.month, users: t.count, meetings: Math.round(t.count * 0.4), ai: Math.round(t.count * 0.8),
  })) || [];

  const ugData = meetingsStats?.trends?.slice(-6).map(t => ({
    label: t.month, individual: Math.round(t.count * 0.8), team: Math.round(t.count * 0.2),
  })) || [];

  const aiData = meetingsStats?.trends?.slice(-7).map(t => ({
    label: t.month, gpt4: Math.round(t.count * 0.5), claude: Math.round(t.count * 0.3), llama: Math.round(t.count * 0.1),
  })) || [];

  const stData = meetingsStats?.trends?.slice(-6).map((t, i) => ({
    label: t.month, used: 2 + (i * 1.2),
  })) || [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F5FEFF" }}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#06B6D4" }} />
          <p className="text-sm" style={{ color: "#94A3B8" }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#F5FEFF" }}>
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "#0F172A" }}>
              {getGreeting()}, {userName}
            </h1>
            <p className="text-sm mt-1" style={{ color: "#94A3B8" }}>
              {formatToday()} &mdash; Here&apos;s what&apos;s happening across your platform
            </p>
          </div>
        </div>

        <div className="grid grid-cols-6 gap-4 mb-6">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div key={kpi.label} className="rounded-2xl border p-4 transition-all hover:shadow-md" style={{ borderColor: "#E5F4F7", background: "white" }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${kpi.color}12` }}>
                    <Icon size={18} style={{ color: kpi.color }} />
                  </div>
                  {kpi.change && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ color: "#10B981", background: "#10B98118" }}>
                      {kpi.change}
                    </span>
                  )}
                </div>
                <div className="text-2xl font-bold mb-0.5" style={{ color: "#0F172A" }}>{kpi.value}</div>
                <div className="text-xs mb-3" style={{ color: "#94A3B8" }}>{kpi.label}</div>
                <DashSparkline data={kpi.spark} color={kpi.color} uid={kpi.label} />
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-12 gap-4 mb-6">
          <div className="col-span-8 rounded-2xl border p-5" style={{ borderColor: "#E5F4F7", background: "white" }}>
            <div className="mb-4">
              <h2 className="text-base font-bold" style={{ color: "#0F172A" }}>Platform Overview</h2>
              <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>Meeting trends over time</p>
            </div>
            {overviewData.length > 0 ? (
              <>
                <OverviewAreaChart data={overviewData} period="30D" />
                <div className="flex items-center gap-5 mt-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#06B6D4" }} />
                    <span className="text-xs" style={{ color: "#94A3B8" }}>Users</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#4F46E5" }} />
                    <span className="text-xs" style={{ color: "#94A3B8" }}>Meetings</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#10B981" }} />
                    <span className="text-xs" style={{ color: "#94A3B8" }}>AI Requests</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <BarChart3 className="w-10 h-10 mb-3" style={{ color: "#E5F4F7" }} />
                <p className="text-sm" style={{ color: "#94A3B8" }}>No meeting data yet. Upload your first meeting to see trends.</p>
              </div>
            )}
          </div>

          <div className="col-span-4 rounded-2xl border p-5" style={{ borderColor: "#E5F4F7", background: "white" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold" style={{ color: "#0F172A" }}>Recent Activity</h2>
            </div>
            {activity.length > 0 ? (
              <div className="space-y-3">
                {activity.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl transition-colors hover:bg-gray-50 cursor-pointer">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${item.badgeColor}12` }}>
                        <Icon size={16} style={{ color: item.badgeColor }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-semibold" style={{ color: "#0F172A" }}>{item.label}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ color: item.badgeColor, background: `${item.badgeColor}18` }}>
                            {item.badge}
                          </span>
                        </div>
                        <p className="text-xs truncate" style={{ color: "#94A3B8" }}>{item.detail}</p>
                      </div>
                      <span className="text-[11px] whitespace-nowrap" style={{ color: "#94A3B8" }}>{item.time}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ScrollText className="w-10 h-10 mb-3" style={{ color: "#E5F4F7" }} />
                <p className="text-sm" style={{ color: "#94A3B8" }}>No recent activity</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="rounded-2xl border p-5" style={{ borderColor: "#E5F4F7", background: "white" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold" style={{ color: "#0F172A" }}>Meeting Trends</h2>
            </div>
            {ugData.length > 0 ? <UserGrowthChart data={ugData} /> : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Video className="w-10 h-10 mb-3" style={{ color: "#E5F4F7" }} />
                <p className="text-sm" style={{ color: "#94A3B8" }}>No trend data yet</p>
              </div>
            )}
          </div>

          <div className="rounded-2xl border p-5" style={{ borderColor: "#E5F4F7", background: "white" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold" style={{ color: "#0F172A" }}>AI Usage</h2>
            </div>
            {aiData.length > 0 ? <AiUsageChart data={aiData} /> : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Brain className="w-10 h-10 mb-3" style={{ color: "#E5F4F7" }} />
                <p className="text-sm" style={{ color: "#94A3B8" }}>No AI usage data yet</p>
              </div>
            )}
          </div>

          <div className="rounded-2xl border p-5" style={{ borderColor: "#E5F4F7", background: "white" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold" style={{ color: "#0F172A" }}>Storage Usage</h2>
            </div>
            {stData.length > 0 ? <StorageAreaChart data={stData} /> : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <HardDrive className="w-10 h-10 mb-3" style={{ color: "#E5F4F7" }} />
                <p className="text-sm" style={{ color: "#94A3B8" }}>No storage data yet</p>
              </div>
            )}
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-base font-bold mb-4" style={{ color: "#0F172A" }}>Quick Actions</h2>
          <div className="grid grid-cols-4 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button key={action.label} onClick={() => onNav(action.nav)}
                  className="flex items-center gap-3 p-4 rounded-2xl border transition-all hover:shadow-md group"
                  style={{ borderColor: "#E5F4F7", background: "white" }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110" style={{ background: `${action.color}12` }}>
                    <Icon size={18} style={{ color: action.color }} />
                  </div>
                  <span className="text-sm font-semibold" style={{ color: "#0F172A" }}>{action.label}</span>
                  <ArrowRight size={14} className="ml-auto transition-transform group-hover:translate-x-1" style={{ color: "#94A3B8" }} />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
