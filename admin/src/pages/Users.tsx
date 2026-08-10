import { useState, useMemo } from "react";
import {
  Users,
  User,
  Video,
  Building2,
  Sparkles,
  Send,
  CreditCard,
  Upload,
  Shield,
  Clock,
  HardDrive,
  Plus,
  X,
  Search,
  Filter,
  ChevronDown,
  MoreHorizontal,
  Eye,
  Ban,
  CheckCircle,
  Key,
  Trash2,
  Download,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import type { StatusV, UserData } from "@/types";

// ── Mock Data ──────────────────────────────────────────────────────────────

const mockUsers: UserData[] = [
  { id: "u1", name: "Sarah Chen", email: "sarah.chen@acme.com", role: "Admin", plan: "Enterprise", status: "active" as StatusV, storage: "4.2 GB", meetings: 284, joined: "Jan 12, 2024", avatar: "SC" },
  { id: "u2", name: "Marcus Williams", email: "m.williams@orion.io", role: "Member", plan: "Pro", status: "active" as StatusV, storage: "1.8 GB", meetings: 127, joined: "Mar 5, 2024", avatar: "MW" },
  { id: "u3", name: "Priya Patel", email: "priya@nexus.tech", role: "Owner", plan: "Enterprise", status: "active" as StatusV, storage: "12.4 GB", meetings: 512, joined: "Nov 8, 2023", avatar: "PP" },
  { id: "u4", name: "James O'Brien", email: "james@startco.io", role: "Member", plan: "Free", status: "suspended" as StatusV, storage: "0.3 GB", meetings: 18, joined: "Jun 22, 2024", avatar: "JO" },
  { id: "u5", name: "Aiko Tanaka", email: "aiko.tanaka@mitsuko.jp", role: "Admin", plan: "Pro", status: "active" as StatusV, storage: "3.1 GB", meetings: 203, joined: "Feb 14, 2024", avatar: "AT" },
  { id: "u6", name: "Diego Reyes", email: "d.reyes@latam.co", role: "Member", plan: "Pro", status: "inactive" as StatusV, storage: "0.8 GB", meetings: 44, joined: "May 1, 2024", avatar: "DR" },
  { id: "u7", name: "Fatima Al-Hassan", email: "f.alhassan@gulf.ae", role: "Owner", plan: "Enterprise", status: "active" as StatusV, storage: "8.7 GB", meetings: 378, joined: "Dec 3, 2023", avatar: "FA" },
  { id: "u8", name: "Tom Eriksson", email: "tom.e@nordic.se", role: "Member", plan: "Free", status: "active" as StatusV, storage: "0.1 GB", meetings: 7, joined: "Jul 30, 2024", avatar: "TE" },
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

function Av({ initials, size = "sm" }: { initials: string; size?: "sm" | "md" | "lg" }) {
  const sz = size === "sm" ? "w-7 h-7 text-[11px]" : size === "md" ? "w-9 h-9 text-sm" : "w-11 h-11 text-base";
  return (
    <div className={`${sz} rounded-full bg-cyan-100 text-cyan-700 font-semibold flex items-center justify-center flex-shrink-0 select-none`}>
      {initials}
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────

const PER_PAGE = 8;

export { UserManagement };
export default function UserManagement() {
  // ── State ──────────────────────────────────────────────────────────────
  const [search, setSearch]               = useState("");
  const [planFilter, setPlanFilter]       = useState("All");
  const [statusFilter, setStatusFilter]   = useState("All");
  const [roleFilter, setRoleFilter]       = useState("All");
  const [showFilters, setShowFilters]     = useState(false);
  const [selected, setSelected]           = useState<Set<string>>(new Set());
  const [page, setPage]                   = useState(1);
  const [activeUser, setActiveUser]       = useState<UserData | null>(null);
  const [upgradeUser, setUpgradeUser]     = useState<UserData | null>(null);
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
  const patchUsers = (ids: Set<string>, patch: Partial<UserData>) =>
    setLocalUsers(prev => prev.map(u => ids.has(u.id) ? { ...u, ...patch } : u));

  const toggleSuspend = (u: UserData) => {
    const next = u.status === "suspended" ? "active" : "suspended";
    patchUsers(new Set([u.id]), { status: next as StatusV });
    if (activeUser?.id === u.id) setActiveUser(prev => prev ? { ...prev, status: next as StatusV } : null);
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

  const pageNums: (number | "\u2026")[] = useMemo(() => {
    const all = Array.from({ length: totalPages }, (_, i) => i + 1);
    return all.filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
      .reduce<(number | "\u2026")[]>((acc, p, idx, arr) => {
        if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("\u2026");
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
                const newUser: UserData={id:"u"+Date.now(),name:addUserForm.name,email:addUserForm.email,role:addUserForm.role,plan:addUserForm.plan,status:addUserForm.status as StatusV,storage:"0 GB",meetings:0,joined:new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}),phone:addUserForm.phone,avatar:addUserForm.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()};
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
              placeholder="Search by name or email\u2026"
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
                    {lbl}{sortBy===k&&<span className="text-[10px]">{sortDir==="asc"?"\u2191":"\u2193"}</span>}
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
            <button onClick={() => toast.success("Exporting users as CSV\u2026")} className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-[#E5F4F7] bg-white text-[13px] font-medium text-[#475569] hover:border-[#06B6D4] hover:text-[#06B6D4] transition-all cursor-pointer">
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

        {/* ── Main content: table ──────────────────────────────────────────── */}
        <div className="flex gap-5 items-start">

          {/* Table */}
          <div className="flex-1 min-w-0 space-y-0">
            <div className="bg-white border border-[#E5F4F7] rounded-2xl overflow-hidden">
              <div className="overflow-x-auto [&::-webkit-scrollbar]:h-[5px] [&::-webkit-scrollbar-track]:bg-[#F0FAFE] [&::-webkit-scrollbar-thumb]:bg-[#06B6D4]/40 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-[#06B6D4] [&::-webkit-scrollbar-thumb:active]:bg-[#0891B2]">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-[#EDF7F9] bg-[#F9FCFD]">
                      <th className="w-10 px-4 py-3.5">
                        <input
                          type="checkbox"
                          checked={allOnPage}
                          onChange={toggleAll}
                          className="w-3.5 h-3.5 rounded border-[#CBD5E1] text-[#06B6D4] focus:ring-[#06B6D4]/20 cursor-pointer accent-[#06B6D4]"
                        />
                      </th>
                      {(["User", "Email", "Role", "Plan", "Meetings", "Storage", "Status", "Last Active", ""] as const).map((h, i) => (
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
                          <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleOne(u.id)}
                              className="w-3.5 h-3.5 rounded border-[#CBD5E1] text-[#06B6D4] focus:ring-[#06B6D4]/20 cursor-pointer accent-[#06B6D4]"
                            />
                          </td>
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
                    : `${(safePage - 1) * PER_PAGE + 1}\u2013${Math.min(safePage * PER_PAGE, sorted.length)} of ${sorted.length} users`}
                </span>
                <div className="flex items-center gap-1">
                  <button disabled={safePage === 1} onClick={() => setPage(p => p - 1)}
                    className="px-2.5 py-1.5 rounded-lg text-[11.5px] font-mono text-[#475569] hover:bg-[#EDF7F9] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors">
                    \u2190 Prev
                  </button>
                  {pageNums.map((p, i) =>
                    p === "\u2026"
                      ? <span key={`el-${i}`} className="w-7 text-center text-[#94A3B8] text-[11.5px] select-none">\u2026</span>
                      : <button key={p} onClick={() => setPage(p as number)}
                          className={`w-7 h-7 rounded-lg text-[11.5px] font-mono transition-all cursor-pointer ${
                            safePage === p ? "bg-[#06B6D4] text-white" : "text-[#475569] hover:bg-[#EDF7F9]"
                          }`}>
                          {p}
                        </button>
                  )}
                  <button disabled={safePage === totalPages} onClick={() => setPage(p => p + 1)}
                    className="px-2.5 py-1.5 rounded-lg text-[11.5px] font-mono text-[#475569] hover:bg-[#EDF7F9] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors">
                    Next \u2192
                  </button>
                </div>
              </div>
            </div>
          </div>
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
                    <span className="text-[12px] font-semibold text-[#374151]">{activeUser.storage} / 20 GB \u00B7 {storagePct.toFixed(0)}%</span>
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
              <h3 className="text-[16px] font-semibold text-[#0F172A] tracking-[-0.015em]">Change Plan</h3>
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
