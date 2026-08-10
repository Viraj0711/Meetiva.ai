import { useState, useMemo } from "react";
import {
  Brain,
  Zap,
  Database,
  DollarSign,
  Timer,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { SvgAreaChart, SvgLineChart, SvgDonutChart } from "@/components/charts";

const modelUsageData = [
  { name: "GPT-4o", value: 48, color: "#06B6D4" },
  { name: "Claude 3.5", value: 31, color: "#4F46E5" },
  { name: "Gemini Pro", value: 14, color: "#F59E0B" },
  { name: "Llama 3.1", value: 7, color: "#16A34A" },
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

const aiWeekData = [
  { day: "Mon", requests: 12400, tokens: 890 },
  { day: "Tue", requests: 15200, tokens: 1100 },
  { day: "Wed", requests: 13800, tokens: 950 },
  { day: "Thu", requests: 18900, tokens: 1380 },
  { day: "Fri", requests: 21200, tokens: 1560 },
  { day: "Sat", requests: 9800, tokens: 710 },
  { day: "Sun", requests: 7400, tokens: 530 },
];

const mockAIRequests = [
  { id: "req-001", ts: "14:32:07", user: "sarah.chen@acme.com", model: "GPT-4o", tokens: 2847, latency: "312ms", status: "ok", cost: "$0.014" },
  { id: "req-002", ts: "14:31:54", user: "m.williams@orion.io", model: "Claude 3.5", tokens: 1203, latency: "198ms", status: "ok", cost: "$0.006" },
  { id: "req-003", ts: "14:31:41", user: "priya.patel@nexus.co", model: "GPT-4o", tokens: 5120, latency: "541ms", status: "ok", cost: "$0.026" },
  { id: "req-004", ts: "14:31:28", user: "james@startco.io", model: "Gemini Pro", tokens: 892, latency: "2,104ms", status: "error", cost: "$0.000" },
  { id: "req-005", ts: "14:31:15", user: "a.tanaka@mitsuko.jp", model: "Claude 3.5", tokens: 3641, latency: "287ms", status: "ok", cost: "$0.018" },
  { id: "req-006", ts: "14:30:59", user: "fatima@gulfventures.ae", model: "Llama 3.1", tokens: 1740, latency: "445ms", status: "ok", cost: "$0.003" },
  { id: "req-007", ts: "14:30:44", user: "r.kovacs@influx.eu", model: "GPT-4o", tokens: 4291, latency: "612ms", status: "warn", cost: "$0.022" },
  { id: "req-008", ts: "14:30:31", user: "l.santos@quanta.br", model: "Claude 3.5", tokens: 987, latency: "176ms", status: "ok", cost: "$0.005" },
  { id: "req-009", ts: "14:30:18", user: "k.oduya@centrix.ng", model: "GPT-4o", tokens: 3308, latency: "389ms", status: "ok", cost: "$0.017" },
  { id: "req-010", ts: "14:30:04", user: "e.berg@nordic.se", model: "Gemini Pro", tokens: 1547, latency: "1,830ms", status: "warn", cost: "$0.004" },
];

const modelColor = (model: string) =>
  model === "GPT-4o" ? "#06B6D4" :
  model === "Claude 3.5" ? "#4F46E5" :
  model === "Gemini Pro" ? "#F59E0B" : "#16A34A";

const modelBg = (model: string) =>
  model === "GPT-4o" ? "bg-[#F0FDFF] text-[#0891B2] border-cyan-200" :
  model === "Claude 3.5" ? "bg-purple-50 text-purple-700 border-purple-200" :
  model === "Gemini Pro" ? "bg-amber-50 text-amber-700 border-amber-200" :
    "bg-emerald-50 text-emerald-700 border-emerald-200";

const statusDot = (s: string) =>
  s === "ok" ? "bg-emerald-400" :
  s === "warn" ? "bg-amber-400" : "bg-red-400";

const statusLabel = (s: string) =>
  s === "ok" ? "text-emerald-600 bg-emerald-50 border-emerald-100" :
  s === "warn" ? "text-amber-600 bg-amber-50 border-amber-100" :
    "text-red-600 bg-red-50 border-red-100";

function DashKPI({ label, value, sub, icon: Icon, trend, trendUp, uid }: {
  label: string; value: string; sub: string; icon: React.ElementType;
  trend?: string; trendUp?: boolean; uid: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#E5F4F7] p-5 shadow-sm hover:shadow-md hover:border-[#C8E8F2] transition-all duration-200 cursor-default">
      <div className="flex items-start justify-between mb-3">
        <div className="w-8 h-8 rounded-xl bg-[#F0FAFE] flex items-center justify-center border border-[#E0F3F8]">
          <Icon size={14} className="text-[#06B6D4]" />
        </div>
        {trend && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${trendUp ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
            {trend}
          </span>
        )}
      </div>
      <p className="text-[10.5px] font-semibold text-[#94A3B8] uppercase tracking-[0.12em] mb-1.5">{label}</p>
      <p className="text-[22px] font-extrabold text-[#0F172A] leading-none tracking-tight mb-2">{value}</p>
      <p className="text-[11px] font-mono text-[#94A3B8] truncate">{sub}</p>
    </div>
  );
}

export { AiUsage };
export default function AiUsage() {
  const [reqFilter, setReqFilter] = useState("All");

  const filteredReqs = useMemo(() =>
    reqFilter === "All" ? mockAIRequests : mockAIRequests.filter(r => r.status === reqFilter.toLowerCase())
  , [reqFilter]);

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
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#E5F4F7] bg-white text-[12px] text-[#475569]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium">Streaming</span>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-5 gap-4">
          <DashKPI label="Total Requests" value="98,412" sub="AI API calls processed" icon={Zap} trend="+34.7%" trendUp={true} uid="ai-kpi-req" />
          <DashKPI label="Tokens Consumed" value="2.4M" sub="This month" icon={Database} trend="+28.1%" trendUp={true} uid="ai-kpi-tok" />
          <DashKPI label="Total Cost" value="$7,184" sub="This month" icon={DollarSign} trend="+22.4%" trendUp={false} uid="ai-kpi-cost" />
          <DashKPI label="Avg Latency" value="342ms" sub="p50 median" icon={Timer} trend="-12ms" trendUp={true} uid="ai-kpi-lat" />
          <DashKPI label="Failed Requests" value="23" sub="0.02% error rate" icon={XCircle} trend="-0.3%" trendUp={true} uid="ai-kpi-err" />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-2 gap-5">
          {/* Model Usage donut */}
          <div className="bg-white border border-[#E5F4F7] rounded-2xl p-7">
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

          {/* Cost Trend area */}
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

        {/* Recent AI Requests */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10.5px] font-mono font-semibold text-[#9CA3AF] uppercase tracking-[0.12em] mb-1">Recent AI Requests</p>
              <p className="text-[18px] font-bold text-[#0F172A] tracking-[-0.02em]">Live Feed</p>
            </div>
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
                  {(["Request ID", "Timestamp", "User", "Model", "Tokens", "Latency", "Status", "Cost"] as const).map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-[10.5px] font-mono font-semibold text-[#9CA3AF] uppercase tracking-[0.12em] whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredReqs.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-16 text-center">
                      <p className="text-[13px] text-[#94A3B8]">No requests match this filter.</p>
                    </td>
                  </tr>
                )}
                {filteredReqs.map((r, idx) => {
                  const isLast = idx === filteredReqs.length - 1;
                  return (
                    <tr key={r.id}
                      className={`transition-colors hover:bg-[#FAFCFD] ${isLast ? "" : "border-b border-[#F0F9FB]"}`}>
                      <td className="px-5 py-3.5">
                        <span className="text-[11.5px] font-mono text-[#94A3B8]">{r.id}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-[11.5px] font-mono text-[#94A3B8]">{r.ts}</span>
                      </td>
                      <td className="px-5 py-3.5 max-w-[200px]">
                        <span className="text-[12.5px] text-[#374151] truncate block">{r.user}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: modelColor(r.model) }} />
                          <span className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-lg border ${modelBg(r.model)}`}>
                            {r.model}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-[12px] font-mono tabular-nums text-[#475569]">{r.tokens.toLocaleString()}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-[12px] font-mono tabular-nums ${
                          parseInt(r.latency) > 1000 ? "text-red-500" :
                          parseInt(r.latency) > 500 ? "text-amber-600" : "text-[#475569]"
                        }`}>{r.latency}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusDot(r.status)}`} />
                          <span className={`text-[10.5px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded-md border ${statusLabel(r.status)}`}>
                            {r.status}
                          </span>
                        </div>
                      </td>
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
              <button onClick={() => {}} className="flex items-center gap-1.5 text-[11.5px] font-mono text-[#94A3B8] hover:text-[#06B6D4] transition-colors cursor-pointer">
                <RefreshCw size={11} /> Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Response Time chart */}
        <div className="bg-white border border-[#E5F4F7] rounded-2xl p-7">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-[10.5px] font-mono font-semibold text-[#9CA3AF] uppercase tracking-[0.12em] mb-1.5">Response Latency</p>
              <p className="text-[20px] font-bold text-[#0F172A] tracking-[-0.02em]">
                342ms <span className="text-[13px] font-medium text-[#64748B] tracking-normal">p50 today</span>
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

      </div>
    </div>
  );
}
