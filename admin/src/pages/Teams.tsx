import { useState, useMemo, useEffect } from "react";
import {
  Users, User, Video, Building2, Sparkles, Globe, CreditCard,
  Shield, Clock, HardDrive, Plus, X, Search, ChevronDown,
  MoreHorizontal, Eye, Ban, CheckCircle, Trash2, Zap, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { teamsApi } from "@/lib/api";
import type { StatusV, TeamData } from "@/types";

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
  active: "bg-green-500", verified: "bg-green-500", ok: "bg-green-500",
  inactive: "bg-slate-400", pending: "bg-amber-500", warn: "bg-amber-500",
  suspended: "bg-red-500", error: "bg-red-500",
};

function Badge({ variant, children }: { variant: StatusV; children: React.ReactNode }) {
  return (
    <span className={"inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium font-mono tracking-tight " + statusStyles[variant]}>
      <span className={"w-1.5 h-1.5 rounded-full " + statusDot[variant]} />
      {children}
    </span>
  );
}

const logoColor = (id: string) => {
  const palette = ["#06B6D4", "#4F46E5", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#0EA5E9"];
  return palette[id.charCodeAt(1) % palette.length];
};

const logoInitials = (name: string) => name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();

const planCls = (plan: string) =>
  plan === "Enterprise" ? "bg-purple-50 text-purple-700 border border-purple-200" :
  plan === "Pro" ? "bg-[#F0FDFF] text-[#0891B2] border border-cyan-200" :
  "bg-slate-50 text-slate-500 border border-slate-200";

export { TeamManagement };
export default function TeamManagement() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"all" | "workspaces" | "requests" | "archived">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [statusFilter, setStatusFilter] = useState("All");
  const [activeTeam, setActiveTeam] = useState<TeamData | null>(null);
  const [localTeams, setLocalTeams] = useState<TeamData[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [upgradeTeam, setUpgradeTeam] = useState<TeamData | null>(null);
  const [teamSortBy, setTeamSortBy] = useState<"name" | "members" | "created" | "plan">("name");
  const [teamSortDir, setTeamSortDir] = useState<"asc" | "desc">("asc");
  const [teamSortOpen, setTeamSortOpen] = useState(false);
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [addTeamForm, setAddTeamForm] = useState({ name: "", owner: "", ownerEmail: "", department: "", website: "", description: "", plan: "Free" });
  const [teamMemberInput, setTeamMemberInput] = useState("");
  const [teamMemberList, setTeamMemberList] = useState<{ name: string; email: string; role: string }[]>([]);
  const [showWorkspace, setShowWorkspace] = useState<TeamData | null>(null);
  const [showManageMembers, setShowManageMembers] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState<{ userId: string; name: string; email: string; role: string; status?: string }[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  useEffect(() => {
    const fetchTeams = async () => {
      setLoading(true);
      try {
        const res = await teamsApi.list();
        const mapped: TeamData[] = res.teams.map((t, i) => ({
          id: t.id || "t" + i,
          name: t.name || "Team " + (i + 1),
          owner: t.role ? t.role.charAt(0).toUpperCase() + t.role.slice(1).toLowerCase() : "Member",
          members: 0,
          status: (t.status === "ACCEPTED" ? "verified" : t.status === "PENDING" ? "pending" : "suspended") as StatusV,
          created: t.joinedAt ? new Date(t.joinedAt).toLocaleDateString() : "Unknown",
          plan: "Pro",
        }));
        setLocalTeams(mapped);
      } catch {
        // API unavailable
      } finally {
        setLoading(false);
      }
    };
    fetchTeams();
  }, []);

  const fetchMembers = async (teamId: string) => {
    setMembersLoading(true);
    try {
      const res = await teamsApi.members(teamId);
      setTeamMembers(res.members);
    } catch {
      setTeamMembers([]);
    } finally {
      setMembersLoading(false);
    }
  };

  const pendingCount = localTeams.filter(t => t.status === "pending").length;

  const tabFiltered = localTeams.filter(t => {
    if (tab === "requests") return t.status === "pending";
    if (tab === "archived") return t.status === "suspended";
    if (tab === "workspaces") return t.status === "verified";
    return true;
  });

  const filtered = tabFiltered.filter(t => {
    const q = search.toLowerCase();
    return (
      (!q || t.name.toLowerCase().includes(q) || t.owner.toLowerCase().includes(q)) &&
      (statusFilter === "All" || t.status === statusFilter)
    );
  });

  const teamsSorted = useMemo(
    () =>
      [...filtered].sort((a, b) => {
        const dir = teamSortDir === "asc" ? 1 : -1;
        if (teamSortBy === "name") return dir * a.name.localeCompare(b.name);
        if (teamSortBy === "members") return dir * (a.members - b.members);
        if (teamSortBy === "created") return dir * a.created.localeCompare(b.created);
        if (teamSortBy === "plan") return dir * a.plan.localeCompare(b.plan);
        return 0;
      }),
    [filtered, teamSortBy, teamSortDir]
  );

  const tabs = [
    { id: "all" as const, label: "All Teams" },
    { id: "workspaces" as const, label: "Workspaces" },
    { id: "requests" as const, label: "Requests", badge: pendingCount },
    { id: "archived" as const, label: "Archived" },
  ];

  const summaryStats = [
    { label: "Total Teams", value: localTeams.length, icon: Building2, color: "#06B6D4" },
    { label: "Active", value: localTeams.filter(t => t.status === "verified").length, icon: CheckCircle, color: "#10B981" },
    { label: "Pending", value: pendingCount, icon: Clock, color: "#F59E0B" },
    { label: "Suspended", value: localTeams.filter(t => t.status === "suspended").length, icon: Ban, color: "#EF4444" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F5FEFF" }}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#06B6D4" }} />
          <p className="text-sm" style={{ color: "#94A3B8" }}>Loading teams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#F5FEFF" }}>
      {/* Header */}
      <div className="px-10 pt-8 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[28px] font-bold text-[#0F172A] tracking-[-0.025em] leading-none">Teams</h1>
            <p className="text-[13px] text-[#94A3B8] mt-1.5">Manage teams, workspaces, and member access</p>
          </div>
          <button onClick={() => setShowAddTeam(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#06B6D4] text-white text-[13px] font-semibold hover:bg-[#0891B2] transition-colors cursor-pointer shadow-sm shadow-[#06B6D4]/25">
            <Plus size={15} /> Create Team
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="px-10 py-4">
        <div className="grid grid-cols-4 gap-4">
          {summaryStats.map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-white rounded-2xl border border-[#E5F4F7] p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: s.color + "12" }}>
                  <Icon size={18} style={{ color: s.color }} />
                </div>
                <div>
                  <p className="text-[11px] text-[#94A3B8] font-medium">{s.label}</p>
                  <p className="text-lg font-bold text-[#0F172A]">{s.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-10">
        <div className="flex gap-1 border-b border-[#E5F4F7]">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={"flex items-center gap-2 px-5 py-3 text-[13px] font-semibold border-b-2 transition-all cursor-pointer " + (tab === t.id ? "border-[#06B6D4] text-[#06B6D4]" : "border-transparent text-[#64748B] hover:text-[#0F172A]")}
            >
              {t.label}
              {"badge" in t && t.badge ? (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF3C7] text-[#D97706]">{t.badge}</span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-10 py-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search teams..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E5F4F7] rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4] transition-all" />
          </div>

          <div className="flex gap-1.5">
            {["All", "verified", "pending", "suspended"].map(s => (
              <button key={s} onClick={() => setStatusFilter(s === "All" ? "All" : s)}
                className={"px-3 py-1.5 rounded-lg text-[11.5px] font-semibold transition-all cursor-pointer " + (statusFilter === s ? "bg-[#06B6D4] text-white" : "bg-white border border-[#E5F4F7] text-[#64748B] hover:bg-[#F8FDFE]")}
              >
                {s === "All" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          <div className="relative">
            <button onClick={() => setTeamSortOpen(o => !o)} className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border bg-white text-[13px] font-medium text-[#64748B] hover:bg-[#F8FDFE] transition-all cursor-pointer">
              <ChevronDown size={13} className={"transition-transform " + (teamSortOpen ? "rotate-180" : "")} /> Sort
            </button>
            {teamSortOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-[#E5F4F7] rounded-xl shadow-lg z-50 py-1">
                {(["name", "members", "created", "plan"] as const).map(s => (
                  <button key={s} onClick={() => { setTeamSortBy(s); setTeamSortOpen(false); }}
                    className="w-full text-left px-4 py-2 text-[13px] hover:bg-[#F8FDFE] transition-all text-[#0F172A]"
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex rounded-lg border border-[#E5F4F7] overflow-hidden">
            <button onClick={() => setViewMode("grid")} className={"w-7 h-7 flex items-center justify-center transition-all cursor-pointer " + (viewMode === "grid" ? "bg-[#06B6D4] text-white" : "bg-white text-[#64748B]")}>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><rect x="0" y="0" width="7" height="7" rx="1.5"/><rect x="9" y="0" width="7" height="7" rx="1.5"/><rect x="0" y="9" width="7" height="7" rx="1.5"/><rect x="9" y="9" width="7" height="7" rx="1.5"/></svg>
            </button>
            <button onClick={() => setViewMode("list")} className={"w-7 h-7 flex items-center justify-center transition-all cursor-pointer " + (viewMode === "list" ? "bg-[#06B6D4] text-white" : "bg-white text-[#64748B]")}>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><rect x="0" y="1" width="16" height="3" rx="1"/><rect x="0" y="6.5" width="16" height="3" rx="1"/><rect x="0" y="12" width="16" height="3" rx="1"/></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Teams Grid/List */}
      <div className="px-10 pb-10">
        {teamsSorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Building2 className="w-12 h-12 mb-3" style={{ color: "#E5F4F7" }} />
            <p className="text-[15px] font-semibold text-[#0F172A]">No teams found</p>
            <p className="text-[13px] text-[#94A3B8] mt-1">Create your first team to get started</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-3 gap-4">
            {teamsSorted.map(team => (
              <div key={team.id} onClick={() => { setActiveTeam(team); fetchMembers(team.id); }}
                className="relative bg-white border border-[#E5F4F7] rounded-2xl p-5 cursor-pointer hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-[13px] font-bold" style={{ background: logoColor(team.id) }}>
                      {logoInitials(team.name)}
                    </div>
                    <div>
                      <h3 className="text-[14px] font-semibold text-[#0F172A]">{team.name}</h3>
                      <p className="text-[11px] text-[#94A3B8]">Owner: {team.owner}</p>
                    </div>
                  </div>
                  <Badge variant={team.status}>{team.status}</Badge>
                </div>
                <div className="flex items-center gap-4 mt-3 text-[11px] text-[#94A3B8]">
                  <span>{team.members} members</span>
                  <span>{team.created}</span>
                </div>
                <div className="mt-3">
                  <span className={"inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold " + planCls(team.plan)}>{team.plan}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#E5F4F7] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E5F4F7]">
                  <th className="text-left text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider px-5 py-3">Team</th>
                  <th className="text-left text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider px-5 py-3">Owner</th>
                  <th className="text-left text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider px-5 py-3">Members</th>
                  <th className="text-left text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider px-5 py-3">Status</th>
                  <th className="text-left text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider px-5 py-3">Plan</th>
                  <th className="text-left text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider px-5 py-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {teamsSorted.map(team => (
                  <tr key={team.id} onClick={() => { setActiveTeam(team); fetchMembers(team.id); }}
                    className="border-b border-[#E5F4F7]/50 hover:bg-[#F8FDFE] cursor-pointer transition-all"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[11px] font-bold" style={{ background: logoColor(team.id) }}>
                          {logoInitials(team.name)}
                        </div>
                        <span className="text-[13px] font-semibold text-[#0F172A]">{team.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-[13px] text-[#64748B]">{team.owner}</td>
                    <td className="px-5 py-3 text-[13px] text-[#0F172A] font-medium">{team.members}</td>
                    <td className="px-5 py-3"><Badge variant={team.status}>{team.status}</Badge></td>
                    <td className="px-5 py-3"><span className={"inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold " + planCls(team.plan)}>{team.plan}</span></td>
                    <td className="px-5 py-3 text-[13px] text-[#94A3B8]">{team.created}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Team Detail Modal */}
      {activeTeam && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setActiveTeam(null); setTeamMembers([]); }}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-[#E5F4F7]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-[13px] font-bold" style={{ background: logoColor(activeTeam.id) }}>
                  {logoInitials(activeTeam.name)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#0F172A]">{activeTeam.name}</h3>
                  <p className="text-[12px] text-[#94A3B8]">Team Details</p>
                </div>
              </div>
              <button onClick={() => { setActiveTeam(null); setTeamMembers([]); }} className="w-8 h-8 rounded-lg hover:bg-[#F5FEFF] flex items-center justify-center transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-[11px] text-[#94A3B8] uppercase tracking-wider mb-1">Owner</p><p className="text-[13px] font-medium text-[#0F172A]">{activeTeam.owner}</p></div>
                <div><p className="text-[11px] text-[#94A3B8] uppercase tracking-wider mb-1">Status</p><Badge variant={activeTeam.status}>{activeTeam.status}</Badge></div>
                <div><p className="text-[11px] text-[#94A3B8] uppercase tracking-wider mb-1">Plan</p><span className={"inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold " + planCls(activeTeam.plan)}>{activeTeam.plan}</span></div>
                <div><p className="text-[11px] text-[#94A3B8] uppercase tracking-wider mb-1">Created</p><p className="text-[13px] text-[#0F172A]">{activeTeam.created}</p></div>
              </div>

              <div>
                <p className="text-[11px] text-[#94A3B8] uppercase tracking-wider mb-2">Members</p>
                {membersLoading ? (
                  <div className="flex items-center gap-2 py-4">
                    <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#06B6D4" }} />
                    <span className="text-[13px] text-[#94A3B8]">Loading members...</span>
                  </div>
                ) : teamMembers.length > 0 ? (
                  <div className="space-y-2">
                    {teamMembers.map(m => (
                      <div key={m.userId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#F8FDFE]">
                        <div className="w-8 h-8 rounded-full bg-[#06B6D4] flex items-center justify-center text-white text-[11px] font-bold">
                          {m.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-[#0F172A] truncate">{m.name}</p>
                          <p className="text-[11px] text-[#94A3B8] truncate">{m.email}</p>
                        </div>
                        <Badge variant="active">{m.role}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[13px] text-[#94A3B8] py-2">No members found</p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-[#E5F4F7]">
              <button onClick={() => { setActiveTeam(null); setTeamMembers([]); }} className="px-4 py-2 bg-[#F5FEFF] border border-[#E5F4F7] rounded-xl text-[13px] font-medium text-[#0F172A] hover:bg-[#F8FDFE] transition-all">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Team Modal */}
      {showAddTeam && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAddTeam(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-[#E5F4F7]">
              <h3 className="text-lg font-bold text-[#0F172A]">Create Team</h3>
              <button onClick={() => setShowAddTeam(false)} className="w-8 h-8 rounded-lg hover:bg-[#F5FEFF] flex items-center justify-center transition-all"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">Team Name *</label>
                <input value={addTeamForm.name} onChange={e => setAddTeamForm(f => ({ ...f, name: e.target.value }))} className="w-full mt-1 px-3 py-2 bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4] transition-all" placeholder="e.g. Engineering Team" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">Owner *</label>
                <input value={addTeamForm.owner} onChange={e => setAddTeamForm(f => ({ ...f, owner: e.target.value }))} className="w-full mt-1 px-3 py-2 bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4] transition-all" placeholder="e.g. John Doe" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">Description</label>
                <textarea value={addTeamForm.description} onChange={e => setAddTeamForm(f => ({ ...f, description: e.target.value }))} rows={3} className="w-full mt-1 px-3 py-2 bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4] transition-all resize-none" placeholder="Brief description..." />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-2 block">Plan</label>
                <div className="flex gap-2">
                  {["Free", "Pro", "Enterprise"].map(p => (
                    <button key={p} onClick={() => setAddTeamForm(f => ({ ...f, plan: p }))}
                      className={"flex-1 py-2 rounded-xl text-[12px] font-semibold transition-all cursor-pointer border " + (addTeamForm.plan === p ? "bg-[#06B6D4] text-white border-[#06B6D4]" : "bg-white text-[#64748B] border-[#E5F4F7] hover:bg-[#F8FDFE]")}
                    >{p}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-[#E5F4F7]">
              <button onClick={() => setShowAddTeam(false)} className="px-4 py-2 bg-[#F5FEFF] border border-[#E5F4F7] rounded-xl text-[13px] font-medium text-[#0F172A] hover:bg-[#F8FDFE] transition-all">Cancel</button>
              <button onClick={() => {
                if (!addTeamForm.name.trim() || !addTeamForm.owner.trim()) { toast.error("Team name and owner are required"); return; }
                const newTeam: TeamData = { id: "t" + Date.now(), name: addTeamForm.name, owner: addTeamForm.owner, members: 1 + teamMemberList.length, status: "pending" as StatusV, created: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }), plan: addTeamForm.plan };
                setLocalTeams(t => [newTeam, ...t]);
                setShowAddTeam(false);
                setAddTeamForm({ name: "", owner: "", ownerEmail: "", department: "", website: "", description: "", plan: "Free" });
                setTeamMemberList([]);
                setTeamMemberInput("");
                toast.success("Team " + newTeam.name + " created");
              }} className="px-5 py-2 rounded-xl bg-[#06B6D4] text-white text-[13px] font-semibold hover:bg-[#0891B2] transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm">
                <Building2 size={13} /> Create Team
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
