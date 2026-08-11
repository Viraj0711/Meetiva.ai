import { useState, useEffect } from "react";
import {
  Building2,
  Users,
  Users2,
  Video,
  HardDrive,
  Pencil,
  Save,
  X,
  Upload,
  Plus,
  CreditCard,
  ScrollText,
  Globe,
  Mail,
  Clock,
  Send,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { authApi, teamsApi, workspaceApi } from "@/lib/api";
import type { MeUser, Team, WorkspaceOverview } from "@/lib/api";

const DEPT_COLORS = ["#06B6D4", "#8B5CF6", "#10B981", "#F59E0B", "#F43F5E", "#4F46E5"];

export function Organization() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<MeUser | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [workspace, setWorkspace] = useState<WorkspaceOverview | null>(null);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [showAddDept, setShowAddDept] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptLead, setNewDeptLead] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [me, teamsRes, ws] = await Promise.all([
          authApi.me(),
          teamsApi.list(),
          workspaceApi.overview(),
        ]);
        setUser(me);
        setTeams(teamsRes.teams ?? []);
        setWorkspace(ws.data);
        setEditName(me.name);
        setEditEmail(me.email);
      } catch {
        toast.error("Failed to load organization data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = () => {
    if (user) {
      setUser({ ...user, name: editName, email: editEmail });
    }
    setEditing(false);
    toast.success("Organization profile updated");
  };

  const handleCancel = () => {
    if (user) {
      setEditName(user.name);
      setEditEmail(user.email);
    }
    setEditing(false);
  };

  const addDepartment = () => {
    if (!newDeptName) return;
    const dept: Team = {
      id: `local-${Date.now()}`,
      name: newDeptName,
      description: null,
      inviteCode: "",
      role: "lead",
      status: "active",
      joinedAt: new Date().toISOString(),
    };
    setTeams((prev) => [...prev, dept]);
    setNewDeptName("");
    setNewDeptLead("");
    setShowAddDept(false);
    toast.success("Department added");
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#06B6D4]" />
          <p className="text-sm text-[#94A3B8]">Loading organization data...</p>
        </div>
      </div>
    );
  }

  const totalUsers = workspace?.teamSize ?? 0;
  const activeTeams = teams.length;
  const meetingsCount = workspace?.ongoingProjects?.length ?? 0;
  const orgName = user?.name ?? "Organization";
  const initials = orgName.charAt(0).toUpperCase();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Organization</h1>
          <p className="text-sm text-[#94A3B8]">Manage your organization profile, structure, and settings</p>
        </div>
        <button
          onClick={() => (editing ? handleCancel() : setEditing(true))}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#06B6D4] to-[#0891B2] text-white rounded-xl text-sm font-semibold shadow-sm shadow-[#06B6D4]/25 hover:shadow-md hover:shadow-[#06B6D4]/30 transition-all"
        >
          {editing ? <X className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
          {editing ? "Cancel" : "Edit Profile"}
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: totalUsers.toLocaleString(), icon: <Users className="w-5 h-5" />, color: "from-[#06B6D4] to-[#0891B2]" },
          { label: "Active Teams", value: activeTeams.toLocaleString(), icon: <Users2 className="w-5 h-5" />, color: "from-[#4F46E5] to-[#6366F1]" },
          { label: "Ongoing Projects", value: meetingsCount.toLocaleString(), icon: <Video className="w-5 h-5" />, color: "from-[#10B981] to-[#059669]" },
          { label: "Velocity Score", value: (workspace?.cumulativeVelocity ?? 0).toLocaleString(), icon: <HardDrive className="w-5 h-5" />, color: "from-[#F59E0B] to-[#D97706]" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-[#E5F4F7] p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white`}>
              {s.icon}
            </div>
            <div>
              <p className="text-sm text-[#94A3B8]">{s.label}</p>
              <p className="text-2xl font-bold text-[#0F172A]">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-[#E5F4F7] overflow-hidden">
            <div className="h-28 bg-gradient-to-r from-[#06B6D4] via-[#0891B2] to-[#4F46E5]" />
            <div className="px-6 pb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#06B6D4] to-[#4F46E5] flex items-center justify-center text-white text-2xl font-bold border-4 border-white -mt-8 shadow-lg">
                {initials}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-5">
                {[
                  { label: "ORGANIZATION NAME", key: "name" as const },
                  { label: "CONTACT EMAIL", key: "email" as const },
                  { label: "MEMBER SINCE", key: "createdAt" as const },
                  { label: "LAST UPDATED", key: "updatedAt" as const },
                ].map((f) => (
                  <div key={f.key}>
                    <p className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">{f.label}</p>
                    {editing && (f.key === "name" || f.key === "email") ? (
                      f.key === "name" ? (
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-3 py-2 bg-[#F8FDFE] border border-[#E5F4F7] rounded-lg text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4] transition-all"
                        />
                      ) : (
                        <input
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="w-full px-3 py-2 bg-[#F8FDFE] border border-[#E5F4F7] rounded-lg text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4] transition-all"
                        />
                      )
                    ) : (
                      <p className="text-sm font-medium text-[#0F172A]">
                        {f.key === "createdAt" || f.key === "updatedAt"
                          ? user?.[f.key] ? new Date(user[f.key]).toLocaleDateString() : "N/A"
                          : user?.[f.key as keyof MeUser] ?? "N/A"}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {editing && (
                <div className="mt-5 flex justify-end">
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#06B6D4] to-[#0891B2] text-white rounded-xl text-sm font-semibold shadow-sm shadow-[#06B6D4]/25 hover:shadow-md transition-all"
                  >
                    <Save className="w-4 h-4" /> Save Changes
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[#E5F4F7] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#0F172A]">Departments</h3>
              <button
                onClick={() => setShowAddDept(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[#06B6D4] text-sm font-medium hover:bg-[#EFF9FB] rounded-lg transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
            <div className="space-y-3">
              {teams.length === 0 ? (
                <div className="text-center py-8">
                  <Users2 className="w-10 h-10 mx-auto text-[#CBD5E1] mb-2" />
                  <p className="text-sm text-[#94A3B8]">No teams yet</p>
                  <p className="text-xs text-[#CBD5E1]">Teams you join will appear here</p>
                </div>
              ) : (
                teams.map((t, i) => (
                  <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#F8FDFE] transition-all">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: DEPT_COLORS[i % DEPT_COLORS.length] }}
                    >
                      {t.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#0F172A] truncate">{t.name}</p>
                      <p className="text-xs text-[#94A3B8]">Role: {t.role}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      t.status === "active" ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"
                    }`}>
                      {t.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E5F4F7] p-5">
            <h3 className="text-base font-bold text-[#0F172A] mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Export Data", icon: <Upload className="w-4 h-4" />, color: "text-[#06B6D4]" },
                { label: "Invite Members", icon: <Send className="w-4 h-4" />, color: "text-[#4F46E5]" },
                { label: "Billing & Plans", icon: <CreditCard className="w-4 h-4" />, color: "text-[#10B981]" },
                { label: "Audit Log", icon: <ScrollText className="w-4 h-4" />, color: "text-[#F59E0B]" },
              ].map((a) => (
                <button
                  key={a.label}
                  onClick={() => toast.success(`${a.label} clicked`)}
                  className="flex items-center gap-2.5 p-3 bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl text-sm font-medium text-[#0F172A] hover:bg-[#EFF9FB] hover:border-[#06B6D4]/20 transition-all"
                >
                  <span className={a.color}>{a.icon}</span>
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showAddDept && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAddDept(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-[#E5F4F7]">
              <h3 className="text-lg font-bold text-[#0F172A]">Add Department</h3>
              <button onClick={() => setShowAddDept(false)} className="w-8 h-8 rounded-lg hover:bg-[#F5FEFF] flex items-center justify-center transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Department Name</label>
                <input
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4] transition-all"
                  placeholder="e.g. Human Resources"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Lead</label>
                <input
                  value={newDeptLead}
                  onChange={(e) => setNewDeptLead(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4] transition-all"
                  placeholder="e.g. John Doe"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-[#E5F4F7]">
              <button onClick={() => setShowAddDept(false)} className="px-4 py-2 bg-[#F5FEFF] border border-[#E5F4F7] rounded-xl text-sm font-medium text-[#0F172A] hover:bg-[#F8FDFE] transition-all">
                Cancel
              </button>
              <button onClick={addDepartment} className="px-4 py-2 bg-gradient-to-r from-[#06B6D4] to-[#0891B2] text-white rounded-xl text-sm font-semibold shadow-sm transition-all">
                Add Department
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Organization;
