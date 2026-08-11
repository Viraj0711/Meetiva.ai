import { useState, useEffect } from "react";
import { Pencil, Camera, LogOut, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { authApi, type MeUser, type Subscription } from "@/lib/api";

export { ProfilePage };
export default function ProfilePage() {
  const [user, setUser] = useState<MeUser | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ name: "", email: "" });

  useEffect(() => {
    Promise.all([authApi.me(), authApi.subscription()])
      .then(([me, sub]) => {
        setUser(me);
        setSubscription(sub);
        setDraft({ name: me.name, email: me.email });
      })
      .catch((err) => {
        toast.error(err.message || "Failed to load profile");
      })
      .finally(() => setLoading(false));
  }, []);

  const set =
    (k: keyof typeof draft) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setDraft((d) => ({ ...d, [k]: e.target.value }));

  const handleEdit = () => {
    if (user) setDraft({ name: user.name, email: user.email });
    setEditing(true);
  };
  const handleCancel = () => setEditing(false);
  const handleSave = () => {
    if (user) setUser({ ...user, name: draft.name, email: draft.email });
    setEditing(false);
    toast.success("Profile updated successfully");
  };

  const initials = (user?.name || "")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  if (loading) {
    return (
      <div className="min-h-full bg-[#F5FEFF] flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-[#06B6D4]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-full bg-[#F5FEFF] flex items-center justify-center">
        <p className="text-[13px] text-[#94A3B8]">Unable to load profile.</p>
      </div>
    );
  }

  const readonlyFields = [
    { label: "User ID", value: user.id },
    { label: "Account Type", value: subscription?.tier || "Free" },
    { label: "Member Since", value: formatDate(user.createdAt) },
    { label: "Last Updated", value: formatDate(user.updatedAt) },
    { label: "Subscription", value: subscription?.isSubscribed ? "Active" : "None" },
    { label: "Monthly Limit", value: subscription ? `${subscription.monthlyLimit} meetings` : "\u2014" },
  ];

  const activityStats = [
    { label: "Meetings This Month", value: subscription?.meetingCountThisMonth ?? 0 },
    { label: "Meetings Remaining", value: subscription?.meetingsRemaining ?? 0 },
    { label: "Subscription Tier", value: subscription?.tier || "Free" },
    { label: "Status", value: subscription?.isSubscribed ? "Subscribed" : "Free" },
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
                  {user.name}
                </h2>
                <p className="text-[12px] text-[#94A3B8] mt-0.5">
                  {subscription?.tier || "Free"} plan &middot; {user.email}
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

            {/* Editable fields grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={draft.name}
                    onChange={set("name")}
                    className="w-full px-3 py-2.5 text-[13px] text-[#0F172A] bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/10 transition-all"
                  />
                ) : (
                  <p className="text-[13px] text-[#0F172A] font-medium py-2.5 px-3 bg-[#F8FDFE] rounded-xl border border-[#E5F4F7]">
                    {user.name}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">
                  Email
                </label>
                {editing ? (
                  <input
                    type="email"
                    value={draft.email}
                    onChange={set("email")}
                    className="w-full px-3 py-2.5 text-[13px] text-[#0F172A] bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/10 transition-all"
                  />
                ) : (
                  <p className="text-[13px] text-[#0F172A] font-medium py-2.5 px-3 bg-[#F8FDFE] rounded-xl border border-[#E5F4F7]">
                    {user.email}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Account details */}
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
