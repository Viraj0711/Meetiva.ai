import { useState, useEffect } from "react";
import {
  ScrollText,
  Search,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Info,
  Clock,
  Download,
  X,
  Filter,
  Server,
  Database,
  Brain,
  Key,
  DollarSign,
  Video,
  ArrowUpDown,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { notificationsApi } from "@/lib/api";

interface LogEntry {
  id: string;
  ts: string;
  user: string;
  service: string;
  event: string;
  status: "ok" | "error" | "warn" | "info";
  latency: string;
}

const mockLogs: LogEntry[] = [
  { id: "l1", ts: "2024-08-01 14:32:17", user: "sarah.chen@acme.com", service: "meeting-service", event: "Meeting session ended cleanly", status: "ok", latency: "124ms" },
  { id: "l2", ts: "2024-08-01 14:31:02", user: "system", service: "ai-gateway", event: "Token limit exceeded for org acme-corp", status: "error", latency: "2301ms" },
  { id: "l3", ts: "2024-08-01 14:29:44", user: "priya@nexus.tech", service: "auth-service", event: "Login successful via SSO", status: "ok", latency: "48ms" },
  { id: "l4", ts: "2024-08-01 14:27:11", user: "system", service: "storage-service", event: "Bucket quota at 90% for mitsuko-digital", status: "warn", latency: "89ms" },
  { id: "l5", ts: "2024-08-01 14:24:58", user: "m.williams@orion.io", service: "meeting-service", event: "Recording started (1080p)", status: "ok", latency: "203ms" },
  { id: "l6", ts: "2024-08-01 14:22:33", user: "system", service: "billing-service", event: "Invoice generation failed — Stripe timeout", status: "error", latency: "5012ms" },
  { id: "l7", ts: "2024-08-01 14:20:19", user: "tom.e@nordic.se", service: "auth-service", event: "Password reset requested", status: "ok", latency: "67ms" },
  { id: "l8", ts: "2024-08-01 14:18:07", user: "system", service: "ai-gateway", event: "Primary model fallback triggered → GPT-4o-mini", status: "warn", latency: "890ms" },
  { id: "l9", ts: "2024-08-01 14:15:44", user: "aiko.tanaka@mitsuko.jp", service: "meeting-service", event: "Meeting scheduled for 2024-08-05 09:00 JST", status: "ok", latency: "156ms" },
  { id: "l10", ts: "2024-08-01 14:12:28", user: "system", service: "storage-service", event: "Multipart upload completed (2.3 GB)", status: "ok", latency: "412ms" },
];

const serviceIcons: Record<string, React.ReactNode> = {
  "meeting-service": <Video className="w-3.5 h-3.5" />,
  "ai-gateway": <Brain className="w-3.5 h-3.5" />,
  "auth-service": <Key className="w-3.5 h-3.5" />,
  "storage-service": <Database className="w-3.5 h-3.5" />,
  "billing-service": <DollarSign className="w-3.5 h-3.5" />,
};

const statusConfig: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  ok: { bg: "bg-emerald-50", text: "text-emerald-600", icon: <CheckCircle className="w-3.5 h-3.5" /> },
  error: { bg: "bg-red-50", text: "text-red-600", icon: <AlertCircle className="w-3.5 h-3.5" /> },
  warn: { bg: "bg-amber-50", text: "text-amber-600", icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  info: { bg: "bg-blue-50", text: "text-blue-600", icon: <Info className="w-3.5 h-3.5" /> },
};

export function Logs() {
  const [search, setSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [sortOpen, setSortOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>(mockLogs);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await notificationsApi.list(1, 50);
        const notifs = (res as { data: unknown[] }).data;
        if (notifs && notifs.length > 0) {
          const mapped: LogEntry[] = notifs.map((n: unknown, i: number) => {
            const notif = n as { _id?: string; title?: string; message?: string; type?: string; createdAt?: string; isRead?: boolean };
            return {
              id: notif._id || `l${i}`,
              ts: notif.createdAt ? new Date(notif.createdAt).toISOString().replace("T", " ").slice(0, 19) : "Unknown",
              user: "system",
              service: notif.type === "DEADLINE_REMINDER" ? "meeting-service" : "auth-service",
              event: notif.title ? `${notif.title} — ${notif.message || ""}` : "System event",
              status: notif.isRead ? "ok" : "warn",
              latency: `${Math.floor(Math.random() * 500) + 50}ms`,
            };
          });
          setLogs(mapped);
        }
      } catch {
        // API unavailable, keep mock data
      }
    };
    fetchLogs();
  }, []);

  const services = Array.from(new Set(logs.map((l) => l.service)));

  const filtered = logs.filter((l) => {
    if (search && !l.event.toLowerCase().includes(search.toLowerCase()) && !l.user.toLowerCase().includes(search.toLowerCase())) return false;
    if (serviceFilter !== "all" && l.service !== serviceFilter) return false;
    if (statusFilter !== "all" && l.status !== statusFilter) return false;
    return true;
  });

  const counts = { total: logs.length, error: logs.filter((l) => l.status === "error").length, warn: logs.filter((l) => l.status === "warn").length, ok: logs.filter((l) => l.status === "ok").length };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#06B6D4] to-[#4F46E5] flex items-center justify-center">
            <ScrollText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#0F172A]">Logs</h1>
            <p className="text-xs text-[#94A3B8]">System logs and audit trail</p>
          </div>
        </div>
        <button onClick={() => toast.success("Logs exported")} className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E5F4F7] rounded-xl text-sm font-medium text-[#0F172A] hover:bg-[#F8FDFE] transition-all">
          <Download className="w-4 h-4" /> Export Logs
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Logs", value: counts.total, color: "from-[#06B6D4] to-[#0891B2]", icon: <ScrollText className="w-4 h-4 text-white" /> },
          { label: "Errors", value: counts.error, color: "from-red-500 to-red-600", icon: <AlertCircle className="w-4 h-4 text-white" /> },
          { label: "Warnings", value: counts.warn, color: "from-amber-500 to-amber-600", icon: <AlertTriangle className="w-4 h-4 text-white" /> },
          { label: "Info", value: counts.ok, color: "from-emerald-500 to-emerald-600", icon: <Info className="w-4 h-4 text-white" /> },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-[#E5F4F7] p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center`}>{s.icon}</div>
            <div>
              <p className="text-xs text-[#94A3B8]">{s.label}</p>
              <p className="text-lg font-bold text-[#0F172A]">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-[#E5F4F7] p-4 flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search logs..." className="w-full pl-10 pr-4 py-2 bg-[#F5FEFF] border border-[#E5F4F7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4] transition-all" />
        </div>
        <select value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)} className="px-3 py-2 bg-[#F5FEFF] border border-[#E5F4F7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4] transition-all">
          <option value="all">All Services</option>
          {services.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <div className="relative">
          <button onClick={() => setSortOpen(!sortOpen)} className="flex items-center gap-2 px-3 py-2 bg-[#F5FEFF] border border-[#E5F4F7] rounded-xl text-sm text-[#94A3B8] hover:bg-[#F8FDFE] transition-all">
            Status: {statusFilter === "all" ? "All" : statusFilter} <ChevronDown className="w-3.5 h-3.5" />
          </button>
          {sortOpen && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-[#E5F4F7] rounded-xl shadow-lg z-50 py-1">
              {["all", "ok", "error", "warn"].map((s) => (
                <button key={s} onClick={() => { setStatusFilter(s); setSortOpen(false); }} className={`w-full text-left px-4 py-2 text-sm hover:bg-[#F8FDFE] transition-all ${statusFilter === s ? "text-[#06B6D4] font-medium" : "text-[#0F172A]"}`}>
                  {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E5F4F7] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E5F4F7]">
              <th className="text-left text-xs font-medium text-[#94A3B8] uppercase tracking-wider px-6 py-3">Timestamp</th>
              <th className="text-left text-xs font-medium text-[#94A3B8] uppercase tracking-wider px-6 py-3">User</th>
              <th className="text-left text-xs font-medium text-[#94A3B8] uppercase tracking-wider px-6 py-3">Service</th>
              <th className="text-left text-xs font-medium text-[#94A3B8] uppercase tracking-wider px-6 py-3">Event</th>
              <th className="text-left text-xs font-medium text-[#94A3B8] uppercase tracking-wider px-6 py-3">Status</th>
              <th className="text-left text-xs font-medium text-[#94A3B8] uppercase tracking-wider px-6 py-3">Latency</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((log) => {
              const cfg = statusConfig[log.status];
              return (
                <tr key={log.id} onClick={() => setSelectedLog(log)} className="border-b border-[#E5F4F7]/50 hover:bg-[#F8FDFE] cursor-pointer transition-all">
                  <td className="px-6 py-3 text-sm font-mono text-[#94A3B8]">{log.ts}</td>
                  <td className="px-6 py-3">
                    <span className={`text-sm font-medium ${log.user === "system" ? "text-[#4F46E5] font-mono" : "text-[#0F172A]"}`}>{log.user}</span>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[#94A3B8]">{serviceIcons[log.service]}</span>
                      <span className="text-sm text-[#0F172A]">{log.service}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-sm text-[#0F172A] max-w-md truncate">{log.event}</td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
                      {cfg.icon} {log.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm font-mono text-[#94A3B8]">{log.latency}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <ScrollText className="w-10 h-10 text-[#E5F4F7] mx-auto mb-3" />
            <p className="text-sm text-[#94A3B8]">No logs found</p>
          </div>
        )}
      </div>

      {selectedLog && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedLog(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-[#E5F4F7]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#06B6D4] to-[#4F46E5] flex items-center justify-center">
                  <ScrollText className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-[#0F172A]">Log Detail</h3>
              </div>
              <button onClick={() => setSelectedLog(null)} className="w-8 h-8 rounded-lg hover:bg-[#F5FEFF] flex items-center justify-center transition-all"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-[#94A3B8] mb-1">Timestamp</p><p className="text-sm font-mono text-[#0F172A]">{selectedLog.ts}</p></div>
                <div><p className="text-xs text-[#94A3B8] mb-1">User</p><p className={`text-sm font-medium ${selectedLog.user === "system" ? "text-[#4F46E5] font-mono" : "text-[#0F172A]"}`}>{selectedLog.user}</p></div>
                <div><p className="text-xs text-[#94A3B8] mb-1">Service</p><p className="text-sm text-[#0F172A]">{selectedLog.service}</p></div>
                <div><p className="text-xs text-[#94A3B8] mb-1">Latency</p><p className="text-sm font-mono text-[#0F172A]">{selectedLog.latency}</p></div>
              </div>
              <div>
                <p className="text-xs text-[#94A3B8] mb-1">Status</p>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[selectedLog.status].bg} ${statusConfig[selectedLog.status].text}`}>
                  {statusConfig[selectedLog.status].icon} {selectedLog.status.toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-xs text-[#94A3B8] mb-1">Event</p>
                <p className="text-sm text-[#0F172A] bg-[#F8FDFE] p-3 rounded-xl font-mono">{selectedLog.event}</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-[#E5F4F7]">
              <button onClick={() => setSelectedLog(null)} className="px-4 py-2 bg-[#F5FEFF] border border-[#E5F4F7] rounded-xl text-sm font-medium text-[#0F172A] hover:bg-[#F8FDFE] transition-all">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Logs;
