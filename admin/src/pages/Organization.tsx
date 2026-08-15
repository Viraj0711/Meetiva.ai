import { useState, useEffect } from "react";
import {
  Building2, Users, Users2, Video, HardDrive, Pencil, Save, X,
  Plus, Loader2, Shield, ShieldCheck, ShieldOff, UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { authApi, organizationsApi, projectsApi, invitesApi } from "@/lib/api";
import type { MeUser, OrganizationData, OrgUser, ProjectData, InviteData } from "@/lib/api";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-600",
  pending: "bg-amber-50 text-amber-600",
  suspended: "bg-red-50 text-red-600",
};

const ROLE_COLORS: Record<string, string> = {
  super_admin: "bg-purple-50 text-purple-600",
  admin: "bg-blue-50 text-blue-600",
  manager: "bg-cyan-50 text-cyan-600",
  team_leader: "bg-green-50 text-green-600",
  member: "bg-gray-50 text-gray-600",
};

export function Organization() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<MeUser | null>(null);
  const [organizations, setOrganizations] = useState<OrganizationData[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<OrganizationData | null>(null);
  const [orgUsers, setOrgUsers] = useState<OrgUser[]>([]);
  const [orgProjects, setOrgProjects] = useState<ProjectData[]>([]);
  const [showProvision, setShowProvision] = useState(false);
  const [provisionForm, setProvisionForm] = useState({ email: "", name: "", role: "manager" });
  const [provisionResult, setProvisionResult] = useState<{ tempPassword: string } | null>(null);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [addAdminForm, setAddAdminForm] = useState({ email: "", name: "" });
  const [addAdminResult, setAddAdminResult] = useState<{ tempPassword: string } | null>(null);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [projectForm, setProjectForm] = useState({ name: "", description: "" });
  const [showInviteManager, setShowInviteManager] = useState<string | null>(null);
  const [inviteForm, setInviteForm] = useState({ email: "" });
  const [inviteResult, setInviteResult] = useState<{ inviteLink: string } | null>(null);
  const [projectInvites, setProjectInvites] = useState<Record<string, InviteData[]>>({});

  const isSuperAdmin = user?.orgRole === "super_admin";
  const isAdmin = user?.orgRole === "admin";

  useEffect(() => {
    async function load() {
      try {
        const me = await authApi.me();
        setUser(me);

        if (me.orgRole === "super_admin") {
          const orgs = await organizationsApi.listAll();
          setOrganizations(orgs);
        } else if (me.organizationId) {
          const org = await organizationsApi.get(me.organizationId);
          setSelectedOrg(org);
          const [usersRes, projectsRes] = await Promise.allSettled([
            organizationsApi.listUsers(org.id),
            projectsApi.list(org.id),
          ]);
          if (usersRes.status === "fulfilled") setOrgUsers(usersRes.value.users ?? []);
          if (projectsRes.status === "fulfilled") setOrgProjects(projectsRes.value.projects ?? []);
        }
      } catch {
        toast.error("Failed to load organization data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const loadOrgDetails = async (orgId: string, openProvisionModal = false) => {
    try {
      const [org, usersRes, projectsRes] = await Promise.allSettled([
        organizationsApi.get(orgId),
        organizationsApi.listUsers(orgId),
        projectsApi.list(orgId),
      ]);
      if (org.status === "fulfilled") {
        setSelectedOrg(org.value);
        // Auto-open Add Admin modal for pending orgs when Review is clicked
        if (openProvisionModal && org.value.status === "pending") {
          setShowAddAdmin(true);
        }
      }
      if (usersRes.status === "fulfilled") setOrgUsers(usersRes.value.users ?? []);
      if (projectsRes.status === "fulfilled") setOrgProjects(projectsRes.value.projects ?? []);
    } catch {
      toast.error("Failed to load organization details");
    }
  };

  const handleDeleteOrg = async (orgId: string) => {
    if (!confirm("Are you sure you want to delete this organization request?")) return;
    try {
      await organizationsApi.deletePending(orgId);
      toast.success("Organization request deleted");
      setOrganizations((prev) => prev.filter((o) => o.id !== orgId));
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    }
  };

  const handleProvision = async () => {
    if (!selectedOrg) return;
    try {
      const res = await organizationsApi.provision(selectedOrg.id, provisionForm);
      setProvisionResult({ tempPassword: res.tempPassword });
      toast.success(`User ${provisionForm.name} provisioned successfully`);
      setOrgUsers((prev) => [...prev, res.user]);
      setProvisionForm({ email: "", name: "", role: "manager" });
    } catch (err: any) {
      toast.error(err.message || "Provisioning failed");
    }
  };

  const handleActivate = async (orgId: string) => {
    try {
      await organizationsApi.activate(orgId);
      toast.success("Organization activated");
      setOrganizations((prev) => prev.map((o) => (o.id === orgId ? { ...o, status: "active" } : o)));
    } catch (err: any) {
      toast.error(err.message || "Failed to activate");
    }
  };

  const handleSuspend = async (orgId: string) => {
    try {
      await organizationsApi.suspend(orgId);
      toast.success("Organization suspended");
      setOrganizations((prev) => prev.map((o) => (o.id === orgId ? { ...o, status: "suspended" } : o)));
    } catch (err: any) {
      toast.error(err.message || "Failed to suspend");
    }
  };

  const handleCreateProject = async () => {
    if (!selectedOrg || !projectForm.name.trim()) return;
    try {
      const project = await projectsApi.create({
        name: projectForm.name.trim(),
        description: projectForm.description.trim() || undefined,
        organizationId: selectedOrg.id,
      });
      setOrgProjects((prev) => [...prev, { ...project, manager: null }]);
      setProjectForm({ name: "", description: "" });
      setShowCreateProject(false);
      toast.success(`Project "${project.name}" created`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create project");
    }
  };

  const handleSendInvite = async () => {
    if (!showInviteManager) return;
    try {
      const result = await invitesApi.createProjectInvite({
        projectId: showInviteManager,
        email: inviteForm.email.trim() || undefined,
      });
      setInviteResult({ inviteLink: result.inviteLink });
      toast.success("Invite link generated");
    } catch (err: any) {
      toast.error(err.message || "Failed to create invite");
    }
  };

  const loadProjectInvites = async (projectId: string) => {
    try {
      const res = await invitesApi.listProjectInvites(projectId);
      setProjectInvites((prev) => ({ ...prev, [projectId]: res.invites }));
    } catch {
      // ignore
    }
  };

  const handleAddAdmin = async () => {
    if (!selectedOrg) return;
    try {
      const res = await organizationsApi.addAdmin(selectedOrg.id, addAdminForm);
      setAddAdminResult({ tempPassword: res.user.tempPassword });
      toast.success(`Admin ${addAdminForm.name} added successfully`);
      setOrgUsers((prev) => [...prev, res.user]);
      setAddAdminForm({ email: "", name: "" });
    } catch (err: any) {
      toast.error(err.message || "Failed to add admin");
    }
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

  if (isSuperAdmin && !selectedOrg) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Organizations</h1>
          <p className="text-sm text-[#94A3B8]">Manage all organizations on the platform</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-[#E5F4F7] p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#06B6D4] to-[#0891B2] flex items-center justify-center text-white"><Building2 className="w-5 h-5" /></div>
            <div><p className="text-sm text-[#94A3B8]">Total Orgs</p><p className="text-2xl font-bold text-[#0F172A]">{organizations.length}</p></div>
          </div>
          <div className="bg-white rounded-2xl border border-[#E5F4F7] p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center text-white"><ShieldCheck className="w-5 h-5" /></div>
            <div><p className="text-sm text-[#94A3B8]">Active</p><p className="text-2xl font-bold text-[#0F172A]">{organizations.filter((o) => o.status === "active").length}</p></div>
          </div>
          <div className="bg-white rounded-2xl border border-[#E5F4F7] p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#F59E0B] to-[#D97706] flex items-center justify-center text-white"><ShieldOff className="w-5 h-5" /></div>
            <div><p className="text-sm text-[#94A3B8]">Pending</p><p className="text-2xl font-bold text-[#0F172A]">{organizations.filter((o) => o.status === "pending").length}</p></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5F4F7] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E5F4F7]">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Organization</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Contact</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Seats</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Created</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {organizations.map((org) => (
                <tr key={org.id} className="border-b border-[#F8FDFE] hover:bg-[#F8FDFE] transition-colors cursor-pointer" onClick={() => loadOrgDetails(org.id)}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#06B6D4] to-[#4F46E5] flex items-center justify-center text-white text-xs font-bold">{org.name.charAt(0)}</div>
                      <div>
                        <p className="text-sm font-semibold text-[#0F172A]">{org.name}</p>
                        <p className="text-xs text-[#94A3B8]">{org.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-[#64748B]">{org.contactEmail || "—"}</td>
                  <td className="px-5 py-4"><span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[org.status] ?? "bg-gray-50 text-gray-600"}`}>{org.status}</span></td>
                  <td className="px-5 py-4 text-sm text-[#0F172A]">{org.seatsUsed}/{org.seatLimit}</td>
                  <td className="px-5 py-4 text-sm text-[#94A3B8]">{new Date(org.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {org.status === "pending" && (
                        <>
                          <button onClick={(e) => { e.stopPropagation(); loadOrgDetails(org.id, true); }} className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer">Review</button>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteOrg(org.id); }} className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors cursor-pointer">Delete</button>
                        </>
                      )}
                      {org.status === "active" && <button onClick={(e) => { e.stopPropagation(); handleSuspend(org.id); }} className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors cursor-pointer">Suspend</button>}
                    </div>
                  </td>
                </tr>
              ))}
              {organizations.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-[#94A3B8]">No organizations found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            {isSuperAdmin && (
              <button onClick={() => { setSelectedOrg(null); setOrgUsers([]); setOrgProjects([]); }} className="text-sm text-[#06B6D4] hover:underline cursor-pointer">← All Organizations</button>
            )}
          </div>
          <h1 className="text-2xl font-bold text-[#0F172A]">{selectedOrg?.name ?? "Organization"}</h1>
          <p className="text-sm text-[#94A3B8]">
            {selectedOrg?.contactEmail && <span>Contact: <strong className="text-[#64748B]">{selectedOrg.contactEmail}</strong> · </span>}
            Manage organization users, projects, and settings
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isSuperAdmin && selectedOrg && (
            <button onClick={() => setShowAddAdmin(true)} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl text-sm font-semibold shadow-sm shadow-purple-500/25 hover:shadow-md transition-all">
              <Shield className="w-4 h-4" /> Add Admin
            </button>
          )}
          {isAdmin && selectedOrg && (
            <button onClick={() => setShowProvision(true)} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#06B6D4] to-[#0891B2] text-white rounded-xl text-sm font-semibold shadow-sm shadow-[#06B6D4]/25 hover:shadow-md transition-all">
              <UserPlus className="w-4 h-4" /> Provision User
            </button>
          )}
        </div>
      </div>

      {selectedOrg && (
        <>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Status", value: selectedOrg.status, icon: <Shield className="w-5 h-5" />, color: "from-[#06B6D4] to-[#0891B2]" },
              { label: "Users", value: `${selectedOrg.seatsUsed}/${selectedOrg.seatLimit}`, icon: <Users className="w-5 h-5" />, color: "from-[#4F46E5] to-[#6366F1]" },
              { label: "Projects", value: orgProjects.length.toString(), icon: <Video className="w-5 h-5" />, color: "from-[#10B981] to-[#059669]" },
              { label: "Teams", value: orgProjects.reduce((acc, p) => acc, 0).toString(), icon: <HardDrive className="w-5 h-5" />, color: "from-[#F59E0B] to-[#D97706]" },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-2xl border border-[#E5F4F7] p-5 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white`}>{s.icon}</div>
                <div><p className="text-sm text-[#94A3B8]">{s.label}</p><p className="text-2xl font-bold text-[#0F172A]">{s.value}</p></div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-[#E5F4F7] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5F4F7]">
              <h3 className="text-base font-bold text-[#0F172A]">Users</h3>
              <span className="text-xs text-[#94A3B8]">{orgUsers.length} members</span>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E5F4F7]">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">User</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Role</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Joined</th>
                </tr>
              </thead>
              <tbody>
                {orgUsers.map((u) => (
                  <tr key={u.id} className="border-b border-[#F8FDFE] hover:bg-[#F8FDFE] transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#06B6D4] flex items-center justify-center text-white text-xs font-bold">{u.name.charAt(0).toUpperCase()}</div>
                        <div><p className="text-sm font-semibold text-[#0F172A]">{u.name}</p><p className="text-xs text-[#94A3B8]">{u.email}</p></div>
                      </div>
                    </td>
                    <td className="px-5 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[u.orgRole] ?? "bg-gray-50 text-gray-600"}`}>{u.orgRole}</span></td>
                    <td className="px-5 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.isActive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>{u.isActive ? "Active" : "Inactive"}</span></td>
                    <td className="px-5 py-3 text-sm text-[#94A3B8]">{new Date(u.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {orgUsers.length === 0 && (
                  <tr><td colSpan={4} className="px-5 py-8 text-center text-sm text-[#94A3B8]">No users in this organization</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="bg-white rounded-2xl border border-[#E5F4F7] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5F4F7]">
              <h3 className="text-base font-bold text-[#0F172A]">Projects</h3>
              <div className="flex items-center gap-3">
                <span className="text-xs text-[#94A3B8]">{orgProjects.length} projects</span>
                {isAdmin && (
                  <button onClick={() => setShowCreateProject(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#06B6D4] text-white rounded-lg text-xs font-semibold hover:bg-[#0891B2] transition-colors">
                    <Plus size={12} /> Create Project
                  </button>
                )}
              </div>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E5F4F7]">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Project</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Manager</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Created</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orgProjects.map((p) => (
                  <tr key={p.id} className="border-b border-[#F8FDFE] hover:bg-[#F8FDFE] transition-colors">
                    <td className="px-5 py-3"><p className="text-sm font-semibold text-[#0F172A]">{p.name}</p>{p.description && <p className="text-xs text-[#94A3B8] truncate max-w-xs">{p.description}</p>}</td>
                    <td className="px-5 py-3 text-sm text-[#94A3B8]">{p.manager?.name || "Unassigned"}</td>
                    <td className="px-5 py-3 text-sm text-[#94A3B8]">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => { setShowInviteManager(p.id); setInviteResult(null); setInviteForm({ email: "" }); }} className="px-3 py-1.5 text-xs font-medium text-[#06B6D4] bg-[#F0FDFF] rounded-lg hover:bg-[#CFFAFE] transition-colors">
                          Invite Manager
                        </button>
                        <button onClick={() => loadProjectInvites(p.id)} className="px-3 py-1.5 text-xs font-medium text-[#64748B] bg-[#F8FDFE] rounded-lg hover:bg-[#EDF7F9] transition-colors">
                          Invites
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {orgProjects.length === 0 && (
                  <tr><td colSpan={4} className="px-5 py-8 text-center text-sm text-[#94A3B8]">No projects in this organization</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showAddAdmin && selectedOrg && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setShowAddAdmin(false); setAddAdminResult(null); }}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-[#E5F4F7]">
              <h3 className="text-lg font-bold text-[#0F172A]">{addAdminResult ? "Admin Added" : "Add Organization Admin"}</h3>
              <button onClick={() => { setShowAddAdmin(false); setAddAdminResult(null); }} className="w-8 h-8 rounded-lg hover:bg-[#F5FEFF] flex items-center justify-center transition-all"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              {addAdminResult ? (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-purple-800 mb-2">Admin account created successfully</p>
                  <p className="text-xs text-purple-700">Temporary password:</p>
                  <code className="block mt-1 px-3 py-2 bg-white rounded-lg text-sm font-mono text-[#0F172A] border border-purple-200 select-all">{addAdminResult.tempPassword}</code>
                  <p className="text-xs text-purple-600 mt-2">Share this password securely. The admin will be forced to change it on first login.</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Email</label>
                    <input type="email" value={addAdminForm.email} onChange={(e) => setAddAdminForm((f) => ({ ...f, email: e.target.value }))} className="w-full mt-1 px-3 py-2 bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all" placeholder="admin@company.com" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Full Name</label>
                    <input type="text" value={addAdminForm.name} onChange={(e) => setAddAdminForm((f) => ({ ...f, name: e.target.value }))} className="w-full mt-1 px-3 py-2 bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all" placeholder="John Admin" />
                  </div>
                  <p className="text-xs text-[#94A3B8]">The new admin will have full access to this organization only. If an admin already exists, they will be replaced.</p>
                </>
              )}
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-[#E5F4F7]">
              <button onClick={() => { setShowAddAdmin(false); setAddAdminResult(null); }} className="px-4 py-2 bg-[#F5FEFF] border border-[#E5F4F7] rounded-xl text-sm font-medium text-[#0F172A] hover:bg-[#F8FDFE] transition-all">
                {addAdminResult ? "Close" : "Cancel"}
              </button>
              {!addAdminResult && (
                <button onClick={handleAddAdmin} className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl text-sm font-semibold shadow-sm transition-all">
                  Add Admin
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showCreateProject && selectedOrg && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCreateProject(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-[#E5F4F7]">
              <h3 className="text-lg font-bold text-[#0F172A]">Create Project</h3>
              <button onClick={() => setShowCreateProject(false)} className="w-8 h-8 rounded-lg hover:bg-[#F5FEFF] flex items-center justify-center transition-all"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Project Name</label>
                <input type="text" value={projectForm.name} onChange={(e) => setProjectForm((f) => ({ ...f, name: e.target.value }))} className="w-full mt-1 px-3 py-2 bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4] transition-all" placeholder="e.g. Q4 Planning" />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Description (optional)</label>
                <textarea value={projectForm.description} onChange={(e) => setProjectForm((f) => ({ ...f, description: e.target.value }))} className="w-full mt-1 px-3 py-2 bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4] transition-all" rows={3} placeholder="Brief description of the project" />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-[#E5F4F7]">
              <button onClick={() => setShowCreateProject(false)} className="px-4 py-2 bg-[#F5FEFF] border border-[#E5F4F7] rounded-xl text-sm font-medium text-[#0F172A] hover:bg-[#F8FDFE] transition-all">Cancel</button>
              <button onClick={handleCreateProject} disabled={!projectForm.name.trim()} className="px-4 py-2 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold shadow-sm transition-all disabled:opacity-50">Create Project</button>
            </div>
          </div>
        </div>
      )}

      {showInviteManager && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setShowInviteManager(null); setInviteResult(null); }}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-[#E5F4F7]">
              <h3 className="text-lg font-bold text-[#0F172A]">{inviteResult ? "Invite Link Ready" : "Invite Manager"}</h3>
              <button onClick={() => { setShowInviteManager(null); setInviteResult(null); }} className="w-8 h-8 rounded-lg hover:bg-[#F5FEFF] flex items-center justify-center transition-all"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              {inviteResult ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-emerald-800 mb-2">Invite link generated!</p>
                  <p className="text-xs text-emerald-700 mb-2">Share this link with the person you want to invite as Manager:</p>
                  <div className="flex items-center gap-2">
                    <input readOnly value={inviteResult.inviteLink} className="flex-1 px-3 py-2 bg-white rounded-lg text-xs font-mono border border-emerald-200 select-all" />
                    <button onClick={() => { navigator.clipboard.writeText(inviteResult.inviteLink); toast.success("Copied!"); }} className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors">Copy</button>
                  </div>
                  <p className="text-xs text-emerald-600 mt-2">Link expires in 7 days. The invitee must have or create a Meetiva account.</p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-[#64748B]">Send an invite link to someone you want as a Manager on this project.</p>
                  <div>
                    <label className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Email (optional — restricts invite to this email)</label>
                    <input type="email" value={inviteForm.email} onChange={(e) => setInviteForm({ email: e.target.value })} className="w-full mt-1 px-3 py-2 bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4] transition-all" placeholder="manager@company.com" />
                  </div>
                </>
              )}
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-[#E5F4F7]">
              <button onClick={() => { setShowInviteManager(null); setInviteResult(null); }} className="px-4 py-2 bg-[#F5FEFF] border border-[#E5F4F7] rounded-xl text-sm font-medium text-[#0F172A] hover:bg-[#F8FDFE] transition-all">
                {inviteResult ? "Close" : "Cancel"}
              </button>
              {!inviteResult && (
                <button onClick={handleSendInvite} className="px-4 py-2 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold shadow-sm transition-all">
                  Generate Invite Link
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showProvision && selectedOrg && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setShowProvision(false); setProvisionResult(null); }}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-[#E5F4F7]">
              <h3 className="text-lg font-bold text-[#0F172A]">Provision User</h3>
              <button onClick={() => { setShowProvision(false); setProvisionResult(null); }} className="w-8 h-8 rounded-lg hover:bg-[#F5FEFF] flex items-center justify-center transition-all"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              {provisionResult ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-emerald-800 mb-2">User provisioned successfully</p>
                  <p className="text-xs text-emerald-700">Temporary password:</p>
                  <code className="block mt-1 px-3 py-2 bg-white rounded-lg text-sm font-mono text-[#0F172A] border border-emerald-200 select-all">{provisionResult.tempPassword}</code>
                  <p className="text-xs text-emerald-600 mt-2">Share this password securely. The user will be forced to change it on first login.</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Email</label>
                    <input type="email" value={provisionForm.email} onChange={(e) => setProvisionForm((f) => ({ ...f, email: e.target.value }))} className="w-full mt-1 px-3 py-2 bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4] transition-all" placeholder="user@company.com" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Full Name</label>
                    <input type="text" value={provisionForm.name} onChange={(e) => setProvisionForm((f) => ({ ...f, name: e.target.value }))} className="w-full mt-1 px-3 py-2 bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4] transition-all" placeholder="John Doe" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Role</label>
                    <select value={provisionForm.role} onChange={(e) => setProvisionForm((f) => ({ ...f, role: e.target.value }))} className="w-full mt-1 px-3 py-2 bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4] transition-all">
                      {isSuperAdmin && <option value="admin">Admin</option>}
                      <option value="manager">Manager</option>
                      <option value="team_leader">Team Leader</option>
                      <option value="member">Member</option>
                    </select>
                  </div>
                </>
              )}
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-[#E5F4F7]">
              <button onClick={() => { setShowProvision(false); setProvisionResult(null); }} className="px-4 py-2 bg-[#F5FEFF] border border-[#E5F4F7] rounded-xl text-sm font-medium text-[#0F172A] hover:bg-[#F8FDFE] transition-all">
                {provisionResult ? "Close" : "Cancel"}
              </button>
              {!provisionResult && (
                <button onClick={handleProvision} className="px-4 py-2 bg-gradient-to-r from-[#06B6D4] to-[#0891B2] text-white rounded-xl text-sm font-semibold shadow-sm transition-all">
                  Provision
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Organization;
