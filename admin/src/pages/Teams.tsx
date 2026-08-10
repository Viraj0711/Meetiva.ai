import { useState, useMemo, useEffect } from "react";
import {
  Users,
  User,
  Video,
  Building2,
  Sparkles,
  Globe,
  CreditCard,
  Shield,
  Clock,
  HardDrive,
  Plus,
  X,
  Search,
  ChevronDown,
  MoreHorizontal,
  Eye,
  Ban,
  CheckCircle,
  Trash2,
  Zap,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { teamsApi } from "@/lib/api";
import type { StatusV, TeamData } from "@/types";

// ── Mock Data ──────────────────────────────────────────────────────────────

const mockTeams: TeamData[] = [
  { id: "t1", name: "Acme Corporation", owner: "Sarah Chen", members: 47, status: "verified", created: "Jan 12, 2024", plan: "Enterprise" },
  { id: "t2", name: "Orion Labs", owner: "Marcus Williams", members: 12, status: "verified", created: "Mar 5, 2024", plan: "Pro" },
  { id: "t3", name: "Nexus Technologies", owner: "Priya Patel", members: 128, status: "verified", created: "Nov 8, 2023", plan: "Enterprise" },
  { id: "t4", name: "StartCo", owner: "James O'Brien", members: 4, status: "pending", created: "Jun 22, 2024", plan: "Free" },
  { id: "t5", name: "Mitsuko Digital", owner: "Aiko Tanaka", members: 33, status: "verified", created: "Feb 14, 2024", plan: "Pro" },
  { id: "t6", name: "Gulf Ventures", owner: "Fatima Al-Hassan", members: 89, status: "suspended", created: "Dec 3, 2023", plan: "Enterprise" },
  { id: "t7", name: "Nordic Collective", owner: "Tom Eriksson", members: 8, status: "pending", created: "Jul 30, 2024", plan: "Free" },
  { id: "t8", name: "LatAm Hub", owner: "Diego Reyes", members: 21, status: "suspended", created: "May 1, 2024", plan: "Pro" },
];

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

// ── Component ──────────────────────────────────────────────────────────────

const logoColor = (id: string) => {
  const palette = ["#06B6D4","#4F46E5","#10B981","#F59E0B","#EF4444","#8B5CF6","#EC4899","#0EA5E9"];
  return palette[id.charCodeAt(1) % palette.length];
};

const logoInitials = (name: string) => name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();

const planCls = (plan: string) =>
  plan === "Enterprise" ? "bg-purple-50 text-purple-700 border border-purple-200" :
  plan === "Pro"        ? "bg-[#F0FDFF] text-[#0891B2] border border-cyan-200" :
                          "bg-slate-50 text-slate-500 border border-slate-200";

export { TeamManagement };
export default function TeamManagement() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"all" | "workspaces" | "requests" | "archived">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [statusFilter, setStatusFilter] = useState("All");
  const [activeTeam, setActiveTeam] = useState<TeamData | null>(null);
  const [localTeams, setLocalTeams] = useState<TeamData[]>(() => [...mockTeams]);
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

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await teamsApi.list();
        const teams = (res as { teams: unknown[] }).teams;
        if (teams && teams.length > 0) {
          const mapped: TeamData[] = teams.map((t: unknown, i: number) => {
            const team = t as { _id?: string; name?: string; description?: string; createdAt?: string };
            return {
              id: team._id || `t${i}`,
              name: team.name || `Team ${i + 1}`,
              owner: "Admin",
              members: 0,
              status: "verified" as StatusV,
              created: team.createdAt ? new Date(team.createdAt).toLocaleDateString() : "Unknown",
              plan: "Pro",
            };
          });
          setLocalTeams(mapped);
        }
      } catch {
        // API unavailable, keep mock data
      } finally {
        setLoading(false);
      }
    };
    fetchTeams();
  }, []);

  // ── Derived ─────────────────────────────────────────────────────────────
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

  // ── Mutations ────────────────────────────────────────────────────────────
  const verifyTeam = (id: string) =>
    setLocalTeams(prev => prev.map(t => (t.id === id ? { ...t, status: "verified" as StatusV } : t)));

  const suspendTeam = (id: string) =>
    setLocalTeams(prev => prev.map(t => (t.id === id ? { ...t, status: "suspended" as StatusV } : t)));

  const deleteTeam = (id: string) => {
    setLocalTeams(prev => prev.filter(t => t.id !== id));
    if (activeTeam?.id === id) setActiveTeam(null);
  };

  const applyPlan = (teamId: string, plan: string) => {
    setLocalTeams(prev => prev.map(t => (t.id === teamId ? { ...t, plan } : t)));
    if (activeTeam?.id === teamId) setActiveTeam(prev => (prev ? { ...prev, plan } : null));
    setUpgradeTeam(null);
  };

  const activityEvents = [
    { icon: Building2, color: "#06B6D4", label: "Team Created", team: "Nordic Collective", time: "2m ago" },
    { icon: Zap, color: "#4F46E5", label: "Workspace Activated", team: "Acme Corporation", time: "18m ago" },
    { icon: Users, color: "#10B981", label: "Member Joined", team: "Nexus Technologies", time: "42m ago" },
    { icon: Video, color: "#F59E0B", label: "Meeting Uploaded", team: "Mitsuko Digital", time: "1h ago" },
    { icon: Sparkles, color: "#8B5CF6", label: "AI Summary Generated", team: "Orion Labs", time: "2h ago" },
    { icon: CreditCard, color: "#06B6D4", label: "Plan Upgraded", team: "Gulf Ventures", time: "3h ago" },
  ];

  const summaryStats = [
    { label: "Total Teams", value: localTeams.length, icon: Building2 },
    { label: "Active Teams", value: localTeams.filter(t => t.status === "verified").length, icon: CheckCircle },
    { label: "Pending Verification", value: localTeams.filter(t => t.status === "pending").length, icon: Clock },
    { label: "Suspended", value: localTeams.filter(t => t.status === "suspended").length, icon: Ban },
    { label: "Total Members", value: localTeams.reduce((s, t) => s + t.members, 0), icon: Users },
  ];

  return (
    <div className="h-full overflow-y-auto" style={{ scrollbarWidth: "none" }} onClick={() => setOpenMenuId(null)}>
      {/* ── Create Team Modal ──────────────────────────────────────────── */}
      {showAddTeam && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          onClick={() => {
            setShowAddTeam(false);
            setTeamMemberList([]);
            setTeamMemberInput("");
          }}
        >
          <div className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-[4px]" />
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-[#E5F4F7] overflow-hidden flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#EDF7F9] bg-gradient-to-r from-[#F0FAFE] to-white flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#06B6D4] flex items-center justify-center shadow-sm">
                  <Building2 size={16} className="text-white" />
                </div>
                <div>
                  <h2 className="text-[16px] font-bold text-[#0F172A]">Create New Team</h2>
                  <p className="text-[11.5px] text-[#94A3B8]">Set up a workspace for your organization</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAddTeam(false);
                  setTeamMemberList([]);
                  setTeamMemberInput("");
                }}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-[#94A3B8] hover:bg-[#F5FEFF] hover:text-[#0F172A] transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>
            {/* Body */}
            <div className="overflow-y-auto px-6 py-5 space-y-5 flex-1">
              {/* Team info */}
              <div>
                <p className="text-[11px] font-bold text-[#06B6D4] uppercase tracking-wider mb-3">Team Info</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">
                      Team / Organization Name *
                    </label>
                    <input
                      value={addTeamForm.name}
                      onChange={e => setAddTeamForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. Design Systems Guild"
                      className="w-full px-3 py-2.5 text-[13px] bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/10 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">Department</label>
                    <input
                      value={addTeamForm.department}
                      onChange={e => setAddTeamForm(f => ({ ...f, department: e.target.value }))}
                      placeholder="e.g. Engineering"
                      className="w-full px-3 py-2.5 text-[13px] bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/10 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">Website</label>
                    <input
                      value={addTeamForm.website}
                      onChange={e => setAddTeamForm(f => ({ ...f, website: e.target.value }))}
                      placeholder="https://company.com"
                      className="w-full px-3 py-2.5 text-[13px] bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/10 transition-all"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">Description</label>
                    <textarea
                      value={addTeamForm.description}
                      onChange={e => setAddTeamForm(f => ({ ...f, description: e.target.value }))}
                      rows={2}
                      placeholder="What does this team work on?"
                      className="w-full px-3 py-2.5 text-[13px] bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/10 transition-all resize-none"
                    />
                  </div>
                </div>
              </div>
              {/* Owner */}
              <div>
                <p className="text-[11px] font-bold text-[#4F46E5] uppercase tracking-wider mb-3">Owner / Admin</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">
                      Owner Full Name *
                    </label>
                    <input
                      value={addTeamForm.owner}
                      onChange={e => setAddTeamForm(f => ({ ...f, owner: e.target.value }))}
                      placeholder="e.g. Sarah Chen"
                      className="w-full px-3 py-2.5 text-[13px] bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/10 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">Owner Email</label>
                    <input
                      type="email"
                      value={addTeamForm.ownerEmail}
                      onChange={e => setAddTeamForm(f => ({ ...f, ownerEmail: e.target.value }))}
                      placeholder="owner@company.com"
                      className="w-full px-3 py-2.5 text-[13px] bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/10 transition-all"
                    />
                  </div>
                </div>
              </div>
              {/* Plan */}
              <div>
                <p className="text-[11px] font-bold text-[#8B5CF6] uppercase tracking-wider mb-3">Subscription Plan</p>
                <div className="grid grid-cols-3 gap-3">
                  {(
                    [
                      {
                        p: "Free",
                        price: "$0/mo",
                        features: ["Up to 5 members", "5 meetings/mo", "1 GB storage"],
                        color: "#64748B",
                        accent: "#F1F5F9",
                      },
                      {
                        p: "Pro",
                        price: "$12/mo",
                        features: ["Up to 50 members", "Unlimited meetings", "20 GB storage"],
                        color: "#06B6D4",
                        accent: "#F0FAFE",
                      },
                      {
                        p: "Enterprise",
                        price: "$49/mo",
                        features: ["Unlimited members", "Priority support", "500 GB storage"],
                        color: "#4F46E5",
                        accent: "#EEF2FF",
                      },
                    ] as const
                  ).map(({ p, price, features, color, accent }) => (
                    <button
                      key={p}
                      onClick={() => setAddTeamForm(f => ({ ...f, plan: p }))}
                      className={`p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                        addTeamForm.plan === p ? "shadow-md" : "border-[#E5F4F7] hover:border-[#06B6D4]"
                      }`}
                      style={{
                        background: addTeamForm.plan === p ? accent : "white",
                        borderColor: addTeamForm.plan === p ? color : undefined,
                      }}
                    >
                      <div className="text-[13px] font-bold mb-0.5" style={{ color: addTeamForm.plan === p ? color : "#0F172A" }}>
                        {p}
                      </div>
                      <div className="text-[12px] font-semibold mb-2" style={{ color: addTeamForm.plan === p ? color : "#94A3B8" }}>
                        {price}
                      </div>
                      {features.map(f => (
                        <div key={f} className="flex items-center gap-1.5 text-[10.5px] text-[#64748B] mb-0.5">
                          <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: color }} />
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
                  <input
                    value={teamMemberInput}
                    onChange={e => setTeamMemberInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter" && teamMemberInput.trim()) {
                        const [name, ...rest] = teamMemberInput.split(",");
                        const email = rest[0]?.trim() || "";
                        setTeamMemberList(l => [...l, { name: name.trim(), email, role: "Member" }]);
                        setTeamMemberInput("");
                      }
                    }}
                    placeholder="Name, email  —  or press Enter to add"
                    className="flex-1 px-3 py-2.5 text-[13px] bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/10 transition-all"
                  />
                  <button
                    onClick={() => {
                      if (!teamMemberInput.trim()) return;
                      const [name, ...rest] = teamMemberInput.split(",");
                      const email = rest[0]?.trim() || "";
                      setTeamMemberList(l => [...l, { name: name.trim(), email, role: "Member" }]);
                      setTeamMemberInput("");
                    }}
                    className="px-4 py-2.5 rounded-xl bg-[#10B981] text-white text-[13px] font-semibold hover:bg-[#059669] transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus size={13} /> Add
                  </button>
                </div>
                {teamMemberList.length > 0 && (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {teamMemberList.map((m, i) => (
                      <div key={i} className="flex items-center gap-2.5 px-3 py-2 bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl">
                        <div className="w-6 h-6 rounded-full bg-[#06B6D4] text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0">
                          {m.name
                            .split(" ")
                            .map(w => w[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-semibold text-[#0F172A] truncate">{m.name}</p>
                          {m.email && <p className="text-[10.5px] text-[#94A3B8] truncate">{m.email}</p>}
                        </div>
                        <select
                          value={m.role}
                          onChange={e => setTeamMemberList(l => l.map((x, j) => (j === i ? { ...x, role: e.target.value } : x)))}
                          className="text-[11px] border border-[#E5F4F7] rounded-lg px-2 py-1 text-[#475569] bg-white outline-none cursor-pointer"
                        >
                          {["Member", "Admin", "Viewer"].map(r => (
                            <option key={r}>{r}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => setTeamMemberList(l => l.filter((_, j) => j !== i))}
                          className="w-5 h-5 rounded-lg flex items-center justify-center text-[#94A3B8] hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <X size={11} />
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
              <p className="text-[11.5px] text-[#94A3B8]">
                {teamMemberList.length} member{teamMemberList.length !== 1 ? "s" : ""} will be invited
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowAddTeam(false);
                    setTeamMemberList([]);
                    setTeamMemberInput("");
                  }}
                  className="px-4 py-2 rounded-xl border border-[#E5F4F7] text-[13px] font-semibold text-[#64748B] hover:bg-[#F8FDFE] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!addTeamForm.name.trim() || !addTeamForm.owner.trim()) {
                      toast.error("Team name and owner are required");
                      return;
                    }
                    const newTeam: TeamData = {
                      id: "t" + Date.now(),
                      name: addTeamForm.name,
                      owner: addTeamForm.owner,
                      members: 1 + teamMemberList.length,
                      status: "pending" as StatusV,
                      created: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
                      plan: addTeamForm.plan,
                    };
                    setLocalTeams(t => [newTeam, ...t]);
                    setShowAddTeam(false);
                    setAddTeamForm({ name: "", owner: "", ownerEmail: "", department: "", website: "", description: "", plan: "Free" });
                    setTeamMemberList([]);
                    setTeamMemberInput("");
                    toast.success(`Team "${newTeam.name}" created with ${1 + teamMemberList.length} member(s)`);
                  }}
                  className="px-5 py-2 rounded-xl bg-[#06B6D4] text-white text-[13px] font-semibold hover:bg-[#0891B2] transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Building2 size={13} /> Create Team
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
            <button
              onClick={() => setShowAddTeam(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#06B6D4] text-white text-[13px] font-semibold hover:bg-[#0891B2] transition-colors cursor-pointer shadow-sm"
            >
              <Plus size={14} /> Create Team
            </button>
            <button
              onClick={() => toast.info("Bulk actions: Export, Archive, Delete selected teams")}
              className="w-9 h-9 rounded-xl border border-[#E5F4F7] bg-white flex items-center justify-center text-[#64748B] hover:border-[#06B6D4] hover:text-[#06B6D4] transition-colors cursor-pointer"
            >
              <MoreHorizontal size={15} />
            </button>
          </div>
        </div>

        {/* ── Workspace Tabs ───────────────────────────────────────────────── */}
        <div className="border-b border-[#E5F4F7]">
          <div className="flex items-center gap-0">
            {(
              [
                { id: "all", label: "All Teams" },
                { id: "workspaces", label: "Workspaces" },
                { id: "requests", label: "Requests", badge: pendingCount },
                { id: "archived", label: "Archived" },
              ] as { id: typeof tab; label: string; badge?: number }[]
            ).map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-5 py-3 text-[13px] font-semibold border-b-2 transition-all cursor-pointer ${
                  tab === t.id ? "border-[#06B6D4] text-[#06B6D4]" : "border-transparent text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
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
                <div className="text-[19px] font-bold text-[#0F172A] leading-none tracking-[-0.02em]">{typeof value === "number" ? value.toLocaleString() : value}</div>
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
              placeholder="Search teams or owners\u2026"
              className="w-full pl-10 pr-4 py-2.5 text-[13px] bg-white border border-[#E5F4F7] rounded-xl text-[#0F172A] placeholder-[#B0C4CB] outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/10 transition-all"
            />
          </div>
          <div className="flex items-center bg-[#F5FEFF] border border-[#E5F4F7] rounded-xl p-0.5 gap-0.5">
            {["All", "verified", "pending", "suspended"].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s === "All" ? "All" : s)}
                className={`px-3 py-1.5 rounded-[9px] text-[11.5px] font-semibold transition-all duration-150 cursor-pointer ${
                  statusFilter === s
                    ? "bg-white text-[#0F172A] shadow-sm border border-[#E5F4F7]"
                    : "text-[#9CA3AF] hover:text-[#475569]"
                }`}
              >
                {s === "All" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          <div className="w-px h-7 bg-[#EDF7F9]" />
          <div className="relative">
            <button
              onClick={() => setTeamSortOpen(o => !o)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border bg-white text-[13px] font-medium transition-all cursor-pointer ${
                teamSortOpen ? "border-[#06B6D4] text-[#06B6D4]" : "border-[#E5F4F7] text-[#475569] hover:border-[#06B6D4] hover:text-[#06B6D4]"
              }`}
            >
              <ChevronDown size={13} className={`transition-transform ${teamSortOpen ? "rotate-180" : ""}`} /> Sort
            </button>
            {teamSortOpen && (
              <div
                className="absolute top-full left-0 mt-1 bg-white border border-[#E5F4F7] rounded-xl shadow-xl z-50 py-1 min-w-[180px]"
                onClick={e => e.stopPropagation()}
              >
                {(
                  [
                    ["name", "Name"],
                    ["members", "Members"],
                    ["created", "Date Created"],
                    ["plan", "Plan"],
                  ] as const
                ).map(([k, lbl]) => (
                  <button
                    key={k}
                    onClick={() => {
                      if (teamSortBy === k) setTeamSortDir(d => (d === "asc" ? "desc" : "asc"));
                      else {
                        setTeamSortBy(k);
                        setTeamSortDir("asc");
                      }
                      setTeamSortOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-[12px] hover:bg-[#F8FDFE] cursor-pointer transition-colors ${
                      teamSortBy === k ? "text-[#06B6D4] font-semibold" : "text-[#374151]"
                    }`}
                  >
                    {lbl}
                    {teamSortBy === k && <span className="text-[10px]">{teamSortDir === "asc" ? "\u2191" : "\u2193"}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="w-px h-7 bg-[#EDF7F9]" />
          <div className="flex items-center gap-1 bg-[#F5FEFF] border border-[#E5F4F7] rounded-xl p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={`w-7 h-7 rounded-[9px] flex items-center justify-center transition-all cursor-pointer ${
                viewMode === "grid" ? "bg-white shadow-sm text-[#06B6D4]" : "text-[#9CA3AF] hover:text-[#475569]"
              }`}
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <rect x="0.5" y="0.5" width="5" height="5" rx="1.5" stroke="currentColor" />
                <rect x="7.5" y="0.5" width="5" height="5" rx="1.5" stroke="currentColor" />
                <rect x="0.5" y="7.5" width="5" height="5" rx="1.5" stroke="currentColor" />
                <rect x="7.5" y="7.5" width="5" height="5" rx="1.5" stroke="currentColor" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`w-7 h-7 rounded-[9px] flex items-center justify-center transition-all cursor-pointer ${
                viewMode === "list" ? "bg-white shadow-sm text-[#06B6D4]" : "text-[#9CA3AF] hover:text-[#475569]"
              }`}
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <rect x="0.5" y="1" width="12" height="2" rx="1" fill="currentColor" />
                <rect x="0.5" y="5.5" width="12" height="2" rx="1" fill="currentColor" />
                <rect x="0.5" y="10" width="12" height="2" rx="1" fill="currentColor" />
              </svg>
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
                  const isActive = activeTeam?.id === team.id;
                  const color = logoColor(team.id);
                  const menuOpen = openMenuId === team.id;
                  const storagePct = Math.min(100, (team.members / 200) * 100);
                  return (
                    <div
                      key={team.id}
                      onClick={e => {
                        e.stopPropagation();
                        setActiveTeam(team);
                      }}
                      className={`relative bg-white border rounded-2xl p-5 cursor-pointer transition-all duration-200 group ${
                        isActive
                          ? "border-[#06B6D4]/50 shadow-[0_0_0_3px_rgba(6,182,212,0.08)] shadow-md"
                          : "border-[#E5F4F7] hover:border-[#06B6D4]/30 hover:shadow-md hover:-translate-y-0.5"
                      }`}
                    >
                      {/* Card header */}
                      <div className="flex items-start justify-between mb-4">
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-[15px] font-bold flex-shrink-0"
                          style={{ backgroundColor: color }}
                        >
                          {logoInitials(team.name)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={team.status}>{team.status}</Badge>
                          <div className="relative" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                setOpenMenuId(menuOpen ? null : team.id);
                              }}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-[#94A3B8] hover:text-[#475569] hover:bg-[#F5FEFF] opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                            >
                              <MoreHorizontal size={14} />
                            </button>
                            {menuOpen && (
                              <div className="absolute right-0 top-8 z-20 bg-white border border-[#E5F4F7] rounded-xl shadow-lg py-1 w-44">
                                <button
                                  onClick={() => {
                                    setActiveTeam(team);
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[12.5px] text-[#475569] hover:bg-[#F5FEFF] cursor-pointer transition-colors"
                                >
                                  <Eye size={13} /> View Details
                                </button>
                                {team.status === "pending" && (
                                  <button
                                    onClick={() => {
                                      verifyTeam(team.id);
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[12.5px] text-emerald-600 hover:bg-emerald-50 cursor-pointer transition-colors"
                                  >
                                    <CheckCircle size={13} /> Verify Team
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setUpgradeTeam(team);
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[12.5px] text-[#4F46E5] hover:bg-indigo-50 cursor-pointer transition-colors"
                                >
                                  <CreditCard size={13} /> Upgrade Plan
                                </button>
                                <button
                                  onClick={() => {
                                    suspendTeam(team.id);
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[12.5px] text-amber-600 hover:bg-amber-50 cursor-pointer transition-colors"
                                >
                                  <Ban size={13} /> Suspend
                                </button>
                                <div className="mx-3 my-1 h-px bg-[#EDF7F9]" />
                                <button
                                  onClick={() => {
                                    deleteTeam(team.id);
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[12.5px] text-red-500 hover:bg-red-50 cursor-pointer transition-colors"
                                >
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
                            {team.owner
                              .split(" ")
                              .map(n => n[0])
                              .join("")
                              .slice(0, 2)}
                          </div>
                          <span className="text-[11.5px] text-[#64748B]">{team.owner}</span>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="h-px bg-[#F0F9FB] mb-4" />

                      {/* Stats row */}
                      <div className="grid grid-cols-3 gap-0 text-center">
                        <div>
                          <div className="text-[15px] font-semibold text-[#0F172A] leading-none">{team.members}</div>
                          <div className="text-[10px] font-mono text-[#94A3B8] mt-0.5">Members</div>
                        </div>
                        <div className="border-x border-[#F0F9FB]">
                          <div className="text-[15px] font-semibold text-[#0F172A] leading-none">{Math.round(team.members * 3.4)}</div>
                          <div className="text-[10px] font-mono text-[#94A3B8] mt-0.5">Meetings</div>
                        </div>
                        <div>
                          <div className="text-[15px] font-semibold text-[#0F172A] leading-none">{(team.members * 0.18).toFixed(1)}</div>
                          <div className="text-[10px] font-mono text-[#94A3B8] mt-0.5">GB Used</div>
                        </div>
                      </div>

                      {/* Storage bar */}
                      <div className="mt-4">
                        <div className="h-[3px] bg-[#EDF7F9] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${storagePct}%`, backgroundColor: color + "cc" }}
                          />
                        </div>
                      </div>

                      {/* Plan badge */}
                      <div className="mt-3 flex items-center justify-between">
                        <span className={`text-[10.5px] font-mono font-semibold px-2 py-0.5 rounded-lg ${planCls(team.plan)}`}>
                          {team.plan}
                        </span>
                        <span className="text-[10.5px] font-mono text-[#94A3B8]">{team.created}</span>
                      </div>
                    </div>
                  );
                })}

                {/* Create new team card */}
                <div
                  onClick={() => setShowAddTeam(true)}
                  className="bg-white border-2 border-dashed border-[#E5F4F7] rounded-2xl p-5 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-[#06B6D4]/40 hover:bg-[#F5FEFF] transition-all group min-h-[200px]"
                >
                  <div className="w-10 h-10 rounded-2xl bg-[#F5FEFF] border border-[#E5F4F7] flex items-center justify-center group-hover:border-[#06B6D4]/30 transition-colors">
                    <Plus size={18} className="text-[#94A3B8] group-hover:text-[#06B6D4] transition-colors" />
                  </div>
                  <div className="text-center">
                    <div className="text-[13px] font-semibold text-[#94A3B8] group-hover:text-[#0F172A] transition-colors">
                      Create New Team
                    </div>
                    <div className="text-[11px] font-mono text-[#B0C4CB] mt-0.5">Set up a new workspace</div>
                  </div>
                </div>
              </div>
            ) : (
              /* List view */
              <div className="bg-white border border-[#E5F4F7] rounded-2xl overflow-hidden">
                {teamsSorted.map((team, idx) => {
                  const isActive = activeTeam?.id === team.id;
                  const color = logoColor(team.id);
                  const menuOpen = openMenuId === team.id;
                  return (
                    <div
                      key={team.id}
                      onClick={e => {
                        e.stopPropagation();
                        setActiveTeam(team);
                      }}
                      className={`flex items-center gap-4 px-6 py-4 cursor-pointer transition-colors group ${
                        idx < filtered.length - 1 ? "border-b border-[#F0F9FB]" : ""
                      } ${isActive ? "bg-[#EFF9FC]" : "hover:bg-[#FAFCFD]"}`}
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-[13px] font-bold flex-shrink-0"
                        style={{ backgroundColor: color }}
                      >
                        {logoInitials(team.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13.5px] font-semibold text-[#0F172A]">{team.name}</div>
                        <div className="text-[11.5px] text-[#64748B] mt-0.5">
                          {team.owner} · {team.members} members
                        </div>
                      </div>
                      <Badge variant={team.status}>{team.status}</Badge>
                      <span className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-lg ${planCls(team.plan)}`}>{team.plan}</span>
                      <span className="text-[11.5px] font-mono text-[#94A3B8] w-28 text-right">{team.created}</span>
                      <div className="relative" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setOpenMenuId(menuOpen ? null : team.id);
                          }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-[#94A3B8] hover:text-[#475569] hover:bg-[#EDF7F9] opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                        >
                          <MoreHorizontal size={14} />
                        </button>
                        {menuOpen && (
                          <div className="absolute right-0 top-8 z-20 bg-white border border-[#E5F4F7] rounded-xl shadow-lg py-1 w-44">
                            <button
                              onClick={() => {
                                setActiveTeam(team);
                                setOpenMenuId(null);
                              }}
                              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[12.5px] text-[#475569] hover:bg-[#F5FEFF] cursor-pointer"
                            >
                              <Eye size={13} /> View Details
                            </button>
                            {team.status === "pending" && (
                              <button
                                onClick={() => {
                                  verifyTeam(team.id);
                                  setOpenMenuId(null);
                                }}
                                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[12.5px] text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                              >
                                <CheckCircle size={13} /> Verify Team
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setUpgradeTeam(team);
                                setOpenMenuId(null);
                              }}
                              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[12.5px] text-[#4F46E5] hover:bg-indigo-50 cursor-pointer"
                            >
                              <CreditCard size={13} /> Upgrade Plan
                            </button>
                            <button
                              onClick={() => {
                                suspendTeam(team.id);
                                setOpenMenuId(null);
                              }}
                              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[12.5px] text-amber-600 hover:bg-amber-50 cursor-pointer"
                            >
                              <Ban size={13} /> Suspend
                            </button>
                            <div className="mx-3 my-1 h-px bg-[#EDF7F9]" />
                            <button
                              onClick={() => {
                                deleteTeam(team.id);
                                setOpenMenuId(null);
                              }}
                              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[12.5px] text-red-500 hover:bg-red-50 cursor-pointer"
                            >
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
        {activeTeam &&
          (() => {
            const color = logoColor(activeTeam.id);
            const storagePct = Math.min(100, (activeTeam.members / 200) * 100);
            const recentActivity = [
              { icon: Users, label: "Member joined the team", time: "12m ago" },
              { icon: Video, label: "Meeting recording uploaded", time: "1h ago" },
              { icon: Sparkles, label: "AI summary generated", time: "2h ago" },
              { icon: Shield, label: "Plan verified", time: "1d ago" },
            ];
            const fields = [
              { label: "Owner", value: activeTeam.owner, icon: User },
              { label: "Plan", value: activeTeam.plan, icon: CreditCard },
              { label: "Created", value: activeTeam.created, icon: Clock },
              { label: "Members", value: activeTeam.members.toLocaleString(), icon: Users },
              { label: "Meetings", value: Math.round(activeTeam.members * 3.4).toLocaleString(), icon: Video },
              { label: "Storage", value: (activeTeam.members * 0.18).toFixed(1) + " GB", icon: HardDrive },
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
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-[15px] font-bold shadow-sm"
                        style={{ backgroundColor: color }}
                      >
                        {logoInitials(activeTeam.name)}
                      </div>
                      <div>
                        <div className="text-[15px] font-semibold text-[#111827] leading-tight">{activeTeam.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={activeTeam.status}>{activeTeam.status}</Badge>
                          <span className={`text-[10.5px] font-mono font-semibold px-2 py-0.5 rounded-lg ${planCls(activeTeam.plan)}`}>
                            {activeTeam.plan}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTeam(null)}
                      className="w-8 h-8 rounded-xl border border-[#E5F4F7] flex items-center justify-center text-[#94A3B8] hover:text-[#374151] hover:border-[#C8E8F2] hover:bg-[#F5FEFF] transition-all cursor-pointer"
                    >
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
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${storagePct}%`, backgroundColor: color }} />
                    </div>
                  </div>

                  {/* Members + Recent Activity */}
                  <div className="px-6 py-4 grid grid-cols-2 gap-6 border-b border-[#EDF7F9]">
                    {/* Member avatars */}
                    <div>
                      <div className="text-[10.5px] font-semibold text-[#94A3B8] uppercase tracking-wide mb-2">Members</div>
                      <div className="flex items-center">
                        {Array.from({ length: Math.min(5, activeTeam.members) }, (_, i) => {
                          const initials = ["SC", "MW", "PP", "AT", "FA"][i];
                          const bg = ["#06B6D4", "#4F46E5", "#10B981", "#F59E0B", "#8B5CF6"][i];
                          return (
                            <div
                              key={i}
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold border-2 border-white -ml-2 first:ml-0 shadow-sm"
                              style={{ backgroundColor: bg }}
                            >
                              {initials}
                            </div>
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
                    <button
                      onClick={() => {
                        setShowWorkspace(activeTeam);
                        setActiveTeam(null);
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#06B6D4] text-white text-[12.5px] font-semibold hover:bg-[#0891B2] transition-colors cursor-pointer"
                    >
                      <Globe size={13} /> Open Workspace
                    </button>
                    <button
                      onClick={() => {
                        setShowManageMembers(activeTeam);
                        setActiveTeam(null);
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E5F4F7] bg-white text-[12.5px] font-semibold text-[#475569] hover:border-[#06B6D4] hover:text-[#06B6D4] transition-colors cursor-pointer"
                    >
                      <Users size={13} /> Manage Members
                    </button>
                    <button
                      onClick={() => {
                        setUpgradeTeam(activeTeam);
                        setActiveTeam(null);
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-indigo-100 bg-indigo-50 text-[12.5px] font-semibold text-[#4F46E5] hover:bg-indigo-100 transition-colors cursor-pointer"
                    >
                      <CreditCard size={13} /> Upgrade Plan
                    </button>
                    <button
                      onClick={() => {
                        suspendTeam(activeTeam.id);
                        setActiveTeam(null);
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-100 text-[12.5px] font-semibold text-amber-700 hover:bg-amber-100 transition-colors cursor-pointer"
                    >
                      <Ban size={13} /> Suspend
                    </button>
                    <button
                      onClick={() => {
                        deleteTeam(activeTeam.id);
                        setActiveTeam(null);
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-50 border border-red-100 text-[12.5px] font-semibold text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
                    >
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
            <button
              onClick={() => toast.info("Full activity report coming soon")}
              className="text-[12px] font-semibold text-[#06B6D4] hover:text-[#0891B2] cursor-pointer transition-colors"
            >
              View all
            </button>
          </div>
          <div className="relative">
            <div className="absolute top-4 left-0 right-0 h-px bg-[#EDF7F9]" />
            <div className="grid grid-cols-6 gap-4 relative">
              {activityEvents.map((ev, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2.5 group cursor-default">
                  <div
                    className="w-8 h-8 rounded-full border-2 border-white ring-1 ring-[#E5F4F7] flex items-center justify-center z-10 group-hover:ring-[#06B6D4]/40 transition-all shadow-sm"
                    style={{ backgroundColor: ev.color + "15" }}
                  >
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
                <p className="text-[13px] text-white/70 mt-0.5">
                  Choose the right plan for <span className="font-semibold text-white">{upgradeTeam.name}</span>
                </p>
              </div>
              <button
                onClick={() => setUpgradeTeam(null)}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white cursor-pointer transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            {/* 3 vertical cards */}
            <div className="grid grid-cols-3 gap-4">
              {(
                [
                  {
                    plan: "Free",
                    price: "$0",
                    period: "/mo",
                    tagline: "Get started",
                    color: "#64748B",
                    gradFrom: "#F8FAFC",
                    gradTo: "#F1F5F9",
                    border: "#CBD5E1",
                    textCol: "#334155",
                    features: ["Up to 5 members", "5 meetings / month", "1 GB cloud storage", "Basic analytics", "Email support"],
                  },
                  {
                    plan: "Pro",
                    price: "$12",
                    period: "/mo",
                    tagline: "Most popular",
                    color: "#06B6D4",
                    gradFrom: "#F0FAFE",
                    gradTo: "#E0F7FE",
                    border: "#06B6D4",
                    textCol: "#0E7490",
                    features: [
                      "Up to 50 members",
                      "Unlimited meetings",
                      "20 GB cloud storage",
                      "Advanced analytics",
                      "Priority support",
                      "AI meeting summaries",
                    ],
                  },
                  {
                    plan: "Enterprise",
                    price: "$49",
                    period: "/mo",
                    tagline: "For large teams",
                    color: "#4F46E5",
                    gradFrom: "#EEF2FF",
                    gradTo: "#E0E7FF",
                    border: "#4F46E5",
                    textCol: "#3730A3",
                    features: [
                      "Unlimited members",
                      "Unlimited meetings",
                      "500 GB cloud storage",
                      "Custom analytics",
                      "Dedicated support",
                      "AI features + API access",
                      "SSO & SAML",
                    ],
                  },
                ] as const
              ).map(({ plan, price, period, tagline, color, gradFrom, gradTo, textCol, features }) => {
                const active = upgradeTeam.plan === plan;
                return (
                  <button
                    key={plan}
                    onClick={() => applyPlan(upgradeTeam.id, plan)}
                    style={{
                      background: `linear-gradient(160deg, ${gradFrom}, ${gradTo})`,
                      borderColor: active ? color : "#E5F4F7",
                      boxShadow: active ? `0 0 0 2px ${color}40, 0 8px 32px ${color}30` : "0 2px 12px rgba(0,0,0,0.06)",
                    }}
                    className={`relative flex flex-col p-5 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer ${
                      active ? "scale-[1.02]" : "hover:scale-[1.01]"
                    }`}
                  >
                    {active && (
                      <div
                        style={{ background: color }}
                        className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-white text-[10px] font-bold whitespace-nowrap shadow-md"
                      >
                        Current Plan
                      </div>
                    )}
                    {plan === "Pro" && !active && (
                      <div
                        style={{ background: "#06B6D4" }}
                        className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-white text-[10px] font-bold whitespace-nowrap shadow-md"
                      >
                        Most Popular
                      </div>
                    )}
                    <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color }}>
                      {tagline}
                    </p>
                    <p className="text-[18px] font-extrabold tracking-tight mb-0.5" style={{ color: textCol }}>
                      {plan}
                    </p>
                    <div className="flex items-end gap-0.5 mb-4">
                      <span className="text-[28px] font-black leading-none" style={{ color }}>
                        {price}
                      </span>
                      <span className="text-[12px] font-semibold pb-1" style={{ color: textCol + "99" }}>
                        {period}
                      </span>
                    </div>
                    <div className="flex-1 space-y-2 mb-4">
                      {features.map(f => (
                        <div key={f} className="flex items-start gap-2 text-[11.5px]" style={{ color: textCol }}>
                          <CheckCircle size={12} className="mt-0.5 flex-shrink-0" style={{ color }} />
                          {f}
                        </div>
                      ))}
                    </div>
                    <div
                      style={{
                        background: active ? color : "white",
                        color: active ? "white" : color,
                        border: `1.5px solid ${color}`,
                      }}
                      className="w-full py-2.5 rounded-xl text-[12.5px] font-bold text-center transition-all"
                    >
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
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" onClick={() => setShowWorkspace(null)}>
          <div className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-[4px]" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-[#E5F4F7] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="h-24 bg-gradient-to-r from-[#06B6D4] to-[#4F46E5] flex items-end px-6 pb-4 relative">
              <div className="w-12 h-12 rounded-2xl bg-white shadow-lg flex items-center justify-center text-[18px] font-black text-[#06B6D4]">
                {showWorkspace.name
                  .split(" ")
                  .map(w => w[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <button
                onClick={() => setShowWorkspace(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-white cursor-pointer transition-colors"
              >
                <X size={14} />
              </button>
            </div>
            <div className="px-6 py-5">
              <h2 className="text-[17px] font-bold text-[#0F172A]">{showWorkspace.name}</h2>
              <p className="text-[12.5px] text-[#94A3B8] mb-4">
                Owner: {showWorkspace.owner} · {showWorkspace.plan} Plan
              </p>
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { label: "Members", value: showWorkspace.members },
                  { label: "Meetings", value: Math.floor(Math.random() * 200 + 20) },
                  { label: "Storage", value: "12 GB" },
                ].map(s => (
                  <div key={s.label} className="bg-[#F8FDFE] border border-[#EDF7F9] rounded-xl p-3 text-center">
                    <p className="text-[18px] font-bold text-[#0F172A]">{s.value}</p>
                    <p className="text-[11px] text-[#94A3B8] font-medium">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2 mb-5">
                <div className="flex items-center justify-between py-2 border-b border-[#F1F9FB]">
                  <span className="text-[12.5px] text-[#64748B]">Status</span>
                  <span
                    className={`text-[12px] font-semibold px-2.5 py-0.5 rounded-full ${
                      showWorkspace.status === "verified"
                        ? "bg-emerald-50 text-emerald-700"
                        : showWorkspace.status === "pending"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-red-50 text-red-600"
                    }`}
                  >
                    {showWorkspace.status}
                  </span>
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
                <button
                  onClick={() => {
                    toast.success("Launched workspace for " + showWorkspace.name);
                    setShowWorkspace(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-[#06B6D4] text-white text-[13px] font-semibold hover:bg-[#0891B2] transition-colors cursor-pointer"
                >
                  Launch Workspace
                </button>
                <button
                  onClick={() => {
                    setShowManageMembers(showWorkspace);
                    setShowWorkspace(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-[#E5F4F7] text-[13px] font-semibold text-[#475569] hover:border-[#06B6D4] hover:text-[#06B6D4] transition-colors cursor-pointer"
                >
                  Manage Members
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Manage Members Panel ──────────────────────────────────────────── */}
      {showManageMembers && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" onClick={() => setShowManageMembers(null)}>
          <div className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-[4px]" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-[#E5F4F7] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#EDF7F9] bg-gradient-to-r from-[#F0FAFE] to-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#4F46E5] flex items-center justify-center">
                  <Users size={15} className="text-white" />
                </div>
                <div>
                  <h2 className="text-[15px] font-bold text-[#0F172A]">Manage Members</h2>
                  <p className="text-[11.5px] text-[#94A3B8]">
                    {showManageMembers.name} · {showManageMembers.members} members
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowManageMembers(null)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-[#94A3B8] hover:bg-[#F5FEFF] hover:text-[#0F172A] transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>
            <div className="px-6 py-5">
              <div className="flex gap-2 mb-4">
                <input
                  placeholder="Invite by name or email\u2026"
                  className="flex-1 px-3 py-2.5 text-[13px] bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/10 transition-all"
                />
                <button
                  onClick={() => toast.success("Invitation sent")}
                  className="px-4 py-2.5 rounded-xl bg-[#4F46E5] text-white text-[13px] font-semibold hover:bg-[#4338CA] transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Plus size={13} /> Invite
                </button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {Array.from({ length: Math.min(showManageMembers.members, 6) }, (_, i) => {
                  const names = ["Sarah Chen", "Marcus Williams", "Priya Patel", "Tom Eriksson", "Aiko Tanaka", "Diego Reyes"];
                  const roles = ["Admin", "Member", "Member", "Viewer", "Member", "Admin"];
                  return (
                    <div key={i} className="flex items-center gap-3 px-3 py-2.5 bg-[#F8FDFE] border border-[#EDF7F9] rounded-xl">
                      <div className="w-8 h-8 rounded-full bg-[#4F46E5] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                        {names[i]
                          .split(" ")
                          .map(w => w[0])
                          .join("")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12.5px] font-semibold text-[#0F172A] truncate">{names[i]}</p>
                        <p className="text-[11px] text-[#94A3B8]">
                          {names[i].toLowerCase().replace(" ", ".")}@company.com
                        </p>
                      </div>
                      <select
                        defaultValue={roles[i]}
                        className="text-[11px] border border-[#E5F4F7] rounded-lg px-2 py-1 text-[#475569] bg-white outline-none cursor-pointer"
                      >
                        {["Admin", "Member", "Viewer"].map(r => (
                          <option key={r}>{r}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => toast.error("Member removed")}
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-[#94A3B8] hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <X size={11} />
                      </button>
                    </div>
                  );
                })}
                {showManageMembers.members > 6 && (
                  <p className="text-center text-[11.5px] text-[#94A3B8] py-2">+{showManageMembers.members - 6} more members</p>
                )}
              </div>
            </div>
            <div className="flex justify-end px-6 py-4 border-t border-[#EDF7F9] bg-[#FAFEFF]">
              <button
                onClick={() => {
                  toast.success("Member changes saved");
                  setShowManageMembers(null);
                }}
                className="px-5 py-2 rounded-xl bg-[#4F46E5] text-white text-[13px] font-semibold hover:bg-[#4338CA] transition-colors cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
