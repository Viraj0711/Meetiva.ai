import { useState } from "react";
import { Pencil, Camera, LogOut, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export { ProfilePage };
export default function ProfilePage() {
  const [form, setForm] = useState({
    name: "Super Admin",
    email: "admin@meetiva.com",
    phone: "+1 (555) 000-0000",
    role: "Super Administrator",
    department: "Platform Operations",
    location: "San Francisco, CA",
    timezone: "UTC−8 Pacific Time",
    bio: "Platform administrator with full access to all Meetiva workspaces and system configuration. Responsible for user management, billing, and infrastructure oversight.",
  });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(form);

  const set =
    (k: keyof typeof draft) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setDraft((d) => ({ ...d, [k]: e.target.value }));

  const handleEdit = () => {
    setDraft(form);
    setEditing(true);
  };
  const handleCancel = () => setEditing(false);
  const handleSave = () => {
    setForm(draft);
    setEditing(false);
    toast.success("Profile updated successfully");
  };

  const initials = form.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const Field = ({
    label,
    value,
    k,
    type = "text",
    full = false,
  }: {
    label: string;
    value: string;
    k: keyof typeof draft;
    type?: string;
    full?: boolean;
  }) => (
    <div className={full ? "col-span-2" : ""}>
      <label className="block text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">
        {label}
      </label>
      {editing ? (
        <input
          type={type}
          value={draft[k]}
          onChange={set(k)}
          className="w-full px-3 py-2.5 text-[13px] text-[#0F172A] bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/10 transition-all"
        />
      ) : (
        <p className="text-[13px] text-[#0F172A] font-medium py-2.5 px-3 bg-[#F8FDFE] rounded-xl border border-[#E5F4F7]">
          {value}
        </p>
      )}
    </div>
  );

  const readonlyFields = [
    { label: "User ID", value: "ADM-000001" },
    { label: "Account Type", value: "Super Administrator" },
    { label: "Member Since", value: "January 12, 2022" },
    { label: "Last Login", value: "Today at 09:41 AM" },
    { label: "Last IP", value: "192.168.1.1" },
    { label: "2FA Status", value: "Enabled (Authenticator App)" },
  ];

  const activityStats = [
    { label: "Users Managed", value: "13,847" },
    { label: "Teams Overseen", value: "1,124" },
    { label: "Logs Reviewed", value: "48,291" },
    { label: "Settings Changed", value: "214" },
  ];

  return (
    <div className="min-h-full bg-[#F5FEFF]">
      <div className="max-w-4xl mx-auto px-8 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-[#0F172A] tracking-tight">
              My Profile
            </h1>
            <p className="text-[12px] text-[#94A3B8] mt-0.5">
              View and manage your account information
            </p>
          </div>
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 rounded-xl border border-[#E5F4F7] text-[12px] font-semibold text-[#64748B] hover:bg-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 rounded-xl bg-[#06B6D4] text-white text-[12px] font-semibold hover:bg-[#0891B2] transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle size={13} /> Save changes
                </button>
              </>
            ) : (
              <button
                onClick={handleEdit}
                className="px-4 py-2 rounded-xl bg-white border border-[#E5F4F7] text-[12px] font-semibold text-[#0F172A] hover:border-[#06B6D4] hover:text-[#06B6D4] transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
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
                <h2 className="text-[18px] font-bold text-[#0F172A] leading-tight">
                  {form.name}
                </h2>
                <p className="text-[12px] text-[#94A3B8] mt-0.5">
                  {form.role} · {form.department}
                </p>
              </div>
              {!editing && (
                <button
                  onClick={() => toast.info("Photo upload coming soon")}
                  className="ml-auto pb-1 flex items-center gap-1.5 text-[11px] font-semibold text-[#06B6D4] hover:text-[#0891B2] transition-colors cursor-pointer"
                >
                  <Camera size={12} /> Change photo
                </button>
              )}
            </div>

            {/* Bio */}
            <div className="mb-5">
              <label className="block text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">
                Bio
              </label>
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
              <Field label="Full Name" value={form.name} k="name" />
              <Field label="Email" value={form.email} k="email" type="email" />
              <Field label="Phone" value={form.phone} k="phone" type="tel" />
              <Field label="Role" value={form.role} k="role" />
              <Field label="Department" value={form.department} k="department" />
              <Field label="Location" value={form.location} k="location" />
              <Field label="Timezone" value={form.timezone} k="timezone" full />
            </div>
          </div>
        </div>

        {/* Account details (read-only) */}
        <div className="bg-white rounded-2xl border border-[#E5F4F7] shadow-sm p-6">
          <h3 className="text-[14px] font-bold text-[#0F172A] mb-4">Account Details</h3>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            {readonlyFields.map((f) => (
              <div
                key={f.label}
                className="flex items-center justify-between py-2.5 border-b border-[#F1F9FB] last:border-0"
              >
                <span className="text-[12px] text-[#94A3B8] font-medium">{f.label}</span>
                <span className="text-[12px] text-[#0F172A] font-semibold">{f.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Activity stats */}
        <div className="grid grid-cols-4 gap-4">
          {activityStats.map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-2xl border border-[#E5F4F7] shadow-sm p-4 text-center"
            >
              <p className="text-[22px] font-extrabold text-[#0F172A] leading-none mb-1">
                {s.value}
              </p>
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
              <p className="text-[11.5px] text-[#94A3B8] mt-0.5">
                This will end all active sessions immediately
              </p>
            </div>
            <button
              onClick={() => toast.error("Sign-out requires confirmation")}
              className="px-4 py-2 rounded-xl border border-[#FEE2E2] text-[#EF4444] text-[12px] font-semibold hover:bg-[#FEF2F2] transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <LogOut size={13} /> Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
