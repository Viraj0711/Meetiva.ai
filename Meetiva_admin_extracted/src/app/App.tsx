import React, { useState, useMemo, useRef, useEffect } from "react";
import { toast, Toaster } from "sonner";
import {
  LayoutDashboard, Users, Users2, Brain, ScrollText, Settings,
  Bell, Search, TrendingUp, TrendingDown, HardDrive, Zap,
  Filter, Download, Plus, CheckCircle, XCircle, Clock, AlertCircle,
  LogOut, X, Eye, Trash2, Ban, ArrowUpRight, Menu, ChevronLeft,
  Building2, Activity, DollarSign, Timer, Database, Shield,
  Upload, CreditCard, Wrench, Key, Globe, RefreshCw, ChevronDown,
  User, MoreHorizontal, Hash, Mail, Layers,
  Sparkles, Send, Video, BarChart3, ArrowRight,
  Monitor, MapPin, Camera, Pencil
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

type Page = "dashboard" | "users" | "teams" | "organization" | "ai" | "logs" | "settings" | "profile";
type StatusV = "active" | "inactive" | "suspended" | "pending" | "verified" | "ok" | "error" | "warn";

// ── Mock Data ──────────────────────────────────────────────────────────────

const userGrowthData = [
  { month: "Feb", users: 4200, teams: 380 },
  { month: "Mar", users: 5100, teams: 470 },
  { month: "Apr", users: 6300, teams: 560 },
  { month: "May", users: 7800, teams: 690 },
  { month: "Jun", users: 9200, teams: 810 },
  { month: "Jul", users: 11400, teams: 950 },
  { month: "Aug", users: 13847, teams: 1124 },
];

const aiWeekData = [
  { day: "Mon", requests: 12400, tokens: 890 },
  { day: "Tue", requests: 15200, tokens: 1100 },
  { day: "Wed", requests: 13800, tokens: 950 },
  { day: "Thu", requests: 18900, tokens: 1380 },
  { day: "Fri", requests: 21200, tokens: 1560 },
  { day: "Sat", requests: 9800, tokens: 710 },
  { day: "Sun", requests: 7400, tokens: 530 },
];

const costTrendData = [
  { month: "Feb", cost: 1240 },
  { month: "Mar", cost: 1890 },
  { month: "Apr", cost: 2340 },
  { month: "May", cost: 3120 },
  { month: "Jun", cost: 4280 },
  { month: "Jul", cost: 5640 },
  { month: "Aug", cost: 7184 },
];

const responseTimeData = [
  { hour: "00:00", p50: 210, p95: 680 },
  { hour: "04:00", p50: 180, p95: 520 },
  { hour: "08:00", p50: 340, p95: 1100 },
  { hour: "12:00", p50: 290, p95: 890 },
  { hour: "16:00", p50: 270, p95: 810 },
  { hour: "20:00", p50: 220, p95: 640 },
];

const modelUsageData = [
  { name: "GPT-4o", value: 48, color: "#06B6D4" },
  { name: "Claude 3.5", value: 31, color: "#4F46E5" },
  { name: "Gemini Pro", value: 14, color: "#F59E0B" },
  { name: "Llama 3.1", value: 7, color: "#16A34A" },
];

const storageData = [
  { month: "Feb", used: 1.2 },
  { month: "Mar", used: 1.8 },
  { month: "Apr", used: 2.6 },
  { month: "May", used: 3.4 },
  { month: "Jun", used: 4.8 },
  { month: "Jul", used: 6.2 },
  { month: "Aug", used: 7.9 },
];

const mockAIRequests = [
  { id: "req-001", ts: "14:32:07", user: "sarah.chen@acme.com",        model: "GPT-4o",     tokens: 2847, latency: "312ms",  status: "ok",    cost: "$0.014" },
  { id: "req-002", ts: "14:31:54", user: "m.williams@orion.io",        model: "Claude 3.5", tokens: 1203, latency: "198ms",  status: "ok",    cost: "$0.006" },
  { id: "req-003", ts: "14:31:41", user: "priya.patel@nexus.co",       model: "GPT-4o",     tokens: 5120, latency: "541ms",  status: "ok",    cost: "$0.026" },
  { id: "req-004", ts: "14:31:28", user: "james@startco.io",           model: "Gemini Pro", tokens: 892,  latency: "2,104ms",status: "error", cost: "$0.000" },
  { id: "req-005", ts: "14:31:15", user: "a.tanaka@mitsuko.jp",        model: "Claude 3.5", tokens: 3641, latency: "287ms",  status: "ok",    cost: "$0.018" },
  { id: "req-006", ts: "14:30:59", user: "fatima@gulfventures.ae",     model: "Llama 3.1",  tokens: 1740, latency: "445ms",  status: "ok",    cost: "$0.003" },
  { id: "req-007", ts: "14:30:44", user: "r.kovacs@influx.eu",         model: "GPT-4o",     tokens: 4291, latency: "612ms",  status: "warn",  cost: "$0.022" },
  { id: "req-008", ts: "14:30:31", user: "l.santos@quanta.br",         model: "Claude 3.5", tokens: 987,  latency: "176ms",  status: "ok",    cost: "$0.005" },
  { id: "req-009", ts: "14:30:18", user: "k.oduya@centrix.ng",         model: "GPT-4o",     tokens: 3308, latency: "389ms",  status: "ok",    cost: "$0.017" },
  { id: "req-010", ts: "14:30:04", user: "e.berg@nordic.se",           model: "Gemini Pro", tokens: 1547, latency: "1,830ms",status: "warn",  cost: "$0.004" },
];

const recentActivity = [
  { id: 1, user: "Sarah Chen", action: "Upgraded to Enterprise", time: "2m ago", type: "upgrade" },
  { id: 2, user: "Marcus Williams", action: "Created new meeting", time: "8m ago", type: "meeting" },
  { id: 3, user: "Priya Patel", action: "Invited 5 members", time: "14m ago", type: "invite" },
  { id: 4, user: "System", action: "AI token quota warning (90%)", time: "31m ago", type: "warning" },
  { id: 5, user: "James O'Brien", action: "Account suspended", time: "1h ago", type: "suspend" },
  { id: 6, user: "Aiko Tanaka", action: "Storage limit reached", time: "2h ago", type: "warning" },
];

const mockUsers = [
  { id: "u1", name: "Sarah Chen", email: "sarah.chen@acme.com", role: "Admin", plan: "Enterprise", status: "active" as StatusV, storage: "4.2 GB", meetings: 284, joined: "Jan 12, 2024", avatar: "SC" },
  { id: "u2", name: "Marcus Williams", email: "m.williams@orion.io", role: "Member", plan: "Pro", status: "active" as StatusV, storage: "1.8 GB", meetings: 127, joined: "Mar 5, 2024", avatar: "MW" },
  { id: "u3", name: "Priya Patel", email: "priya@nexus.tech", role: "Owner", plan: "Enterprise", status: "active" as StatusV, storage: "12.4 GB", meetings: 512, joined: "Nov 8, 2023", avatar: "PP" },
  { id: "u4", name: "James O'Brien", email: "james@startco.io", role: "Member", plan: "Free", status: "suspended" as StatusV, storage: "0.3 GB", meetings: 18, joined: "Jun 22, 2024", avatar: "JO" },
  { id: "u5", name: "Aiko Tanaka", email: "aiko.tanaka@mitsuko.jp", role: "Admin", plan: "Pro", status: "active" as StatusV, storage: "3.1 GB", meetings: 203, joined: "Feb 14, 2024", avatar: "AT" },
  { id: "u6", name: "Diego Reyes", email: "d.reyes@latam.co", role: "Member", plan: "Pro", status: "inactive" as StatusV, storage: "0.8 GB", meetings: 44, joined: "May 1, 2024", avatar: "DR" },
  { id: "u7", name: "Fatima Al-Hassan", email: "f.alhassan@gulf.ae", role: "Owner", plan: "Enterprise", status: "active" as StatusV, storage: "8.7 GB", meetings: 378, joined: "Dec 3, 2023", avatar: "FA" },
  { id: "u8", name: "Tom Eriksson", email: "tom.e@nordic.se", role: "Member", plan: "Free", status: "active" as StatusV, storage: "0.1 GB", meetings: 7, joined: "Jul 30, 2024", avatar: "TE" },
];

const mockTeams = [
  { id: "t1", name: "Acme Corporation", owner: "Sarah Chen", members: 47, status: "verified" as StatusV, created: "Jan 12, 2024", plan: "Enterprise" },
  { id: "t2", name: "Orion Labs", owner: "Marcus Williams", members: 12, status: "verified" as StatusV, created: "Mar 5, 2024", plan: "Pro" },
  { id: "t3", name: "Nexus Technologies", owner: "Priya Patel", members: 128, status: "verified" as StatusV, created: "Nov 8, 2023", plan: "Enterprise" },
  { id: "t4", name: "StartCo", owner: "James O'Brien", members: 4, status: "pending" as StatusV, created: "Jun 22, 2024", plan: "Free" },
  { id: "t5", name: "Mitsuko Digital", owner: "Aiko Tanaka", members: 33, status: "verified" as StatusV, created: "Feb 14, 2024", plan: "Pro" },
  { id: "t6", name: "Gulf Ventures", owner: "Fatima Al-Hassan", members: 89, status: "suspended" as StatusV, created: "Dec 3, 2023", plan: "Enterprise" },
];

const mockLogs = [
  { id: "l1", ts: "2024-08-01 14:32:17", user: "sarah.chen@acme.com", service: "meeting-service", event: "Meeting session ended cleanly", status: "ok" as StatusV, latency: "124ms" },
  { id: "l2", ts: "2024-08-01 14:31:02", user: "system", service: "ai-gateway", event: "Token limit exceeded for org acme-corp", status: "error" as StatusV, latency: "2301ms" },
  { id: "l3", ts: "2024-08-01 14:29:44", user: "priya@nexus.tech", service: "auth-service", event: "Login successful via SSO", status: "ok" as StatusV, latency: "48ms" },
  { id: "l4", ts: "2024-08-01 14:27:11", user: "system", service: "storage-service", event: "Bucket quota at 90% for mitsuko-digital", status: "warn" as StatusV, latency: "89ms" },
  { id: "l5", ts: "2024-08-01 14:24:58", user: "m.williams@orion.io", service: "meeting-service", event: "Recording started (1080p)", status: "ok" as StatusV, latency: "203ms" },
  { id: "l6", ts: "2024-08-01 14:22:33", user: "system", service: "billing-service", event: "Invoice generation failed — Stripe timeout", status: "error" as StatusV, latency: "5012ms" },
  { id: "l7", ts: "2024-08-01 14:20:19", user: "tom.e@nordic.se", service: "auth-service", event: "Password reset requested", status: "ok" as StatusV, latency: "67ms" },
  { id: "l8", ts: "2024-08-01 14:18:07", user: "system", service: "ai-gateway", event: "Primary model fallback triggered → GPT-4o-mini", status: "warn" as StatusV, latency: "890ms" },
  { id: "l9", ts: "2024-08-01 14:15:44", user: "aiko.tanaka@mitsuko.jp", service: "meeting-service", event: "Meeting scheduled for 2024-08-05 09:00 JST", status: "ok" as StatusV, latency: "156ms" },
  { id: "l10", ts: "2024-08-01 14:12:28", user: "system", service: "storage-service", event: "Multipart upload completed (2.3 GB)", status: "ok" as StatusV, latency: "412ms" },
];

const liveActivity = [
  { id: "a1",  group: "Today",     color: "#10B981", dot: "bg-emerald-400", initials: "SC", title: "Sarah Chen joined Acme Corp",              time: "2m ago"  },
  { id: "a2",  group: "Today",     color: "#06B6D4", dot: "bg-cyan-400",    initials: "MW", title: "Meeting #MV-9012 completed successfully",  time: "8m ago"  },
  { id: "a3",  group: "Today",     color: "#F59E0B", dot: "bg-amber-400",   initials: "!",  title: "AI quota warning — Acme Corp at 90%",      time: "31m ago" },
  { id: "a4",  group: "Today",     color: "#4F46E5", dot: "bg-indigo-400",  initials: "PP", title: "Priya Patel invited 5 team members",       time: "1h ago"  },
  { id: "a5",  group: "Today",     color: "#EF4444", dot: "bg-red-400",     initials: "!",  title: "Billing failure — Stripe timeout",          time: "2h ago"  },
  { id: "a6",  group: "Yesterday", color: "#10B981", dot: "bg-emerald-400", initials: "AT", title: "Mitsuko Digital plan upgraded to Pro",     time: "Yesterday" },
  { id: "a7",  group: "Yesterday", color: "#06B6D4", dot: "bg-cyan-400",    initials: "JO", title: "James O'Brien account suspended",          time: "Yesterday" },
  { id: "a8",  group: "Yesterday", color: "#4F46E5", dot: "bg-indigo-400",  initials: "FA", title: "Gulf Ventures added 12 new members",       time: "Yesterday" },
];

const presetPrompts = [
  "How many users joined today?",
  "Show failed meetings",
  "Find inactive teams",
  "Generate weekly report",
  "Show AI cost breakdown",
];

function getAIResponse(input: string): string {
  const q = input.toLowerCase();
  if (q.includes("user") || q.includes("joined")) return "Today, **127 new users** joined Meetiva — 98 individual accounts and 29 through team invitations. Your 30-day growth rate is **+34.7%**, trending above forecast.\n\nTop acquisition: Direct (48%), Google SSO (31%), Invitation (21%).";
  if (q.includes("fail") || q.includes("error")) return "Found **3 failed meetings** in the last 24 hours:\n\n• Meeting #MV-8821 — Acme Corp, 14:32 (pipeline timeout)\n• Meeting #MV-8803 — Orion Labs, 11:15 (codec error)\n• Meeting #MV-8794 — StartCo, 09:48 (storage write fail)\n\nAll three are recording pipeline failures. Recommend checking the storage service logs.";
  if (q.includes("inactive") || q.includes("team")) return "**4 teams** haven't processed a meeting in 30+ days:\n\n• BrightPath Inc. — 45 days inactive\n• Mitsuko Digital — 38 days inactive\n• Gulf Ventures — suspended\n• StartCo — pending verification";
  if (q.includes("report") || q.includes("weekly")) return "**Week of Jul 28 – Aug 3, 2024:**\n\n• 12,847 meetings processed (+22%)\n• 3.4M AI tokens consumed · $1,241 AI spend\n• 127 new users · 2 new teams verified\n• Net new ARR: +$24,800\n\nOverall platform health: **Excellent**.";
  if (q.includes("ai") || q.includes("cost") || q.includes("token")) return "**AI spend this month:** $7,184\n\n• GPT-4o — $3,448 (48%)\n• Claude 3.5 — $2,228 (31%)\n• Gemini Pro — $1,007 (14%)\n• Llama 3.1 — $501 (7%)\n\nDaily average: $284. On track to hit ~$8,500 by month end.";
  return `I searched the platform for **"${input}"** and found relevant data across users, meetings, and AI logs. Would you like me to narrow down the results or generate a full detailed report?`;
}

type ChatMsg = { id: string; role: "user" | "ai"; text: string };

function renderAIText(text: string): React.ReactNode {
  return text.split("\n").map((line, i, arr) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g).map((seg, j) =>
      seg.startsWith("**") && seg.endsWith("**")
        ? <strong key={j} className="font-semibold text-[#0F172A]">{seg.slice(2, -2)}</strong>
        : seg
    );
    return <span key={i}>{parts}{i < arr.length - 1 ? <br /> : null}</span>;
  });
}

// ── Utility Components ─────────────────────────────────────────────────────

const statusStyles: Record<StatusV, string> = {
  active: "bg-green-50 text-green-700 border border-green-200",
  verified: "bg-green-50 text-green-700 border border-green-200",
  ok: "bg-green-50 text-green-700 border border-green-200",
  inactive: "bg-slate-100 text-slate-500 border border-slate-200",
  pending: "bg-amber-50 text-amber-700 border border-amber-200",
  warn: "bg-amber-50 text-amber-700 border border-amber-200",
  suspended: "bg-red-50 text-red-600 border border-red-200",
  error: "bg-red-50 text-red-600 border border-red-200",
};

const statusDot: Record<StatusV, string> = {
  active: "bg-green-500",
  verified: "bg-green-500",
  ok: "bg-green-500",
  inactive: "bg-slate-400",
  pending: "bg-amber-500",
  warn: "bg-amber-500",
  suspended: "bg-red-500",
  error: "bg-red-500",
};

function Badge({ variant, children }: { variant: StatusV; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium font-mono tracking-tight ${statusStyles[variant]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${statusDot[variant]}`} />
      {children}
    </span>
  );
}

function Av({ initials, size = "sm" }: { initials: string; size?: "sm" | "md" | "lg" }) {
  const sz = size === "sm" ? "w-7 h-7 text-[11px]" : size === "md" ? "w-9 h-9 text-sm" : "w-11 h-11 text-base";
  return (
    <div className={`${sz} rounded-full bg-cyan-100 text-cyan-700 font-semibold flex items-center justify-center flex-shrink-0 select-none`}>
      {initials}
    </div>
  );
}

function Btn({
  children, variant = "primary", size = "md", icon: Icon, onClick, danger,
}: {
  children?: React.ReactNode; variant?: "primary" | "secondary" | "ghost"; size?: "sm" | "md";
  icon?: React.ElementType; onClick?: () => void; danger?: boolean;
}) {
  const base = "inline-flex items-center gap-1.5 font-medium rounded-xl transition-all duration-150 cursor-pointer select-none whitespace-nowrap";
  const sz = size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm";
  const vars = {
    primary: danger ? "bg-red-500 hover:bg-red-600 text-white shadow-sm" : "bg-[#06B6D4] hover:bg-[#0891B2] text-white shadow-sm",
    secondary: "bg-white hover:bg-[#F5FEFF] text-[#111827] border border-[#E5F4F7] shadow-sm",
    ghost: danger ? "text-red-500 hover:bg-red-50" : "text-[#4B5563] hover:bg-[#EFF9FB]",
  };
  return (
    <button className={`${base} ${sz} ${vars[variant]}`} onClick={onClick}>
      {Icon && <Icon size={size === "sm" ? 13 : 15} />}
      {children}
    </button>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-[#E5F4F7] shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div>
        <h2 className="text-base font-semibold text-[#111827]" style={{ fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>{title}</h2>
        {subtitle && <p className="text-xs text-[#94A3B8] mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function Input({ placeholder, icon: Icon, value, onChange }: {
  placeholder: string; icon?: React.ElementType; value?: string;
  onChange?: (v: string) => void;
}) {
  return (
    <div className="relative">
      {Icon && <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />}
      <input
        className={`${Icon ? "pl-9" : "pl-3"} pr-3 py-2 text-sm bg-white border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/10 transition-all w-full placeholder:text-[#94A3B8] text-[#111827]`}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange?.(e.target.value)}
      />
    </div>
  );
}

// ── SVG Chart Primitives ───────────────────────────────────────────────────

type NumRecord = Record<string, number | string>;

function svgPath(points: { x: number; y: number }[], smooth = false): string {
  if (points.length < 2) return "";
  if (!smooth) return points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx = (prev.x + curr.x) / 2;
    d += ` C${cpx},${prev.y} ${cpx},${curr.y} ${curr.x},${curr.y}`;
  }
  return d;
}

function SvgAreaChart({ data, keys, colors, labels, uid }: {
  data: NumRecord[]; keys: string[]; colors: string[]; labels?: string[]; uid: string;
}) {
  const [hov, setHov] = useState<number | null>(null);
  const W = 560; const H = 160; const PAD = { t: 10, r: 8, b: 30, l: 38 };
  const cW = W - PAD.l - PAD.r; const cH = H - PAD.t - PAD.b;
  const allVals = data.flatMap(d => keys.map(k => Number(d[k])));
  const maxVal = Math.max(...allVals) || 1;
  const pts = (key: string) => data.map((d, i) => ({
    x: PAD.l + (i / (data.length - 1)) * cW,
    y: PAD.t + cH - (Number(d[key]) / maxVal) * cH,
  }));
  const xLabels = data.map((d, i) => ({ x: PAD.l + (i / (data.length - 1)) * cW, label: String(d.month ?? d.day ?? d.hour ?? i) }));
  const yTicks = [0, 0.5, 1].map(f => ({ y: PAD.t + cH - f * cH, val: Math.round(maxVal * f) }));
  const colW = data.length > 1 ? cW / (data.length - 1) : cW;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      <defs>
        {keys.map((k, i) => (
          <linearGradient key={`${uid}-g${i}`} id={`${uid}-g${i}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors[i]} stopOpacity={0.18} />
            <stop offset="100%" stopColor={colors[i]} stopOpacity={0} />
          </linearGradient>
        ))}
      </defs>
      {yTicks.map((t, ti) => (
        <g key={`${uid}-yt-${ti}`}>
          <line x1={PAD.l} x2={W - PAD.r} y1={t.y} y2={t.y} stroke="#E5F4F7" strokeDasharray="3 3" />
          <text x={PAD.l - 6} y={t.y + 4} textAnchor="end" fontSize={9} fill="#94A3B8" fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace">
            {t.val >= 1000 ? `${(t.val / 1000).toFixed(0)}k` : t.val}
          </text>
        </g>
      ))}
      {keys.map((k, i) => {
        const p = pts(k);
        const linePath = svgPath(p, true);
        const areaPath = `${linePath} L${p[p.length - 1].x},${PAD.t + cH} L${p[0].x},${PAD.t + cH} Z`;
        return (
          <g key={`${uid}-area-${i}`}>
            <path d={areaPath} fill={`url(#${uid}-g${i})`} />
            <path d={linePath} fill="none" stroke={colors[i]} strokeWidth={2} strokeLinejoin="round" />
          </g>
        );
      })}
      {/* Hover dots */}
      {hov !== null && keys.map((k, i) => {
        const p = pts(k);
        return <circle key={`${uid}-hd-${i}`} cx={p[hov].x} cy={p[hov].y} r={4} fill="white" stroke={colors[i]} strokeWidth={2} />;
      })}
      {/* Hit zones */}
      {data.map((d, i) => {
        const x0 = PAD.l + (i / (data.length - 1)) * cW;
        return (
          <rect key={`${uid}-hz-${i}`} x={x0 - colW / 2} y={PAD.t} width={colW} height={cH}
            fill="transparent" style={{ cursor: "crosshair" }}
            onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)} />
        );
      })}
      {/* Tooltip */}
      {hov !== null && (() => {
        const d = data[hov];
        const tx = PAD.l + (hov / (data.length - 1)) * cW;
        const tw = 120, th = 14 + keys.length * 18 + 10;
        const bx = Math.max(tw / 2 + PAD.l, Math.min(W - PAD.r - tw / 2, tx));
        const by = PAD.t + 4;
        return (
          <g pointerEvents="none">
            <line x1={tx} y1={PAD.t} x2={tx} y2={PAD.t + cH} stroke={colors[0]} strokeWidth="1" strokeDasharray="3,2" opacity="0.35" />
            <rect x={bx - tw / 2} y={by} width={tw} height={th} rx="7" fill="white" stroke="#D9F2F8" strokeWidth="1" />
            <text x={bx} y={by + 14} textAnchor="middle" fill="#0891B2" fontSize="9" fontFamily="Inter,sans-serif" fontWeight="600">
              {String(d.month ?? d.day ?? d.hour ?? hov)}
            </text>
            {keys.map((k, i) => (
              <g key={k}>
                <circle cx={bx - tw / 2 + 12} cy={by + 24 + i * 18} r="3" fill={colors[i]} />
                <text x={bx - tw / 2 + 20} y={by + 28 + i * 18} fill={colors[i]} fontSize="10" fontWeight="700" fontFamily="Inter,sans-serif">
                  {Number(d[k]) >= 1000 ? `${(Number(d[k]) / 1000).toFixed(1)}k` : String(d[k])}
                </text>
                {labels && <text x={bx + tw / 2 - 6} y={by + 28 + i * 18} textAnchor="end" fill="#94A3B8" fontSize="9" fontFamily="Inter,sans-serif">{labels[i]}</text>}
              </g>
            ))}
          </g>
        );
      })()}
      {xLabels.map(({ x, label }, xi) => (
        <text key={`${uid}-xl-${xi}`} x={x} y={H - 6} textAnchor="middle" fontSize={9}
          fill={hov === xi ? "#374151" : "#94A3B8"} fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace">{label}</text>
      ))}
    </svg>
  );
}

function SvgBarChart({ data, dataKey, color, uid }: {
  data: NumRecord[]; dataKey: string; color: string; uid: string;
}) {
  const W = 400; const H = 160; const PAD = { t: 10, r: 8, b: 30, l: 38 };
  const cW = W - PAD.l - PAD.r; const cH = H - PAD.t - PAD.b;
  const maxVal = Math.max(...data.map(d => Number(d[dataKey]))) || 1;
  const barW = Math.max(6, (cW / data.length) * 0.55);
  const gap = cW / data.length;
  const yTicks = [0, 0.5, 1].map(f => ({ y: PAD.t + cH - f * cH, val: Math.round(maxVal * f) }));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      {yTicks.map((t, ti) => (
        <g key={`${uid}-yt-${ti}`}>
          <line x1={PAD.l} x2={W - PAD.r} y1={t.y} y2={t.y} stroke="#E5F4F7" strokeDasharray="3 3" />
          <text x={PAD.l - 6} y={t.y + 4} textAnchor="end" fontSize={9} fill="#94A3B8" fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace">
            {t.val >= 1000 ? `${(t.val / 1000).toFixed(0)}k` : t.val}
          </text>
        </g>
      ))}
      {data.map((d, i) => {
        const barH = (Number(d[dataKey]) / maxVal) * cH;
        const x = PAD.l + i * gap + gap / 2 - barW / 2;
        const y = PAD.t + cH - barH;
        const label = String(d.day ?? d.month ?? i);
        return (
          <g key={`${uid}-bar-${i}`}>
            <rect x={x} y={y} width={barW} height={barH} rx={4} fill={color} opacity={0.85} />
            <text x={x + barW / 2} y={H - 6} textAnchor="middle" fontSize={9} fill="#94A3B8" fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace">{label}</text>
          </g>
        );
      })}
    </svg>
  );
}

function SvgLineChart({ data, keys, colors, labels, uid }: {
  data: NumRecord[]; keys: string[]; colors: string[]; labels?: string[]; uid: string;
}) {
  const [hov, setHov] = useState<number | null>(null);
  const W = 400; const H = 160; const PAD = { t: 10, r: 8, b: 30, l: 42 };
  const cW = W - PAD.l - PAD.r; const cH = H - PAD.t - PAD.b;
  const allVals = data.flatMap(d => keys.map(k => Number(d[k])));
  const maxVal = Math.max(...allVals) || 1;
  const pts = (key: string) => data.map((d, i) => ({
    x: PAD.l + (i / (data.length - 1)) * cW,
    y: PAD.t + cH - (Number(d[key]) / maxVal) * cH,
  }));
  const xLabels = data.map((d, i) => ({ x: PAD.l + (i / (data.length - 1)) * cW, label: String(d.month ?? d.day ?? d.hour ?? i) }));
  const yTicks = [0, 0.5, 1].map(f => ({ y: PAD.t + cH - f * cH, val: Math.round(maxVal * f) }));
  const colW = data.length > 1 ? cW / (data.length - 1) : cW;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      {yTicks.map((t, ti) => (
        <g key={`${uid}-yt-${ti}`}>
          <line x1={PAD.l} x2={W - PAD.r} y1={t.y} y2={t.y} stroke="#E5F4F7" strokeDasharray="3 3" />
          <text x={PAD.l - 6} y={t.y + 4} textAnchor="end" fontSize={9} fill="#94A3B8" fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace">
            {t.val >= 1000 ? `${(t.val / 1000).toFixed(0)}k` : t.val}
          </text>
        </g>
      ))}
      {keys.map((k, i) => {
        const p = pts(k);
        return (
          <g key={`${uid}-line-${i}`}>
            <path d={svgPath(p, true)} fill="none" stroke={colors[i]} strokeWidth={2}
              strokeDasharray={i === 1 ? "5 3" : undefined} strokeLinejoin="round" />
            {p.map((pt, j) => (
              <circle key={`${uid}-dot-${i}-${j}`} cx={pt.x} cy={pt.y}
                r={hov === j ? 5 : 2.5}
                fill={hov === j ? colors[i] : colors[i]} stroke="white"
                strokeWidth={hov === j ? 1.5 : 0} />
            ))}
          </g>
        );
      })}
      {/* Crosshair + tooltip */}
      {hov !== null && (() => {
        const d = data[hov];
        const tx = PAD.l + (hov / (data.length - 1)) * cW;
        const tw = 130, th = 14 + keys.length * 18 + 10;
        const bx = Math.max(tw / 2 + PAD.l, Math.min(W - PAD.r - tw / 2, tx));
        const by = PAD.t + 4;
        return (
          <g pointerEvents="none" style={{filter:"drop-shadow(0 4px 18px rgba(6,182,212,0.18))"}}>
            <line x1={tx} y1={PAD.t} x2={tx} y2={PAD.t + cH} stroke="#06B6D4" strokeWidth="1" strokeDasharray="3,2" opacity="0.3" />
            <rect x={bx - tw / 2} y={by} width={tw} height={th} rx="7" fill="white" stroke="#D9F2F8" strokeWidth="1" />
            <text x={bx} y={by + 14} textAnchor="middle" fill="#0891B2" fontSize="9" fontWeight="600" fontFamily="Inter,sans-serif">
              {String(d.month ?? d.day ?? d.hour ?? hov)}
            </text>
            {keys.map((k, i) => (
              <g key={k}>
                <circle cx={bx - tw / 2 + 12} cy={by + 24 + i * 18} r="3" fill={colors[i]} />
                <text x={bx - tw / 2 + 20} y={by + 28 + i * 18} fill={colors[i]} fontSize="10" fontWeight="700" fontFamily="Inter,sans-serif">
                  {Number(d[k]) >= 1000 ? `${(Number(d[k]) / 1000).toFixed(1)}k` : `${Number(d[k])} ms`}
                </text>
                {labels && <text x={bx + tw / 2 - 6} y={by + 28 + i * 18} textAnchor="end" fill="#94A3B8" fontSize="9" fontFamily="Inter,sans-serif">{labels[i]}</text>}
              </g>
            ))}
          </g>
        );
      })()}
      {/* Hit zones */}
      {data.map((_, i) => {
        const x0 = PAD.l + (i / (data.length - 1)) * cW;
        return (
          <rect key={`${uid}-hz-${i}`} x={x0 - colW / 2} y={PAD.t} width={colW} height={cH}
            fill="transparent" style={{ cursor: "crosshair" }}
            onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)} />
        );
      })}
      {xLabels.map(({ x, label }, xi) => (
        <text key={`${uid}-xl-${xi}`} x={x} y={H - 6} textAnchor="middle" fontSize={9}
          fill={hov === xi ? "#374151" : "#94A3B8"} fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace">{label}</text>
      ))}
      {labels && (
        <g>
          {keys.map((k, i) => (
            <g key={k} transform={`translate(${PAD.l + i * 90}, ${H - 2})`}>
              <line x1={0} y1={-5} x2={10} y2={-5} stroke={colors[i]} strokeWidth={2} strokeDasharray={i === 1 ? "4 2" : undefined} />
              <text x={14} y={-2} fontSize={9} fill="#94A3B8" fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace">{labels[i]}</text>
            </g>
          ))}
        </g>
      )}
    </svg>
  );
}

function SvgDonutChart({ data, uid }: {
  data: { name: string; value: number; color: string }[]; uid: string;
}) {
  const [hov, setHov] = useState<number | null>(null);
  const size = 160; const cx = size / 2; const cy = size / 2;
  const outerR = 68; const innerR = 44;
  const total = data.reduce((s, d) => s + d.value, 0);
  let startAngle = -Math.PI / 2;
  const slices = data.map((d, idx) => {
    const angle = (d.value / total) * 2 * Math.PI;
    const endAngle = startAngle + angle;
    const x1 = cx + outerR * Math.cos(startAngle); const y1 = cy + outerR * Math.sin(startAngle);
    const x2 = cx + outerR * Math.cos(endAngle); const y2 = cy + outerR * Math.sin(endAngle);
    const ix1 = cx + innerR * Math.cos(endAngle); const iy1 = cy + innerR * Math.sin(endAngle);
    const ix2 = cx + innerR * Math.cos(startAngle); const iy2 = cy + innerR * Math.sin(startAngle);
    const large = angle > Math.PI ? 1 : 0;
    const path = `M${x1},${y1} A${outerR},${outerR} 0 ${large} 1 ${x2},${y2} L${ix1},${iy1} A${innerR},${innerR} 0 ${large} 0 ${ix2},${iy2} Z`;
    const result = { ...d, path, idx };
    startAngle = endAngle;
    return result;
  });
  const hovSlice = hov !== null ? slices[hov] : null;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
      {slices.map((s, i) => (
        <path key={`${uid}-slice-${i}`} d={s.path}
          fill={s.color}
          opacity={hov === null || hov === i ? 0.9 : 0.4}
          style={{ cursor: "pointer", transition: "opacity 0.15s" }}
          onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)} />
      ))}
      <circle cx={cx} cy={cy} r={innerR} fill="white" />
      {hovSlice ? (
        <>
          <text x={cx} y={cy - 8} textAnchor="middle" fill={hovSlice.color} fontSize="12" fontWeight="800" fontFamily="Inter,sans-serif">{hovSlice.value}%</text>
          <text x={cx} y={cy + 5} textAnchor="middle" fill="#64748B" fontSize="8" fontFamily="Inter,sans-serif">{hovSlice.name}</text>
        </>
      ) : (
        <text x={cx} y={cy + 4} textAnchor="middle" fill="#94A3B8" fontSize="9" fontFamily="Inter,sans-serif">hover</text>
      )}
    </svg>
  );
}

// ── Profile Edit Panel ─────────────────────────────────────────────────────

// ── Profile Page ───────────────────────────────────────────────────────────

function ProfilePage() {
  const [form, setForm] = useState({
    name:       "Super Admin",
    email:      "admin@meetiva.com",
    phone:      "+1 (555) 000-0000",
    role:       "Super Administrator",
    department: "Platform Operations",
    location:   "San Francisco, CA",
    timezone:   "UTC−8 Pacific Time",
    bio:        "Platform administrator with full access to all Meetiva workspaces and system configuration. Responsible for user management, billing, and infrastructure oversight.",
  });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(form);

  const set = (k: keyof typeof draft) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setDraft(d => ({ ...d, [k]: e.target.value }));

  const handleEdit  = () => { setDraft(form); setEditing(true); };
  const handleCancel = () => setEditing(false);
  const handleSave  = () => { setForm(draft); setEditing(false); toast.success("Profile updated successfully"); };

  const initials = form.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  const Field = ({ label, value, k, type = "text", full = false }: {
    label: string; value: string; k: keyof typeof draft; type?: string; full?: boolean;
  }) => (
    <div className={full ? "col-span-2" : ""}>
      <label className="block text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">{label}</label>
      {editing ? (
        <input
          type={type}
          value={draft[k]}
          onChange={set(k)}
          className="w-full px-3 py-2.5 text-[13px] text-[#0F172A] bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/10 transition-all"
        />
      ) : (
        <p className="text-[13px] text-[#0F172A] font-medium py-2.5 px-3 bg-[#F8FDFE] rounded-xl border border-[#E5F4F7]">{value}</p>
      )}
    </div>
  );

  const readonlyFields = [
    { label: "User ID",        value: "ADM-000001" },
    { label: "Account Type",   value: "Super Administrator" },
    { label: "Member Since",   value: "January 12, 2022" },
    { label: "Last Login",     value: "Today at 09:41 AM" },
    { label: "Last IP",        value: "192.168.1.1" },
    { label: "2FA Status",     value: "Enabled (Authenticator App)" },
  ];

  const activityStats = [
    { label: "Users Managed",   value: "13,847" },
    { label: "Teams Overseen",  value: "1,124"  },
    { label: "Logs Reviewed",   value: "48,291" },
    { label: "Settings Changed", value: "214"   },
  ];

  return (
    <div className="min-h-full bg-[#F5FEFF]">
      <div className="max-w-4xl mx-auto px-8 py-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-[#0F172A] tracking-tight">My Profile</h1>
            <p className="text-[12px] text-[#94A3B8] mt-0.5">View and manage your account information</p>
          </div>
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <button onClick={handleCancel}
                  className="px-4 py-2 rounded-xl border border-[#E5F4F7] text-[12px] font-semibold text-[#64748B] hover:bg-white transition-colors cursor-pointer">
                  Cancel
                </button>
                <button onClick={handleSave}
                  className="px-4 py-2 rounded-xl bg-[#06B6D4] text-white text-[12px] font-semibold hover:bg-[#0891B2] transition-colors cursor-pointer flex items-center gap-1.5">
                  <CheckCircle size={13} /> Save changes
                </button>
              </>
            ) : (
              <button onClick={handleEdit}
                className="px-4 py-2 rounded-xl bg-white border border-[#E5F4F7] text-[12px] font-semibold text-[#0F172A] hover:border-[#06B6D4] hover:text-[#06B6D4] transition-all cursor-pointer flex items-center gap-1.5 shadow-sm">
                <Pencil size={13} /> Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Profile card */}
        <div className="bg-white rounded-2xl border border-[#E5F4F7] shadow-sm overflow-hidden">
          {/* Cover */}
          <div className="h-24 bg-gradient-to-r from-[#06B6D4] to-[#4F46E5]" />
          <div className="px-6 pb-6">
            <div className="flex items-end gap-4 -mt-10 mb-5">
              <div className="w-20 h-20 rounded-2xl bg-[#4F46E5] text-white text-[26px] font-bold flex items-center justify-center border-4 border-white shadow-lg flex-shrink-0">
                {initials}
              </div>
              <div className="pb-1">
                <h2 className="text-[18px] font-bold text-[#0F172A] leading-tight">{form.name}</h2>
                <p className="text-[12px] text-[#94A3B8] mt-0.5">{form.role} · {form.department}</p>
              </div>
              {!editing && (
                <button onClick={() => toast.info("Photo upload coming soon")}
                  className="ml-auto pb-1 flex items-center gap-1.5 text-[11px] font-semibold text-[#06B6D4] hover:text-[#0891B2] transition-colors cursor-pointer">
                  <Camera size={12} /> Change photo
                </button>
              )}
            </div>

            {/* Bio */}
            <div className="mb-5">
              <label className="block text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">Bio</label>
              {editing ? (
                <textarea
                  value={draft.bio}
                  onChange={set("bio")}
                  rows={3}
                  className="w-full px-3 py-2.5 text-[13px] text-[#0F172A] bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/10 transition-all resize-none"
                />
              ) : (
                <p className="text-[13px] text-[#64748B] leading-relaxed">{form.bio}</p>
              )}
            </div>

            {/* Editable fields grid */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Full Name"   value={form.name}       k="name" />
              <Field label="Email"       value={form.email}      k="email" type="email" />
              <Field label="Phone"       value={form.phone}      k="phone" type="tel" />
              <Field label="Role"        value={form.role}       k="role" />
              <Field label="Department"  value={form.department} k="department" />
              <Field label="Location"    value={form.location}   k="location" />
              <Field label="Timezone"    value={form.timezone}   k="timezone" full />
            </div>
          </div>
        </div>

        {/* Account details (read-only) */}
        <div className="bg-white rounded-2xl border border-[#E5F4F7] shadow-sm p-6">
          <h3 className="text-[14px] font-bold text-[#0F172A] mb-4">Account Details</h3>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            {readonlyFields.map(f => (
              <div key={f.label} className="flex items-center justify-between py-2.5 border-b border-[#F1F9FB] last:border-0">
                <span className="text-[12px] text-[#94A3B8] font-medium">{f.label}</span>
                <span className="text-[12px] text-[#0F172A] font-semibold">{f.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Activity stats */}
        <div className="grid grid-cols-4 gap-4">
          {activityStats.map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-[#E5F4F7] shadow-sm p-4 text-center">
              <p className="text-[22px] font-extrabold text-[#0F172A] leading-none mb-1">{s.value}</p>
              <p className="text-[11px] text-[#94A3B8] font-medium">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Danger zone */}
        <div className="bg-white rounded-2xl border border-[#FEE2E2] shadow-sm p-5">
          <h3 className="text-[13px] font-bold text-[#EF4444] mb-3">Danger Zone</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-semibold text-[#0F172A]">Sign out of all devices</p>
              <p className="text-[11.5px] text-[#94A3B8] mt-0.5">This will end all active sessions immediately</p>
            </div>
            <button onClick={() => toast.error("Sign-out requires confirmation")}
              className="px-4 py-2 rounded-xl border border-[#FEE2E2] text-[#EF4444] text-[12px] font-semibold hover:bg-[#FEF2F2] transition-colors cursor-pointer flex items-center gap-1.5">
              <LogOut size={13} /> Sign out
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Sidebar ────────────────────────────────────────────────────────────────

const sidebarNav: { id: Page; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "users",     label: "Users",     icon: Users },
  { id: "teams",        label: "Teams",        icon: Users2 },
  { id: "organization", label: "Organization", icon: Building2 },
  { id: "ai",           label: "AI Usage",     icon: Brain },
  { id: "logs",      label: "Logs",      icon: ScrollText },
  { id: "settings",  label: "Settings",  icon: Settings },
];

function Sidebar({ current, onNav }: { current: Page; onNav: (p: Page) => void }) {
  const profileActive = current === "profile";

  return (
    <aside className="fixed left-0 top-0 h-screen flex flex-col bg-white border-r border-[#EDF7F9] z-50" style={{ width: "210px" }}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-[#EDF7F9]">
        <div className="w-8 h-8 rounded-xl bg-[#06B6D4] flex items-center justify-center flex-shrink-0 shadow-sm shadow-[#06B6D4]/25">
          <span className="text-white font-bold text-[15px]">M</span>
        </div>
        <div>
          <div className="text-[14px] font-semibold text-[#0F172A] leading-tight">Meetiva</div>
          <div className="meetiva-caption text-[#94A3B8] leading-tight">Admin Console</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-3 overflow-y-auto">
        <ul className="space-y-0.5">
          {sidebarNav.map(({ id, label, icon: Icon }) => {
            const active = current === id;
            return (
              <li key={id}>
                <button
                  onClick={() => onNav(id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl meetiva-nav transition-all duration-150 cursor-pointer ${
                    active
                      ? "bg-[#EFF9FB] text-[#06B6D4] font-semibold"
                      : "text-[#64748B] hover:bg-[#F8FDFE] hover:text-[#0F172A]"
                  }`}
                >
                  <Icon size={15} className="flex-shrink-0" />
                  <span>{label}</span>
                  {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#06B6D4] flex-shrink-0" />}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Profile — click to go to profile page */}
      <button
        onClick={() => onNav("profile")}
        className={`flex items-center gap-2.5 px-4 py-3 border-t border-[#EDF7F9] transition-colors cursor-pointer w-full text-left group ${profileActive ? "bg-[#EFF9FB]" : "hover:bg-[#F8FDFE]"}`}
      >
        <div className={`w-7 h-7 rounded-full text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 ${profileActive ? "bg-[#06B6D4]" : "bg-[#4F46E5]"}`}>SA</div>
        <div className="flex-1 min-w-0">
          <div className={`text-[14px] font-semibold truncate transition-colors ${profileActive ? "text-[#06B6D4]" : "text-[#0F172A] group-hover:text-[#06B6D4]"}`}>Super Admin</div>
          <div className="meetiva-caption text-[#94A3B8] truncate">admin@meetiva.com</div>
        </div>
        <Pencil size={11} className={`flex-shrink-0 transition-colors ${profileActive ? "text-[#06B6D4]" : "text-[#CBD5E1] group-hover:text-[#06B6D4]"}`} />
      </button>
    </aside>
  );
}

// ── Top Bar ────────────────────────────────────────────────────────────────

function TopBar({ onNav }: { onNav?: (p: Page) => void }) {
  const dateStr = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const [searchVal, setSearchVal] = useState("");
  const [searchFocus, setSearchFocus] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const adminRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (adminRef.current && !adminRef.current.contains(e.target as Node)) setAdminOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const notifications = [
    { id: 1, icon: AlertCircle, color: "#EF4444", bg: "#FEE2E2", title: "API rate limit hit",       sub: "Workspace NordicCo · 8 min ago",  read: false },
    { id: 2, icon: Shield,      color: "#F59E0B", bg: "#FEF3C7", title: "Failed login attempts",    sub: "user@latamhub.io · 22 min ago",   read: false },
    { id: 3, icon: CheckCircle, color: "#10B981", bg: "#D1FAE5", title: "Maintenance completed",    sub: "DB01 server · 1 hr ago",          read: false },
  ];

  return (
    <div className="flex items-center gap-4 px-6 py-3.5 border-b border-[#EDF7F9] bg-white flex-shrink-0">
      {/* Search with live suggestions */}
      <div className="relative flex-1 max-w-sm" onClick={e => e.stopPropagation()}>
        <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
        <input
          value={searchVal}
          onChange={e => { setSearchVal(e.target.value); setSearchFocus(true); }}
          onFocus={() => setSearchFocus(true)}
          onBlur={() => setTimeout(() => setSearchFocus(false), 150)}
          onKeyDown={e => {
            if (e.key === "Enter" && searchVal.trim()) {
              const dest = searchVal.toLowerCase().includes("team") ? "teams"
                : searchVal.toLowerCase().includes("log") ? "logs"
                : searchVal.toLowerCase().includes("ai") ? "ai"
                : searchVal.toLowerCase().includes("setting") ? "settings"
                : "users";
              onNav?.(dest as Page);
              setSearchVal(""); setSearchFocus(false);
            }
            if (e.key === "Escape") { setSearchVal(""); setSearchFocus(false); }
          }}
          className="w-full pl-9 pr-4 py-2 meetiva-small bg-[#F8FDFE] border border-[#EDF7F9] rounded-xl outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/10 placeholder:text-[#B0C4CB] text-[#0F172A] transition-all"
          placeholder="Search users, teams, meetings, logs…"
        />
        {searchVal.trim() && searchFocus && (() => {
          const q = searchVal.toLowerCase();
          const userHits = [
            { id:"u1", name:"Sarah Chen",       email:"sarah.chen@acme.com",    page:"users"  as Page },
            { id:"u2", name:"Marcus Williams",  email:"m.williams@orion.io",    page:"users"  as Page },
            { id:"u3", name:"Priya Patel",      email:"priya@nexus.tech",       page:"users"  as Page },
            { id:"u5", name:"Aiko Tanaka",      email:"aiko.tanaka@mitsuko.jp", page:"users"  as Page },
            { id:"u7", name:"Fatima Al-Hassan", email:"f.alhassan@gulf.ae",     page:"users"  as Page },
            { id:"u8", name:"Tom Eriksson",     email:"tom.e@nordic.se",        page:"users"  as Page },
          ].filter(u => u.name.toLowerCase().includes(q) || u.email.includes(q));
          const pageHits = [
            { label:"Users",     icon:"👥", page:"users"    as Page },
            { label:"Teams",     icon:"🏢", page:"teams"    as Page },
            { label:"AI Usage",  icon:"🤖", page:"ai"       as Page },
            { label:"Logs",      icon:"📋", page:"logs"     as Page },
            { label:"Settings",  icon:"⚙️", page:"settings" as Page },
            { label:"My Profile",icon:"👤", page:"profile"  as Page },
          ].filter(p => p.label.toLowerCase().includes(q));
          const allHits = [...userHits.slice(0,4), ...pageHits.slice(0,3)];
          if (!allHits.length) return null;
          return (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E5F4F7] rounded-2xl shadow-2xl z-[100] overflow-hidden">
              {userHits.slice(0,4).length > 0 && (
                <>
                  <p className="px-3 pt-2.5 pb-1 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Users</p>
                  {userHits.slice(0,4).map(u => (
                    <button key={u.id}
                      onMouseDown={() => { onNav?.(u.page); setSearchVal(""); setSearchFocus(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[#F8FDFE] transition-colors cursor-pointer text-left">
                      <div className="w-6 h-6 rounded-full bg-[#4F46E5] text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0">
                        {u.name.split(" ").map(w=>w[0]).join("").slice(0,2)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[12px] font-semibold text-[#0F172A] truncate">{u.name}</p>
                        <p className="text-[10.5px] text-[#94A3B8] truncate">{u.email}</p>
                      </div>
                    </button>
                  ))}
                </>
              )}
              {pageHits.slice(0,3).length > 0 && (
                <>
                  <p className="px-3 pt-2 pb-1 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider border-t border-[#F1F9FB] mt-1">Pages</p>
                  {pageHits.slice(0,3).map(p => (
                    <button key={p.page}
                      onMouseDown={() => { onNav?.(p.page); setSearchVal(""); setSearchFocus(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[#F8FDFE] transition-colors cursor-pointer text-left">
                      <span className="text-base">{p.icon}</span>
                      <span className="text-[12px] font-medium text-[#374151]">{p.label}</span>
                    </button>
                  ))}
                </>
              )}
              <p className="px-3 py-2 text-[10.5px] text-[#94A3B8] border-t border-[#F1F9FB]">Press Enter to navigate</p>
            </div>
          );
        })()}
      </div>

      <div className="flex items-center gap-2.5 ml-auto">
        <span className="meetiva-caption font-mono text-[#94A3B8] hidden lg:block">{dateStr}</span>

        {/* Notification badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F0FAFE] border border-[#D9F2F8]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4] animate-pulse" />
          <span className="text-[11px] font-bold text-[#06B6D4]">{notifications.filter(n => !n.read).length}</span>
        </div>

        {/* Bell + notification dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setNotifOpen(o => !o); setAdminOpen(false); }}
            className="relative w-8 h-8 rounded-xl bg-white border border-[#EDF7F9] flex items-center justify-center text-[#6B7280] hover:border-[#06B6D4] hover:text-[#06B6D4] transition-all cursor-pointer">
            <Bell size={14} />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#EF4444] rounded-full border-2 border-white" />
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-[320px] bg-white border border-[#E5F4F7] rounded-2xl shadow-2xl z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 pt-3.5 pb-2 border-b border-[#EDF7F9]">
                <span className="text-[13px] font-bold text-[#0F172A]">Notifications</span>
                <button onClick={() => { toast.success("All notifications marked as read"); setNotifOpen(false); }}
                  className="text-[11px] font-semibold text-[#06B6D4] hover:text-[#0891B2] cursor-pointer transition-colors">Mark all read</button>
              </div>
              <div className="divide-y divide-[#F1F9FB]">
                {notifications.map(n => {
                  const Icon = n.icon;
                  return (
                    <div key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-[#F8FDFE] transition-colors cursor-pointer" onClick={() => { toast.info(n.title); setNotifOpen(false); }}>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: n.bg }}>
                        <Icon size={13} style={{ color: n.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12.5px] font-semibold text-[#0F172A] leading-snug">{n.title}</p>
                        <p className="text-[11px] text-[#94A3B8] mt-0.5">{n.sub}</p>
                      </div>
                      {!n.read && <span className="w-2 h-2 rounded-full bg-[#06B6D4] flex-shrink-0 mt-1.5" />}
                    </div>
                  );
                })}
              </div>
              <div className="px-4 py-3 border-t border-[#EDF7F9]">
                <button onClick={() => { onNav?.("logs"); setNotifOpen(false); }}
                  className="w-full text-center text-[12px] font-semibold text-[#06B6D4] hover:text-[#0891B2] cursor-pointer transition-colors">
                  View all in Logs →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Super Admin dropdown */}
        <div className="relative" ref={adminRef}>
          <button
            onClick={() => { setAdminOpen(o => !o); setNotifOpen(false); }}
            className="flex items-center gap-2 px-2.5 py-1.5 bg-white border border-[#EDF7F9] rounded-xl cursor-pointer hover:border-[#06B6D4] transition-all">
            <div className="w-6 h-6 rounded-full bg-[#4F46E5] text-white text-[9px] font-bold flex items-center justify-center">SA</div>
            <span className="text-[14px] font-semibold text-[#0F172A] hidden sm:block">Super Admin</span>
            <ChevronDown size={11} className={`text-[#94A3B8] transition-transform duration-200 ${adminOpen ? "rotate-180" : ""}`} />
          </button>
          {adminOpen && (
            <div className="absolute right-0 top-full mt-2 w-[200px] bg-white border border-[#E5F4F7] rounded-2xl shadow-2xl z-50 overflow-hidden py-1.5">
              {[
                { label: "My Profile",  icon: User,     page: "profile"  as Page },
                { label: "Settings",    icon: Settings, page: "settings" as Page },
              ].map(item => {
                const Icon = item.icon;
                return (
                  <button key={item.label}
                    onClick={() => { onNav?.(item.page); setAdminOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#374151] hover:bg-[#F8FDFE] hover:text-[#06B6D4] transition-colors cursor-pointer">
                    <Icon size={13} className="text-[#94A3B8]" /> {item.label}
                  </button>
                );
              })}
              <div className="mx-3 my-1 border-t border-[#EDF7F9]" />
              <button
                onClick={() => { toast.error("Sign-out requires confirmation"); setAdminOpen(false); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#EF4444] hover:bg-[#FEF2F2] transition-colors cursor-pointer">
                <LogOut size={13} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── KPI Card ───────────────────────────────────────────────────────────────

function KPICard({ label, value, sub, icon: Icon, trend, trendUp }: {
  label: string; value: string; sub: string; icon: React.ElementType;
  trend?: string; trendUp?: boolean;
}) {
  return (
    <Card className="p-5 flex flex-col gap-3 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <span className="meetiva-caption font-medium text-[#94A3B8] uppercase tracking-widest">{label}</span>
        <div className="w-8 h-8 rounded-xl bg-[#F5FEFF] flex items-center justify-center border border-[#E5F4F7]">
          <Icon size={14} className="text-[#06B6D4]" />
        </div>
      </div>
      <div>
        <div className="text-2xl font-semibold text-[#111827] tracking-tight" style={{ fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>{value}</div>
        <div className="meetiva-caption text-[#94A3B8] mt-0.5 font-mono">{sub}</div>
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-[11px] font-medium ${trendUp ? "text-green-600" : "text-red-500"}`}>
          {trendUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {trend}
        </div>
      )}
    </Card>
  );
}

// ── Dashboard chart types ─────────────────────────────────────────────────
type OvPoint  = { label: string; users: number; meetings: number; ai: number };
type UGPoint  = { label: string; individual: number; team: number };
type AIPoint  = { label: string; gpt4: number; claude: number; llama: number };
type StPoint  = { label: string; used: number };

// ── Dashboard Sparkline ──────────────────────────────────────────────────
function DashSparkline({ data, color, uid }: { data: number[]; color: string; uid: string }) {
  const W = 76, H = 28;
  const min = Math.min(...data), range = (Math.max(...data) - min) || 1;
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * W,
    H - 2 - ((v - min) / range) * (H - 6),
  ]);
  const d = "M" + pts.map(p => p.join(",")).join(" L");
  const fa = `M0,${H} L` + pts.map(p => p.join(",")).join(" L") + ` L${W},${H} Z`;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none">
      <defs>
        <linearGradient id={`dsp-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fa} fill={`url(#dsp-${uid})`} />
      <path d={d} stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.5" fill={color} />
    </svg>
  );
}

// ── DashKPI card (used by AI Usage page) ──────────────────────────────────
function DashKPI({ label, value, sub, icon: Icon, trend, trendUp, spark, sparkColor, uid }: {
  label: string; value: string; sub: string; icon: React.ElementType;
  trend?: string; trendUp?: boolean; spark?: number[]; sparkColor?: string; uid: string;
}) {
  return (
    <Card className="p-5 cursor-default transition-all duration-200 hover:border-[#C5E8F2] hover:shadow-sm">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-[#F0FAFE] border border-[#E0F3F8] flex items-center justify-center flex-shrink-0">
            <Icon size={12} className="text-[#06B6D4]" />
          </div>
          <span className="text-[10.5px] font-semibold text-[#94A3B8] uppercase tracking-[0.12em] truncate">{label}</span>
        </div>
        {spark && <DashSparkline data={spark} color={sparkColor || "#06B6D4"} uid={uid} />}
      </div>
      <div className="text-[24px] font-bold text-[#0F172A] leading-none mb-2"
        style={{ fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        {value}
      </div>
      <div className="flex items-center justify-between gap-1">
        <span className="text-[11px] font-mono text-[#94A3B8] truncate">{sub}</span>
        {trend && (
          <div className={`flex items-center gap-0.5 text-[10.5px] font-bold flex-shrink-0 ${trendUp ? "text-emerald-600" : "text-red-500"}`}>
            {trendUp ? <TrendingUp size={9} strokeWidth={2.5} /> : <TrendingDown size={9} strokeWidth={2.5} />}
            {trend}
          </div>
        )}
      </div>
    </Card>
  );
}

// ── Platform Overview (multi-series area, hover tooltip) ─────────────────
function OverviewAreaChart({ data, period }: { data: OvPoint[]; period: string }) {
  const [hov, setHov] = useState<number | null>(null);
  // W:H = 5:2 gives a compact chart; removing style height lets the viewBox
  // aspect ratio set the rendered height naturally — no letterboxing or stretching.
  // pL is wide enough so y-axis labels never clip.
  const W = 500, H = 200, pL = 54, pR = 14, pT = 14, pB = 32;
  const cW = W - pL - pR, cH = H - pT - pB;
  const n = data.length;
  const maxV = Math.max(...data.flatMap(d => [d.users, d.meetings, d.ai])) || 1;
  const px = (i: number) => pL + (i / Math.max(n - 1, 1)) * cW;
  const py = (v: number) => pT + cH - (v / maxV) * cH;
  const colW = n > 1 ? cW / (n - 1) : cW;
  type Kk = "users" | "meetings" | "ai";
  const series: { key: Kk; color: string; label: string }[] = [
    { key: "users",    color: "#06B6D4", label: "Users" },
    { key: "meetings", color: "#4F46E5", label: "Meetings" },
    { key: "ai",       color: "#10B981", label: "AI Requests" },
  ];
  const makePath = (key: Kk) =>
    data.map((d, i) => `${i === 0 ? "M" : "L"}${px(i).toFixed(1)},${py(d[key]).toFixed(1)}`).join(" ");
  const makeArea = (key: Kk) => {
    const pts = data.map((d, i) => `${px(i).toFixed(1)},${py(d[key]).toFixed(1)}`);
    return `M${pL},${pT + cH} L${pts.join(" L")} L${px(n - 1)},${pT + cH} Z`;
  };
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => ({ v: Math.round(f * maxV), y: py(Math.round(f * maxV)) }));
  const fmt = (v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v);

  const TipBox = ({ idx }: { idx: number }) => {
    const d = data[idx];
    const tx = px(idx);
    const tw = 138, th = 86;
    const bx = Math.max(tw / 2 + 4, Math.min(W - pR - tw / 2 - 4, tx));
    const by = pT + 4;
    return (
      <g pointerEvents="none" style={{filter:"drop-shadow(0 4px 18px rgba(6,182,212,0.18))"}}>
        <line x1={tx} y1={pT} x2={tx} y2={pT + cH} stroke="#06B6D4" strokeWidth="1" strokeDasharray="3,2" opacity="0.35" />
        <rect x={bx - tw / 2} y={by} width={tw} height={th} rx="9" fill="white" stroke="#D9F2F8" strokeWidth="1.5" />
        <text x={bx} y={by + 16} textAnchor="middle" fill="#0891B2" fontSize="10" fontFamily="Inter,sans-serif" fontWeight="700">{d.label} · {period}</text>
        {series.map((s, si) => (
          <g key={s.key}>
            <circle cx={bx - tw / 2 + 13} cy={by + 30 + si * 18} r="3.5" fill={s.color} />
            <text x={bx - tw / 2 + 22} y={by + 35 + si * 18} fill={s.color} fontSize="11" fontWeight="700" fontFamily="Inter,sans-serif">{fmt(d[s.key])}</text>
            <text x={bx + tw / 2 - 8} y={by + 35 + si * 18} textAnchor="end" fill="#64748B" fontSize="9.5" fontFamily="Inter,sans-serif">{s.label}</text>
          </g>
        ))}
      </g>
    );
  };

  // Only className="w-full", no style height — browser computes height from
  // viewBox aspect ratio so the chart scales proportionally without stretching.
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      <defs>
        {series.map((s, i) => (
          <linearGradient key={`ovg-${i}-${period}`} id={`ovg-${i}-${period}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={s.color} stopOpacity="0.15" />
            <stop offset="100%" stopColor={s.color} stopOpacity="0" />
          </linearGradient>
        ))}
      </defs>
      {yTicks.map((t, ti) => (
        <g key={`ovyt-${ti}`}>
          <line x1={pL} x2={W - pR} y1={t.y} y2={t.y} stroke="#EDF7F9" strokeWidth="1" />
          <text x={pL - 7} y={t.y + 4} textAnchor="end" fill="#64748B" fontSize="12" fontWeight="500" fontFamily="Inter,sans-serif">
            {t.v >= 1000 ? `${Math.round(t.v / 1000)}k` : t.v}
          </text>
        </g>
      ))}
      {[...series].reverse().map((s, i) => (
        <path key={`ova-${i}`} d={makeArea(s.key)} fill={`url(#ovg-${series.length - 1 - i}-${period})`} />
      ))}
      {series.map(s => (
        <path key={`ovl-${s.key}`} d={makePath(s.key)} fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      ))}
      {hov !== null && series.map(s => (
        <circle key={`ovd-${s.key}`} cx={px(hov)} cy={py(data[hov][s.key])} r="4.5" fill="white" stroke={s.color} strokeWidth="2" />
      ))}
      {data.map((d, i) => (
        <text key={`ovx-${i}`} x={px(i)} y={H - 7} textAnchor="middle"
          fill={hov === i ? "#1E293B" : "#64748B"} fontSize="12" fontWeight="500" fontFamily="Inter,sans-serif">{d.label}</text>
      ))}
      {data.map((_, i) => (
        <rect key={`ovh-${i}`} x={px(i) - colW / 2} y={pT} width={colW} height={cH}
          fill="transparent" style={{ cursor: "crosshair" }}
          onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)} />
      ))}
      {hov !== null && <TipBox idx={hov} />}
    </svg>
  );
}

// ── User Growth stacked bar chart with hover ──────────────────────────────
function UserGrowthChart({ data }: { data: UGPoint[] }) {
  const [hov, setHov] = useState<number | null>(null);
  const W = 480, H = 160, pL = 38, pR = 8, pT = 12, pB = 26;
  const cW = W - pL - pR, cH = H - pT - pB;
  const maxV = Math.max(...data.map(d => d.individual + d.team)) || 1;
  const n = data.length;
  const slotW = cW / n;
  const barW = Math.min(28, slotW * 0.55);
  const bx = (i: number) => pL + i * slotW + slotW / 2 - barW / 2;
  const yTicks = [0, 0.5, 1];
  const TipBox = ({ idx }: { idx: number }) => {
    const d = data[idx];
    const cx = pL + idx * slotW + slotW / 2;
    const tw = 132, th = 62;
    const bxc = Math.max(tw / 2 + 4, Math.min(W - pR - tw / 2 - 4, cx));
    const by = pT + 2;
    return (
      <g pointerEvents="none" style={{filter:"drop-shadow(0 4px 18px rgba(6,182,212,0.18))"}}>
        <rect x={bxc - tw / 2} y={by} width={tw} height={th} rx="8" fill="white" stroke="#D9F2F8" strokeWidth="1" />
        <text x={bxc} y={by + 15} textAnchor="middle" fill="#0891B2" fontSize="9" fontFamily="Inter,sans-serif" fontWeight="600">{d.label}</text>
        <circle cx={bxc - tw / 2 + 13} cy={by + 29} r="3.5" fill="#06B6D4" />
        <text x={bxc - tw / 2 + 22} y={by + 33} fill="#67E8F9" fontSize="10.5" fontWeight="700" fontFamily="Inter,sans-serif">{(d.individual / 1000).toFixed(1)}k</text>
        <text x={bxc + tw / 2 - 8} y={by + 33} textAnchor="end" fill="#94A3B8" fontSize="9" fontFamily="Inter,sans-serif">Individual</text>
        <circle cx={bxc - tw / 2 + 13} cy={by + 47} r="3.5" fill="#4F46E5" />
        <text x={bxc - tw / 2 + 22} y={by + 51} fill="#A5B4FC" fontSize="10.5" fontWeight="700" fontFamily="Inter,sans-serif">{d.team}</text>
        <text x={bxc + tw / 2 - 8} y={by + 51} textAnchor="end" fill="#94A3B8" fontSize="9" fontFamily="Inter,sans-serif">Teams</text>
      </g>
    );
  };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      {yTicks.map((f, i) => {
        const v = Math.round(f * maxV);
        const y = pT + cH * (1 - f);
        return (
          <g key={`ugy-${i}`}>
            <line x1={pL} x2={W - pR} y1={y} y2={y} stroke="#EDF7F9" strokeWidth="1" />
            <text x={pL - 4} y={y + 4} textAnchor="end" fill="#B0C4CB" fontSize="8" fontFamily="Inter,sans-serif">
              {v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
            </text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const x = bx(i), isHov = hov === i;
        const hInd = (d.individual / maxV) * cH;
        const hTeam = (d.team / maxV) * cH;
        return (
          <g key={`ugb-${i}`}>
            <rect x={x} y={pT + cH - hInd - hTeam} width={barW} height={hTeam}
              fill={isHov ? "#6366F1" : "#4F46E5"} rx="3" />
            <rect x={x} y={pT + cH - hInd} width={barW} height={hInd}
              fill={isHov ? "#22D3EE" : "#06B6D4"} rx="3" />
            <text x={x + barW / 2} y={H - 7} textAnchor="middle"
              fill={isHov ? "#374151" : "#B0C4CB"} fontSize="8.5" fontFamily="Inter,sans-serif">{d.label}</text>
            <rect x={pL + i * slotW} y={pT} width={slotW} height={cH}
              fill="transparent" style={{ cursor: "crosshair" }}
              onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)} />
          </g>
        );
      })}
      {hov !== null && <TipBox idx={hov} />}
    </svg>
  );
}

// ── AI Usage stacked bar chart with hover ─────────────────────────────────
function AiUsageChart({ data }: { data: AIPoint[] }) {
  const [hov, setHov] = useState<number | null>(null);
  const W = 480, H = 160, pL = 38, pR = 8, pT = 12, pB = 26;
  const cW = W - pL - pR, cH = H - pT - pB;
  const maxV = Math.max(...data.map(d => d.gpt4 + d.claude + d.llama)) || 1;
  const n = data.length;
  const slotW = cW / n;
  const barW = Math.min(24, slotW * 0.5);
  const bx = (i: number) => pL + i * slotW + slotW / 2 - barW / 2;
  const yTicks = [0, 0.5, 1];
  const TipBox = ({ idx }: { idx: number }) => {
    const d = data[idx];
    const cx = pL + idx * slotW + slotW / 2;
    const tw = 140, th = 74;
    const bxc = Math.max(tw / 2 + 4, Math.min(W - pR - tw / 2 - 4, cx));
    const by = pT + 2;
    const rows = [
      { c: "#06B6D4", tc: "#67E8F9", label: "GPT-4o", v: d.gpt4 },
      { c: "#4F46E5", tc: "#A5B4FC", label: "Claude",  v: d.claude },
      { c: "#F59E0B", tc: "#FCD34D", label: "LLaMA",   v: d.llama },
    ];
    return (
      <g pointerEvents="none" style={{filter:"drop-shadow(0 4px 18px rgba(6,182,212,0.18))"}}>
        <rect x={bxc - tw / 2} y={by} width={tw} height={th} rx="8" fill="white" stroke="#D9F2F8" strokeWidth="1" />
        <text x={bxc} y={by + 15} textAnchor="middle" fill="#0891B2" fontSize="9" fontWeight="600" fontFamily="Inter,sans-serif">{d.label}</text>
        {rows.map((r, ri) => (
          <g key={ri}>
            <circle cx={bxc - tw / 2 + 13} cy={by + 28 + ri * 17} r="3.5" fill={r.c} />
            <text x={bxc - tw / 2 + 23} y={by + 32 + ri * 17} fill={r.tc} fontSize="10.5" fontWeight="700" fontFamily="Inter,sans-serif">
              {(r.v / 1000).toFixed(1)}k
            </text>
            <text x={bxc + tw / 2 - 8} y={by + 32 + ri * 17} textAnchor="end" fill="#94A3B8" fontSize="9" fontFamily="Inter,sans-serif">{r.label}</text>
          </g>
        ))}
      </g>
    );
  };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      {yTicks.map((f, i) => {
        const v = Math.round(f * maxV);
        const y = pT + cH * (1 - f);
        return (
          <g key={`aiy-${i}`}>
            <line x1={pL} x2={W - pR} y1={y} y2={y} stroke="#EDF7F9" strokeWidth="1" />
            <text x={pL - 4} y={y + 4} textAnchor="end" fill="#B0C4CB" fontSize="8" fontFamily="Inter,sans-serif">
              {v >= 1000 ? `${Math.round(v / 1000)}k` : v}
            </text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const x = bx(i), isHov = hov === i;
        const hG = (d.gpt4 / maxV) * cH;
        const hC = (d.claude / maxV) * cH;
        const hL = (d.llama / maxV) * cH;
        return (
          <g key={`aib-${i}`}>
            <rect x={x} y={pT + cH - hG - hC - hL} width={barW} height={hL} fill={isHov ? "#FCD34D" : "#F59E0B"} rx="2" />
            <rect x={x} y={pT + cH - hG - hC} width={barW} height={hC} fill={isHov ? "#818CF8" : "#4F46E5"} rx="2" />
            <rect x={x} y={pT + cH - hG} width={barW} height={hG} fill={isHov ? "#22D3EE" : "#06B6D4"} rx="2" />
            <text x={x + barW / 2} y={H - 7} textAnchor="middle"
              fill={isHov ? "#374151" : "#B0C4CB"} fontSize="8.5" fontFamily="Inter,sans-serif">{d.label.slice(0, 3)}</text>
            <rect x={pL + i * slotW} y={pT} width={slotW} height={cH}
              fill="transparent" style={{ cursor: "crosshair" }}
              onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)} />
          </g>
        );
      })}
      {hov !== null && <TipBox idx={hov} />}
    </svg>
  );
}

// ── Storage area chart with hover ─────────────────────────────────────────
function StorageAreaChart({ data }: { data: StPoint[] }) {
  const [hov, setHov] = useState<number | null>(null);
  const W = 480, H = 160, pL = 40, pR = 8, pT = 12, pB = 26;
  const cW = W - pL - pR, cH = H - pT - pB;
  const maxV = 20;
  const n = data.length;
  const px = (i: number) => pL + (i / Math.max(n - 1, 1)) * cW;
  const py = (v: number) => pT + cH - (v / maxV) * cH;
  const pts = data.map((d, i): [number, number] => [px(i), py(d.used)]);
  const linePath = "M" + pts.map(p => p.join(",")).join(" L");
  const areaPath = `M${pts[0][0]},${pT + cH} L${pts.map(p => p.join(",")).join(" L")} L${pts[n - 1][0]},${pT + cH} Z`;
  const colW = n > 1 ? cW / (n - 1) : cW;
  const TipBox = ({ idx }: { idx: number }) => {
    const d = data[idx];
    const tx = pts[idx][0];
    const tw = 112, th = 50;
    const bxc = Math.max(tw / 2 + 4, Math.min(W - pR - tw / 2 - 4, tx));
    const by = pT + 4;
    return (
      <g pointerEvents="none" style={{filter:"drop-shadow(0 4px 18px rgba(6,182,212,0.18))"}}>
        <line x1={tx} y1={pT} x2={tx} y2={pT + cH} stroke="#EF4444" strokeWidth="1" strokeDasharray="3,2" opacity="0.4" />
        <rect x={bxc - tw / 2} y={by} width={tw} height={th} rx="8" fill="white" stroke="#D9F2F8" strokeWidth="1" />
        <text x={bxc} y={by + 15} textAnchor="middle" fill="#0891B2" fontSize="9" fontFamily="Inter,sans-serif" fontWeight="600">{d.label} 2025</text>
        <circle cx={bxc - tw / 2 + 13} cy={by + 32} r="3.5" fill="#EF4444" />
        <text x={bxc - tw / 2 + 23} y={by + 36} fill="#EF4444" fontSize="11" fontWeight="700" fontFamily="Inter,sans-serif">{d.used} TB</text>
        <text x={bxc + tw / 2 - 8} y={by + 36} textAnchor="end" fill="#94A3B8" fontSize="9" fontFamily="Inter,sans-serif">used</text>
      </g>
    );
  };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      <defs>
        <linearGradient id="stg-dash" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EF4444" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 10, 20].map((v, i) => {
        const y = py(v);
        return (
          <g key={`sty-${i}`}>
            <line x1={pL} x2={W - pR} y1={y} y2={y} stroke="#EDF7F9" strokeWidth="1" />
            <text x={pL - 4} y={y + 4} textAnchor="end" fill="#B0C4CB" fontSize="8" fontFamily="Inter,sans-serif">{v} TB</text>
          </g>
        );
      })}
      <path d={areaPath} fill="url(#stg-dash)" />
      <path d={linePath} stroke="#EF4444" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((_, i) => (
        <circle key={`std-${i}`} cx={pts[i][0]} cy={pts[i][1]}
          r={hov === i ? 5.5 : 3.5}
          fill={hov === i ? "#EF4444" : "white"} stroke="#EF4444" strokeWidth="2" />
      ))}
      {data.map((d, i) => (
        <text key={`stlbl-${i}`} x={pts[i][0]} y={H - 7} textAnchor="middle"
          fill={hov === i ? "#374151" : "#B0C4CB"} fontSize="8.5" fontFamily="Inter,sans-serif">{d.label}</text>
      ))}
      {data.map((_, i) => {
        const zx = i === 0 ? pL - colW / 2 : pts[i][0] - colW / 2;
        const zw = i === 0 || i === n - 1 ? colW * 0.75 : colW;
        return (
          <rect key={`sth-${i}`} x={zx} y={pT} width={zw} height={cH}
            fill="transparent" style={{ cursor: "crosshair" }}
            onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)} />
        );
      })}
      {hov !== null && <TipBox idx={hov} />}
    </svg>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────
function Dashboard({ onNav }: { onNav: (p: Page) => void }) {
  const [period, setPeriod] = useState<"24H" | "7D" | "30D">("7D");
  const [workspace, setWorkspace] = useState("Meetiva Global");
  const [wsOpen, setWsOpen] = useState(false);
  const wsRef = useRef<HTMLDivElement>(null);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const dateStr = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wsRef.current && !wsRef.current.contains(e.target as Node)) setWsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const workspaces = [
    { name: "Meetiva Global", users: "13,847", plan: "Enterprise", color: "#06B6D4" },
    { name: "Enterprise Org", users: "4,219",  plan: "Business",   color: "#4F46E5" },
    { name: "Dev Sandbox",    users: "124",    plan: "Developer",  color: "#10B981" },
  ];

  const kpis = [
    { label: "Total Users",         value: "13,847",  pct: "+8.4%",  up: true,  icon: Users,     color: "#06B6D4", spark: [42,55,49,68,61,84,91,84,99,114,128,138], uid: "k-tu" },
    { label: "Individual Users",    value: "11,203",  pct: "+7.1%",  up: true,  icon: User,      color: "#4F46E5", spark: [30,38,34,50,46,60,64,70,78,90,98,112],   uid: "k-iu" },
    { label: "Team Accounts",       value: "1,124",   pct: "+12.1%", up: true,  icon: Users2,    color: "#10B981", spark: [10,13,12,17,16,21,20,26,24,32,30,38],    uid: "k-ta" },
    { label: "Meetings Processed",  value: "284,391", pct: "+22.3%", up: true,  icon: Video,     color: "#F59E0B", spark: [260,295,280,330,355,390,405,425,455,485,508,540], uid: "k-mp" },
    { label: "Storage Used",        value: "7.9 TB",  pct: "+5.3%",  up: true,  icon: HardDrive, color: "#EF4444", spark: [20,25,28,32,36,41,45,52,57,63,69,79],    uid: "k-su" },
    { label: "Today's AI Requests", value: "98,412",  pct: "+34.7%", up: true,  icon: Brain,     color: "#8B5CF6", spark: [50,75,62,88,80,106,111,104,118,134,140,148], uid: "k-ai" },
  ];

  const overviewData: Record<"24H" | "7D" | "30D", OvPoint[]> = {
    "24H": [
      { label: "00:00", users: 320,   meetings: 45,   ai: 2100  },
      { label: "03:00", users: 180,   meetings: 20,   ai: 980   },
      { label: "06:00", users: 290,   meetings: 38,   ai: 1600  },
      { label: "09:00", users: 810,   meetings: 142,  ai: 5400  },
      { label: "12:00", users: 1240,  meetings: 280,  ai: 9800  },
      { label: "15:00", users: 1380,  meetings: 310,  ai: 12000 },
      { label: "18:00", users: 980,   meetings: 201,  ai: 8200  },
      { label: "21:00", users: 640,   meetings: 128,  ai: 5100  },
    ],
    "7D": [
      { label: "Mon", users: 1820,  meetings: 284,  ai: 14200 },
      { label: "Tue", users: 2140,  meetings: 390,  ai: 17800 },
      { label: "Wed", users: 1980,  meetings: 341,  ai: 15600 },
      { label: "Thu", users: 2380,  meetings: 471,  ai: 22400 },
      { label: "Fri", users: 2620,  meetings: 520,  ai: 26100 },
      { label: "Sat", users: 1540,  meetings: 190,  ai: 11800 },
      { label: "Sun", users: 1260,  meetings: 148,  ai: 9400  },
    ],
    "30D": [
      { label: "Wk 1", users: 8200,  meetings: 1420, ai: 62000 },
      { label: "Wk 2", users: 9800,  meetings: 1680, ai: 74000 },
      { label: "Wk 3", users: 11400, meetings: 2100, ai: 88000 },
      { label: "Wk 4", users: 13847, meetings: 2841, ai: 98412 },
    ],
  };

  const ugData: UGPoint[] = [
    { label: "Feb", individual: 7200,  team: 720  },
    { label: "Mar", individual: 8100,  team: 810  },
    { label: "Apr", individual: 9000,  team: 890  },
    { label: "May", individual: 9800,  team: 960  },
    { label: "Jun", individual: 10600, team: 1020 },
    { label: "Jul", individual: 11203, team: 1124 },
  ];

  const aiData: AIPoint[] = [
    { label: "Mon", gpt4: 14200, claude: 8400,  llama: 3100 },
    { label: "Tue", gpt4: 17800, claude: 10200, llama: 3800 },
    { label: "Wed", gpt4: 15600, claude: 9100,  llama: 3400 },
    { label: "Thu", gpt4: 22400, claude: 12800, llama: 5200 },
    { label: "Fri", gpt4: 26100, claude: 14900, llama: 6200 },
    { label: "Sat", gpt4: 11800, claude: 6900,  llama: 2800 },
    { label: "Sun", gpt4: 9400,  claude: 5400,  llama: 2100 },
  ];

  const stData: StPoint[] = [
    { label: "Feb", used: 4.2 }, { label: "Mar", used: 4.9 },
    { label: "Apr", used: 5.6 }, { label: "May", used: 6.1 },
    { label: "Jun", used: 7.0 }, { label: "Jul", used: 7.9 },
  ];

  const recentActivity = [
    { id: "a1", icon: Users,       color: "#06B6D4", text: "Sarah Chen upgraded to Enterprise plan",     time: "2 min ago",  badge: "upgrade",  bc: "#4F46E5" },
    { id: "a2", icon: AlertCircle, color: "#EF4444", text: "API rate limit hit — workspace NordicCo",    time: "8 min ago",  badge: "alert",    bc: "#EF4444" },
    { id: "a3", icon: Users2,      color: "#10B981", text: "New team created: Design Systems Guild",     time: "14 min ago", badge: "new",      bc: "#10B981" },
    { id: "a4", icon: Shield,      color: "#F59E0B", text: "Failed login attempts on user@latamhub.io", time: "22 min ago", badge: "security", bc: "#F59E0B" },
    { id: "a5", icon: Brain,       color: "#8B5CF6", text: "AI model switched to Claude 3.5 Sonnet",    time: "35 min ago", badge: "system",   bc: "#64748B" },
    { id: "a6", icon: CheckCircle, color: "#10B981", text: "Scheduled maintenance completed — DB01",    time: "1 hr ago",   badge: "done",     bc: "#10B981" },
    { id: "a7", icon: HardDrive,   color: "#EF4444", text: "Storage quota warning: IndieStudio (92%)",  time: "2 hr ago",   badge: "warn",     bc: "#F59E0B" },
    { id: "a8", icon: CreditCard,  color: "#4F46E5", text: "Invoice #8821 generated for 38 accounts",   time: "3 hr ago",   badge: "billing",  bc: "#4F46E5" },
  ];

  const quickActions = [
    { icon: Plus,       label: "Add User",    color: "#06B6D4", bg: "#EFF9FB", onClick: () => onNav("users")    },
    { icon: Users2,     label: "Create Team", color: "#4F46E5", bg: "#EEF2FF", onClick: () => onNav("teams")    },
    { icon: BarChart3,  label: "Reports",     color: "#10B981", bg: "#F0FDF4", onClick: () => onNav("logs")     },
    { icon: ScrollText, label: "System Logs", color: "#6B7280", bg: "#F9FAFB", onClick: () => onNav("logs")     },
    { icon: Brain,      label: "AI Usage",    color: "#8B5CF6", bg: "#F5F3FF", onClick: () => onNav("ai")       },
    { icon: HardDrive,  label: "Storage",     color: "#EF4444", bg: "#FEF2F2", onClick: () => onNav("settings") },
    { icon: Shield,     label: "Security",    color: "#F59E0B", bg: "#FFFBEB", onClick: () => onNav("settings") },
    { icon: Settings,   label: "Settings",    color: "#64748B", bg: "#F9FAFB", onClick: () => onNav("settings") },
  ];

  const activeWs = workspaces.find(w => w.name === workspace)!;

  return (
    <div className="min-h-full bg-[#F5FEFF]">
      <div className="max-w-[1440px] mx-auto px-8 py-4 space-y-4">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[26px] font-bold text-[#0F172A] leading-tight tracking-tight">
              {greeting}, Alex 👋
            </h1>
            <p className="text-[13px] text-[#94A3B8] mt-0.5 font-medium">
              {dateStr} · Meetiva Super Admin
            </p>
          </div>

          {/* Custom workspace dropdown */}
          <div className="relative" ref={wsRef}>
            <button
              onClick={() => setWsOpen(o => !o)}
              className="flex items-center gap-3 px-4 py-3 bg-white border border-[#E5F4F7] rounded-2xl shadow-sm hover:border-[#B8E4F0] hover:shadow-md transition-all duration-200 cursor-pointer min-w-[220px]"
            >
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: activeWs.color + "1A" }}>
                <Building2 size={14} style={{ color: activeWs.color }} />
              </div>
              <div className="flex-1 text-left">
                <div className="text-[13px] font-semibold text-[#0F172A] leading-tight">{workspace}</div>
                <div className="text-[10.5px] text-[#94A3B8] mt-0.5">{activeWs.plan} · {activeWs.users} users</div>
              </div>
              <ChevronDown size={13}
                className={`text-[#94A3B8] flex-shrink-0 transition-transform duration-200 ${wsOpen ? "rotate-180" : ""}`} />
            </button>

            {wsOpen && (
              <div className="absolute right-0 top-full mt-2 w-[280px] bg-white border border-[#E5F4F7] rounded-2xl shadow-2xl z-50 overflow-hidden">
                <div className="px-4 pt-3 pb-1.5">
                  <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Switch Workspace</p>
                </div>
                <div className="p-2 space-y-0.5">
                  {workspaces.map(ws => {
                    const active = workspace === ws.name;
                    return (
                      <button key={ws.name}
                        onClick={() => { setWorkspace(ws.name); setWsOpen(false); }}
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all duration-150 cursor-pointer ${active ? "bg-[#EFF9FB] border border-[#D0EEF6]" : "hover:bg-[#F8FDFE]"}`}>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: ws.color + "1A" }}>
                          <Building2 size={15} style={{ color: ws.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-semibold text-[#0F172A] truncate">{ws.name}</div>
                          <div className="text-[10.5px] text-[#94A3B8] mt-0.5">{ws.users} users · {ws.plan}</div>
                        </div>
                        {active ? (
                          <div className="w-5 h-5 rounded-full bg-[#06B6D4] flex items-center justify-center flex-shrink-0">
                            <div className="w-2 h-2 rounded-full bg-white" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-[#E5F4F7] flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="border-t border-[#EDF7F9] mx-3 mb-1" />
                <div className="p-2">
                  <button
                    onClick={() => { toast.info("Workspace creation coming soon"); setWsOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#F8FDFE] transition-colors cursor-pointer">
                    <div className="w-9 h-9 rounded-xl border-2 border-dashed border-[#CBD5E1] flex items-center justify-center flex-shrink-0">
                      <Plus size={12} className="text-[#94A3B8]" />
                    </div>
                    <span className="text-[12.5px] font-medium text-[#94A3B8]">Add new workspace</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── KPI Cards ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-6 gap-4">
          {kpis.map(k => {
            const Icon = k.icon;
            return (
              <div key={k.label}
                className="bg-white rounded-2xl border border-[#E5F4F7] p-4 shadow-sm hover:shadow-md hover:border-[#C8E8F2] transition-all duration-200 cursor-default group">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: k.color + "18" }}>
                    <Icon size={16} style={{ color: k.color }} />
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full leading-tight ${k.up ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
                    {k.pct}
                  </span>
                </div>
                <p className="text-[10.5px] text-[#94A3B8] font-semibold uppercase tracking-wider mb-1.5">{k.label}</p>
                <p className="text-[22px] font-extrabold text-[#0F172A] leading-none tracking-tight mb-3">{k.value}</p>
                <DashSparkline data={k.spark} color={k.color} uid={k.uid} />
              </div>
            );
          })}
        </div>

        {/* ── Platform Overview + Analytics (tight) ───────────────────────── */}
        <div className="flex flex-col gap-3">
        <div className="grid grid-cols-12 gap-4">
          {/* Platform Overview */}
          <div className="col-span-8 bg-white rounded-2xl border border-[#E5F4F7] p-4 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="text-[16px] font-bold text-[#0F172A]">Platform Overview</h2>
                <p className="text-[11.5px] text-[#94A3B8] mt-0.5">Active Users · Meetings · AI Requests · hover to inspect</p>
              </div>
              <div className="flex items-center gap-4 flex-shrink-0">
                <div className="flex items-center gap-3.5">
                  {[["Users", "#06B6D4"], ["Meetings", "#4F46E5"], ["AI Requests", "#10B981"]].map(([l, c]) => (
                    <div key={l} className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: c }} />
                      <span className="text-[11px] text-[#94A3B8]">{l}</span>
                    </div>
                  ))}
                </div>
                <div className="flex bg-[#F5FEFF] border border-[#E5F4F7] rounded-xl overflow-hidden">
                  {(["24H", "7D", "30D"] as const).map(p => (
                    <button key={p} onClick={() => setPeriod(p)}
                      className={`text-[11px] font-semibold px-3.5 py-1.5 transition-colors cursor-pointer ${period === p ? "bg-[#06B6D4] text-white" : "text-[#94A3B8] hover:text-[#374151]"}`}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <OverviewAreaChart data={overviewData[period]} period={period} />
          </div>

          {/* Recent Activity */}
          <div className="col-span-4 bg-white rounded-2xl border border-[#E5F4F7] p-4 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-bold text-[#0F172A]">Recent Activity</h2>
              <button onClick={() => onNav("logs")}
                className="text-[12px] font-semibold text-[#06B6D4] hover:text-[#0891B2] cursor-pointer flex items-center gap-0.5 transition-colors">
                View all <ArrowRight size={10} />
              </button>
            </div>
            <div className="space-y-3">
              {recentActivity.slice(0, 5).map(a => {
                const Icon = a.icon;
                return (
                  <div key={a.id} className="flex items-start gap-3 group">
                    <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: a.color + "15" }}>
                      <Icon size={12} style={{ color: a.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-[#374151] leading-snug">{a.text}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-[#94A3B8]">{a.time}</span>
                        <span className="text-[9.5px] font-semibold px-1.5 py-0.5 rounded-full"
                          style={{ background: a.bc + "15", color: a.bc }}>{a.badge}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {/* User Growth */}
          <div className="bg-white rounded-2xl border border-[#E5F4F7] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-[14px] font-bold text-[#0F172A]">User Growth</h3>
              <span className="text-[10px] font-mono text-[#94A3B8]">Feb – Jul</span>
            </div>
            <p className="text-[11.5px] text-[#94A3B8] mb-4">Individual vs. Team accounts · hover bars</p>
            <UserGrowthChart data={ugData} />
            <div className="mt-3 pt-3 border-t border-[#EDF7F9] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#06B6D4]" /><span className="text-[10.5px] text-[#94A3B8]">Individual</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#4F46E5]" /><span className="text-[10.5px] text-[#94A3B8]">Teams</span></div>
              </div>
              <button onClick={() => onNav("users")}
                className="text-[11px] font-semibold text-[#06B6D4] hover:text-[#0891B2] cursor-pointer flex items-center gap-0.5 transition-colors">
                Details <ArrowRight size={10} />
              </button>
            </div>
          </div>

          {/* AI Usage */}
          <div className="bg-white rounded-2xl border border-[#E5F4F7] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-[14px] font-bold text-[#0F172A]">AI Usage</h3>
              <span className="text-[10px] font-mono text-[#94A3B8]">This week</span>
            </div>
            <p className="text-[11.5px] text-[#94A3B8] mb-4">Requests by model · GPT-4 · Claude · LLaMA</p>
            <AiUsageChart data={aiData} />
            <div className="mt-3 pt-3 border-t border-[#EDF7F9] flex items-center justify-between">
              <div className="flex items-center gap-3">
                {[["GPT-4", "#06B6D4"], ["Claude", "#4F46E5"], ["LLaMA", "#F59E0B"]].map(([l, c]) => (
                  <div key={l} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: c }} />
                    <span className="text-[10.5px] text-[#94A3B8]">{l}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => onNav("ai")}
                className="text-[11px] font-semibold text-[#06B6D4] hover:text-[#0891B2] cursor-pointer flex items-center gap-0.5 transition-colors">
                Details <ArrowRight size={10} />
              </button>
            </div>
          </div>

          {/* Storage */}
          <div className="bg-white rounded-2xl border border-[#E5F4F7] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-[14px] font-bold text-[#0F172A]">Storage Usage</h3>
              <span className="text-[10px] font-mono text-[#94A3B8]">Feb – Jul</span>
            </div>
            <p className="text-[11.5px] text-[#94A3B8] mb-4">Growth in TB · Cap 20 TB · hover to inspect</p>
            <StorageAreaChart data={stData} />
            <div className="mt-3 pt-3 border-t border-[#EDF7F9] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-bold text-[#0F172A]">7.9 / 20 TB</span>
                <div className="h-1.5 w-24 bg-[#F5FEFF] rounded-full border border-[#E5F4F7] overflow-hidden">
                  <div className="h-full rounded-full bg-[#EF4444]" style={{ width: "39.5%" }} />
                </div>
                <span className="text-[10px] text-[#94A3B8]">39.5%</span>
              </div>
              <button onClick={() => onNav("settings")}
                className="text-[11px] font-semibold text-[#06B6D4] hover:text-[#0891B2] cursor-pointer flex items-center gap-0.5 transition-colors">
                Manage <ArrowRight size={10} />
              </button>
            </div>
          </div>
        </div>

        </div>{/* end overview+analytics wrapper */}

        {/* ── Quick Actions ────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-[#E5F4F7] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-bold text-[#0F172A]">Quick Actions</h2>
            <span className="text-[11px] text-[#94A3B8]">Common admin tasks</span>
          </div>
          <div className="grid grid-cols-8 gap-3">
            {quickActions.map(qa => {
              const Icon = qa.icon;
              return (
                <button key={qa.label} onClick={qa.onClick}
                  className="flex flex-col items-center gap-2.5 px-2 py-4 rounded-2xl border border-[#E5F4F7] bg-white hover:border-[#C8E8F2] hover:bg-[#F8FDFE] hover:shadow-md transition-all duration-200 cursor-pointer group">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
                    style={{ background: qa.bg }}>
                    <Icon size={17} style={{ color: qa.color }} />
                  </div>
                  <span className="text-[11.5px] font-semibold text-[#374151] text-center leading-tight group-hover:text-[#0F172A] transition-colors">{qa.label}</span>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}


// ── User Management ────────────────────────────────────────────────────────

function UserManagement() {
  const PER_PAGE = 8;

  // ── State ──────────────────────────────────────────────────────────────
  const [search, setSearch]               = useState("");
  const [planFilter, setPlanFilter]       = useState("All");
  const [statusFilter, setStatusFilter]   = useState("All");
  const [roleFilter, setRoleFilter]       = useState("All");
  const [showFilters, setShowFilters]     = useState(false);
  const [selected, setSelected]           = useState<Set<string>>(new Set());
  const [page, setPage]                   = useState(1);
  const [activeUser, setActiveUser]       = useState<typeof mockUsers[0] | null>(null);
  const [upgradeUser, setUpgradeUser]     = useState<typeof mockUsers[0] | null>(null);
  const [localUsers, setLocalUsers]       = useState(() => mockUsers);
  const [openMenuId, setOpenMenuId]       = useState<string | null>(null);
  const [sortBy, setSortBy]               = useState<"name"|"email"|"joined"|"meetings"|"plan">("name");
  const [sortDir, setSortDir]             = useState<"asc"|"desc">("asc");
  const [sortOpen, setSortOpen]           = useState(false);
  const [showAddUser, setShowAddUser]     = useState(false);
  const [addUserForm, setAddUserForm]     = useState({ name:"", email:"", role:"Member", plan:"Free", phone:"", status:"active" });

  // ── Filter helpers ─────────────────────────────────────────────────────
  const doSearch       = (v: string) => { setSearch(v);       setPage(1); };
  const doPlanFilter   = (v: string) => { setPlanFilter(v);   setPage(1); };
  const doStatusFilter = (v: string) => { setStatusFilter(v); setPage(1); };
  const doRoleFilter   = (v: string) => { setRoleFilter(v);   setPage(1); };
  const clearFilters   = () => { doPlanFilter("All"); doStatusFilter("All"); doRoleFilter("All"); };
  const activeFilters  = [planFilter, statusFilter, roleFilter].filter(f => f !== "All").length;

  // ── Derived data ───────────────────────────────────────────────────────
  const filtered = useMemo(() => localUsers.filter(u => {
    const q = search.toLowerCase();
    return (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
      && (planFilter   === "All" || u.plan   === planFilter)
      && (statusFilter === "All" || u.status === statusFilter)
      && (roleFilter   === "All" || u.role   === roleFilter);
  }), [search, planFilter, statusFilter, roleFilter, localUsers]);

  const sorted = useMemo(() => [...filtered].sort((a,b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    if (sortBy === "name")     return dir * a.name.localeCompare(b.name);
    if (sortBy === "email")    return dir * a.email.localeCompare(b.email);
    if (sortBy === "joined")   return dir * a.joined.localeCompare(b.joined);
    if (sortBy === "meetings") return dir * (a.meetings - b.meetings);
    if (sortBy === "plan")     return dir * a.plan.localeCompare(b.plan);
    return 0;
  }), [filtered, sortBy, sortDir]);

  const totalPages  = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage    = Math.min(page, totalPages);
  const pageSlice   = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  // ── Bulk select ────────────────────────────────────────────────────────
  const allOnPage = pageSlice.length > 0 && pageSlice.every(u => selected.has(u.id));
  const toggleAll = () => {
    const next = new Set(selected);
    allOnPage ? pageSlice.forEach(u => next.delete(u.id)) : pageSlice.forEach(u => next.add(u.id));
    setSelected(next);
  };
  const toggleOne = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  // ── User mutations ─────────────────────────────────────────────────────
  const patchUsers = (ids: Set<string>, patch: Partial<typeof mockUsers[0]>) =>
    setLocalUsers(prev => prev.map(u => ids.has(u.id) ? { ...u, ...patch } : u));

  const toggleSuspend = (u: typeof mockUsers[0]) => {
    const next = u.status === "suspended" ? "active" : "suspended";
    patchUsers(new Set([u.id]), { status: next as typeof u.status });
    if (activeUser?.id === u.id) setActiveUser(prev => prev ? { ...prev, status: next as typeof prev.status } : null);
  };
  const deleteUser = (id: string) => {
    setLocalUsers(prev => prev.filter(u => u.id !== id));
    if (activeUser?.id === id) setActiveUser(null);
    const next = new Set(selected); next.delete(id); setSelected(next);
  };
  const applyPlan = (userId: string, plan: string) => {
    patchUsers(new Set([userId]), { plan });
    if (activeUser?.id === userId) setActiveUser(prev => prev ? { ...prev, plan } : null);
    setUpgradeUser(null);
  };

  const bulkSuspend    = () => { patchUsers(selected, { status: "suspended" }); setSelected(new Set()); };
  const bulkReactivate = () => { patchUsers(selected, { status: "active"    }); setSelected(new Set()); };
  const bulkDelete     = () => { setLocalUsers(prev => prev.filter(u => !selected.has(u.id))); setSelected(new Set()); };

  // ── Style helpers ──────────────────────────────────────────────────────
  const planCls = (plan: string) =>
    plan === "Enterprise" ? "bg-purple-50 text-purple-700 border border-purple-200" :
    plan === "Pro"        ? "bg-[#F0FDFF] text-[#0891B2] border border-cyan-200"    :
                            "bg-slate-50 text-slate-500 border border-slate-200";

  const roleOpts = useMemo(() => ["All", ...Array.from(new Set(localUsers.map(u => u.role)))], [localUsers]);

  const pageNums: (number | "…")[] = useMemo(() => {
    const all = Array.from({ length: totalPages }, (_, i) => i + 1);
    return all.filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
      .reduce<(number | "…")[]>((acc, p, idx, arr) => {
        if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("…");
        acc.push(p); return acc;
      }, []);
  }, [totalPages, safePage]);

  // ── Overview stats ─────────────────────────────────────────────────────
  const activeCount    = localUsers.filter(u => u.status === "active").length;
  const suspendedCount = localUsers.filter(u => u.status === "suspended").length;
  const pendingCount   = localUsers.filter(u => u.status === "inactive").length;

  // ── Activity timeline data ─────────────────────────────────────────────
  const activityEvents = [
    { icon: Users,       color: "#06B6D4", label: "User Joined",                user: "Tom Eriksson",       time: "2m ago"    },
    { icon: Building2,   color: "#4F46E5", label: "Workspace Created",          user: "Aiko Tanaka",        time: "18m ago"   },
    { icon: Video,       color: "#10B981", label: "Meeting Uploaded",            user: "Priya Patel",        time: "41m ago"   },
    { icon: Sparkles,    color: "#F59E0B", label: "AI Summary Generated",       user: "Sarah Chen",         time: "1h ago"    },
    { icon: Send,        color: "#8B5CF6", label: "Team Invitation Accepted",   user: "Marcus Williams",    time: "2h ago"    },
    { icon: CreditCard,  color: "#06B6D4", label: "Plan Upgraded",              user: "Fatima Al-Hassan",   time: "3h ago"    },
  ];

  return (
    <div className="h-full overflow-y-auto scrollbar-hide" onClick={() => setOpenMenuId(null)}>
      <div className="px-10 py-9 space-y-7 max-w-[1600px]">

        {/* ── Page header ─────────────────────────────────────────────────── */}
        <div className="flex items-end justify-between gap-6">
          <div>
            <h1 className="text-[28px] font-bold text-[#0F172A] tracking-[-0.025em] leading-none">
              Users
            </h1>
            <p className="text-[13.5px] text-[#64748B] mt-2.5 leading-relaxed">
              Manage, monitor and organize every user across the Meetiva platform.
            </p>
          </div>
          <button onClick={() => setShowAddUser(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#06B6D4] text-white text-[13px] font-semibold hover:bg-[#0891B2] transition-colors cursor-pointer flex-shrink-0 shadow-sm">
            <Plus size={14} /> Add User
          </button>
        </div>


      {/* ── Add User Modal ───────────────────────────────────────────────── */}
      {showAddUser && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" onClick={()=>setShowAddUser(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[3px]"/>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-[#E5F4F7] overflow-hidden" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#EDF7F9]">
              <div>
                <h2 className="text-[16px] font-bold text-[#0F172A]">Add New User</h2>
                <p className="text-[11.5px] text-[#94A3B8] mt-0.5">Fill in the details to create a new user account</p>
              </div>
              <button onClick={()=>setShowAddUser(false)} className="w-8 h-8 rounded-xl flex items-center justify-center text-[#94A3B8] hover:bg-[#F5FEFF] hover:text-[#0F172A] transition-colors cursor-pointer"><X size={15}/></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">Full Name *</label>
                  <input value={addUserForm.name} onChange={e=>setAddUserForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Jane Smith"
                    className="w-full px-3 py-2.5 text-[13px] bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/10 transition-all"/>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">Email Address *</label>
                  <input type="email" value={addUserForm.email} onChange={e=>setAddUserForm(f=>({...f,email:e.target.value}))} placeholder="jane@company.com"
                    className="w-full px-3 py-2.5 text-[13px] bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/10 transition-all"/>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">Phone Number</label>
                <input type="tel" value={addUserForm.phone} onChange={e=>setAddUserForm(f=>({...f,phone:e.target.value}))} placeholder="+1 (555) 000-0000"
                  className="w-full px-3 py-2.5 text-[13px] bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/10 transition-all"/>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">Role</label>
                  <select value={addUserForm.role} onChange={e=>setAddUserForm(f=>({...f,role:e.target.value}))}
                    className="w-full px-3 py-2.5 text-[13px] bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] transition-all cursor-pointer">
                    {["Member","Admin","Owner"].map(r=><option key={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">Plan</label>
                  <select value={addUserForm.plan} onChange={e=>setAddUserForm(f=>({...f,plan:e.target.value}))}
                    className="w-full px-3 py-2.5 text-[13px] bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] transition-all cursor-pointer">
                    {["Free","Pro","Enterprise"].map(p=><option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">Status</label>
                  <select value={addUserForm.status} onChange={e=>setAddUserForm(f=>({...f,status:e.target.value}))}
                    className="w-full px-3 py-2.5 text-[13px] bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] transition-all cursor-pointer">
                    {["active","inactive","pending"].map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#EDF7F9] bg-[#FAFEFF]">
              <button onClick={()=>setShowAddUser(false)} className="px-4 py-2 rounded-xl border border-[#E5F4F7] text-[13px] font-semibold text-[#64748B] hover:bg-[#F8FDFE] transition-colors cursor-pointer">Cancel</button>
              <button onClick={()=>{
                if(!addUserForm.name.trim()||!addUserForm.email.trim()){toast.error("Name and email are required");return;}
                const newUser={id:"u"+Date.now(),name:addUserForm.name,email:addUserForm.email,role:addUserForm.role,plan:addUserForm.plan,status:addUserForm.status as StatusV,storage:"0 GB",meetings:0,joined:new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}),phone:addUserForm.phone,avatar:addUserForm.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()};
                setLocalUsers(u=>[newUser,...u]);
                setShowAddUser(false);
                setAddUserForm({name:"",email:"",role:"Member",plan:"Free",phone:"",status:"active"});
                toast.success(`User "${newUser.name}" added successfully`);
              }} className="px-5 py-2 rounded-xl bg-[#06B6D4] text-white text-[13px] font-semibold hover:bg-[#0891B2] transition-colors cursor-pointer flex items-center gap-1.5">
                <Plus size={13}/> Add User
              </button>
            </div>
          </div>
        </div>
      )}
        {/* ── Overview Cards ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-4">
          {([
            { label: "New Users Today",      value: "3",                         icon: Users,        trend: "+3", up: true,  sub: "vs 1 yesterday"      },
            { label: "Active Users",         value: activeCount.toString(),      icon: Activity,     trend: "+2", up: true,  sub: "currently active"    },
            { label: "Suspended Users",      value: suspendedCount.toString(),   icon: Ban,          trend: "0",  up: false, sub: "no change today"     },
            { label: "Pending Verification", value: pendingCount.toString(),     icon: AlertCircle,  trend: "-1", up: true,  sub: "resolved 1 today"    },
          ] as { label: string; value: string; icon: React.ElementType; trend: string; up: boolean; sub: string }[]).map(({ label, value, icon: Ic, trend, up, sub }) => (
            <div key={label} className="bg-white border border-[#E5F4F7] rounded-2xl p-5 flex items-start gap-4 hover:border-[#06B6D4]/30 hover:shadow-sm transition-all">
              <div className="w-9 h-9 rounded-xl bg-[#F5FEFF] border border-[#E5F4F7] flex items-center justify-center flex-shrink-0">
                <Ic size={16} className="text-[#06B6D4]" />
              </div>
              <div className="min-w-0">
                <div className="text-[26px] font-bold text-[#0F172A] leading-none tracking-[-0.02em]">{value}</div>
                <div className="text-[12px] font-medium text-[#64748B] mt-1.5">{label}</div>
                <div className="flex items-center gap-1.5 mt-2">
                  {up ? <TrendingUp size={11} className="text-emerald-500" /> : <TrendingDown size={11} className="text-amber-500" />}
                  <span className={`text-[11px] font-semibold ${up ? "text-emerald-600" : "text-amber-600"}`}>{trend}</span>
                  <span className="text-[11px] text-[#94A3B8]">{sub}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Toolbar ──────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-72">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none" />
            <input
              value={search}
              onChange={e => doSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="w-full pl-10 pr-10 py-2.5 text-[13px] bg-white border border-[#E5F4F7] rounded-xl text-[#0F172A] placeholder-[#B0C4CB] outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/10 transition-all"
            />
            {search && (
              <button onClick={() => doSearch("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#EDF7F9] flex items-center justify-center text-[#94A3B8] hover:text-[#4B5563] cursor-pointer transition-colors">
                <X size={10} />
              </button>
            )}
          </div>
          <button onClick={() => setShowFilters(f => !f)}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-[13px] font-medium transition-all cursor-pointer ${
              showFilters || activeFilters > 0
                ? "border-[#06B6D4] bg-[#F0FAFE] text-[#06B6D4]"
                : "border-[#E5F4F7] bg-white text-[#475569] hover:border-[#06B6D4] hover:text-[#06B6D4]"
            }`}>
            <Filter size={13} />
            Filter
            {activeFilters > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#06B6D4] text-white text-[9px] font-bold flex items-center justify-center leading-none">
                {activeFilters}
              </span>
            )}
          </button>
          <div className="relative">
            <button onClick={() => setSortOpen(o => !o)} className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border bg-white text-[13px] font-medium transition-all cursor-pointer ${sortOpen?"border-[#06B6D4] text-[#06B6D4]":"border-[#E5F4F7] text-[#475569] hover:border-[#06B6D4] hover:text-[#06B6D4]"}`}>
              <ChevronDown size={13} className={`transition-transform ${sortOpen?"rotate-180":""}`}/> Sort
            </button>
            {sortOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-[#E5F4F7] rounded-xl shadow-xl z-50 py-1 min-w-[180px]" onClick={e=>e.stopPropagation()}>
                {([["name","Name"],["email","Email"],["joined","Date Joined"],["meetings","Meetings"],["plan","Plan"]] as const).map(([k,lbl])=>(
                  <button key={k} onClick={()=>{if(sortBy===k)setSortDir(d=>d==="asc"?"desc":"asc");else{setSortBy(k);setSortDir("asc");}setSortOpen(false);}}
                    className={`w-full flex items-center justify-between px-3 py-2 text-[12px] hover:bg-[#F8FDFE] cursor-pointer transition-colors ${sortBy===k?"text-[#06B6D4] font-semibold":"text-[#374151]"}`}>
                    {lbl}{sortBy===k&&<span className="text-[10px]">{sortDir==="asc"?"↑":"↓"}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
          {selected.size > 0 && (
            <div className="flex items-center gap-1.5 px-3.5 py-2.5 bg-[#F0FAFE] border border-[#06B6D4]/20 rounded-xl">
              <span className="w-5 h-5 rounded-full bg-[#06B6D4] text-white text-[9px] font-bold flex items-center justify-center">{selected.size}</span>
              <span className="text-[12px] font-semibold text-[#0F172A]">selected</span>
              <button onClick={bulkSuspend} className="ml-1 text-[11px] font-semibold text-amber-600 hover:text-amber-700 px-2 py-1 rounded-lg hover:bg-amber-50 cursor-pointer transition-colors flex items-center gap-1">
                <Ban size={10} /> Suspend
              </button>
              <button onClick={bulkReactivate} className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 px-2 py-1 rounded-lg hover:bg-emerald-50 cursor-pointer transition-colors flex items-center gap-1">
                <CheckCircle size={10} /> Activate
              </button>
              <button onClick={bulkDelete} className="text-[11px] font-semibold text-red-500 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 cursor-pointer transition-colors flex items-center gap-1">
                <Trash2 size={10} /> Delete
              </button>
              <button onClick={() => setSelected(new Set())} className="ml-1 w-5 h-5 rounded-lg flex items-center justify-center text-[#94A3B8] hover:text-[#475569] cursor-pointer transition-colors">
                <X size={11} />
              </button>
            </div>
          )}
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => toast.success("Exporting users as CSV…")} className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-[#E5F4F7] bg-white text-[13px] font-medium text-[#475569] hover:border-[#06B6D4] hover:text-[#06B6D4] transition-all cursor-pointer">
              <Download size={13} /> Export
            </button>
          </div>
        </div>

        {/* ── Advanced Filters ─────────────────────────────────────────────── */}
        {showFilters && (
          <div className="bg-white border border-[#E5F4F7] rounded-2xl px-6 py-4">
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-3">
                <span className="text-[10.5px] font-mono font-semibold text-[#9CA3AF] uppercase tracking-[0.12em] flex-shrink-0">Plan</span>
                <div className="flex items-center bg-[#F5FEFF] border border-[#E5F4F7] rounded-xl p-0.5 gap-0.5">
                  {["All", "Enterprise", "Pro", "Free"].map(p => (
                    <button key={p} onClick={() => doPlanFilter(p)}
                      className={`px-3 py-1.5 rounded-[9px] text-[11.5px] font-semibold transition-all duration-150 cursor-pointer ${
                        planFilter === p ? "bg-white text-[#0F172A] shadow-sm border border-[#E5F4F7]" : "text-[#9CA3AF] hover:text-[#475569]"
                      }`}>{p}</button>
                  ))}
                </div>
              </div>
              <div className="w-px h-8 bg-[#EDF7F9]" />
              <div className="flex items-center gap-3">
                <span className="text-[10.5px] font-mono font-semibold text-[#9CA3AF] uppercase tracking-[0.12em] flex-shrink-0">Status</span>
                <div className="flex items-center bg-[#F5FEFF] border border-[#E5F4F7] rounded-xl p-0.5 gap-0.5">
                  {["All", "active", "suspended", "inactive"].map(s => (
                    <button key={s} onClick={() => doStatusFilter(s)}
                      className={`px-3 py-1.5 rounded-[9px] text-[11.5px] font-semibold transition-all duration-150 cursor-pointer ${
                        statusFilter === s ? "bg-white text-[#0F172A] shadow-sm border border-[#E5F4F7]" : "text-[#9CA3AF] hover:text-[#475569]"
                      }`}>{s}</button>
                  ))}
                </div>
              </div>
              <div className="w-px h-8 bg-[#EDF7F9]" />
              <div className="flex items-center gap-3">
                <span className="text-[10.5px] font-mono font-semibold text-[#9CA3AF] uppercase tracking-[0.12em] flex-shrink-0">Role</span>
                <div className="flex items-center bg-[#F5FEFF] border border-[#E5F4F7] rounded-xl p-0.5 gap-0.5 flex-wrap">
                  {roleOpts.map(r => (
                    <button key={r} onClick={() => doRoleFilter(r)}
                      className={`px-3 py-1.5 rounded-[9px] text-[11.5px] font-semibold transition-all duration-150 cursor-pointer ${
                        roleFilter === r ? "bg-white text-[#0F172A] shadow-sm border border-[#E5F4F7]" : "text-[#9CA3AF] hover:text-[#475569]"
                      }`}>{r}</button>
                  ))}
                </div>
              </div>
              {activeFilters > 0 && (
                <>
                  <div className="w-px h-8 bg-[#EDF7F9]" />
                  <button onClick={clearFilters} className="text-[12px] font-semibold text-red-500 hover:text-red-600 cursor-pointer transition-colors">Clear all</button>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── Main content: table + details panel ──────────────────────────── */}
        <div className="flex gap-5 items-start">

          {/* Table (72%) */}
          <div className="flex-1 min-w-0 space-y-0">
            <div className="bg-white border border-[#E5F4F7] rounded-2xl overflow-hidden">
              <div className="overflow-x-auto [&::-webkit-scrollbar]:h-[5px] [&::-webkit-scrollbar-track]:bg-[#F0FAFE] [&::-webkit-scrollbar-thumb]:bg-[#06B6D4]/40 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-[#06B6D4] [&::-webkit-scrollbar-thumb:active]:bg-[#0891B2]">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-[#EDF7F9] bg-[#F9FCFD]">
                      {(["User", "Email", "Role", "Workspace", "Meetings", "Storage", "Status", "Last Active", ""] as const).map((h, i) => (
                        <th key={i} className={`px-4 py-3.5 text-left text-[10.5px] font-mono font-semibold text-[#9CA3AF] uppercase tracking-[0.12em] whitespace-nowrap ${h === "" ? "w-12" : ""}`}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pageSlice.length === 0 && (
                      <tr>
                        <td colSpan={10} className="px-5 py-20 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <Users size={28} className="text-[#CBD5E1]" />
                            <p className="text-[13px] text-[#94A3B8]">No users match your current filters.</p>
                            {activeFilters > 0 && (
                              <button onClick={clearFilters} className="text-[12px] font-semibold text-[#06B6D4] hover:text-[#0891B2] cursor-pointer mt-1">
                                Clear filters
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                    {pageSlice.map((u, rowIdx) => {
                      const isSelected = selected.has(u.id);
                      const isActive   = activeUser?.id === u.id;
                      const storagePct = Math.min(100, (parseFloat(u.storage) / 20) * 100);
                      const isLast     = rowIdx === pageSlice.length - 1;
                      const menuOpen   = openMenuId === u.id;
                      return (
                        <tr key={u.id}
                          onClick={e => { e.stopPropagation(); setActiveUser(u); }}
                          className={`transition-colors group cursor-pointer ${isLast ? "" : "border-b border-[#F0F9FB]"} ${
                            isActive ? "bg-[#EFF9FC]" : isSelected ? "bg-[#F0FAFE]" : "hover:bg-[#FAFCFD]"
                          }`}>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <Av initials={u.avatar} />
                              <div>
                                <div className="text-[13px] font-semibold text-[#0F172A] whitespace-nowrap">{u.name}</div>
                                <div className="text-[11px] font-mono text-[#94A3B8] mt-0.5">{u.joined}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-[12px] font-mono text-[#64748B]">{u.email}</span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-[11px] font-mono text-[#475569] bg-[#F5FEFF] px-2 py-0.5 rounded-lg border border-[#EDF7F9]">{u.role}</span>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-lg ${planCls(u.plan)}`}>{u.plan}</span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-[12px] font-mono text-[#475569] tabular-nums">{u.meetings.toLocaleString()}</span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="space-y-1.5">
                              <span className="text-[11.5px] font-mono text-[#475569] tabular-nums">{u.storage}</span>
                              <div className="w-16 h-[3px] bg-[#EDF7F9] rounded-full overflow-hidden">
                                <div className="h-full rounded-full bg-[#F59E0B]" style={{ width: `${storagePct}%` }} />
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <Badge variant={u.status}>{u.status}</Badge>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-[11.5px] font-mono text-[#94A3B8] whitespace-nowrap">Just now</span>
                          </td>
                          <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                            <div className="relative">
                              <button
                                onClick={e => { e.stopPropagation(); setOpenMenuId(menuOpen ? null : u.id); }}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-[#94A3B8] hover:text-[#475569] hover:bg-[#EDF7F9] opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                                <MoreHorizontal size={14} />
                              </button>
                              {menuOpen && (
                                <div className="absolute right-0 top-8 z-20 bg-white border border-[#E5F4F7] rounded-xl shadow-lg py-1 w-44">
                                  <button onClick={() => { setActiveUser(u); setOpenMenuId(null); }}
                                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[12.5px] text-[#475569] hover:bg-[#F5FEFF] hover:text-[#0F172A] cursor-pointer transition-colors">
                                    <Eye size={13} /> View Profile
                                  </button>
                                  <button onClick={() => { toggleSuspend(u); setOpenMenuId(null); }}
                                    className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-[12.5px] cursor-pointer transition-colors ${
                                      u.status === "suspended" ? "text-emerald-600 hover:bg-emerald-50" : "text-amber-600 hover:bg-amber-50"
                                    }`}>
                                    {u.status === "suspended" ? <><CheckCircle size={13} /> Reactivate</> : <><Ban size={13} /> Suspend</>}
                                  </button>
                                  <button className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[12.5px] text-[#475569] hover:bg-[#F5FEFF] hover:text-[#0F172A] cursor-pointer transition-colors">
                                    <Key size={13} /> Reset Password
                                  </button>
                                  <button onClick={() => { setUpgradeUser(u); setOpenMenuId(null); }}
                                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[12.5px] text-[#4F46E5] hover:bg-indigo-50 cursor-pointer transition-colors">
                                    <CreditCard size={13} /> Upgrade Plan
                                  </button>
                                  <div className="mx-3 my-1 h-px bg-[#EDF7F9]" />
                                  <button onClick={() => { deleteUser(u.id); setOpenMenuId(null); }}
                                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[12.5px] text-red-500 hover:bg-red-50 cursor-pointer transition-colors">
                                    <Trash2 size={13} /> Delete User
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-5 py-3.5 border-t border-[#EDF7F9]">
                <span className="text-[11.5px] font-mono text-[#94A3B8]">
                  {filtered.length === 0
                    ? "No results"
                    : `${(safePage - 1) * PER_PAGE + 1}–${Math.min(safePage * PER_PAGE, sorted.length)} of ${sorted.length} users`}
                </span>
                <div className="flex items-center gap-1">
                  <button disabled={safePage === 1} onClick={() => setPage(p => p - 1)}
                    className="px-2.5 py-1.5 rounded-lg text-[11.5px] font-mono text-[#475569] hover:bg-[#EDF7F9] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors">
                    ← Prev
                  </button>
                  {pageNums.map((p, i) =>
                    p === "…"
                      ? <span key={`el-${i}`} className="w-7 text-center text-[#94A3B8] text-[11.5px] select-none">…</span>
                      : <button key={p} onClick={() => setPage(p as number)}
                          className={`w-7 h-7 rounded-lg text-[11.5px] font-mono transition-all cursor-pointer ${
                            safePage === p ? "bg-[#06B6D4] text-white" : "text-[#475569] hover:bg-[#EDF7F9]"
                          }`}>
                          {p}
                        </button>
                  )}
                  <button disabled={safePage === totalPages} onClick={() => setPage(p => p + 1)}
                    className="px-2.5 py-1.5 rounded-lg text-[11.5px] font-mono text-[#475569] hover:bg-[#EDF7F9] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors">
                    Next →
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* User Details Panel (28%) */}
        </div>

        {/* ── User Detail Modal ──────────────────────────────────────────────── */}
        {activeUser && (() => {
          const storagePct = Math.min(100, (parseFloat(activeUser.storage) / 20) * 100);
          const recentActivity = [
            { icon: Video,    label: "Joined a meeting",      time: "5m ago" },
            { icon: Sparkles, label: "AI summary generated",  time: "1h ago" },
            { icon: Upload,   label: "Recording uploaded",    time: "3h ago" },
            { icon: Shield,   label: "Password changed",      time: "2d ago" },
          ];
          const fields = [
            { label: "Role",      value: activeUser.role,                      icon: User      },
            { label: "Workspace", value: activeUser.plan + " workspace",       icon: Building2 },
            { label: "Meetings",  value: activeUser.meetings.toLocaleString(), icon: Video     },
            { label: "Joined",    value: activeUser.joined,                    icon: Clock     },
          ] as { label: string; value: string; icon: React.ElementType }[];
          return (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ backgroundColor: "rgba(15,23,42,0.45)", backdropFilter: "blur(4px)" }}
              onClick={() => setActiveUser(null)}
            >
              <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
                style={{ boxShadow: "0 24px 64px rgba(6,182,212,0.12), 0 8px 24px rgba(0,0,0,0.14)" }}
                onClick={e => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#EDF7F9]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#06B6D4] to-[#4F46E5] flex items-center justify-center text-white text-[15px] font-bold shadow-sm">
                      {activeUser.avatar}
                    </div>
                    <div>
                      <div className="text-[15px] font-semibold text-[#111827] leading-tight">{activeUser.name}</div>
                      <div className="text-[11.5px] font-mono text-[#94A3B8] mt-0.5">{activeUser.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={activeUser.status}>{activeUser.status}</Badge>
                    <span className={`text-[10.5px] font-mono font-semibold px-2 py-0.5 rounded-lg ${planCls(activeUser.plan)}`}>{activeUser.plan}</span>
                    <button onClick={() => setActiveUser(null)}
                      className="ml-1 w-8 h-8 rounded-xl border border-[#E5F4F7] flex items-center justify-center text-[#94A3B8] hover:text-[#374151] hover:border-[#C8E8F2] hover:bg-[#F5FEFF] transition-all cursor-pointer">
                      <X size={15} />
                    </button>
                  </div>
                </div>

                {/* Fields grid */}
                <div className="px-6 py-4 grid grid-cols-2 gap-x-8 gap-y-3.5 border-b border-[#EDF7F9]">
                  {fields.map(({ label, value, icon: Ic }) => (
                    <div key={label}>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Ic size={10} className="text-[#94A3B8] flex-shrink-0" />
                        <span className="text-[10.5px] font-medium text-[#94A3B8] uppercase tracking-wide">{label}</span>
                      </div>
                      <span className="text-[13px] font-semibold text-[#111827]">{value}</span>
                    </div>
                  ))}
                </div>

                {/* Storage bar */}
                <div className="px-6 py-3 border-b border-[#EDF7F9]">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <HardDrive size={10} className="text-[#94A3B8]" />
                      <span className="text-[10.5px] font-medium text-[#94A3B8] uppercase tracking-wide">Storage</span>
                    </div>
                    <span className="text-[12px] font-semibold text-[#374151]">{activeUser.storage} / 20 GB · {storagePct.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-[#EDF7F9] rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-[#F59E0B] transition-all duration-500" style={{ width: `${storagePct}%` }} />
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="px-6 py-4 border-b border-[#EDF7F9]">
                  <div className="text-[10.5px] font-semibold text-[#94A3B8] uppercase tracking-wide mb-3">Recent Activity</div>
                  <div className="grid grid-cols-2 gap-2">
                    {recentActivity.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-[#F5FEFF] border border-[#EDF7F9] flex items-center justify-center flex-shrink-0">
                          <item.icon size={11} className="text-[#06B6D4]" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[11px] text-[#374151] truncate">{item.label}</div>
                          <div className="text-[10px] font-mono text-[#94A3B8]">{item.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="px-6 py-4 flex flex-wrap gap-2">
                  <button onClick={() => toast.info("Full profile view coming soon")} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#06B6D4] text-white text-[12.5px] font-semibold hover:bg-[#0891B2] transition-colors cursor-pointer">
                    <Eye size={13} /> View Profile
                  </button>
                  <button onClick={() => { toggleSuspend(activeUser); setActiveUser(null); }}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-[12.5px] font-semibold transition-colors cursor-pointer ${
                      activeUser.status === "suspended"
                        ? "bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100"
                        : "bg-amber-50 border-amber-100 text-amber-700 hover:bg-amber-100"
                    }`}>
                    {activeUser.status === "suspended"
                      ? <><CheckCircle size={13} /> Reactivate</>
                      : <><Ban size={13} /> Suspend</>}
                  </button>
                  <button onClick={() => toast.success("Password reset email sent")} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E5F4F7] bg-white text-[12.5px] font-semibold text-[#475569] hover:border-[#06B6D4] hover:text-[#06B6D4] transition-colors cursor-pointer">
                    <Key size={13} /> Reset Password
                  </button>
                  <button onClick={() => { setUpgradeUser(activeUser); setActiveUser(null); }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-indigo-100 bg-indigo-50 text-[12.5px] font-semibold text-[#4F46E5] hover:bg-indigo-100 transition-colors cursor-pointer">
                    <CreditCard size={13} /> Upgrade Plan
                  </button>
                  <button onClick={() => { deleteUser(activeUser.id); setActiveUser(null); }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-50 border border-red-100 text-[12.5px] font-semibold text-red-600 hover:bg-red-100 transition-colors cursor-pointer">
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── Activity Timeline ─────────────────────────────────────────────── */}
        <div className="bg-white border border-[#E5F4F7] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-[14px] font-bold text-[#0F172A] tracking-[-0.01em]">Platform Activity</h3>
              <p className="text-[11.5px] text-[#94A3B8] mt-0.5">Recent events across all users</p>
            </div>
            <button onClick={() => toast.info("Full activity report coming soon")} className="text-[12px] font-semibold text-[#06B6D4] hover:text-[#0891B2] cursor-pointer transition-colors">View all</button>
          </div>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute top-4 left-0 right-0 h-px bg-[#EDF7F9]" />
            <div className="grid grid-cols-6 gap-4 relative">
              {activityEvents.map((ev, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2.5 group cursor-default">
                  <div className="w-8 h-8 rounded-full border-2 border-white ring-1 ring-[#E5F4F7] flex items-center justify-center bg-white z-10 group-hover:ring-[#06B6D4]/40 transition-all shadow-sm"
                    style={{ backgroundColor: ev.color + "15" }}>
                    <ev.icon size={14} style={{ color: ev.color }} />
                  </div>
                  <div className="text-center">
                    <div className="text-[11px] font-semibold text-[#374151] leading-tight">{ev.label}</div>
                    <div className="text-[10px] font-mono text-[#94A3B8] mt-0.5">{ev.user}</div>
                    <div className="text-[10px] font-mono text-[#B0C4CB] mt-0.5">{ev.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* ── Upgrade / Downgrade Plan modal ────────────────────────────────────── */}
      {upgradeUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-[#0F172A]/15 backdrop-blur-[3px]" onClick={() => setUpgradeUser(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-[#E5F4F7] w-[340px] p-7">
            <div className="flex items-start justify-between mb-1.5">
              <h3 className="meetiva-body-lg font-semibold text-[#0F172A] tracking-[-0.015em]">Change Plan</h3>
              <button onClick={() => setUpgradeUser(null)}
                className="w-7 h-7 rounded-lg hover:bg-[#F5FEFF] flex items-center justify-center text-[#94A3B8] hover:text-[#475569] cursor-pointer transition-colors">
                <X size={14} />
              </button>
            </div>
            <p className="text-[12.5px] text-[#64748B] mb-5">
              Changing plan for <span className="font-semibold text-[#0F172A]">{upgradeUser.name}</span>
            </p>
            <div className="space-y-2">
              {([
                { plan: "Free",       price: "$0/mo",   desc: "Up to 5 users, 5 meetings/mo" },
                { plan: "Pro",        price: "$12/mo",  desc: "Up to 50 users, unlimited meetings" },
                { plan: "Enterprise", price: "$49/mo",  desc: "Unlimited users & storage" },
              ] as { plan: string; price: string; desc: string }[]).map(({ plan, price, desc }) => {
                const active = upgradeUser.plan === plan;
                return (
                  <button key={plan} onClick={() => applyPlan(upgradeUser.id, plan)}
                    className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-left transition-all cursor-pointer ${
                      active ? "border-[#06B6D4] bg-[#F0FAFE]" : "border-[#E5F4F7] bg-white hover:border-[#06B6D4] hover:bg-[#F9FCFD]"
                    }`}>
                    <div>
                      <div className={`text-[13px] font-semibold ${active ? "text-[#06B6D4]" : "text-[#0F172A]"}`}>{plan}</div>
                      <div className="text-[11px] text-[#94A3B8] font-mono mt-0.5">{desc}</div>
                    </div>
                    <div className="flex items-center gap-2.5 flex-shrink-0">
                      <span className="text-[12px] font-mono font-semibold text-[#64748B]">{price}</span>
                      {active && <CheckCircle size={14} className="text-[#06B6D4]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Team Management ────────────────────────────────────────────────────────

function TeamManagement() {
  // ── State ───────────────────────────────────────────────────────────────
  const [search, setSearch]           = useState("");
  const [tab, setTab]                 = useState<"all" | "workspaces" | "requests" | "archived">("all");
  const [viewMode, setViewMode]       = useState<"grid" | "list">("grid");
  const [statusFilter, setStatusFilter] = useState("All");
  const [activeTeam, setActiveTeam]   = useState<typeof mockTeams[0] | null>(null);
  const [localTeams, setLocalTeams]   = useState(() => [
    ...mockTeams,
    { id: "t7", name: "Nordic Collective", owner: "Tom Eriksson", members: 8, status: "pending" as StatusV, created: "Jul 30, 2024", plan: "Free" },
    { id: "t8", name: "LatAm Hub", owner: "Diego Reyes", members: 21, status: "suspended" as StatusV, created: "May 1, 2024", plan: "Pro" },
  ]);
  const [openMenuId, setOpenMenuId]   = useState<string | null>(null);
  const [upgradeTeam, setUpgradeTeam] = useState<typeof mockTeams[0] | null>(null);
  const [teamSortBy, setTeamSortBy]   = useState<"name"|"members"|"created"|"plan">("name");
  const [teamSortDir, setTeamSortDir] = useState<"asc"|"desc">("asc");
  const [teamSortOpen, setTeamSortOpen] = useState(false);
  const [showAddTeam, setShowAddTeam]  = useState(false);
  const [addTeamForm, setAddTeamForm]  = useState({ name:"", owner:"", ownerEmail:"", department:"", website:"", description:"", plan:"Free" });
  const [teamMemberInput, setTeamMemberInput] = useState("");
  const [teamMemberList, setTeamMemberList]   = useState<{name:string;email:string;role:string}[]>([]);
  const [showWorkspace, setShowWorkspace]     = useState<typeof mockTeams[0] | null>(null);
  const [showManageMembers, setShowManageMembers] = useState<typeof mockTeams[0] | null>(null);

  // ── Derived ─────────────────────────────────────────────────────────────
  const pendingCount = localTeams.filter(t => t.status === "pending").length;

  const tabFiltered = localTeams.filter(t => {
    if (tab === "requests")  return t.status === "pending";
    if (tab === "archived")  return t.status === "suspended";
    if (tab === "workspaces") return t.status === "verified";
    return true;
  });

  const filtered = tabFiltered.filter(t => {
    const q = search.toLowerCase();
    return (!q || t.name.toLowerCase().includes(q) || t.owner.toLowerCase().includes(q))
      && (statusFilter === "All" || t.status === statusFilter);
  });
  const teamsSorted = useMemo(() => [...filtered].sort((a,b) => {
    const dir = teamSortDir === "asc" ? 1 : -1;
    if (teamSortBy === "name")    return dir * a.name.localeCompare(b.name);
    if (teamSortBy === "members") return dir * (a.members - b.members);
    if (teamSortBy === "created") return dir * a.created.localeCompare(b.created);
    if (teamSortBy === "plan")    return dir * a.plan.localeCompare(b.plan);
    return 0;
  }), [filtered, teamSortBy, teamSortDir]);


  // ── Mutations ────────────────────────────────────────────────────────────
  const verifyTeam  = (id: string) => setLocalTeams(prev => prev.map(t => t.id === id ? { ...t, status: "verified" as StatusV } : t));
  const suspendTeam = (id: string) => setLocalTeams(prev => prev.map(t => t.id === id ? { ...t, status: "suspended" as StatusV } : t));
  const deleteTeam  = (id: string) => {
    setLocalTeams(prev => prev.filter(t => t.id !== id));
    if (activeTeam?.id === id) setActiveTeam(null);
  };
  const applyPlan = (teamId: string, plan: string) => {
    setLocalTeams(prev => prev.map(t => t.id === teamId ? { ...t, plan } : t));
    if (activeTeam?.id === teamId) setActiveTeam(prev => prev ? { ...prev, plan } : null);
    setUpgradeTeam(null);
  };

  // ── Logo color helper ─────────────────────────────────────────────────
  const logoColor = (id: string) => {
    const palette = ["#06B6D4","#4F46E5","#10B981","#F59E0B","#EF4444","#8B5CF6","#EC4899","#0EA5E9"];
    return palette[id.charCodeAt(1) % palette.length];
  };
  const logoInitials = (name: string) => name.split(" ").map(w => w[0]).slice(0,2).join("").toUpperCase();

  const planCls = (plan: string) =>
    plan === "Enterprise" ? "bg-purple-50 text-purple-700 border border-purple-200" :
    plan === "Pro"        ? "bg-[#F0FDFF] text-[#0891B2] border border-cyan-200"    :
                            "bg-slate-50 text-slate-500 border border-slate-200";

  const activityEvents = [
    { icon: Building2, color: "#06B6D4", label: "Team Created",          team: "Nordic Collective", time: "2m ago"  },
    { icon: Zap,       color: "#4F46E5", label: "Workspace Activated",   team: "Acme Corporation",  time: "18m ago" },
    { icon: Users,     color: "#10B981", label: "Member Joined",         team: "Nexus Technologies",time: "42m ago" },
    { icon: Video,     color: "#F59E0B", label: "Meeting Uploaded",      team: "Mitsuko Digital",   time: "1h ago"  },
    { icon: Sparkles,  color: "#8B5CF6", label: "AI Summary Generated",  team: "Orion Labs",        time: "2h ago"  },
    { icon: CreditCard,color: "#06B6D4", label: "Plan Upgraded",         team: "Gulf Ventures",     time: "3h ago"  },
  ];

  const summaryStats = [
    { label: "Total Teams",         value: localTeams.length,                                              icon: Building2   },
    { label: "Active Teams",        value: localTeams.filter(t => t.status === "verified").length,          icon: CheckCircle },
    { label: "Pending Verification",value: localTeams.filter(t => t.status === "pending").length,           icon: Clock       },
    { label: "Suspended",           value: localTeams.filter(t => t.status === "suspended").length,         icon: Ban         },
    { label: "Total Members",       value: localTeams.reduce((s, t) => s + t.members, 0),                   icon: Users       },
  ];

  return (
    <div className="h-full overflow-y-auto scrollbar-hide" onClick={() => setOpenMenuId(null)}>
      {/* ── Add Team Modal ──────────────────────────────────────────── */}
      {/* ── Create Team Modal ──────────────────────────────────────────── */}
      {showAddTeam && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" onClick={()=>{setShowAddTeam(false);setTeamMemberList([]);setTeamMemberInput("");}}>
          <div className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-[4px]"/>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-[#E5F4F7] overflow-hidden flex flex-col max-h-[90vh]" onClick={e=>e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#EDF7F9] bg-gradient-to-r from-[#F0FAFE] to-white flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#06B6D4] flex items-center justify-center shadow-sm">
                  <Building2 size={16} className="text-white"/>
                </div>
                <div>
                  <h2 className="text-[16px] font-bold text-[#0F172A]">Create New Team</h2>
                  <p className="text-[11.5px] text-[#94A3B8]">Set up a workspace for your organization</p>
                </div>
              </div>
              <button onClick={()=>{setShowAddTeam(false);setTeamMemberList([]);setTeamMemberInput("");}} className="w-8 h-8 rounded-xl flex items-center justify-center text-[#94A3B8] hover:bg-[#F5FEFF] hover:text-[#0F172A] transition-colors cursor-pointer"><X size={15}/></button>
            </div>
            {/* Body */}
            <div className="overflow-y-auto px-6 py-5 space-y-5 flex-1">
              {/* Team info */}
              <div>
                <p className="text-[11px] font-bold text-[#06B6D4] uppercase tracking-wider mb-3">Team Info</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">Team / Organization Name *</label>
                    <input value={addTeamForm.name} onChange={e=>setAddTeamForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Design Systems Guild"
                      className="w-full px-3 py-2.5 text-[13px] bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/10 transition-all"/>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">Department</label>
                    <input value={addTeamForm.department} onChange={e=>setAddTeamForm(f=>({...f,department:e.target.value}))} placeholder="e.g. Engineering"
                      className="w-full px-3 py-2.5 text-[13px] bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/10 transition-all"/>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">Website</label>
                    <input value={addTeamForm.website} onChange={e=>setAddTeamForm(f=>({...f,website:e.target.value}))} placeholder="https://company.com"
                      className="w-full px-3 py-2.5 text-[13px] bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/10 transition-all"/>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">Description</label>
                    <textarea value={addTeamForm.description} onChange={e=>setAddTeamForm(f=>({...f,description:e.target.value}))} rows={2} placeholder="What does this team work on?"
                      className="w-full px-3 py-2.5 text-[13px] bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/10 transition-all resize-none"/>
                  </div>
                </div>
              </div>
              {/* Owner */}
              <div>
                <p className="text-[11px] font-bold text-[#4F46E5] uppercase tracking-wider mb-3">Owner / Admin</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">Owner Full Name *</label>
                    <input value={addTeamForm.owner} onChange={e=>setAddTeamForm(f=>({...f,owner:e.target.value}))} placeholder="e.g. Sarah Chen"
                      className="w-full px-3 py-2.5 text-[13px] bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/10 transition-all"/>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">Owner Email</label>
                    <input type="email" value={addTeamForm.ownerEmail} onChange={e=>setAddTeamForm(f=>({...f,ownerEmail:e.target.value}))} placeholder="owner@company.com"
                      className="w-full px-3 py-2.5 text-[13px] bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/10 transition-all"/>
                  </div>
                </div>
              </div>
              {/* Plan */}
              <div>
                <p className="text-[11px] font-bold text-[#8B5CF6] uppercase tracking-wider mb-3">Subscription Plan</p>
                <div className="grid grid-cols-3 gap-3">
                  {([
                    {p:"Free",       price:"$0/mo",   features:["Up to 5 members","5 meetings/mo","1 GB storage"],       color:"#64748B", accent:"#F1F5F9"},
                    {p:"Pro",        price:"$12/mo",  features:["Up to 50 members","Unlimited meetings","20 GB storage"], color:"#06B6D4", accent:"#F0FAFE"},
                    {p:"Enterprise", price:"$49/mo",  features:["Unlimited members","Priority support","500 GB storage"], color:"#4F46E5", accent:"#EEF2FF"},
                  ] as const).map(({p,price,features,color,accent})=>(
                    <button key={p} onClick={()=>setAddTeamForm(f=>({...f,plan:p}))}
                      className={`p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer ${addTeamForm.plan===p ? "border-["+color+"] shadow-md" : "border-[#E5F4F7] hover:border-["+color+"]"}`}
                      style={{background: addTeamForm.plan===p ? accent : "white"}}>
                      <div className="text-[13px] font-bold mb-0.5" style={{color: addTeamForm.plan===p ? color : "#0F172A"}}>{p}</div>
                      <div className="text-[12px] font-semibold mb-2" style={{color: addTeamForm.plan===p ? color : "#94A3B8"}}>{price}</div>
                      {features.map(f=>(
                        <div key={f} className="flex items-center gap-1.5 text-[10.5px] text-[#64748B] mb-0.5">
                          <div className="w-1 h-1 rounded-full flex-shrink-0" style={{background:color}}/>
                          {f}
                        </div>
                      ))}
                    </button>
                  ))}
                </div>
              </div>
              {/* Add Members */}
              <div>
                <p className="text-[11px] font-bold text-[#10B981] uppercase tracking-wider mb-3">Add Members</p>
                <div className="flex gap-2 mb-3">
                  <input value={teamMemberInput} onChange={e=>setTeamMemberInput(e.target.value)}
                    onKeyDown={e=>{
                      if(e.key==="Enter"&&teamMemberInput.trim()){
                        const [name,...rest]=teamMemberInput.split(",");
                        const email=rest[0]?.trim()||"";
                        setTeamMemberList(l=>[...l,{name:name.trim(),email,role:"Member"}]);
                        setTeamMemberInput("");
                      }
                    }}
                    placeholder='Name, email  —  or press Enter to add'
                    className="flex-1 px-3 py-2.5 text-[13px] bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/10 transition-all"/>
                  <button onClick={()=>{
                    if(!teamMemberInput.trim())return;
                    const [name,...rest]=teamMemberInput.split(",");
                    const email=rest[0]?.trim()||"";
                    setTeamMemberList(l=>[...l,{name:name.trim(),email,role:"Member"}]);
                    setTeamMemberInput("");
                  }} className="px-4 py-2.5 rounded-xl bg-[#10B981] text-white text-[13px] font-semibold hover:bg-[#059669] transition-colors cursor-pointer flex items-center gap-1.5">
                    <Plus size={13}/> Add
                  </button>
                </div>
                {teamMemberList.length > 0 && (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {teamMemberList.map((m,i)=>(
                      <div key={i} className="flex items-center gap-2.5 px-3 py-2 bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl">
                        <div className="w-6 h-6 rounded-full bg-[#06B6D4] text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0">
                          {m.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-semibold text-[#0F172A] truncate">{m.name}</p>
                          {m.email && <p className="text-[10.5px] text-[#94A3B8] truncate">{m.email}</p>}
                        </div>
                        <select value={m.role} onChange={e=>setTeamMemberList(l=>l.map((x,j)=>j===i?{...x,role:e.target.value}:x))}
                          className="text-[11px] border border-[#E5F4F7] rounded-lg px-2 py-1 text-[#475569] bg-white outline-none cursor-pointer">
                          {["Member","Admin","Viewer"].map(r=><option key={r}>{r}</option>)}
                        </select>
                        <button onClick={()=>setTeamMemberList(l=>l.filter((_,j)=>j!==i))} className="w-5 h-5 rounded-lg flex items-center justify-center text-[#94A3B8] hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer">
                          <X size={11}/>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {teamMemberList.length === 0 && (
                  <p className="text-[11.5px] text-[#B0C4CB] text-center py-2">No members added yet. Type a name and press Enter.</p>
                )}
              </div>
            </div>
            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-[#EDF7F9] bg-[#FAFEFF] flex-shrink-0">
              <p className="text-[11.5px] text-[#94A3B8]">{teamMemberList.length} member{teamMemberList.length!==1?"s":""} will be invited</p>
              <div className="flex gap-2">
                <button onClick={()=>{setShowAddTeam(false);setTeamMemberList([]);setTeamMemberInput("");}} className="px-4 py-2 rounded-xl border border-[#E5F4F7] text-[13px] font-semibold text-[#64748B] hover:bg-[#F8FDFE] transition-colors cursor-pointer">Cancel</button>
                <button onClick={()=>{
                  if(!addTeamForm.name.trim()||!addTeamForm.owner.trim()){toast.error("Team name and owner are required");return;}
                  const newTeam={id:"t"+Date.now(),name:addTeamForm.name,owner:addTeamForm.owner,members:1+teamMemberList.length,status:"pending" as StatusV,created:new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}),plan:addTeamForm.plan};
                  setLocalTeams(t=>[newTeam,...t]);
                  setShowAddTeam(false);
                  setAddTeamForm({name:"",owner:"",ownerEmail:"",department:"",website:"",description:"",plan:"Free"});
                  setTeamMemberList([]);setTeamMemberInput("");
                  toast.success(`Team "${newTeam.name}" created with ${1+teamMemberList.length} member(s)`);
                }} className="px-5 py-2 rounded-xl bg-[#06B6D4] text-white text-[13px] font-semibold hover:bg-[#0891B2] transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm">
                  <Building2 size={13}/> Create Team
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="px-10 py-9 space-y-6 max-w-[1600px]">

        {/* ── Page Header ─────────────────────────────────────────────────── */}
        <div className="flex items-end justify-between gap-6">
          <div>
            <h1 className="text-[28px] font-bold text-[#0F172A] tracking-[-0.025em] leading-none">Teams</h1>
            <p className="text-[13.5px] text-[#64748B] mt-2.5 leading-relaxed">
              Oversee organizations, workspaces and collaboration in one place.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowAddTeam(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#06B6D4] text-white text-[13px] font-semibold hover:bg-[#0891B2] transition-colors cursor-pointer shadow-sm">
              <Plus size={14} /> Create Team
            </button>
            <button onClick={() => toast.info("Bulk actions: Export, Archive, Delete selected teams")} className="w-9 h-9 rounded-xl border border-[#E5F4F7] bg-white flex items-center justify-center text-[#64748B] hover:border-[#06B6D4] hover:text-[#06B6D4] transition-colors cursor-pointer">
              <MoreHorizontal size={15} />
            </button>
          </div>
        </div>

        {/* ── Workspace Tabs ───────────────────────────────────────────────── */}
        <div className="border-b border-[#E5F4F7]">
          <div className="flex items-center gap-0">
            {([
              { id: "all",        label: "All Teams"   },
              { id: "workspaces", label: "Workspaces"  },
              { id: "requests",   label: "Requests",   badge: pendingCount },
              { id: "archived",   label: "Archived"    },
            ] as { id: typeof tab; label: string; badge?: number }[]).map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-5 py-3 text-[13px] font-semibold border-b-2 transition-all cursor-pointer ${
                  tab === t.id
                    ? "border-[#06B6D4] text-[#06B6D4]"
                    : "border-transparent text-[#64748B] hover:text-[#0F172A]"
                }`}>
                {t.label}
                {t.badge ? (
                  <span className="w-5 h-5 rounded-full bg-[#06B6D4] text-white text-[9px] font-bold flex items-center justify-center leading-none">
                    {t.badge}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </div>

        {/* ── Summary Strip ────────────────────────────────────────────────── */}
        <div className="bg-white border border-[#E5F4F7] rounded-2xl px-6 py-4 flex items-center gap-0 divide-x divide-[#EDF7F9]">
          {summaryStats.map(({ label, value, icon: Ic }, idx) => (
            <div key={idx} className="flex items-center gap-3 px-6 first:pl-0 last:pr-0">
              <div className="w-8 h-8 rounded-xl bg-[#F5FEFF] border border-[#EDF7F9] flex items-center justify-center flex-shrink-0">
                <Ic size={14} className="text-[#06B6D4]" />
              </div>
              <div>
                <div className="text-[19px] font-bold text-[#0F172A] leading-none tracking-[-0.02em]">{value.toLocaleString()}</div>
                <div className="text-[11px] font-medium text-[#94A3B8] mt-0.5">{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Toolbar ──────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 min-w-64">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search teams or owners…"
              className="w-full pl-10 pr-4 py-2.5 text-[13px] bg-white border border-[#E5F4F7] rounded-xl text-[#0F172A] placeholder-[#B0C4CB] outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/10 transition-all"
            />
          </div>
          <div className="flex items-center bg-[#F5FEFF] border border-[#E5F4F7] rounded-xl p-0.5 gap-0.5">
            {["All","verified","pending","suspended"].map(s => (
              <button key={s} onClick={() => setStatusFilter(s === "All" ? "All" : s)}
                className={`px-3 py-1.5 rounded-[9px] text-[11.5px] font-semibold transition-all duration-150 cursor-pointer ${
                  statusFilter === s ? "bg-white text-[#0F172A] shadow-sm border border-[#E5F4F7]" : "text-[#9CA3AF] hover:text-[#475569]"
                }`}>
                {s === "All" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          <div className="w-px h-7 bg-[#EDF7F9]" />
          <div className="relative">
            <button onClick={() => setTeamSortOpen(o => !o)} className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border bg-white text-[13px] font-medium transition-all cursor-pointer ${teamSortOpen?"border-[#06B6D4] text-[#06B6D4]":"border-[#E5F4F7] text-[#475569] hover:border-[#06B6D4] hover:text-[#06B6D4]"}`}>
              <ChevronDown size={13} className={`transition-transform ${teamSortOpen?"rotate-180":""}`}/> Sort
            </button>
            {teamSortOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-[#E5F4F7] rounded-xl shadow-xl z-50 py-1 min-w-[180px]" onClick={e=>e.stopPropagation()}>
                {([["name","Name"],["members","Members"],["created","Date Created"],["plan","Plan"]] as const).map(([k,lbl])=>(
                  <button key={k} onClick={()=>{if(teamSortBy===k)setTeamSortDir(d=>d==="asc"?"desc":"asc");else{setTeamSortBy(k);setTeamSortDir("asc");}setTeamSortOpen(false);}}
                    className={`w-full flex items-center justify-between px-3 py-2 text-[12px] hover:bg-[#F8FDFE] cursor-pointer transition-colors ${teamSortBy===k?"text-[#06B6D4] font-semibold":"text-[#374151]"}`}>
                    {lbl}{teamSortBy===k&&<span className="text-[10px]">{teamSortDir==="asc"?"↑":"↓"}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="w-px h-7 bg-[#EDF7F9]" />
          <div className="flex items-center gap-1 bg-[#F5FEFF] border border-[#E5F4F7] rounded-xl p-0.5">
            <button onClick={() => setViewMode("grid")}
              className={`w-7 h-7 rounded-[9px] flex items-center justify-center transition-all cursor-pointer ${viewMode === "grid" ? "bg-white shadow-sm text-[#06B6D4]" : "text-[#9CA3AF] hover:text-[#475569]"}`}>
              <Layers size={13} />
            </button>
            <button onClick={() => setViewMode("list")}
              className={`w-7 h-7 rounded-[9px] flex items-center justify-center transition-all cursor-pointer ${viewMode === "list" ? "bg-white shadow-sm text-[#06B6D4]" : "text-[#9CA3AF] hover:text-[#475569]"}`}>
              <Menu size={13} />
            </button>
          </div>
        </div>

        {/* ── Main: Cards + Details Panel ──────────────────────────────────── */}
        <div className="flex gap-5 items-start">

          {/* Cards grid / list */}
          <div className="flex-1 min-w-0">
            {viewMode === "grid" ? (
              <div className="grid grid-cols-3 gap-4">
                {teamsSorted.map(team => {
                  const isActive  = activeTeam?.id === team.id;
                  const color     = logoColor(team.id);
                  const menuOpen  = openMenuId === team.id;
                  const storagePct = Math.min(100, (team.members / 200) * 100);
                  return (
                    <div key={team.id}
                      onClick={e => { e.stopPropagation(); setActiveTeam(team); }}
                      className={`relative bg-white border rounded-2xl p-5 cursor-pointer transition-all duration-200 group ${
                        isActive
                          ? "border-[#06B6D4]/50 shadow-[0_0_0_3px_rgba(6,182,212,0.08)] shadow-md"
                          : "border-[#E5F4F7] hover:border-[#06B6D4]/30 hover:shadow-md hover:-translate-y-0.5"
                      }`}>

                      {/* Card header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-[15px] font-bold flex-shrink-0"
                          style={{ backgroundColor: color }}>
                          {logoInitials(team.name)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={team.status}>{team.status}</Badge>
                          <div className="relative" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={e => { e.stopPropagation(); setOpenMenuId(menuOpen ? null : team.id); }}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-[#94A3B8] hover:text-[#475569] hover:bg-[#F5FEFF] opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                              <MoreHorizontal size={14} />
                            </button>
                            {menuOpen && (
                              <div className="absolute right-0 top-8 z-20 bg-white border border-[#E5F4F7] rounded-xl shadow-lg py-1 w-44">
                                <button onClick={() => { setActiveTeam(team); setOpenMenuId(null); }}
                                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[12.5px] text-[#475569] hover:bg-[#F5FEFF] cursor-pointer transition-colors">
                                  <Eye size={13} /> View Details
                                </button>
                                {team.status === "pending" && (
                                  <button onClick={() => { verifyTeam(team.id); setOpenMenuId(null); }}
                                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[12.5px] text-emerald-600 hover:bg-emerald-50 cursor-pointer transition-colors">
                                    <CheckCircle size={13} /> Verify Team
                                  </button>
                                )}
                                <button onClick={() => { setUpgradeTeam(team); setOpenMenuId(null); }}
                                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[12.5px] text-[#4F46E5] hover:bg-indigo-50 cursor-pointer transition-colors">
                                  <CreditCard size={13} /> Upgrade Plan
                                </button>
                                <button onClick={() => { suspendTeam(team.id); setOpenMenuId(null); }}
                                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[12.5px] text-amber-600 hover:bg-amber-50 cursor-pointer transition-colors">
                                  <Ban size={13} /> Suspend
                                </button>
                                <div className="mx-3 my-1 h-px bg-[#EDF7F9]" />
                                <button onClick={() => { deleteTeam(team.id); setOpenMenuId(null); }}
                                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[12.5px] text-red-500 hover:bg-red-50 cursor-pointer transition-colors">
                                  <Trash2 size={13} /> Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Team name + owner */}
                      <div className="mb-4">
                        <h3 className="text-[14px] font-bold text-[#0F172A] leading-tight">{team.name}</h3>
                        <div className="flex items-center gap-1.5 mt-1">
                          <div className="w-4 h-4 rounded-full bg-[#E5F4F7] flex items-center justify-center text-[8px] font-bold text-[#475569]">
                            {team.owner.split(" ").map(n => n[0]).join("").slice(0,2)}
                          </div>
                          <span className="text-[11.5px] text-[#64748B]">{team.owner}</span>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="h-px bg-[#F0F9FB] mb-4" />

                      {/* Stats row */}
                      <div className="grid grid-cols-3 gap-0 text-center">
                        <div>
                          <div className="meetiva-body-lg font-semibold text-[#0F172A] leading-none">{team.members}</div>
                          <div className="text-[10px] font-mono text-[#94A3B8] mt-0.5">Members</div>
                        </div>
                        <div className="border-x border-[#F0F9FB]">
                          <div className="meetiva-body-lg font-semibold text-[#0F172A] leading-none">{Math.round(team.members * 3.4)}</div>
                          <div className="text-[10px] font-mono text-[#94A3B8] mt-0.5">Meetings</div>
                        </div>
                        <div>
                          <div className="meetiva-body-lg font-semibold text-[#0F172A] leading-none">{(team.members * 0.18).toFixed(1)}</div>
                          <div className="text-[10px] font-mono text-[#94A3B8] mt-0.5">GB Used</div>
                        </div>
                      </div>

                      {/* Storage bar */}
                      <div className="mt-4">
                        <div className="h-[3px] bg-[#EDF7F9] rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${storagePct}%`, backgroundColor: color + "cc" }} />
                        </div>
                      </div>

                      {/* Plan badge */}
                      <div className="mt-3 flex items-center justify-between">
                        <span className={`text-[10.5px] font-mono font-semibold px-2 py-0.5 rounded-lg ${planCls(team.plan)}`}>{team.plan}</span>
                        <span className="text-[10.5px] font-mono text-[#94A3B8]">{team.created}</span>
                      </div>
                    </div>
                  );
                })}

                {/* Create new team card */}
                <div className="bg-white border-2 border-dashed border-[#E5F4F7] rounded-2xl p-5 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-[#06B6D4]/40 hover:bg-[#F5FEFF] transition-all group min-h-[200px]">
                  <div className="w-10 h-10 rounded-2xl bg-[#F5FEFF] border border-[#E5F4F7] flex items-center justify-center group-hover:border-[#06B6D4]/30 transition-colors">
                    <Plus size={18} className="text-[#94A3B8] group-hover:text-[#06B6D4] transition-colors" />
                  </div>
                  <div className="text-center">
                    <div className="text-[13px] font-semibold text-[#94A3B8] group-hover:text-[#0F172A] transition-colors">Create New Team</div>
                    <div className="text-[11px] font-mono text-[#B0C4CB] mt-0.5">Set up a new workspace</div>
                  </div>
                </div>
              </div>
            ) : (
              /* List view */
              <div className="bg-white border border-[#E5F4F7] rounded-2xl overflow-hidden">
                {teamsSorted.map((team, idx) => {
                  const isActive = activeTeam?.id === team.id;
                  const color    = logoColor(team.id);
                  const menuOpen = openMenuId === team.id;
                  return (
                    <div key={team.id}
                      onClick={e => { e.stopPropagation(); setActiveTeam(team); }}
                      className={`flex items-center gap-4 px-6 py-4 cursor-pointer transition-colors group ${idx < filtered.length - 1 ? "border-b border-[#F0F9FB]" : ""} ${isActive ? "bg-[#EFF9FC]" : "hover:bg-[#FAFCFD]"}`}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-[13px] font-bold flex-shrink-0"
                        style={{ backgroundColor: color }}>
                        {logoInitials(team.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13.5px] font-semibold text-[#0F172A]">{team.name}</div>
                        <div className="text-[11.5px] text-[#64748B] mt-0.5">{team.owner} · {team.members} members</div>
                      </div>
                      <Badge variant={team.status}>{team.status}</Badge>
                      <span className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-lg ${planCls(team.plan)}`}>{team.plan}</span>
                      <span className="text-[11.5px] font-mono text-[#94A3B8] w-28 text-right">{team.created}</span>
                      <div className="relative" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={e => { e.stopPropagation(); setOpenMenuId(menuOpen ? null : team.id); }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-[#94A3B8] hover:text-[#475569] hover:bg-[#EDF7F9] opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                          <MoreHorizontal size={14} />
                        </button>
                        {menuOpen && (
                          <div className="absolute right-0 top-8 z-20 bg-white border border-[#E5F4F7] rounded-xl shadow-lg py-1 w-44">
                            <button onClick={() => { setActiveTeam(team); setOpenMenuId(null); }}
                              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[12.5px] text-[#475569] hover:bg-[#F5FEFF] cursor-pointer">
                              <Eye size={13} /> View Details
                            </button>
                            {team.status === "pending" && (
                              <button onClick={() => { verifyTeam(team.id); setOpenMenuId(null); }}
                                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[12.5px] text-emerald-600 hover:bg-emerald-50 cursor-pointer">
                                <CheckCircle size={13} /> Verify Team
                              </button>
                            )}
                            <button onClick={() => { setUpgradeTeam(team); setOpenMenuId(null); }}
                              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[12.5px] text-[#4F46E5] hover:bg-indigo-50 cursor-pointer">
                              <CreditCard size={13} /> Upgrade Plan
                            </button>
                            <button onClick={() => { suspendTeam(team.id); setOpenMenuId(null); }}
                              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[12.5px] text-amber-600 hover:bg-amber-50 cursor-pointer">
                              <Ban size={13} /> Suspend
                            </button>
                            <div className="mx-3 my-1 h-px bg-[#EDF7F9]" />
                            <button onClick={() => { deleteTeam(team.id); setOpenMenuId(null); }}
                              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[12.5px] text-red-500 hover:bg-red-50 cursor-pointer">
                              <Trash2 size={13} /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {filtered.length === 0 && (
                  <div className="flex flex-col items-center gap-2 py-20">
                    <Building2 size={28} className="text-[#CBD5E1]" />
                    <p className="text-[13px] text-[#94A3B8]">No teams match your search.</p>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        {/* ── Team Detail Modal ──────────────────────────────────────────────── */}
        {activeTeam && (() => {
          const color      = logoColor(activeTeam.id);
          const storagePct = Math.min(100, (activeTeam.members / 200) * 100);
          const recentActivity = [
            { icon: Users,    label: "Member joined the team",    time: "12m ago" },
            { icon: Video,    label: "Meeting recording uploaded", time: "1h ago"  },
            { icon: Sparkles, label: "AI summary generated",      time: "2h ago"  },
            { icon: Shield,   label: "Plan verified",             time: "1d ago"  },
          ];
          const fields = [
            { label: "Owner",    value: activeTeam.owner,                                    icon: User       },
            { label: "Plan",     value: activeTeam.plan,                                     icon: CreditCard },
            { label: "Created",  value: activeTeam.created,                                  icon: Clock      },
            { label: "Members",  value: activeTeam.members.toLocaleString(),                  icon: Users      },
            { label: "Meetings", value: Math.round(activeTeam.members * 3.4).toLocaleString(),icon: Video      },
            { label: "Storage",  value: (activeTeam.members * 0.18).toFixed(1) + " GB",      icon: HardDrive  },
          ] as { label: string; value: string; icon: React.ElementType }[];
          return (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ backgroundColor: "rgba(15,23,42,0.45)", backdropFilter: "blur(4px)" }}
              onClick={() => setActiveTeam(null)}
            >
              <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
                style={{ boxShadow: "0 24px 64px rgba(6,182,212,0.12), 0 8px 24px rgba(0,0,0,0.14)" }}
                onClick={e => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#EDF7F9]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-[15px] font-bold shadow-sm"
                      style={{ backgroundColor: color }}>
                      {logoInitials(activeTeam.name)}
                    </div>
                    <div>
                      <div className="text-[15px] font-semibold text-[#111827] leading-tight">{activeTeam.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={activeTeam.status}>{activeTeam.status}</Badge>
                        <span className={`text-[10.5px] font-mono font-semibold px-2 py-0.5 rounded-lg ${planCls(activeTeam.plan)}`}>{activeTeam.plan}</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setActiveTeam(null)}
                    className="w-8 h-8 rounded-xl border border-[#E5F4F7] flex items-center justify-center text-[#94A3B8] hover:text-[#374151] hover:border-[#C8E8F2] hover:bg-[#F5FEFF] transition-all cursor-pointer">
                    <X size={15} />
                  </button>
                </div>

                {/* Fields grid */}
                <div className="px-6 py-4 grid grid-cols-2 gap-x-8 gap-y-3.5 border-b border-[#EDF7F9]">
                  {fields.map(({ label, value, icon: Ic }) => (
                    <div key={label}>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Ic size={10} className="text-[#94A3B8] flex-shrink-0" />
                        <span className="text-[10.5px] font-medium text-[#94A3B8] uppercase tracking-wide">{label}</span>
                      </div>
                      <span className="text-[13px] font-semibold text-[#111827]">{value}</span>
                    </div>
                  ))}
                </div>

                {/* Storage bar */}
                <div className="px-6 py-3 border-b border-[#EDF7F9]">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-medium text-[#94A3B8]">Storage capacity</span>
                    <span className="text-[11px] font-semibold text-[#374151]">{storagePct.toFixed(0)}% used</span>
                  </div>
                  <div className="h-2 bg-[#EDF7F9] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${storagePct}%`, backgroundColor: color }} />
                  </div>
                </div>

                {/* Members + Recent Activity */}
                <div className="px-6 py-4 grid grid-cols-2 gap-6 border-b border-[#EDF7F9]">
                  {/* Member avatars */}
                  <div>
                    <div className="text-[10.5px] font-semibold text-[#94A3B8] uppercase tracking-wide mb-2">Members</div>
                    <div className="flex items-center">
                      {Array.from({ length: Math.min(5, activeTeam.members) }, (_, i) => {
                        const initials = ["SC","MW","PP","AT","FA"][i];
                        const bg = ["#06B6D4","#4F46E5","#10B981","#F59E0B","#8B5CF6"][i];
                        return (
                          <div key={i} className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold border-2 border-white -ml-2 first:ml-0 shadow-sm"
                            style={{ backgroundColor: bg }}>{initials}</div>
                        );
                      })}
                      {activeTeam.members > 5 && (
                        <div className="w-8 h-8 rounded-full bg-[#F5FEFF] border-2 border-white border border-[#E5F4F7] flex items-center justify-center text-[10px] font-bold text-[#64748B] -ml-2 shadow-sm">
                          +{activeTeam.members - 5}
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Recent activity */}
                  <div>
                    <div className="text-[10.5px] font-semibold text-[#94A3B8] uppercase tracking-wide mb-2">Recent Activity</div>
                    <div className="space-y-2">
                      {recentActivity.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-md bg-[#F5FEFF] border border-[#EDF7F9] flex items-center justify-center flex-shrink-0">
                            <item.icon size={10} className="text-[#06B6D4]" />
                          </div>
                          <span className="text-[11px] text-[#374151] truncate flex-1">{item.label}</span>
                          <span className="text-[10px] font-mono text-[#94A3B8] whitespace-nowrap">{item.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="px-6 py-4 flex flex-wrap gap-2">
                  <button onClick={() => { setShowWorkspace(activeTeam); setActiveTeam(null); }} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#06B6D4] text-white text-[12.5px] font-semibold hover:bg-[#0891B2] transition-colors cursor-pointer">
                    <Globe size={13} /> Open Workspace
                  </button>
                  <button onClick={() => { setShowManageMembers(activeTeam); setActiveTeam(null); }} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E5F4F7] bg-white text-[12.5px] font-semibold text-[#475569] hover:border-[#06B6D4] hover:text-[#06B6D4] transition-colors cursor-pointer">
                    <Users size={13} /> Manage Members
                  </button>
                  <button onClick={() => { setUpgradeTeam(activeTeam); setActiveTeam(null); }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-indigo-100 bg-indigo-50 text-[12.5px] font-semibold text-[#4F46E5] hover:bg-indigo-100 transition-colors cursor-pointer">
                    <CreditCard size={13} /> Upgrade Plan
                  </button>
                  <button onClick={() => { suspendTeam(activeTeam.id); setActiveTeam(null); }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-100 text-[12.5px] font-semibold text-amber-700 hover:bg-amber-100 transition-colors cursor-pointer">
                    <Ban size={13} /> Suspend
                  </button>
                  <button onClick={() => { deleteTeam(activeTeam.id); setActiveTeam(null); }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-50 border border-red-100 text-[12.5px] font-semibold text-red-600 hover:bg-red-100 transition-colors cursor-pointer">
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── Activity Timeline ─────────────────────────────────────────────── */}
        <div className="bg-white border border-[#E5F4F7] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-[14px] font-bold text-[#0F172A] tracking-[-0.01em]">Workspace Activity</h3>
              <p className="text-[11.5px] text-[#94A3B8] mt-0.5">Recent events across all teams</p>
            </div>
            <button onClick={() => toast.info("Full activity report coming soon")} className="text-[12px] font-semibold text-[#06B6D4] hover:text-[#0891B2] cursor-pointer transition-colors">View all</button>
          </div>
          <div className="relative">
            <div className="absolute top-4 left-0 right-0 h-px bg-[#EDF7F9]" />
            <div className="grid grid-cols-6 gap-4 relative">
              {activityEvents.map((ev, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2.5 group cursor-default">
                  <div className="w-8 h-8 rounded-full border-2 border-white ring-1 ring-[#E5F4F7] flex items-center justify-center z-10 group-hover:ring-[#06B6D4]/40 transition-all shadow-sm"
                    style={{ backgroundColor: ev.color + "15" }}>
                    <ev.icon size={14} style={{ color: ev.color }} />
                  </div>
                  <div className="text-center">
                    <div className="text-[11px] font-semibold text-[#374151] leading-tight">{ev.label}</div>
                    <div className="text-[10px] font-mono text-[#94A3B8] mt-0.5">{ev.team}</div>
                    <div className="text-[10px] font-mono text-[#B0C4CB] mt-0.5">{ev.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* ── Upgrade Plan modal — 3 vertical cards ────────────────────────── */}
      {upgradeTeam && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0F172A]/50 backdrop-blur-[5px]" onClick={() => setUpgradeTeam(null)} />
          <div className="relative z-10 w-full max-w-2xl">
            {/* Title */}
            <div className="flex items-center justify-between mb-5 px-1">
              <div>
                <h3 className="text-[20px] font-bold text-white tracking-tight">Upgrade Plan</h3>
                <p className="text-[13px] text-white/70 mt-0.5">Choose the right plan for <span className="font-semibold text-white">{upgradeTeam.name}</span></p>
              </div>
              <button onClick={() => setUpgradeTeam(null)}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white cursor-pointer transition-colors">
                <X size={16} />
              </button>
            </div>
            {/* 3 vertical cards */}
            <div className="grid grid-cols-3 gap-4">
              {([
                { plan:"Free",       price:"$0",    period:"/mo",  tagline:"Get started",     color:"#64748B", gradFrom:"#F8FAFC", gradTo:"#F1F5F9", border:"#CBD5E1",  textCol:"#334155",
                  features:["Up to 5 members","5 meetings / month","1 GB cloud storage","Basic analytics","Email support"] },
                { plan:"Pro",        price:"$12",   period:"/mo",  tagline:"Most popular",    color:"#06B6D4", gradFrom:"#F0FAFE", gradTo:"#E0F7FE", border:"#06B6D4",  textCol:"#0E7490",
                  features:["Up to 50 members","Unlimited meetings","20 GB cloud storage","Advanced analytics","Priority support","AI meeting summaries"] },
                { plan:"Enterprise", price:"$49",   period:"/mo",  tagline:"For large teams", color:"#4F46E5", gradFrom:"#EEF2FF", gradTo:"#E0E7FF", border:"#4F46E5",  textCol:"#3730A3",
                  features:["Unlimited members","Unlimited meetings","500 GB cloud storage","Custom analytics","Dedicated support","AI features + API access","SSO & SAML"] },
              ] as const).map(({plan,price,period,tagline,color,gradFrom,gradTo,border,textCol,features})=>{
                const active = upgradeTeam.plan === plan;
                return (
                  <button key={plan} onClick={() => applyPlan(upgradeTeam.id, plan)}
                    style={{background:`linear-gradient(160deg, ${gradFrom}, ${gradTo})`, borderColor: active ? color : "#E5F4F7", boxShadow: active ? `0 0 0 2px ${color}40, 0 8px 32px ${color}30` : "0 2px 12px rgba(0,0,0,0.06)"}}
                    className={`relative flex flex-col p-5 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer ${active?"scale-[1.02]":"hover:scale-[1.01]"}`}>
                    {active && (
                      <div style={{background:color}} className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-white text-[10px] font-bold whitespace-nowrap shadow-md">Current Plan</div>
                    )}
                    {plan==="Pro" && !active && (
                      <div style={{background:"#06B6D4"}} className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-white text-[10px] font-bold whitespace-nowrap shadow-md">Most Popular</div>
                    )}
                    <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{color}}>{tagline}</p>
                    <p className="text-[18px] font-extrabold tracking-tight mb-0.5" style={{color:textCol}}>{plan}</p>
                    <div className="flex items-end gap-0.5 mb-4">
                      <span className="text-[28px] font-black leading-none" style={{color}}>{price}</span>
                      <span className="text-[12px] font-semibold pb-1" style={{color:textCol+"99"}}>{period}</span>
                    </div>
                    <div className="flex-1 space-y-2 mb-4">
                      {features.map(f=>(
                        <div key={f} className="flex items-start gap-2 text-[11.5px]" style={{color:textCol}}>
                          <CheckCircle size={12} className="mt-0.5 flex-shrink-0" style={{color}}/>
                          {f}
                        </div>
                      ))}
                    </div>
                    <div style={{background: active ? color : "white", color: active ? "white" : color, border:`1.5px solid ${color}`}}
                      className="w-full py-2.5 rounded-xl text-[12.5px] font-bold text-center transition-all">
                      {active ? "Current Plan" : "Select Plan"}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Open Workspace Panel ─────────────────────────────────────────── */}
      {showWorkspace && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" onClick={()=>setShowWorkspace(null)}>
          <div className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-[4px]"/>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-[#E5F4F7] overflow-hidden" onClick={e=>e.stopPropagation()}>
            <div className="h-24 bg-gradient-to-r from-[#06B6D4] to-[#4F46E5] flex items-end px-6 pb-4 relative">
              <div className="w-12 h-12 rounded-2xl bg-white shadow-lg flex items-center justify-center text-[18px] font-black text-[#06B6D4]">
                {showWorkspace.name.split(" ").map(w=>w[0]).join("").slice(0,2)}
              </div>
              <button onClick={()=>setShowWorkspace(null)} className="absolute top-3 right-3 w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-white cursor-pointer transition-colors"><X size={14}/></button>
            </div>
            <div className="px-6 py-5">
              <h2 className="text-[17px] font-bold text-[#0F172A]">{showWorkspace.name}</h2>
              <p className="text-[12.5px] text-[#94A3B8] mb-4">Owner: {showWorkspace.owner} · {showWorkspace.plan} Plan</p>
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[{label:"Members",value:showWorkspace.members},{label:"Meetings",value:Math.floor(Math.random()*200+20)},{label:"Storage",value:"12 GB"}].map(s=>(
                  <div key={s.label} className="bg-[#F8FDFE] border border-[#EDF7F9] rounded-xl p-3 text-center">
                    <p className="text-[18px] font-bold text-[#0F172A]">{s.value}</p>
                    <p className="text-[11px] text-[#94A3B8] font-medium">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2 mb-5">
                <div className="flex items-center justify-between py-2 border-b border-[#F1F9FB]">
                  <span className="text-[12.5px] text-[#64748B]">Status</span>
                  <span className={`text-[12px] font-semibold px-2.5 py-0.5 rounded-full ${showWorkspace.status==="verified"?"bg-emerald-50 text-emerald-700":showWorkspace.status==="pending"?"bg-amber-50 text-amber-700":"bg-red-50 text-red-600"}`}>{showWorkspace.status}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-[#F1F9FB]">
                  <span className="text-[12.5px] text-[#64748B]">Created</span>
                  <span className="text-[12.5px] font-semibold text-[#0F172A]">{showWorkspace.created}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-[12.5px] text-[#64748B]">Workspace ID</span>
                  <span className="text-[11.5px] font-mono text-[#64748B]">WS-{showWorkspace.id.toUpperCase()}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={()=>{toast.success("Launched workspace for "+showWorkspace.name);setShowWorkspace(null);}} className="flex-1 py-2.5 rounded-xl bg-[#06B6D4] text-white text-[13px] font-semibold hover:bg-[#0891B2] transition-colors cursor-pointer">Launch Workspace</button>
                <button onClick={()=>{setShowManageMembers(showWorkspace);setShowWorkspace(null);}} className="flex-1 py-2.5 rounded-xl border border-[#E5F4F7] text-[13px] font-semibold text-[#475569] hover:border-[#06B6D4] hover:text-[#06B6D4] transition-colors cursor-pointer">Manage Members</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Manage Members Panel ──────────────────────────────────────────── */}
      {showManageMembers && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" onClick={()=>setShowManageMembers(null)}>
          <div className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-[4px]"/>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-[#E5F4F7] overflow-hidden" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#EDF7F9] bg-gradient-to-r from-[#F0FAFE] to-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#4F46E5] flex items-center justify-center"><Users size={15} className="text-white"/></div>
                <div>
                  <h2 className="text-[15px] font-bold text-[#0F172A]">Manage Members</h2>
                  <p className="text-[11.5px] text-[#94A3B8]">{showManageMembers.name} · {showManageMembers.members} members</p>
                </div>
              </div>
              <button onClick={()=>setShowManageMembers(null)} className="w-8 h-8 rounded-xl flex items-center justify-center text-[#94A3B8] hover:bg-[#F5FEFF] hover:text-[#0F172A] transition-colors cursor-pointer"><X size={15}/></button>
            </div>
            <div className="px-6 py-5">
              <div className="flex gap-2 mb-4">
                <input placeholder="Invite by name or email…" className="flex-1 px-3 py-2.5 text-[13px] bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/10 transition-all"/>
                <button onClick={()=>toast.success("Invitation sent")} className="px-4 py-2.5 rounded-xl bg-[#4F46E5] text-white text-[13px] font-semibold hover:bg-[#4338CA] transition-colors cursor-pointer flex items-center gap-1.5"><Plus size={13}/>Invite</button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {Array.from({length: Math.min(showManageMembers.members,6)}, (_,i)=>{
                  const names=["Sarah Chen","Marcus Williams","Priya Patel","Tom Eriksson","Aiko Tanaka","Diego Reyes"];
                  const roles=["Admin","Member","Member","Viewer","Member","Admin"];
                  return (
                    <div key={i} className="flex items-center gap-3 px-3 py-2.5 bg-[#F8FDFE] border border-[#EDF7F9] rounded-xl">
                      <div className="w-8 h-8 rounded-full bg-[#4F46E5] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                        {names[i].split(" ").map(w=>w[0]).join("")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12.5px] font-semibold text-[#0F172A] truncate">{names[i]}</p>
                        <p className="text-[11px] text-[#94A3B8]">{names[i].toLowerCase().replace(" ",".")}@company.com</p>
                      </div>
                      <select defaultValue={roles[i]} className="text-[11px] border border-[#E5F4F7] rounded-lg px-2 py-1 text-[#475569] bg-white outline-none cursor-pointer">
                        {["Admin","Member","Viewer"].map(r=><option key={r}>{r}</option>)}
                      </select>
                      <button onClick={()=>toast.error("Member removed")} className="w-6 h-6 rounded-lg flex items-center justify-center text-[#94A3B8] hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"><X size={11}/></button>
                    </div>
                  );
                })}
                {showManageMembers.members > 6 && (
                  <p className="text-center text-[11.5px] text-[#94A3B8] py-2">+{showManageMembers.members-6} more members</p>
                )}
              </div>
            </div>
            <div className="flex justify-end px-6 py-4 border-t border-[#EDF7F9] bg-[#FAFEFF]">
              <button onClick={()=>{toast.success("Member changes saved");setShowManageMembers(null);}} className="px-5 py-2 rounded-xl bg-[#4F46E5] text-white text-[13px] font-semibold hover:bg-[#4338CA] transition-colors cursor-pointer">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Organization Page ──────────────────────────────────────────────────────
function OrganizationPage() {
  const [editMode, setEditMode] = useState(false);
  const [org, setOrg] = useState({
    name: "Meetiva Global HQ",
    industry: "Technology / SaaS",
    size: "201–500 employees",
    website: "https://meetiva.com",
    email: "admin@meetiva.com",
    phone: "+1 (415) 000-1234",
    address: "1 Market Street, San Francisco, CA 94105",
    timezone: "America/Los_Angeles",
    founded: "2019",
    description: "Meetiva is an AI-powered meeting intelligence platform helping teams collaborate smarter with automated summaries, action items, and analytics.",
  });
  const [draft, setDraft] = useState(org);
  const set = (k: keyof typeof draft) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setDraft(d => ({ ...d, [k]: e.target.value }));

  const stats = [
    { label: "Total Users",    value: "13,847", icon: Users,       color: "#06B6D4", bg: "#F0FAFE" },
    { label: "Active Teams",   value: "1,124",  icon: Users2,      color: "#4F46E5", bg: "#EEF2FF" },
    { label: "Meetings / mo",  value: "48,291", icon: Building2,   color: "#10B981", bg: "#ECFDF5" },
    { label: "Storage Used",   value: "2.4 TB", icon: Globe,       color: "#F59E0B", bg: "#FFFBEB" },
  ];

  const departments = [
    { name: "Engineering",  members: 142, lead: "Priya Patel",     color: "#06B6D4" },
    { name: "Product",      members:  38, lead: "Marcus Williams", color: "#4F46E5" },
    { name: "Design",       members:  24, lead: "Aiko Tanaka",     color: "#8B5CF6" },
    { name: "Marketing",    members:  31, lead: "Sarah Chen",      color: "#10B981" },
    { name: "Sales",        members:  67, lead: "Tom Eriksson",    color: "#F59E0B" },
    { name: "Finance",      members:  18, lead: "Fatima Al-Hassan",color: "#EF4444" },
  ];

  return (
    <div className="h-full overflow-y-auto" style={{ scrollbarWidth: "none" }}>
      <div className="max-w-[1440px] mx-auto px-8 py-6 space-y-5">

        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight leading-none">Organization</h1>
            <p className="text-[13.5px] text-[#94A3B8] mt-1.5">Manage your organization profile, structure, and settings</p>
          </div>
          <div className="flex items-center gap-2">
            {editMode ? (
              <>
                <button onClick={() => { setDraft(org); setEditMode(false); }}
                  className="px-4 py-2 rounded-xl border border-[#E5F4F7] text-[13px] font-semibold text-[#64748B] hover:bg-[#F8FDFE] transition-colors cursor-pointer">
                  Cancel
                </button>
                <button onClick={() => { setOrg(draft); setEditMode(false); toast.success("Organization profile saved"); }}
                  className="px-5 py-2 rounded-xl bg-[#06B6D4] text-white text-[13px] font-semibold hover:bg-[#0891B2] transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm">
                  <CheckCircle size={13} /> Save Changes
                </button>
              </>
            ) : (
              <button onClick={() => { setDraft(org); setEditMode(true); }}
                className="px-5 py-2 rounded-xl bg-[#06B6D4] text-white text-[13px] font-semibold hover:bg-[#0891B2] transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm">
                <Pencil size={13} /> Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-4 gap-4">
          {stats.map(({ label, value, icon: Ic, color, bg }) => (
            <div key={label} className="bg-white border border-[#E5F4F7] rounded-2xl p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
                <Ic size={18} style={{ color }} />
              </div>
              <div>
                <p className="text-[22px] font-bold text-[#0F172A] leading-none tracking-tight">{value}</p>
                <p className="text-[12px] text-[#94A3B8] font-medium mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-12 gap-5">
          {/* Profile card */}
          <div className="col-span-7 bg-white border border-[#E5F4F7] rounded-2xl overflow-hidden">
            {/* Cover */}
            <div className="h-20 bg-gradient-to-r from-[#06B6D4] via-[#4F46E5] to-[#8B5CF6] relative">
              <div className="absolute -bottom-7 left-6">
                <div className="w-14 h-14 rounded-2xl bg-white shadow-lg border-2 border-white flex items-center justify-center text-[22px] font-black text-[#06B6D4]">M</div>
              </div>
            </div>
            <div className="pt-10 px-6 pb-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                {([
                  ["Organization Name", "name"],
                  ["Industry",          "industry"],
                  ["Company Size",      "size"],
                  ["Founded",           "founded"],
                  ["Website",           "website"],
                  ["Contact Email",     "email"],
                  ["Phone",             "phone"],
                  ["Timezone",          "timezone"],
                ] as [string, keyof typeof draft][]).map(([lbl, key]) => (
                  <div key={key}>
                    <label className="block text-[10.5px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1">{lbl}</label>
                    {editMode ? (
                      <input value={draft[key]} onChange={set(key)}
                        className="w-full px-3 py-2 text-[13px] bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/10 transition-all"/>
                    ) : (
                      <p className="text-[13px] font-semibold text-[#0F172A] truncate">{org[key]}</p>
                    )}
                  </div>
                ))}
                <div className="col-span-2">
                  <label className="block text-[10.5px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1">Address</label>
                  {editMode ? (
                    <input value={draft.address} onChange={set("address")}
                      className="w-full px-3 py-2 text-[13px] bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/10 transition-all"/>
                  ) : (
                    <p className="text-[13px] font-semibold text-[#0F172A]">{org.address}</p>
                  )}
                </div>
                <div className="col-span-2">
                  <label className="block text-[10.5px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1">Description</label>
                  {editMode ? (
                    <textarea value={draft.description} onChange={set("description")} rows={3}
                      className="w-full px-3 py-2 text-[13px] bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/10 transition-all resize-none"/>
                  ) : (
                    <p className="text-[13px] text-[#475569] leading-relaxed">{org.description}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="col-span-5 space-y-4">
            {/* Departments */}
            <div className="bg-white border border-[#E5F4F7] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[14px] font-bold text-[#0F172A]">Departments</h3>
                <button onClick={() => toast.success("Add department coming soon")}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#F0FAFE] text-[#06B6D4] text-[11.5px] font-semibold hover:bg-[#E0F7FE] transition-colors cursor-pointer">
                  <Plus size={11}/> Add
                </button>
              </div>
              <div className="space-y-2">
                {departments.map(d => (
                  <div key={d.name} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#F8FDFE] transition-colors group">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-[10px] font-bold" style={{ background: d.color }}>
                      {d.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12.5px] font-semibold text-[#0F172A]">{d.name}</p>
                      <p className="text-[11px] text-[#94A3B8]">Lead: {d.lead}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[12px] font-bold text-[#0F172A]">{d.members}</span>
                      <span className="text-[11px] text-[#94A3B8]">members</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div className="bg-white border border-[#E5F4F7] rounded-2xl p-5">
              <h3 className="text-[14px] font-bold text-[#0F172A] mb-3">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Export Data",      icon: Upload,    color: "#06B6D4", onClick: () => toast.success("Exporting org data…") },
                  { label: "Invite Members",   icon: Plus,      color: "#4F46E5", onClick: () => toast.success("Invite link copied") },
                  { label: "Billing & Plans",  icon: CreditCard,color: "#10B981", onClick: () => toast.info("Redirecting to billing…") },
                  { label: "Audit Log",        icon: ScrollText, color: "#F59E0B",onClick: () => toast.info("Opening audit log…") },
                ].map(({ label, icon: Ic, color, onClick }) => (
                  <button key={label} onClick={onClick}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[#E5F4F7] hover:border-[#06B6D4] hover:bg-[#F8FDFE] transition-all cursor-pointer group text-left">
                    <Ic size={13} style={{ color }} />
                    <span className="text-[12px] font-semibold text-[#475569] group-hover:text-[#0F172A]">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AIUsage() {
  const [tokenPeriod, setTokenPeriod] = useState("7D");
  const [reqFilter, setReqFilter]     = useState("All");

  // Derive token chart data by period
  const tokenChartData = tokenPeriod === "7D" ? aiWeekData
    : tokenPeriod === "3D" ? aiWeekData.slice(-3)
    : aiWeekData.slice(-1);

  // Filter recent requests
  const filteredReqs = useMemo(() =>
    reqFilter === "All" ? mockAIRequests : mockAIRequests.filter(r => r.status === reqFilter.toLowerCase())
  , [reqFilter]);

  // Model color lookup
  const modelColor = (model: string) =>
    model === "GPT-4o"     ? "#06B6D4" :
    model === "Claude 3.5" ? "#4F46E5" :
    model === "Gemini Pro" ? "#F59E0B" : "#16A34A";

  const modelBg = (model: string) =>
    model === "GPT-4o"     ? "bg-[#F0FDFF] text-[#0891B2] border-cyan-200" :
    model === "Claude 3.5" ? "bg-purple-50 text-purple-700 border-purple-200" :
    model === "Gemini Pro" ? "bg-amber-50 text-amber-700 border-amber-200"   :
                              "bg-emerald-50 text-emerald-700 border-emerald-200";

  const statusDot = (s: string) =>
    s === "ok"    ? "bg-emerald-400" :
    s === "warn"  ? "bg-amber-400"   : "bg-red-400";

  const statusLabel = (s: string) =>
    s === "ok"    ? "text-emerald-600 bg-emerald-50 border-emerald-100" :
    s === "warn"  ? "text-amber-600 bg-amber-50 border-amber-100"       :
                    "text-red-600 bg-red-50 border-red-100";

  return (
    <div className="h-full overflow-y-auto scrollbar-hide">
      <div className="px-10 py-9 space-y-8 max-w-[1480px]">

        {/* ── Page header ───────────────────────────────────────────────────── */}
        <div className="flex items-end justify-between gap-6">
          <div>
            <h1 className="text-[30px] font-bold text-[#0F172A] tracking-[-0.025em] leading-none"
              style={{ fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
              AI Usage
            </h1>
            <p className="text-[13px] text-[#64748B] mt-2.5">
              Platform-wide AI consumption &middot; Aug 2, 2024 &middot; Live
            </p>
          </div>
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#E5F4F7] bg-white text-[12px] text-[#475569]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium">Streaming</span>
          </div>
        </div>

        {/* ── KPI grid (3 × 2) ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3.5">
          <DashKPI
            label="Active AI Models"
            value="4 Models"
            sub="GPT-4o · Claude · Gemini · Llama"
            icon={Brain}
            uid="ai-kpi-models"
          />
          <DashKPI
            label="Requests Today"
            value="98,412"
            sub="AI API calls processed"
            icon={Zap}
            trend="+34.7%"
            trendUp={true}
            spark={aiWeekData.map(d => d.requests)}
            sparkColor="#06B6D4"
            uid="ai-kpi-req"
          />
          <DashKPI
            label="Tokens Used"
            value="71.2M"
            sub="This month · 890K today"
            icon={Database}
            trend="+28.1%"
            trendUp={true}
            spark={aiWeekData.map(d => d.tokens)}
            sparkColor="#4F46E5"
            uid="ai-kpi-tok"
          />
          <DashKPI
            label="Estimated Cost"
            value="$7,184"
            sub="This month · $284 today"
            icon={DollarSign}
            trend="+22.4%"
            trendUp={false}
            spark={costTrendData.map(d => d.cost)}
            sparkColor="#F59E0B"
            uid="ai-kpi-cost"
          />
          <DashKPI
            label="Avg Response Time"
            value="284ms"
            sub="p50 median latency"
            icon={Timer}
            trend="-12ms vs last wk"
            trendUp={true}
            spark={responseTimeData.map(d => d.p50)}
            sparkColor="#06B6D4"
            uid="ai-kpi-lat"
          />
          <DashKPI
            label="Failed Requests"
            value="1,247"
            sub="1.27% error rate today"
            icon={XCircle}
            trend="-0.3% vs last wk"
            trendUp={true}
            uid="ai-kpi-err"
          />
        </div>

        {/* ── Token Usage + Model Distribution ─────────────────────────────── */}
        <div className="grid lg:grid-cols-12 gap-5">

          {/* Token Usage bar — wider */}
          <div className="lg:col-span-8 bg-white border border-[#E5F4F7] rounded-2xl p-7">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-[10.5px] font-mono font-semibold text-[#9CA3AF] uppercase tracking-[0.12em] mb-1.5">Token Usage</p>
                <p className="text-[20px] font-bold text-[#0F172A] tracking-[-0.02em]">
                  {tokenPeriod === "7D" ? "8,120K" : tokenPeriod === "3D" ? "2,800K" : "530K"}
                  <span className="text-[13px] font-medium text-[#64748B] ml-2 tracking-normal">tokens</span>
                </p>
              </div>
              {/* Period selector */}
              <div className="flex items-center bg-[#F5FEFF] border border-[#E5F4F7] rounded-xl p-0.5 gap-0.5">
                {["1D", "3D", "7D"].map(p => (
                  <button key={p} onClick={() => setTokenPeriod(p)}
                    className={`px-3 py-1.5 rounded-[9px] text-[11.5px] font-semibold transition-all duration-150 cursor-pointer ${
                      tokenPeriod === p
                        ? "bg-white text-[#0F172A] shadow-sm border border-[#E5F4F7]"
                        : "text-[#9CA3AF] hover:text-[#475569]"
                    }`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <SvgBarChart data={tokenChartData} dataKey="tokens" color="#06B6D4" uid={`ai-tok-${tokenPeriod}`} />
          </div>

          {/* Model Distribution donut — narrower */}
          <div className="lg:col-span-4 bg-white border border-[#E5F4F7] rounded-2xl p-7">
            <p className="text-[10.5px] font-mono font-semibold text-[#9CA3AF] uppercase tracking-[0.12em] mb-1.5">Model Usage</p>
            <p className="text-[20px] font-bold text-[#0F172A] tracking-[-0.02em] mb-6">Distribution</p>
            <div className="flex flex-col items-center gap-5">
              <SvgDonutChart data={modelUsageData} uid="ai-mdl-donut" />
              <div className="w-full space-y-2">
                {modelUsageData.map(m => (
                  <div key={m.name} className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: m.color }} />
                    <span className="text-[12.5px] text-[#374151] flex-1">{m.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1 bg-[#EDF7F9] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${m.value}%`, background: m.color }} />
                      </div>
                      <span className="text-[11.5px] font-mono font-semibold text-[#0F172A] w-7 text-right">{m.value}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Latency + Cost ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-5">

          {/* Latency — p50 / p95 */}
          <div className="bg-white border border-[#E5F4F7] rounded-2xl p-7">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-[10.5px] font-mono font-semibold text-[#9CA3AF] uppercase tracking-[0.12em] mb-1.5">Response Latency</p>
                <p className="text-[20px] font-bold text-[#0F172A] tracking-[-0.02em]">
                  284ms <span className="text-[13px] font-medium text-[#64748B] tracking-normal">p50 today</span>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#06B6D4]" />
                  <span className="text-[10.5px] font-mono text-[#9CA3AF]">p50</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                  <span className="text-[10.5px] font-mono text-[#9CA3AF]">p95</span>
                </div>
              </div>
            </div>
            <SvgLineChart data={responseTimeData} keys={["p50", "p95"]} colors={["#06B6D4", "#F59E0B"]} labels={["p50 ms", "p95 ms"]} uid="ai-lat-line" />
          </div>

          {/* Cost Trend */}
          <div className="bg-white border border-[#E5F4F7] rounded-2xl p-7">
            <div className="mb-6">
              <p className="text-[10.5px] font-mono font-semibold text-[#9CA3AF] uppercase tracking-[0.12em] mb-1.5">Cost Trend</p>
              <p className="text-[20px] font-bold text-[#0F172A] tracking-[-0.02em]">
                $7,184 <span className="text-[13px] font-medium text-[#64748B] tracking-normal">this month</span>
              </p>
            </div>
            <SvgAreaChart data={costTrendData} keys={["cost"]} colors={["#4F46E5"]} labels={["Cost ($)"]} uid="ai-cost-area" />
          </div>
        </div>

        {/* ── Recent AI Requests ───────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10.5px] font-mono font-semibold text-[#9CA3AF] uppercase tracking-[0.12em] mb-1">Recent AI Requests</p>
              <p className="text-[18px] font-bold text-[#0F172A] tracking-[-0.02em]">Live Feed</p>
            </div>
            {/* Status filter */}
            <div className="flex items-center bg-[#F5FEFF] border border-[#E5F4F7] rounded-xl p-0.5 gap-0.5">
              {["All", "Ok", "Warn", "Error"].map(f => (
                <button key={f} onClick={() => setReqFilter(f)}
                  className={`px-3 py-1.5 rounded-[9px] text-[11.5px] font-semibold transition-all duration-150 cursor-pointer ${
                    reqFilter === f
                      ? "bg-white text-[#0F172A] shadow-sm border border-[#E5F4F7]"
                      : "text-[#9CA3AF] hover:text-[#475569]"
                  }`}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border border-[#E5F4F7] rounded-2xl overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[#EDF7F9] bg-[#F9FCFD]">
                  {(["Time", "User", "Model", "Tokens", "Latency", "Status", "Cost"] as const).map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-[10.5px] font-mono font-semibold text-[#9CA3AF] uppercase tracking-[0.12em] whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredReqs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <p className="text-[13px] text-[#94A3B8]">No requests match this filter.</p>
                    </td>
                  </tr>
                )}
                {filteredReqs.map((r, idx) => {
                  const isLast = idx === filteredReqs.length - 1;
                  return (
                    <tr key={r.id}
                      className={`transition-colors hover:bg-[#FAFCFD] ${isLast ? "" : "border-b border-[#F0F9FB]"}`}>
                      {/* Time */}
                      <td className="px-5 py-3.5">
                        <span className="text-[11.5px] font-mono text-[#94A3B8]">{r.ts}</span>
                      </td>
                      {/* User */}
                      <td className="px-5 py-3.5 max-w-[200px]">
                        <span className="text-[12.5px] text-[#374151] truncate block">{r.user}</span>
                      </td>
                      {/* Model */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: modelColor(r.model) }} />
                          <span className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-lg border ${modelBg(r.model)}`}>
                            {r.model}
                          </span>
                        </div>
                      </td>
                      {/* Tokens */}
                      <td className="px-5 py-3.5">
                        <span className="text-[12px] font-mono tabular-nums text-[#475569]">{r.tokens.toLocaleString()}</span>
                      </td>
                      {/* Latency */}
                      <td className="px-5 py-3.5">
                        <span className={`text-[12px] font-mono tabular-nums ${
                          parseInt(r.latency) > 1000 ? "text-red-500" :
                          parseInt(r.latency) > 500  ? "text-amber-600" : "text-[#475569]"
                        }`}>{r.latency}</span>
                      </td>
                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusDot(r.status)}`} />
                          <span className={`text-[10.5px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded-md border ${statusLabel(r.status)}`}>
                            {r.status}
                          </span>
                        </div>
                      </td>
                      {/* Cost */}
                      <td className="px-5 py-3.5">
                        <span className="text-[12px] font-mono tabular-nums text-[#0F172A] font-semibold">{r.cost}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="flex items-center justify-between px-5 py-3.5 border-t border-[#EDF7F9]">
              <span className="text-[11.5px] font-mono text-[#94A3B8]">
                Showing {filteredReqs.length} of {mockAIRequests.length} requests &middot; Today
              </span>
              <button onClick={() => toast.success("Model requests refreshed")} className="flex items-center gap-1.5 text-[11.5px] font-mono text-[#94A3B8] hover:text-[#06B6D4] transition-colors cursor-pointer">
                <RefreshCw size={11} /> Refresh
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Logs ───────────────────────────────────────────────────────────────────


// ── Logs bottom chart components (interactive hover) ──────────────────────

type TLPoint = { lbl: string; v: number };
function LogsTimelineChart({ data }: { data: TLPoint[] }) {
  const [hov, setHov] = useState<number | null>(null);
  const W = 420, H = 155, pL = 30, pR = 8, pT = 14, pB = 20;
  const cw = W - pL - pR, ch = H - pT - pB;
  const VMAX = 4400;
  const pts = data.map((d, i) => ({
    x: pL + i * (cw / (data.length - 1)),
    y: pT + ch - (d.v / VMAX) * ch,
  }));
  const lineSegs = pts.map((p, i) => {
    if (i === 0) return `M${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    const pp = pts[i - 1];
    return `C${(pp.x+22).toFixed(1)},${pp.y.toFixed(1)} ${(p.x-22).toFixed(1)},${p.y.toFixed(1)} ${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  });
  const linePath = lineSegs.join(" ");
  const areaPath = linePath + ` L${(pL+cw).toFixed(1)},${(pT+ch).toFixed(1)} L${pL},${(pT+ch).toFixed(1)} Z`;
  const yTicks = [0, 1000, 2000, 3000, 4000];
  const colW = cw / (data.length - 1);

  const TipBox = ({ idx }: { idx: number }) => {
    const d = data[idx];
    const tx = pts[idx].x;
    const tw = 110, th = 48;
    const bx = Math.max(tw / 2 + pL, Math.min(W - pR - tw / 2, tx));
    const by = pT + 4;
    return (
      <g pointerEvents="none" style={{filter:"drop-shadow(0 4px 18px rgba(6,182,212,0.18))"}}>
        <line x1={tx} y1={pT} x2={tx} y2={pT + ch} stroke="#06B6D4" strokeWidth="1" strokeDasharray="3,2" opacity="0.35" />
        <rect x={bx - tw / 2} y={by} width={tw} height={th} rx="7" fill="white" stroke="#D9F2F8" strokeWidth="1" />
        <text x={bx} y={by + 15} textAnchor="middle" fill="#0891B2" fontSize="9" fontFamily="Inter,sans-serif" fontWeight="600">{d.lbl}</text>
        <circle cx={bx - tw / 2 + 12} cy={by + 32} r="3.5" fill="#06B6D4" />
        <text x={bx - tw / 2 + 20} y={by + 36} fill="#67E8F9" fontSize="11" fontWeight="700" fontFamily="Inter,sans-serif">{d.v.toLocaleString()}</text>
        <text x={bx + tw / 2 - 7} y={by + 36} textAnchor="end" fill="#94A3B8" fontSize="9" fontFamily="Inter,sans-serif">events</text>
      </g>
    );
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      <defs>
        <linearGradient id="tlGrNew" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
        </linearGradient>
      </defs>
      {yTicks.map(v => {
        const y = pT + ch - (v / VMAX) * ch;
        return (
          <g key={v}>
            <line x1={pL} y1={y} x2={W - pR} y2={y} stroke="#EDF7F9" strokeWidth="1" />
            <text x={pL - 4} y={y + 3.5} textAnchor="end" fill="#94A3B8" fontSize="8.5" fontFamily="Inter,sans-serif">
              {v === 0 ? "0" : v / 1000 + "K"}
            </text>
          </g>
        );
      })}
      <path d={areaPath} fill="url(#tlGrNew)" />
      <path d={linePath} fill="none" stroke="#06B6D4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((_, i) => (
        <circle key={i} cx={pts[i].x} cy={pts[i].y} r={hov === i ? 5.5 : 3.5}
          fill={hov === i ? "#06B6D4" : "white"} stroke="#06B6D4" strokeWidth="2" />
      ))}
      {data.map((d, i) => (
        <text key={i} x={pts[i].x} y={H - 3} textAnchor="middle"
          fill={hov === i ? "#374151" : "#94A3B8"} fontSize="8.5" fontFamily="Inter,sans-serif">{d.lbl}</text>
      ))}
      {/* Hit zones */}
      {data.map((_, i) => (
        <rect key={`tlh-${i}`}
          x={pts[i].x - colW / 2} y={pT} width={colW} height={ch}
          fill="transparent" style={{ cursor: "crosshair" }}
          onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)} />
      ))}
      {hov !== null && <TipBox idx={hov} />}
    </svg>
  );
}

type DonutSlice = { label: string; pct: number; cnt: string; clr: string };
function LogsDonutChart({ data }: { data: DonutSlice[] }) {
  const [hov, setHov] = useState<number | null>(null);
  const cx = 55, cy = 55, r = 48, ri = 28;
  let ang = -90;
  const paths = data.map((d, i) => {
    const a1 = ang * Math.PI / 180;
    ang += (d.pct / 100) * 360;
    const a2 = ang * Math.PI / 180;
    const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
    const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
    const xi1 = cx + ri * Math.cos(a2), yi1 = cy + ri * Math.sin(a2);
    const xi2 = cx + ri * Math.cos(a1), yi2 = cy + ri * Math.sin(a1);
    const lg = d.pct > 50 ? 1 : 0;
    const midAng = (a1 + a2) / 2;
    const tipR = (r + ri) / 2;
    return {
      ...d, i,
      path: `M${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 ${lg},1 ${x2.toFixed(2)},${y2.toFixed(2)} L${xi1.toFixed(2)},${yi1.toFixed(2)} A${ri},${ri} 0 ${lg},0 ${xi2.toFixed(2)},${yi2.toFixed(2)} Z`,
      mx: cx + Math.cos(midAng) * tipR,
      my: cy + Math.sin(midAng) * tipR,
    };
  });

  const hovSlice = hov !== null ? paths[hov] : null;

  return (
    <svg viewBox="0 0 110 110" width={105} height={105} className="flex-shrink-0" style={{ overflow: "visible" }}>
      {paths.map((p, i) => (
        <path key={i} d={p.path}
          fill={p.clr}
          opacity={hov === null || hov === i ? 1 : 0.45}
          style={{ cursor: "pointer", transition: "opacity 0.15s" }}
          onMouseEnter={() => setHov(i)}
          onMouseLeave={() => setHov(null)}
        />
      ))}
      <circle cx={cx} cy={cy} r={ri} fill="white" />
      {hovSlice ? (
        <>
          <text x={cx} y={cy - 6} textAnchor="middle" fill="#06B6D4" fontSize="11" fontWeight="800" fontFamily="Inter,sans-serif">{hovSlice.pct}%</text>
          <text x={cx} y={cy + 8} textAnchor="middle" fill="#94A3B8" fontSize="7" fontFamily="Inter,sans-serif">{hovSlice.cnt}</text>
        </>
      ) : (
        <text x={cx} y={cy + 4} textAnchor="middle" fill="#94A3B8" fontSize="8" fontFamily="Inter,sans-serif">24,790</text>
      )}
    </svg>
  );
}

type RadialHr = { h: number; v: number; norm: number };
function LogsRadialChart({ hrVals }: { hrVals: number[] }) {
  const [hov, setHov] = useState<number | null>(null);
  const cx = 55, cy = 55, rMin = 16, rMax = 44;
  const hrMax = Math.max(...hrVals);
  const spokes: RadialHr[] = hrVals.map((v, h) => ({ h, v, norm: v / hrMax }));
  const lbls = [
    { t: "12AM", h: 0 }, { t: "6AM", h: 6 }, { t: "12PM", h: 12 }, { t: "6PM", h: 18 },
  ];
  return (
    <svg viewBox="0 0 110 110" width={105} height={105} className="flex-shrink-0">
      <circle cx={cx} cy={cy} r={rMax + 8} fill="#F8FEFF" stroke="#EDF7F9" strokeWidth="1" />
      {spokes.map(({ h, norm }) => {
        const ang = (h / 24) * 2 * Math.PI - Math.PI / 2;
        const r2 = rMin + norm * (rMax - rMin);
        const clr = norm > 0.7 ? "#06B6D4" : norm > 0.3 ? "#67E8F9" : "#BAE6FD";
        return (
          <g key={h}>
            <line
              x1={cx + Math.cos(ang) * rMin} y1={cy + Math.sin(ang) * rMin}
              x2={cx + Math.cos(ang) * r2}   y2={cy + Math.sin(ang) * r2}
              stroke={hov === h ? "#0891B2" : clr}
              strokeWidth={norm > 0.05 ? 3 : 1.5}
              strokeLinecap="round"
              opacity={norm < 0.05 ? 0.2 : hov !== null && hov !== h ? 0.5 : 1}
              style={{ cursor: "pointer" }}
            />
            {/* Invisible fat hit zone */}
            <line
              x1={cx + Math.cos(ang) * rMin} y1={cy + Math.sin(ang) * rMin}
              x2={cx + Math.cos(ang) * rMax}  y2={cy + Math.sin(ang) * rMax}
              stroke="transparent" strokeWidth="10"
              onMouseEnter={() => setHov(h)} onMouseLeave={() => setHov(null)}
              style={{ cursor: "crosshair" }}
            />
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r={rMin} fill="white" stroke="#E5F4F7" strokeWidth="1" />
      <circle cx={cx} cy={cy} r="3" fill="#06B6D4" />
      {/* Center tooltip */}
      {hov !== null ? (
        <>
          <text x={cx} y={cy - 5} textAnchor="middle" fill="#0891B2" fontSize="9" fontWeight="700" fontFamily="Inter,sans-serif">
            {hov < 12 ? (hov === 0 ? "12AM" : `${hov}AM`) : (hov === 12 ? "12PM" : `${hov - 12}PM`)}
          </text>
          <text x={cx} y={cy + 7} textAnchor="middle" fill="#06B6D4" fontSize="8" fontWeight="600" fontFamily="Inter,sans-serif">
            {hrVals[hov].toLocaleString()} ev
          </text>
        </>
      ) : null}
      {/* Axis labels */}
      {lbls.map(({ t, h }) => {
        const ang = (h / 24) * 2 * Math.PI - Math.PI / 2;
        const lr = rMax + 15;
        return (
          <text key={t} x={cx + Math.cos(ang) * lr} y={cy + Math.sin(ang) * lr + 3.5}
            textAnchor="middle" fill="#94A3B8" fontSize="7" fontFamily="Inter,sans-serif">{t}</text>
        );
      })}
    </svg>
  );
}

function Logs() {
  const [search, setSearch]           = useState("");
  const [logTab, setLogTab]           = useState<"all"|"user"|"ai"|"security"|"system"|"integrations">("all");
  const [logTypeFilter, setLogTypeFilter] = useState("All Log Types");
  const [userFilter, setUserFilter]       = useState("All Users");
  const [wsFilter, setWsFilter]           = useState("All Workspaces");
  const [dateLabel, setDateLabel]         = useState("May 12, 2025 – May 18, 2025");
  const [filterDropdown, setFilterDropdown] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<typeof rows[0] | null>(null);
  const [checked, setChecked]         = useState<Set<string>>(new Set());
  const [pg, setPg]                   = useState(1);
  const [streaming, setStreaming]     = useState(false);
  const PER = 8;

  const rows = useMemo(() => [
    { id:"r1",  time:"May 18, 10:24:31 AM", event:"User Login",           cat:"user",         user:"John Doe",        email:"john.doe@acme.com",         ws:"Product Squad",     ip:"192.168.1.24",  agent:"Chrome 124.0.0 / Windows 11", loc:"Mumbai, India",    sid:"sess_8f7a2b1c3d4e5f6a",  eid:"evt_01JX9M42A8Z7K2YB6D3F", desc:"User logged in successfully using email and password.", ok:true  },
    { id:"r2",  time:"May 18, 10:23:18 AM", event:"Meeting Uploaded",     cat:"user",         user:"Sarah Kelly",     email:"sarah.kelly@acme.com",      ws:"Design Workspace",  ip:"192.168.1.45",  agent:"Safari 17 / macOS",           loc:"London, UK",       sid:"sess_3c9a22b7f4d1",      eid:"evt_02KY9N53B9A8L3ZC7E4G", desc:"Meeting recording uploaded to Design Workspace.",      ok:true  },
    { id:"r3",  time:"May 18, 10:22:07 AM", event:"AI Summary Generated", cat:"ai",           user:"System",          email:"AI Engine",                 ws:"Product Squad",     ip:"—",             agent:"—",                           loc:"US-East-1",        sid:"sys_ai_01",              eid:"evt_03LZ0O64C0B9M4AD8F5H", desc:"AI generated meeting summary for Product Squad.",      ok:true  },
    { id:"r4",  time:"May 18, 10:21:55 AM", event:"Failed Login Attempt", cat:"security",     user:"Unknown",         email:"unknown@ip.com",            ws:"—",                 ip:"203.0.113.12",  agent:"cURL / Linux",                loc:"Moscow, RU",       sid:"sess_invalid",           eid:"evt_04MA1P75D1C0N5BE9G6I", desc:"Failed login attempt detected from unknown IP.",       ok:false },
    { id:"r5",  time:"May 18, 10:21:09 AM", event:"Team Created",         cat:"user",         user:"Rohan Mehta",     email:"rohan.mehta@acme.com",      ws:"Marketing Team",    ip:"192.168.1.88",  agent:"Chrome 126 / macOS",          loc:"Bengaluru, IN",    sid:"sess_9g8b33c8",          eid:"evt_05NB2Q86E2D1O6CF0H7J", desc:"New team workspace created: Marketing Team.",          ok:true  },
    { id:"r6",  time:"May 18, 10:19:48 AM", event:"API Key Generated",    cat:"integrations", user:"Finance System",  email:"integration@acme.com",      ws:"Finance Workspace", ip:"192.168.1.66",  agent:"API Client",                  loc:"Frankfurt, DE",    sid:"sys_api_02",             eid:"evt_06OC3R97F3E2P7DG1I8K", desc:"New API key generated for Finance System integration.", ok:true  },
    { id:"r7",  time:"May 18, 10:18:32 AM", event:"Report Exported",      cat:"user",         user:"John Doe",        email:"john.doe@acme.com",         ws:"Product Squad",     ip:"192.168.1.24",  agent:"Chrome 124.0.0 / Windows 11", loc:"Mumbai, India",    sid:"sess_8f7a2b1c",          eid:"evt_07PD4S08G4F3Q8EH2J9L", desc:"Monthly analytics report exported as PDF.",            ok:true  },
    { id:"r8",  time:"May 18, 10:17:11 AM", event:"User Deleted",         cat:"security",     user:"Priya Sharma",    email:"priya.sharma@acme.com",     ws:"—",                 ip:"192.168.1.33",  agent:"Firefox 128 / Windows",       loc:"Delhi, IN",        sid:"sess_ad91bc",            eid:"evt_08QE5T19H5G4R9FI3K0M", desc:"User account permanently deleted by admin.",           ok:false },
    { id:"r9",  time:"May 18, 10:15:44 AM", event:"Password Reset",       cat:"security",     user:"Tom Eriksson",    email:"tom.e@nordic.se",           ws:"Nordic SE",         ip:"192.0.2.88",    agent:"Edge 126 / Windows",          loc:"Stockholm, SE",    sid:"sess_5e3f22",            eid:"evt_09RF6U20I6H5S0GJ4L1N", desc:"Password reset link sent to registered email.",        ok:true  },
    { id:"r10", time:"May 18, 10:12:28 AM", event:"Workspace Activated",  cat:"user",         user:"Aiko Tanaka",     email:"aiko.tanaka@mitsuko.jp",    ws:"Mitsuko Digital",   ip:"203.0.113.22",  agent:"Chrome 126 / macOS",          loc:"Tokyo, JP",        sid:"sess_2d7a88",            eid:"evt_10SG7V31J7I6T1HK5M2O", desc:"Workspace activated for Mitsuko Digital org.",         ok:true  },
    { id:"r11", time:"May 18, 10:09:05 AM", event:"API Key Revoked",      cat:"security",     user:"Fatima Al-Hassan",email:"f.alhassan@gulf.ae",        ws:"Gulf Ventures",     ip:"185.15.32.10",  agent:"Chrome 126 / iPad",           loc:"Dubai, AE",        sid:"sess_5f0c11",            eid:"evt_11TH8W42K8J7U2IL6N3P", desc:"API key revoked due to security policy violation.",    ok:false },
    { id:"r12", time:"May 18, 10:06:32 AM", event:"Batch AI Completed",   cat:"ai",           user:"System",          email:"AI Engine",                 ws:"Platform",          ip:"—",             agent:"—",                           loc:"US-East-1",        sid:"sys_batch_03",           eid:"evt_12UI9X53L9K8V3JM7O4Q", desc:"Batch inference completed — 1,240 summaries generated.",ok:true  },
  ], []);


  const tabCounts = { all:24851, user:6245, ai:8742, security:1923, system:4112, integrations:3829 };

  const filtered = useMemo(() => rows.filter(r => {
    const q = search.toLowerCase();
    const mq = !q || r.event.toLowerCase().includes(q) || r.user.toLowerCase().includes(q) || r.email.includes(q);
    const mt = logTab === "all" || r.cat === logTab;
    const mu = userFilter === "All Users" || r.user === userFilter;
    const mw = wsFilter === "All Workspaces" || r.ws === wsFilter;
    return mq && mt && mu && mw;
  }), [search, logTab, userFilter, wsFilter, rows]);

  const totalPg = Math.max(1, Math.ceil(filtered.length / PER));
  const safePg  = Math.min(pg, totalPg);
  const slice   = filtered.slice((safePg-1)*PER, safePg*PER);

  const allPage  = slice.length > 0 && slice.every(r => checked.has(r.id));
  const toggleAll = () => { const n = new Set(checked); allPage ? slice.forEach(r=>n.delete(r.id)) : slice.forEach(r=>n.add(r.id)); setChecked(n); };
  const toggleOne = (id: string) => { const n = new Set(checked); n.has(id)?n.delete(id):n.add(id); setChecked(n); };

  // Event icon/color
  type EvMeta = { Icon: React.ElementType; bg: string; color: string };
  const evMeta = (evt: string, cat: string): EvMeta => {
    if (evt === "User Login")           return { Icon: User,       bg:"#E0F7FA", color:"#06B6D4" };
    if (evt === "Meeting Uploaded")     return { Icon: Video,      bg:"#EDE9FE", color:"#7C3AED" };
    if (evt.startsWith("AI") || evt.startsWith("Batch")) return { Icon: Sparkles, bg:"#FEF3C7", color:"#F59E0B" };
    if (evt === "Failed Login Attempt" || evt === "User Deleted" || evt === "API Key Revoked") return { Icon: Shield, bg:"#FEE2E2", color:"#EF4444" };
    if (evt === "Team Created")         return { Icon: Users2,     bg:"#D1FAE5", color:"#10B981" };
    if (evt === "API Key Generated")    return { Icon: Key,        bg:"#DBEAFE", color:"#3B82F6" };
    if (evt === "Report Exported")      return { Icon: ScrollText, bg:"#FEF3C7", color:"#F59E0B" };
    if (evt === "Password Reset")       return { Icon: Shield,     bg:"#FEF3C7", color:"#F59E0B" };
    if (evt === "Workspace Activated")  return { Icon: Building2,  bg:"#D1FAE5", color:"#10B981" };
    return { Icon: Activity, bg:"#E0F7FA", color:"#06B6D4" };
  };

  // Donut chart
  const donutSeries = [
    { label:"User Events",        pct:31.2, cnt:"7,742",  clr:"#06B6D4" },
    { label:"AI Events",          pct:28.4, cnt:"7,045",  clr:"#F59E0B" },
    { label:"System Events",      pct:20.1, cnt:"4,985",  clr:"#8B5CF6" },
    { label:"Team Events",        pct:11.3, cnt:"2,803",  clr:"#EC4899" },
    { label:"Security Events",    pct:5.2,  cnt:"1,276",  clr:"#EF4444" },
    { label:"Integration Events", pct:3.8,  cnt:"939",    clr:"#10B981" },
  ];
  const donutPaths = (() => {
    const cx=56, cy=56, r=46, ri=26;
    let ang = -90;
    return donutSeries.map(d => {
      const a1 = (ang * Math.PI) / 180;
      ang += (d.pct / 100) * 360;
      const a2 = (ang * Math.PI) / 180;
      const x1=cx+r*Math.cos(a1), y1=cy+r*Math.sin(a1);
      const x2=cx+r*Math.cos(a2), y2=cy+r*Math.sin(a2);
      const lg = d.pct > 50 ? 1 : 0;
      return { ...d, d:`M${cx},${cy} L${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 ${lg} 1 ${x2.toFixed(2)},${y2.toFixed(2)} Z` };
    });
  })();

  // Activity timeline
  const tlData = [
    {lbl:"Mon 12",v:1820},{lbl:"Tue 13",v:2340},{lbl:"Wed 14",v:2890},
    {lbl:"Thu 15",v:3842},{lbl:"Fri 16",v:3120},{lbl:"Sat 17",v:2450},{lbl:"Sun 18",v:2680},
  ];
  const TW=440, TH=100, TMAX=4400;
  const tpts = tlData.map((d,i)=>({ x:(i/(tlData.length-1))*TW, y:TH-(d.v/TMAX)*TH }));
  const tline = tpts.map((p,i)=> i===0 ? `M${p.x},${p.y}` : `C${tpts[i-1].x+28},${tpts[i-1].y} ${p.x-28},${p.y} ${p.x},${p.y}`).join(" ");
  const tarea = tline + ` L${TW},${TH} L0,${TH} Z`;

  // Radial clock
  const hrVals = [3,2,1,1,1,2,7,16,30,50,56,52,40,36,48,54,50,42,30,22,16,10,7,4];
  const hrMax  = Math.max(...hrVals);
  const RCX=65, RCY=65, RMIN=20, RMAX=58;
  const radial = hrVals.map((v,h) => {
    const a = ((h/24)*360 - 90) * Math.PI / 180;
    const rr = RMIN + (v/hrMax)*(RMAX-RMIN);
    const f  = v/hrMax;
    const clr = f>0.7?"#06B6D4":f>0.4?"#67E8F9":f>0.1?"#A5F3FC":"#CFFAFE";
    return { x1:RCX+Math.cos(a)*RMIN, y1:RCY+Math.sin(a)*RMIN, x2:RCX+Math.cos(a)*rr, y2:RCY+Math.sin(a)*rr, clr };
  });

  return (
    <div className="h-full overflow-y-auto scrollbar-hide bg-[#F5FEFF]">
      <div className="px-10 py-8 max-w-[1600px]">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-[28px] font-bold text-[#111827] tracking-[-0.025em] leading-none">Logs</h1>
              <span className="flex items-center gap-1.5 px-2.5 py-[3px] rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />Real-time
              </span>
            </div>
            <p className="meetiva-small text-[#64748B] mt-1">Track and analyze system events across the Meetiva platform.</p>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button onClick={() => toast.success("Exporting logs as CSV…")} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#E5F4F7] bg-white text-[12.5px] font-medium text-[#374151] hover:border-[#06B6D4] hover:text-[#06B6D4] transition-all cursor-pointer shadow-sm">
              <Upload size={13} />Export Logs
            </button>

          </div>
        </div>

        {/* ── Filter Bar ─────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 mb-5 flex-wrap" onClick={() => setFilterDropdown(null)}>
          {/* Search */}
          <div className="relative" style={{minWidth:210}}>
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none"/>
            <input value={search} onChange={e=>{setSearch(e.target.value);setPg(1);}}
              placeholder="Search logs by keyword, user, ID..."
              className="w-full pl-8 pr-3 py-[7px] text-[12px] bg-white border border-[#E5F4F7] rounded-xl text-[#111827] placeholder-[#B0C4CB] outline-none focus:border-[#06B6D4] focus:ring-1 focus:ring-[#06B6D4]/20 transition-all"/>
          </div>

          {/* Log Type dropdown */}
          {([
            { key: "type", label: logTypeFilter, options: ["All Log Types","User Events","AI Events","Security","System","Integrations"], setter: setLogTypeFilter },
            { key: "ws",   label: wsFilter,      options: ["All Workspaces","Product Squad","Design Workspace","Marketing Team","Finance Workspace","Nordic SE"], setter: setWsFilter },
          ] as const).map(f => (
            <div key={f.key} className="relative" onClick={e => e.stopPropagation()}>
              <button
                onClick={() => setFilterDropdown(filterDropdown === f.key ? null : f.key)}
                className={`flex items-center gap-1.5 px-3 py-[7px] bg-white border rounded-xl text-[12px] text-[#374151] hover:border-[#06B6D4] transition-all cursor-pointer whitespace-nowrap shadow-sm ${filterDropdown === f.key ? "border-[#06B6D4]" : "border-[#E5F4F7]"}`}>
                {f.label !== f.options[0] ? <span className="text-[#06B6D4] font-semibold">{f.label}</span> : f.label}
                <ChevronDown size={10} className={`text-[#94A3B8] transition-transform ${filterDropdown === f.key ? "rotate-180" : ""}`}/>
              </button>
              {filterDropdown === f.key && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-[#E5F4F7] rounded-xl shadow-xl z-50 py-1 min-w-[180px]">
                  {f.options.map(opt => (
                    <button key={opt}
                      onClick={() => { f.setter(opt); setFilterDropdown(null); setPg(1); }}
                      className={`w-full text-left px-3 py-2 text-[12px] hover:bg-[#F8FDFE] transition-colors cursor-pointer ${f.label === opt ? "text-[#06B6D4] font-semibold" : "text-[#374151]"}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Date range */}
          <div className="relative" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setFilterDropdown(filterDropdown === "date" ? null : "date")}
              className={`flex items-center gap-1.5 px-3 py-[7px] bg-white border rounded-xl text-[12px] text-[#374151] hover:border-[#06B6D4] transition-all cursor-pointer whitespace-nowrap shadow-sm ${filterDropdown === "date" ? "border-[#06B6D4]" : "border-[#E5F4F7]"}`}>
              <Timer size={12} className="text-[#94A3B8]"/>
              <span className={dateLabel !== "May 12, 2025 – May 18, 2025" ? "text-[#06B6D4] font-semibold" : ""}>{dateLabel}</span>
              <ChevronDown size={10} className={`text-[#94A3B8] transition-transform ${filterDropdown === "date" ? "rotate-180" : ""}`}/>
            </button>
            {filterDropdown === "date" && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-[#E5F4F7] rounded-xl shadow-xl z-50 py-1 min-w-[220px]">
                {["Today","Last 7 days","May 12, 2025 – May 18, 2025","Apr 1, 2025 – Apr 30, 2025","Custom range"].map(opt => (
                  <button key={opt}
                    onClick={() => { setDateLabel(opt); setFilterDropdown(null); setPg(1); }}
                    className={`w-full text-left px-3 py-2 text-[12px] hover:bg-[#F8FDFE] transition-colors cursor-pointer ${dateLabel === opt ? "text-[#06B6D4] font-semibold" : "text-[#374151]"}`}>
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Clear Filters */}
          <button onClick={() => { setSearch(""); setLogTypeFilter("All Log Types"); setUserFilter("All Users"); setWsFilter("All Workspaces"); setDateLabel("May 12, 2025 – May 18, 2025"); setPg(1); setFilterDropdown(null); }}
            className="text-[12px] font-semibold text-[#06B6D4] hover:text-[#0891B2] cursor-pointer ml-auto whitespace-nowrap transition-colors">
            Clear Filters
          </button>
        </div>

        {/* ── Two-column wrapper ──────────────────────────────────────────── */}
        <div className="flex gap-5 items-start">

          {/* ════ LEFT COLUMN ════ */}
          <div className="flex-1 min-w-0 space-y-4">

            {/* Live System Flow */}
            <div className="bg-white border border-[#E5F4F7] rounded-2xl px-8 py-5 shadow-sm">
              <div className="flex items-center gap-2.5 mb-5">
                <span className="text-[13px] font-bold text-[#111827]">Live System Flow</span>
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-semibold text-emerald-600">
                  <span className={`w-1.5 h-1.5 rounded-full bg-emerald-500 ${streaming?"animate-pulse":""}`}/>Live
                </span>
              </div>
              <div className="flex items-end justify-between">
                {([
                  {lbl:"User Events",        Icon:Users,    cnt:"1,248", clr:"#06B6D4", bg:"#E0F7FA"},
                  {lbl:"Team Events",        Icon:Users2,   cnt:"862",   clr:"#7C3AED", bg:"#EDE9FE"},
                  {lbl:"AI Events",          Icon:Sparkles, cnt:"3,421", clr:"#F59E0B", bg:"#FEF3C7"},
                  {lbl:"Security Events",    Icon:Shield,   cnt:"256",   clr:"#10B981", bg:"#D1FAE5"},
                  {lbl:"Integration Events", Icon:Globe,    cnt:"532",   clr:"#EF4444", bg:"#FEE2E2"},
                  {lbl:"System Events",      Icon:Database, cnt:"1,125", clr:"#3B82F6", bg:"#DBEAFE"},
                ] as {lbl:string;Icon:React.ElementType;cnt:string;clr:string;bg:string}[]).map((n,i,a) => (
                  <React.Fragment key={i}>
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-[56px] h-[56px] rounded-full flex items-center justify-center border-4 border-white shadow-md" style={{backgroundColor:n.bg}}>
                        <n.Icon size={22} style={{color:n.clr}}/>
                      </div>
                      <div className="text-center">
                        <div className="text-[18px] font-bold text-[#111827] leading-none">{n.cnt}</div>
                        <div className="text-[10.5px] text-[#64748B] mt-0.5 whitespace-nowrap">{n.lbl}</div>
                      </div>
                    </div>
                    {i < a.length-1 && (
                      <div className="flex gap-1 mb-8">
                        {[0,1,2].map(j=><div key={j} className="w-[5px] h-[5px] rounded-full bg-[#D1E9ED]"/>)}
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Tabs + Table */}
            <div className="bg-white border border-[#E5F4F7] rounded-2xl shadow-sm overflow-hidden">

              {/* Tab bar */}
              <div className="flex items-center justify-between border-b border-[#EDF7F9]">
                <div className="flex items-center overflow-x-auto scrollbar-hide">
                  {([
                    {id:"all",          lbl:"All Logs",      cnt:tabCounts.all,          Icon:null    },
                    {id:"user",         lbl:"User Activity", cnt:tabCounts.user,         Icon:User    },
                    {id:"ai",           lbl:"AI Activity",   cnt:tabCounts.ai,           Icon:Sparkles},
                    {id:"security",     lbl:"Security",      cnt:tabCounts.security,     Icon:Shield  },
                    {id:"system",       lbl:"System",        cnt:tabCounts.system,       Icon:Database},
                    {id:"integrations", lbl:"Integrations",  cnt:tabCounts.integrations, Icon:Globe   },
                  ] as {id:typeof logTab;lbl:string;cnt:number;Icon:React.ElementType|null}[]).map(t=>{
                    const active = logTab===t.id;
                    return (
                      <button key={t.id} onClick={()=>{setLogTab(t.id);setPg(1);}}
                        className={`flex items-center gap-1.5 px-4 py-3.5 text-[12.5px] font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${active?"border-[#06B6D4] text-[#06B6D4]":"border-transparent text-[#64748B] hover:text-[#111827]"}`}>
                        {t.Icon && <t.Icon size={12} className={active?"text-[#06B6D4]":"text-[#94A3B8]"}/>}
                        {t.lbl}
                        <span className={`text-[10.5px] font-mono ${active?"text-[#06B6D4]":"text-[#94A3B8]"}`}>{t.cnt.toLocaleString()}</span>
                      </button>
                    );
                  })}
                </div>
                <button onClick={() => toast.info("Column customisation coming soon")} className="flex items-center gap-1.5 mr-3 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-[#475569] hover:bg-[#F5FEFF] hover:text-[#06B6D4] cursor-pointer flex-shrink-0 transition-colors">
                  <Hash size={12}/>Columns
                </button>
              </div>

              {/* Table */}
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#FAFCFD] border-b border-[#EDF7F9]">
                    <th className="px-4 py-3 text-left">
                      <div className="flex items-center gap-0.5 text-[10.5px] font-mono font-semibold text-[#9CA3AF] uppercase tracking-[0.1em] cursor-pointer hover:text-[#475569]">
                        Time<ChevronDown size={10}/>
                      </div>
                    </th>
                    {["Event","User / System","Workspace","IP Address","Status"].map(h=>(
                      <th key={h} className="px-4 py-3 text-left text-[10.5px] font-mono font-semibold text-[#9CA3AF] uppercase tracking-[0.1em] whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {slice.length===0 ? (
                    <tr><td colSpan={6} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <ScrollText size={24} className="text-[#CBD5E1]"/>
                        <p className="text-[13px] text-[#94A3B8]">No log entries match your filters.</p>
                      </div>
                    </td></tr>
                  ) : slice.map((r, ri) => {
                    const isAct  = selectedLog?.id===r.id;
                    const isCk   = checked.has(r.id);
                    const isLast = ri===slice.length-1;
                    const {Icon:EvIc, bg, color} = evMeta(r.event, r.cat);
                    return (
                      <tr key={r.id} onClick={()=>setSelectedLog(r)}
                        className={`cursor-pointer transition-colors ${isLast?"":"border-b border-[#F0F9FB]"} hover:bg-[#FAFCFD]`}>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="text-[11.5px] font-mono text-[#64748B]">{r.time}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center" style={{backgroundColor:bg}}>
                              <EvIc size={13} style={{color}}/>
                            </div>
                            <span className="text-[12.5px] font-semibold text-[#111827] whitespace-nowrap">{r.event}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="text-[12px] font-semibold text-[#111827] leading-tight">{r.user}</div>
                          <div className="text-[11px] font-mono text-[#94A3B8] mt-0.5">{r.email}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-[11.5px] text-[#64748B]">{r.ws}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-[11.5px] font-mono text-[#94A3B8]">{r.ip}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center px-2.5 py-[3px] rounded-lg text-[11px] font-semibold border ${r.ok?"bg-emerald-50 text-emerald-700 border-emerald-100":"bg-red-50 text-red-600 border-red-100"}`}>
                            {r.ok?"Success":"Failed"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="flex items-center justify-end px-5 py-3 border-t border-[#EDF7F9]">
                <div className="flex items-center gap-1">
                  <button disabled={safePg===1} onClick={()=>setPg(p=>p-1)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[#475569] hover:bg-[#EDF7F9] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">
                    <ChevronLeft size={13}/>
                  </button>
                  {(() => {
                    const pages: (number|"…")[] = [];
                    if (totalPg <= 5) {
                      for (let i = 1; i <= totalPg; i++) pages.push(i);
                    } else {
                      pages.push(1);
                      if (safePg > 3) pages.push("…");
                      for (let i = Math.max(2, safePg-1); i <= Math.min(totalPg-1, safePg+1); i++) pages.push(i);
                      if (safePg < totalPg - 2) pages.push("…");
                      pages.push(totalPg);
                    }
                    return pages.map((p, i) => p === "…"
                      ? <span key={"e"+i} className="w-5 text-center text-[11px] text-[#94A3B8]">…</span>
                      : <button key={p} onClick={()=>setPg(p as number)}
                          className={`w-7 h-7 rounded-lg text-[11.5px] font-mono cursor-pointer transition-all ${safePg===p?"bg-[#06B6D4] text-white":"text-[#475569] hover:bg-[#EDF7F9]"}`}>{p}</button>
                    );
                  })()}
                  <button disabled={safePg===totalPg} onClick={()=>setPg(p=>p+1)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[#475569] hover:bg-[#EDF7F9] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">
                    <ArrowRight size={13}/>
                  </button>
                  <div className="ml-2 flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E5F4F7] bg-white cursor-pointer">
                    <span className="text-[11.5px] font-mono text-[#475569]">20 / page</span>
                    <ChevronDown size={10} className="text-[#94A3B8]"/>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom: Activity Timeline + Top Active Hours + Logs by Type */}
            <div className="grid grid-cols-3 gap-4">

              {/* ── Activity Timeline ───────────────────────────────── */}
              <div className="bg-white border border-[#E5F4F7] rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-[13px] font-semibold text-[#111827]">Activity Timeline </span>
                    <span className="text-[11.5px] text-[#94A3B8]">This Week · hover to inspect</span>
                  </div>
                </div>
                <LogsTimelineChart data={tlData} />
              </div>

              {/* ── Top Active Hours ─────────────────────────────────── */}
              <div className="bg-white border border-[#E5F4F7] rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-[13px] font-semibold text-[#111827]">Top Active Hours </span>
                    <span className="text-[11.5px] text-[#94A3B8]">This Week</span>
                  </div>
                  <button className="text-[11px] font-semibold text-[#06B6D4] hover:text-[#0891B2] cursor-pointer flex items-center gap-0.5">
                    View Full Report<ArrowRight size={10}/>
                  </button>
                </div>
                <div className="flex items-center gap-4">
                  <LogsRadialChart hrVals={hrVals} />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between mb-2 pb-1.5 border-b border-[#EDF7F9]">
                      <span className="text-[9.5px] font-mono font-semibold text-[#9CA3AF] uppercase tracking-[0.07em]">Time Range</span>
                      <span className="text-[9.5px] font-mono font-semibold text-[#9CA3AF] uppercase tracking-[0.07em]">Events</span>
                    </div>
                    <div className="space-y-2">
                      {[
                        {r:"10–11 AM",c:"2,451"},
                        {r:"11 AM–12 PM",c:"2,187"},
                        {r:"9–10 AM",c:"1,982"},
                        {r:"2–3 PM",c:"1,761"},
                        {r:"4–5 PM",c:"1,309"},
                      ].map(({r,c})=>(
                        <div key={r} className="flex justify-between items-center gap-2">
                          <span className="text-[11px] text-[#374151] whitespace-nowrap">{r}</span>
                          <span className="text-[11px] font-semibold font-mono text-[#111827]">{c}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Logs by Type ─────────────────────────────────────── */}
              <div className="bg-white border border-[#E5F4F7] rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-[13px] font-semibold text-[#111827]">Logs by Type </span>
                    <span className="text-[11.5px] text-[#94A3B8]">This Week</span>
                  </div>
                  <button onClick={() => toast.info("Full log type breakdown coming soon")} className="text-[11.5px] font-semibold text-[#06B6D4] hover:text-[#0891B2] cursor-pointer">View All</button>
                </div>
                <div className="flex items-center gap-4">
                  <LogsDonutChart data={donutSeries} />
                  <div className="flex-1 space-y-2.5">
                    {donutSeries.map(d=>(
                      <div key={d.label} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{backgroundColor:d.clr}}/>
                          <span className="text-[11px] text-[#374151] truncate">{d.label.replace(" Events","")}</span>
                        </div>
                        <span className="text-[11px] font-semibold font-mono text-[#64748B] whitespace-nowrap">{d.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>

          </div>{/* end LEFT */}

        </div>{/* end two-col */}

        {/* ── Log Detail Modal ──────────────────────────────────────────── */}
        {selectedLog && (()=>{
          const sl = selectedLog;
          const {Icon:DI, bg, color} = evMeta(sl.event, sl.cat);
          const fields = [
            {Icon:User,        lbl:"User",        val:sl.user  },
            {Icon:Mail,        lbl:"Email",        val:sl.email },
            {Icon:Building2,   lbl:"Workspace",    val:sl.ws    },
            {Icon:Globe,       lbl:"IP Address",   val:sl.ip    },
            {Icon:Monitor,     lbl:"User Agent",   val:sl.agent },
            {Icon:MapPin,      lbl:"Location",     val:sl.loc   },
            {Icon:Hash,        lbl:"Session ID",   val:sl.sid   },
            {Icon:Hash,        lbl:"Event ID",     val:sl.eid   },
            {Icon:ScrollText,  lbl:"Description",  val:sl.desc  },
          ] as {Icon:React.ElementType;lbl:string;val:string}[];
          return (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{backgroundColor:"rgba(15,23,42,0.45)", backdropFilter:"blur(4px)"}}
              onClick={()=>setSelectedLog(null)}
            >
              <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
                style={{boxShadow:"0 24px 64px rgba(6,182,212,0.12), 0 8px 24px rgba(0,0,0,0.14)"}}
                onClick={e=>e.stopPropagation()}
              >
                {/* Modal header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#EDF7F9]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{backgroundColor:bg}}>
                      <DI size={17} style={{color}}/>
                    </div>
                    <div>
                      <div className="text-[15px] font-semibold text-[#111827] leading-tight">{sl.event}</div>
                      <div className="text-[11px] font-mono text-[#94A3B8] mt-0.5">{sl.time.replace("May 18,","May 18, 2025 at")}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${sl.ok?"bg-emerald-50 text-emerald-600 border-emerald-100":"bg-red-50 text-red-600 border-red-100"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sl.ok?"bg-emerald-500":"bg-red-500"}`}/>
                      {sl.ok?"Success":"Failed"}
                    </span>
                    <button
                      onClick={()=>setSelectedLog(null)}
                      className="w-8 h-8 rounded-xl border border-[#E5F4F7] flex items-center justify-center text-[#94A3B8] hover:text-[#374151] hover:border-[#C8E8F2] hover:bg-[#F5FEFF] transition-all cursor-pointer"
                    >
                      <X size={15}/>
                    </button>
                  </div>
                </div>

                {/* Fields grid */}
                <div className="px-6 py-4 grid grid-cols-2 gap-x-8 gap-y-3.5">
                  {fields.slice(0,-1).map(({Icon:FI,lbl,val})=>(
                    <div key={lbl}>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <FI size={10} className="text-[#94A3B8] flex-shrink-0"/>
                        <span className="text-[10.5px] font-medium text-[#94A3B8] uppercase tracking-wide">{lbl}</span>
                      </div>
                      <span className="text-[12.5px] font-medium text-[#111827] break-all leading-snug">{val}</span>
                    </div>
                  ))}
                </div>

                {/* Description full-width */}
                <div className="px-6 pb-4">
                  <div className="flex items-center gap-1.5 mb-1">
                    <ScrollText size={10} className="text-[#94A3B8]"/>
                    <span className="text-[10.5px] font-medium text-[#94A3B8] uppercase tracking-wide">Description</span>
                  </div>
                  <p className="text-[13px] text-[#374151] leading-relaxed bg-[#F8FEFF] border border-[#E5F4F7] rounded-xl px-4 py-3">{sl.desc}</p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-[#EDF7F9] bg-[#FAFEFF]">
                  <button
                    onClick={()=>setSelectedLog(null)}
                    className="text-[13px] font-semibold text-[#64748B] hover:text-[#374151] cursor-pointer transition-colors"
                  >
                    Close
                  </button>
                  <button onClick={() => toast.info("Detailed log view coming soon")} className="flex items-center gap-1.5 text-[13px] font-semibold text-[#06B6D4] hover:text-[#0891B2] cursor-pointer transition-colors">
                    View Full Details <ArrowUpRight size={13}/>
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

// ── Settings ───────────────────────────────────────────────────────────────

function SettingsPage() {
  const [activeTab, setActiveTab] = useState("General");
  const tabs = ["General", "Authentication", "AI", "Storage", "Uploads", "Maintenance", "Billing"];

  return (
    <div className="p-8 h-full overflow-y-auto scrollbar-hide">
      <div className="flex flex-wrap gap-1 mb-8 border-b border-[#E5F4F7] pb-0">
        {tabs.map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all cursor-pointer ${activeTab === t ? "border-[#06B6D4] text-[#06B6D4]" : "border-transparent text-[#94A3B8] hover:text-[#4B5563]"}`}>
            {t}
          </button>
        ))}
      </div>

      {activeTab === "General" && (
        <div className="max-w-2xl space-y-6">
          <Card className="p-6">
            <SectionHeader title="Platform Identity" subtitle="Configure workspace name and public-facing info" />
            <div className="space-y-4">
              {[
                { label: "Platform Name", value: "Meetiva", type: "text" },
                { label: "Support Email", value: "support@meetiva.com", type: "email" },
                { label: "Platform URL", value: "https://app.meetiva.com", type: "url" },
              ].map(({ label, value, type }) => (
                <div key={label}>
                  <label className="block text-xs font-medium text-[#4B5563] mb-1.5">{label}</label>
                  <input defaultValue={value} type={type}
                    className="w-full px-3 py-2.5 text-sm bg-[#F5FEFF] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/10 transition-all text-[#111827]" />
                </div>
              ))}
              <Btn onClick={() => toast.success("Platform settings saved")}>Save Changes</Btn>
            </div>
          </Card>
          <Card className="p-6">
            <SectionHeader title="Localization" subtitle="Default timezone and locale settings" />
            <div className="space-y-4">
              {[
                { label: "Default Timezone", value: "UTC" },
                { label: "Default Language", value: "English (US)" },
              ].map(({ label, value }) => (
                <div key={label}>
                  <label className="block text-xs font-medium text-[#4B5563] mb-1.5">{label}</label>
                  <select defaultValue={value} className="w-full px-3 py-2.5 text-sm bg-[#F5FEFF] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] transition-all text-[#111827]">
                    <option>{value}</option>
                  </select>
                </div>
              ))}
              <Btn onClick={() => toast.success("Localisation settings saved")}>Save Changes</Btn>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "Authentication" && (
        <div className="max-w-2xl space-y-6">
          <Card className="p-6">
            <SectionHeader title="Authentication Methods" subtitle="Configure allowed sign-in providers" />
            <div className="space-y-3">
              {[
                { label: "Email & Password", enabled: true, icon: Mail },
                { label: "Google SSO", enabled: true, icon: Globe },
                { label: "Microsoft SSO", enabled: false, icon: Shield },
                { label: "SAML 2.0", enabled: false, icon: Key },
              ].map(({ label, enabled, icon: Icon }) => (
                <div key={label} className="flex items-center justify-between py-3 border-b border-[#F5FEFF] last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#F5FEFF] border border-[#E5F4F7] flex items-center justify-center">
                      <Icon size={14} className="text-[#06B6D4]" />
                    </div>
                    <span className="text-sm text-[#111827] font-medium">{label}</span>
                  </div>
                  <div className={`w-10 h-5 rounded-full transition-colors cursor-pointer flex items-center px-0.5 ${enabled ? "bg-[#06B6D4]" : "bg-[#E5F4F7]"}`}>
                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${enabled ? "translate-x-5" : "translate-x-0"}`} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === "AI" && (
        <div className="max-w-2xl space-y-6">
          <Card className="p-6">
            <SectionHeader title="AI Model Configuration" subtitle="Set default model and fallback chain" />
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#4B5563] mb-1.5">Primary Model</label>
                <select className="w-full px-3 py-2.5 text-sm bg-[#F5FEFF] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] transition-all text-[#111827]">
                  <option>GPT-4o (OpenAI)</option>
                  <option>Claude 3.5 Sonnet (Anthropic)</option>
                  <option>Gemini Pro (Google)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#4B5563] mb-1.5">Monthly Token Budget</label>
                <input defaultValue="500000000" type="number"
                  className="w-full px-3 py-2.5 text-sm bg-[#F5FEFF] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/10 transition-all text-[#111827] font-mono tracking-tight" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#4B5563] mb-1.5">Per-org Token Limit</label>
                <input defaultValue="10000000" type="number"
                  className="w-full px-3 py-2.5 text-sm bg-[#F5FEFF] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/10 transition-all text-[#111827] font-mono tracking-tight" />
              </div>
              <Btn onClick={() => toast.success("AI settings saved")}>Save AI Settings</Btn>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "Storage" && (
        <div className="max-w-2xl space-y-6">
          <Card className="p-6">
            <SectionHeader title="Storage Configuration" subtitle="Global storage limits and provider" />
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#4B5563] mb-1.5">Storage Provider</label>
                <select className="w-full px-3 py-2.5 text-sm bg-[#F5FEFF] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] transition-all text-[#111827]">
                  <option>Amazon S3</option>
                  <option>Google Cloud Storage</option>
                  <option>Azure Blob Storage</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#4B5563] mb-1.5">Platform Total Limit (TB)</label>
                <input defaultValue="20" type="number"
                  className="w-full px-3 py-2.5 text-sm bg-[#F5FEFF] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/10 transition-all text-[#111827] font-mono tracking-tight" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#4B5563] mb-1.5">Warning Threshold (%)</label>
                <input defaultValue="90" type="number"
                  className="w-full px-3 py-2.5 text-sm bg-[#F5FEFF] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/10 transition-all text-[#111827] font-mono tracking-tight" />
              </div>
              <Btn onClick={() => toast.success("Storage settings saved")}>Save Storage Settings</Btn>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "Uploads" && (
        <div className="max-w-2xl">
          <Card className="p-6">
            <SectionHeader title="Upload Configuration" subtitle="File type restrictions and size limits" />
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#4B5563] mb-1.5">Max File Size (MB)</label>
                <input defaultValue="500" type="number"
                  className="w-full px-3 py-2.5 text-sm bg-[#F5FEFF] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/10 transition-all text-[#111827] font-mono tracking-tight" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#4B5563] mb-1.5">Allowed MIME Types</label>
                <textarea defaultValue="video/mp4, video/webm, audio/mpeg, application/pdf, image/*"
                  className="w-full px-3 py-2.5 text-sm bg-[#F5FEFF] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] transition-all text-[#111827] font-mono tracking-tight resize-none h-20" />
              </div>
              <Btn icon={Upload} onClick={() => toast.success("Upload settings saved")}>Save Upload Settings</Btn>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "Maintenance" && (
        <div className="max-w-2xl space-y-6">
          <Card className="p-6 border-amber-200 bg-amber-50">
            <SectionHeader title="Maintenance Mode" subtitle="Enable to prevent user logins during maintenance windows" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#4B5563]">Maintenance Mode</span>
              <div className="w-10 h-5 rounded-full bg-[#E5F4F7] cursor-pointer flex items-center px-0.5">
                <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
              </div>
            </div>
          </Card>
          <Card className="p-6 border-red-200">
            <SectionHeader title="Danger Zone" subtitle="Irreversible platform-wide actions" />
            <div className="space-y-3">
              <Btn icon={Wrench} variant="secondary" danger onClick={() => toast.success("Rebuilding search indexes…")}>Rebuild Search Indexes</Btn>
              <Btn icon={Database} variant="secondary" danger onClick={() => toast.success("Cache flushed successfully")}>Flush Cache</Btn>
              <Btn icon={RefreshCw} variant="secondary" danger onClick={() => toast.success("Storage sync initiated")}>Force Sync Storage</Btn>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "Billing" && (
        <div className="max-w-2xl space-y-6">
          <Card className="p-6">
            <SectionHeader title="Payment Provider" subtitle="Stripe integration configuration" />
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#4B5563] mb-1.5">Stripe Publishable Key</label>
                <input defaultValue="pk_live_••••••••••••••••••••••••••••••••••" type="text"
                  className="w-full px-3 py-2.5 text-sm bg-[#F5FEFF] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] transition-all text-[#111827] font-mono tracking-tight" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#4B5563] mb-1.5">Stripe Secret Key</label>
                <input defaultValue="sk_live_••••••••••••••••••••••••••••••••••" type="password"
                  className="w-full px-3 py-2.5 text-sm bg-[#F5FEFF] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] transition-all text-[#111827] font-mono tracking-tight" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#4B5563] mb-1.5">Webhook Signing Secret</label>
                <input defaultValue="whsec_••••••••••••••••••••••••••••••••" type="password"
                  className="w-full px-3 py-2.5 text-sm bg-[#F5FEFF] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] transition-all text-[#111827] font-mono tracking-tight" />
              </div>
              <Btn icon={CreditCard} onClick={() => toast.success("Billing settings saved")}>Save Billing Settings</Btn>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// ── App Root ───────────────────────────────────────────────────────────────

export default function App() {
  const [page, setPage] = useState<Page>("dashboard");

  return (
    <div className="h-screen bg-[#F5FEFF] overflow-hidden" style={{ fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <Toaster position="bottom-right" richColors closeButton />
      <Sidebar current={page} onNav={setPage} />
      <div className="flex flex-col overflow-hidden h-screen" style={{ marginLeft: "210px" }}>
        <TopBar onNav={setPage} />
        <main className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
          {page === "dashboard" && <Dashboard onNav={setPage} />}
          {page === "users" && <UserManagement />}
          {page === "teams" && <TeamManagement />}
          {page === "organization" && <OrganizationPage />}
          {page === "ai" && <AIUsage />}
          {page === "logs" && <Logs />}
          {page === "settings" && <SettingsPage />}
          {page === "profile"  && <ProfilePage />}
        </main>
      </div>
    </div>
  );
}
