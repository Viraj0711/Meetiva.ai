import { useState } from "react";
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
  FileText,
  CreditCard,
  ScrollText,
  ChevronDown,
  Globe,
  Mail,
  Phone,
  MapPin,
  Clock,
  Info,
  Send,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";

const defaultOrg = {
  name: "Meetiva Global HQ",
  industry: "Technology / SaaS",
  size: "201-500 employees",
  founded: "2019",
  website: "https://meetiva.com",
  email: "admin@meetiva.com",
  phone: "+1 (415) 000-1234",
  timezone: "America/Los_Angeles",
  address: "1 Market Street, San Francisco, CA 94105",
  description:
    "Meetiva is an AI-powered meeting intelligence platform helping teams collaborate smarter with automated summaries, action items, and analytics.",
};

const defaultDepartments = [
  { id: "d1", name: "Engineering", lead: "Priya Patel", members: 142, color: "#06B6D4", initials: "EN" },
  { id: "d2", name: "Product", lead: "Marcus Williams", members: 38, color: "#8B5CF6", initials: "PR" },
  { id: "d3", name: "Design", lead: "Aiko Tanaka", members: 24, color: "#10B981", initials: "DE" },
  { id: "d4", name: "Marketing", lead: "Sarah Chen", members: 31, color: "#F59E0B", initials: "MA" },
  { id: "d5", name: "Sales", lead: "Tom Eriksson", members: 67, color: "#06B6D4", initials: "SA" },
  { id: "d6", name: "Finance", lead: "Fatima Al-Hassan", members: 18, color: "#F43F5E", initials: "FI" },
];

export function Organization() {
  const [editing, setEditing] = useState(false);
  const [org, setOrg] = useState(defaultOrg);
  const [departments, setDepartments] = useState(defaultDepartments);
  const [showAddDept, setShowAddDept] = useState(false);
  const [newDept, setNewDept] = useState({ name: "", lead: "", members: 0 });

  const handleSave = () => {
    setEditing(false);
    toast.success("Organization profile updated");
  };

  const handleCancel = () => {
    setOrg(defaultOrg);
    setEditing(false);
  };

  const addDepartment = () => {
    if (!newDept.name) return;
    const initials = newDept.name.slice(0, 2).toUpperCase();
    const colors = ["#06B6D4", "#8B5CF6", "#10B981", "#F59E0B", "#F43F5E", "#4F46E5"];
    setDepartments([...departments, { ...newDept, id: `d${departments.length + 1}`, initials, color: colors[departments.length % colors.length] }]);
    setNewDept({ name: "", lead: "", members: 0 });
    setShowAddDept(false);
    toast.success("Department added");
  };

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
          { label: "Total Users", value: "13,847", icon: <Users className="w-5 h-5" />, color: "from-[#06B6D4] to-[#0891B2]" },
          { label: "Active Teams", value: "1,124", icon: <Users2 className="w-5 h-5" />, color: "from-[#4F46E5] to-[#6366F1]" },
          { label: "Meetings / mo", value: "48,291", icon: <Video className="w-5 h-5" />, color: "from-[#10B981] to-[#059669]" },
          { label: "Storage Used", value: "2.4 TB", icon: <HardDrive className="w-5 h-5" />, color: "from-[#F59E0B] to-[#D97706]" },
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
                M
              </div>

              <div className="mt-4 grid grid-cols-2 gap-5">
                {[
                  { label: "ORGANIZATION NAME", key: "name", icon: <Building2 className="w-3.5 h-3.5" /> },
                  { label: "INDUSTRY", key: "industry", icon: <Globe className="w-3.5 h-3.5" /> },
                  { label: "COMPANY SIZE", key: "size", icon: <Users className="w-3.5 h-3.5" /> },
                  { label: "FOUNDED", key: "founded", icon: <Clock className="w-3.5 h-3.5" /> },
                  { label: "WEBSITE", key: "website", icon: <Globe className="w-3.5 h-3.5" /> },
                  { label: "CONTACT EMAIL", key: "email", icon: <Mail className="w-3.5 h-3.5" /> },
                  { label: "PHONE", key: "phone", icon: <Phone className="w-3.5 h-3.5" /> },
                  { label: "TIMEZONE", key: "timezone", icon: <Clock className="w-3.5 h-3.5" /> },
                ].map((f) => (
                  <div key={f.key}>
                    <p className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">{f.label}</p>
                    {editing ? (
                      <input
                        value={org[f.key as keyof typeof org]}
                        onChange={(e) => setOrg({ ...org, [f.key]: e.target.value })}
                        className="w-full px-3 py-2 bg-[#F8FDFE] border border-[#E5F4F7] rounded-lg text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4] transition-all"
                      />
                    ) : (
                      <p className="text-sm font-medium text-[#0F172A]">{org[f.key as keyof typeof org]}</p>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-5">
                <p className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">ADDRESS</p>
                {editing ? (
                  <input
                    value={org.address}
                    onChange={(e) => setOrg({ ...org, address: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F8FDFE] border border-[#E5F4F7] rounded-lg text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4] transition-all"
                  />
                ) : (
                  <p className="text-sm font-medium text-[#0F172A]">{org.address}</p>
                )}
              </div>

              <div className="mt-5">
                <p className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">DESCRIPTION</p>
                {editing ? (
                  <textarea
                    value={org.description}
                    onChange={(e) => setOrg({ ...org, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 bg-[#F8FDFE] border border-[#E5F4F7] rounded-lg text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4] transition-all resize-none"
                  />
                ) : (
                  <p className="text-sm text-[#64748B] leading-relaxed">{org.description}</p>
                )}
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
              {departments.map((d) => (
                <div key={d.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#F8FDFE] transition-all">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: d.color }}
                  >
                    {d.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#0F172A] truncate">{d.name}</p>
                    <p className="text-xs text-[#94A3B8]">Lead: {d.lead}</p>
                  </div>
                  <span className="text-sm font-semibold text-[#0F172A]">{d.members}</span>
                  <span className="text-xs text-[#94A3B8]">members</span>
                </div>
              ))}
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
                  value={newDept.name}
                  onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4] transition-all"
                  placeholder="e.g. Human Resources"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Lead</label>
                <input
                  value={newDept.lead}
                  onChange={(e) => setNewDept({ ...newDept, lead: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4] transition-all"
                  placeholder="e.g. John Doe"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Members</label>
                <input
                  type="number"
                  value={newDept.members}
                  onChange={(e) => setNewDept({ ...newDept, members: Number(e.target.value) })}
                  className="w-full mt-1 px-3 py-2 bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4] transition-all"
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
