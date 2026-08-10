import { useRef, useEffect, useState } from "react";
import {
  Users,
  User,
  Users2,
  Video,
  HardDrive,
  Brain,
  Building2,
  ChevronDown,
  Plus,
  BarChart3,
  ScrollText,
  Shield,
  Settings,
  AlertCircle,
  CreditCard,
  ArrowRight,
  Sparkles,
  Send,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  DashSparkline,
  OverviewAreaChart,
  UserGrowthChart,
  AiUsageChart,
  StorageAreaChart,
} from "@/components/charts";
import { meetingsApi, teamsApi, notificationsApi, authApi } from "@/lib/api";
import type { Page } from "@/types";

const workspaces = [
  { name: "Meetiva Global", users: 13847, plan: "Enterprise", color: "#06B6D4" },
  { name: "Enterprise Org", users: 4219, plan: "Business", color: "#4F46E5" },
  { name: "Dev Sandbox", users: 124, plan: "Developer", color: "#10B981" },
];

const kpis = [
  { label: "Total Users", value: "13,847", change: "+12.5%", up: true, icon: Users, color: "#06B6D4", spark: [8200, 8900, 9400, 10100, 10800, 11200, 11900, 12400, 12900, 13200, 13500, 13847] },
  { label: "Individual Users", value: "11,203", change: "+10.2%", up: true, icon: User, color: "#06B6D4", spark: [6800, 7200, 7800, 8300, 8900, 9400, 9800, 10200, 10600, 10900, 11100, 11203] },
  { label: "Team Accounts", value: "1,124", change: "+18.7%", up: true, icon: Users2, color: "#4F46E5", spark: [420, 480, 540, 620, 700, 780, 850, 920, 980, 1040, 1080, 1124] },
  { label: "Meetings Processed", value: "284,391", change: "+23.1%", up: true, icon: Video, color: "#10B981", spark: [180000, 195000, 210000, 225000, 238000, 248000, 256000, 264000, 272000, 278000, 282000, 284391] },
  { label: "Storage Used", value: "7.9 TB", change: "+8.3%", up: true, icon: HardDrive, color: "#F59E0B", spark: [4.2, 4.8, 5.3, 5.8, 6.2, 6.6, 7.0, 7.3, 7.5, 7.7, 7.8, 7.9] },
  { label: "Today's AI Requests", value: "98,412", change: "+31.4%", up: true, icon: Brain, color: "#8B5CF6", spark: [42000, 48000, 55000, 62000, 68000, 74000, 80000, 86000, 90000, 94000, 97000, 98412] },
];

const overviewData24H = [
  { label: "00:00", users: 420, meetings: 180, ai: 320 },
  { label: "02:00", users: 380, meetings: 150, ai: 290 },
  { label: "04:00", users: 340, meetings: 120, ai: 260 },
  { label: "06:00", users: 520, meetings: 210, ai: 410 },
  { label: "08:00", users: 890, meetings: 420, ai: 750 },
  { label: "10:00", users: 1240, meetings: 580, ai: 1100 },
  { label: "12:00", users: 1100, meetings: 520, ai: 980 },
  { label: "14:00", users: 1380, meetings: 640, ai: 1280 },
  { label: "16:00", users: 1200, meetings: 560, ai: 1050 },
  { label: "18:00", users: 860, meetings: 380, ai: 720 },
  { label: "20:00", users: 640, meetings: 280, ai: 520 },
  { label: "22:00", users: 480, meetings: 200, ai: 380 },
];

const overviewData7D = [
  { label: "Mon", users: 9800, meetings: 4200, ai: 8400 },
  { label: "Tue", users: 10200, meetings: 4500, ai: 8900 },
  { label: "Wed", users: 11400, meetings: 5100, ai: 9800 },
  { label: "Thu", users: 10800, meetings: 4800, ai: 9200 },
  { label: "Fri", users: 12100, meetings: 5400, ai: 10600 },
  { label: "Sat", users: 7200, meetings: 3100, ai: 6400 },
  { label: "Sun", users: 6800, meetings: 2800, ai: 5900 },
];

const overviewData30D = [
  { label: "W1", users: 42000, meetings: 18500, ai: 36000 },
  { label: "W2", users: 45200, meetings: 20100, ai: 39800 },
  { label: "W3", users: 48600, meetings: 22400, ai: 43200 },
  { label: "W4", users: 51000, meetings: 24000, ai: 46800 },
];

const ugData = [
  { label: "Feb", individual: 7200, team: 420 },
  { label: "Mar", individual: 7800, team: 480 },
  { label: "Apr", individual: 8400, team: 540 },
  { label: "May", individual: 9200, team: 620 },
  { label: "Jun", individual: 10100, team: 700 },
  { label: "Jul", individual: 11203, team: 850 },
];

const aiData = [
  { label: "Mon", gpt4: 12400, claude: 8200, llama: 3100 },
  { label: "Tue", gpt4: 13800, claude: 8900, llama: 3400 },
  { label: "Wed", gpt4: 15200, claude: 9600, llama: 3800 },
  { label: "Thu", gpt4: 14400, claude: 9200, llama: 3600 },
  { label: "Fri", gpt4: 16800, claude: 10400, llama: 4200 },
  { label: "Sat", gpt4: 9800, claude: 6400, llama: 2800 },
  { label: "Sun", gpt4: 8600, claude: 5800, llama: 2400 },
];

const stData = [
  { label: "Feb", used: 4.2 },
  { label: "Mar", used: 4.8 },
  { label: "Apr", used: 5.3 },
  { label: "May", used: 5.8 },
  { label: "Jun", used: 6.6 },
  { label: "Jul", used: 7.9 },
];

const recentActivity = [
  { icon: User, label: "New user registered", detail: "sarah.chen@corp.io joined Meetiva Global", badge: "New User", badgeColor: "#06B6D4", time: "2 min ago" },
  { icon: Users2, label: "Team created", detail: "Engineering Team with 12 members", badge: "Team", badgeColor: "#4F46E5", time: "18 min ago" },
  { icon: Brain, label: "AI quota warning", detail: "Enterprise Org at 87% of monthly limit", badge: "Warning", badgeColor: "#F59E0B", time: "45 min ago" },
  { icon: Video, label: "Meeting processed", detail: "42 new meetings synced successfully", badge: "Synced", badgeColor: "#10B981", time: "1 hr ago" },
  { icon: Shield, label: "Security alert", detail: "Unusual login attempt from new IP", badge: "Alert", badgeColor: "#EF4444", time: "2 hr ago" },
];

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

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function formatToday() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export { Dashboard };
export default function Dashboard({ onNav }: { onNav: (p: Page) => void }) {
  const [wsOpen, setWsOpen] = useState(false);
  const [activeWs, setActiveWs] = useState(0);
  const [period, setPeriod] = useState<"24H" | "7D" | "30D">("7D");
  const ddRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [meetingsStats, setMeetingsStats] = useState<{ totalMeetings: number; completedMeetings: number; totalDuration: number } | null>(null);
  const [teamsList, setTeamsList] = useState<{ name: string; members?: unknown[] }[]>([]);
  const [notifications, setNotifications] = useState<{ title: string; message: string; type: string; createdAt: string }[]>([]);
  const [userName, setUserName] = useState("Admin");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [mStats, tList, notifs, user] = await Promise.allSettled([
          meetingsApi.stats(),
          teamsApi.list(),
          notificationsApi.list(1, 5),
          authApi.me(),
        ]);
        if (mStats.status === "fulfilled") setMeetingsStats(mStats.value);
        if (tList.status === "fulfilled") setTeamsList((tList.value as { teams: unknown[] }).teams as { name: string }[]);
        if (notifs.status === "fulfilled") setNotifications((notifs.value as { data: unknown[] }).data as { title: string; message: string; type: string; createdAt: string }[]);
        if (user.status === "fulfilled") setUserName(user.value.name.split(" ")[0]);
      } catch {
        // API unavailable, use mock data
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ddRef.current && !ddRef.current.contains(e.target as Node)) setWsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const overviewData =
    period === "24H" ? overviewData24H : period === "7D" ? overviewData7D : overviewData30D;

  const ws = workspaces[activeWs];

  const dynamicKpis = [
    { label: "Total Users", value: meetingsStats ? "1" : "13,847", change: "+12.5%", up: true, icon: Users, color: "#06B6D4", spark: [8200, 8900, 9400, 10100, 10800, 11200, 11900, 12400, 12900, 13200, 13500, 13847] },
    { label: "Individual Users", value: "11,203", change: "+10.2%", up: true, icon: User, color: "#06B6D4", spark: [6800, 7200, 7800, 8300, 8900, 9400, 9800, 10200, 10600, 10900, 11100, 11203] },
    { label: "Team Accounts", value: teamsList.length > 0 ? String(teamsList.length) : "1,124", change: "+18.7%", up: true, icon: Users2, color: "#4F46E5", spark: [420, 480, 540, 620, 700, 780, 850, 920, 980, 1040, 1080, 1124] },
    { label: "Meetings Processed", value: meetingsStats ? meetingsStats.totalMeetings.toLocaleString() : "284,391", change: "+23.1%", up: true, icon: Video, color: "#10B981", spark: [180000, 195000, 210000, 225000, 238000, 248000, 256000, 264000, 272000, 278000, 282000, 284391] },
    { label: "Storage Used", value: "7.9 TB", change: "+8.3%", up: true, icon: HardDrive, color: "#F59E0B", spark: [4.2, 4.8, 5.3, 5.8, 6.2, 6.6, 7.0, 7.3, 7.5, 7.7, 7.8, 7.9] },
    { label: "Today's AI Requests", value: "98,412", change: "+31.4%", up: true, icon: Brain, color: "#8B5CF6", spark: [42000, 48000, 55000, 62000, 68000, 74000, 80000, 86000, 90000, 94000, 97000, 98412] },
  ];

  const dynamicActivity = notifications.length > 0
    ? notifications.map((n) => ({
        icon: n.type === "DEADLINE_REMINDER" ? AlertCircle : CheckCircle,
        label: n.title,
        detail: n.message,
        badge: n.type === "DEADLINE_REMINDER" ? "Reminder" : "System",
        badgeColor: n.type === "DEADLINE_REMINDER" ? "#F59E0B" : "#06B6D4",
        time: new Date(n.createdAt).toLocaleTimeString(),
      }))
    : recentActivity;

  return (
    <div className="min-h-screen" style={{ background: "#F5FEFF" }}>
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        {/* Greeting Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "#0F172A" }}>
              {getGreeting()}, {userName}
            </h1>
            <p className="text-sm mt-1" style={{ color: "#94A3B8" }}>
              {formatToday()} &mdash; Here&apos;s what&apos;s happening across your platform
            </p>
          </div>

          {/* Workspace Selector */}
          <div className="relative" ref={ddRef}>
            <button
              onClick={() => setWsOpen(!wsOpen)}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all hover:shadow-md"
              style={{ borderColor: "#E5F4F7", background: "white" }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: `${ws.color}18` }}
              >
                <Building2 size={16} style={{ color: ws.color }} />
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold" style={{ color: "#0F172A" }}>
                  {ws.name}
                </div>
                <div className="text-xs" style={{ color: "#94A3B8" }}>
                  {ws.users.toLocaleString()} users &middot; {ws.plan}
                </div>
              </div>
              <ChevronDown
                size={16}
                className={`transition-transform ${wsOpen ? "rotate-180" : ""}`}
                style={{ color: "#94A3B8" }}
              />
            </button>

            {wsOpen && (
              <div
                className="absolute right-0 mt-2 w-72 rounded-xl border shadow-lg z-50 overflow-hidden"
                style={{ borderColor: "#E5F4F7", background: "white" }}
              >
                {workspaces.map((w, i) => (
                  <button
                    key={w.name}
                    onClick={() => {
                      setActiveWs(i);
                      setWsOpen(false);
                      toast.success(`Switched to ${w.name}`);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50"
                    style={{
                      background: i === activeWs ? `${w.color}08` : undefined,
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: `${w.color}18` }}
                    >
                      <Building2 size={16} style={{ color: w.color }} />
                    </div>
                    <div className="text-left flex-1">
                      <div className="text-sm font-semibold" style={{ color: "#0F172A" }}>
                        {w.name}
                      </div>
                      <div className="text-xs" style={{ color: "#94A3B8" }}>
                        {w.users.toLocaleString()} users &middot; {w.plan}
                      </div>
                    </div>
                    {i === activeWs && <CheckCircle size={16} style={{ color: w.color }} />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-6 gap-4 mb-6">
          {dynamicKpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div
                key={kpi.label}
                className="rounded-2xl border p-4 transition-all hover:shadow-md"
                style={{ borderColor: "#E5F4F7", background: "white" }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${kpi.color}12` }}
                  >
                    <Icon size={18} style={{ color: kpi.color }} />
                  </div>
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      color: "#10B981",
                      background: "#10B98118",
                    }}
                  >
                    {kpi.change}
                  </span>
                </div>
                <div className="text-2xl font-bold mb-0.5" style={{ color: "#0F172A" }}>
                  {kpi.value}
                </div>
                <div className="text-xs mb-3" style={{ color: "#94A3B8" }}>
                  {kpi.label}
                </div>
                <DashSparkline data={kpi.spark} color={kpi.color} uid={kpi.label} />
              </div>
            );
          })}
        </div>

        {/* Platform Overview + Recent Activity */}
        <div className="grid grid-cols-12 gap-4 mb-6">
          {/* Platform Overview */}
          <div
            className="col-span-8 rounded-2xl border p-5"
            style={{ borderColor: "#E5F4F7", background: "white" }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold" style={{ color: "#0F172A" }}>
                  Platform Overview
                </h2>
                <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>
                  Users, meetings, and AI activity
                </p>
              </div>
              <div className="flex gap-1 p-0.5 rounded-lg" style={{ background: "#F0FDF9" }}>
                {(["24H", "7D", "30D"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className="px-3 py-1 text-xs font-semibold rounded-md transition-all"
                    style={{
                      background: period === p ? "#06B6D4" : "transparent",
                      color: period === p ? "white" : "#94A3B8",
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <OverviewAreaChart data={overviewData} period={period} />
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
          </div>

          {/* Recent Activity */}
          <div
            className="col-span-4 rounded-2xl border p-5"
            style={{ borderColor: "#E5F4F7", background: "white" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold" style={{ color: "#0F172A" }}>
                Recent Activity
              </h2>
              <button
                className="text-xs font-semibold flex items-center gap-1 transition-colors"
                style={{ color: "#06B6D4" }}
                onClick={() => toast.info("Viewing all activity")}
              >
                View All <ArrowRight size={12} />
              </button>
            </div>
            <div className="space-y-3">
              {dynamicActivity.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-xl transition-colors hover:bg-gray-50 cursor-pointer"
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: `${item.badgeColor}12` }}
                    >
                      <Icon size={16} style={{ color: item.badgeColor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-semibold" style={{ color: "#0F172A" }}>
                          {item.label}
                        </span>
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{ color: item.badgeColor, background: `${item.badgeColor}18` }}
                        >
                          {item.badge}
                        </span>
                      </div>
                      <p className="text-xs truncate" style={{ color: "#94A3B8" }}>
                        {item.detail}
                      </p>
                    </div>
                    <span className="text-[11px] whitespace-nowrap" style={{ color: "#94A3B8" }}>
                      {item.time}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3-Column Charts */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {/* User Growth */}
          <div
            className="rounded-2xl border p-5"
            style={{ borderColor: "#E5F4F7", background: "white" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold" style={{ color: "#0F172A" }}>
                User Growth
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ color: "#10B981", background: "#10B98118" }}>
                +24.3%
              </span>
            </div>
            <UserGrowthChart data={ugData} />
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#06B6D4" }} />
                <span className="text-xs" style={{ color: "#94A3B8" }}>Individual</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#4F46E5" }} />
                <span className="text-xs" style={{ color: "#94A3B8" }}>Teams</span>
              </div>
            </div>
          </div>

          {/* AI Usage */}
          <div
            className="rounded-2xl border p-5"
            style={{ borderColor: "#E5F4F7", background: "white" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold" style={{ color: "#0F172A" }}>
                AI Usage
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ color: "#8B5CF6", background: "#8B5CF618" }}>
                3 models
              </span>
            </div>
            <AiUsageChart data={aiData} />
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#06B6D4" }} />
                <span className="text-xs" style={{ color: "#94A3B8" }}>GPT-4o</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#4F46E5" }} />
                <span className="text-xs" style={{ color: "#94A3B8" }}>Claude</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#F59E0B" }} />
                <span className="text-xs" style={{ color: "#94A3B8" }}>LLaMA</span>
              </div>
            </div>
          </div>

          {/* Storage Usage */}
          <div
            className="rounded-2xl border p-5"
            style={{ borderColor: "#E5F4F7", background: "white" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold" style={{ color: "#0F172A" }}>
                Storage Usage
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ color: "#F59E0B", background: "#F59E0B18" }}>
                7.9 / 20 TB
              </span>
            </div>
            <StorageAreaChart data={stData} />
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs" style={{ color: "#94A3B8" }}>Disk usage</span>
                <span className="text-xs font-semibold" style={{ color: "#0F172A" }}>39.5%</span>
              </div>
              <div className="h-1.5 rounded-full" style={{ background: "#E5F4F7" }}>
                <div className="h-full rounded-full" style={{ background: "#EF4444", width: "39.5%" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-base font-bold mb-4" style={{ color: "#0F172A" }}>
            Quick Actions
          </h2>
          <div className="grid grid-cols-4 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  onClick={() => {
                    onNav(action.nav);
                    toast.success(`Navigating to ${action.label}`);
                  }}
                  className="flex items-center gap-3 p-4 rounded-2xl border transition-all hover:shadow-md group"
                  style={{ borderColor: "#E5F4F7", background: "white" }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                    style={{ background: `${action.color}12` }}
                  >
                    <Icon size={18} style={{ color: action.color }} />
                  </div>
                  <span className="text-sm font-semibold" style={{ color: "#0F172A" }}>
                    {action.label}
                  </span>
                  <ArrowRight
                    size={14}
                    className="ml-auto transition-transform group-hover:translate-x-1"
                    style={{ color: "#94A3B8" }}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}