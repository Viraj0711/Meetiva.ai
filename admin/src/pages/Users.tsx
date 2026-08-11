import { useState, useEffect } from "react";
import { Loader2, User, Video, Building2, CreditCard, Clock, HardDrive, Users } from "lucide-react";
import { authApi } from "@/lib/api";
import type { MeUser, Subscription } from "@/lib/api";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const tierColors: Record<string, string> = {
  free: "bg-slate-50 text-slate-500 border border-slate-200",
  pro: "bg-[#F0FDFF] text-[#0891B2] border border-cyan-200",
  enterprise: "bg-purple-50 text-purple-700 border border-purple-200",
};

const tierLabel = (tier: string) => tier.charAt(0).toUpperCase() + tier.slice(1);

export { UserManagement };
export default function UserManagement() {
  const [user, setUser] = useState<MeUser | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const results = await Promise.allSettled([authApi.me(), authApi.subscription()]);
        if (!cancelled) {
          if (results[0].status === "fulfilled") setUser(results[0].value);
          if (results[1].status === "fulfilled") setSubscription(results[1].value);
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 size={28} className="text-[#06B6D4] animate-spin" />
      </div>
    );
  }

  const initials = user ? getInitials(user.name) : "??";
  const tier = subscription?.tier ?? "free";
  const used = subscription?.meetingCountThisMonth ?? 0;
  const limit = subscription?.monthlyLimit ?? 0;
  const remaining = subscription?.meetingsRemaining ?? 0;
  const usagePct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;

  return (
    <div className="h-full overflow-y-auto scrollbar-hide">
      <div className="px-10 py-9 space-y-7 max-w-[1600px]">

        {/* Page header */}
        <div>
          <h1 className="text-[28px] font-bold text-[#0F172A] tracking-[-0.025em] leading-none">
            Users
          </h1>
          <p className="text-[13.5px] text-[#64748B] mt-2.5 leading-relaxed">
            Manage your account and subscription details.
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-4 gap-4">
          {([
            { label: "Current Tier", value: tierLabel(tier), icon: CreditCard, sub: subscription?.isSubscribed ? "Active subscription" : "Free tier" },
            { label: "Meetings Used", value: used.toString(), icon: Video, sub: `${limit} monthly limit` },
            { label: "Meetings Remaining", value: remaining.toString(), icon: Users, sub: "this billing cycle" },
            { label: "Account Created", value: user ? formatDate(user.createdAt) : "—", icon: Clock, sub: "member since" },
          ] as { label: string; value: string; icon: React.ElementType; sub: string }[]).map(({ label, value, icon: Ic, sub }) => (
            <div key={label} className="bg-white border border-[#E5F4F7] rounded-2xl p-5 flex items-start gap-4 hover:border-[#06B6D4]/30 hover:shadow-sm transition-all">
              <div className="w-9 h-9 rounded-xl bg-[#F5FEFF] border border-[#E5F4F7] flex items-center justify-center flex-shrink-0">
                <Ic size={16} className="text-[#06B6D4]" />
              </div>
              <div className="min-w-0">
                <div className="text-[26px] font-bold text-[#0F172A] leading-none tracking-[-0.02em]">{value}</div>
                <div className="text-[12px] font-medium text-[#64748B] mt-1.5">{label}</div>
                <div className="text-[11px] text-[#94A3B8] mt-2">{sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* User Card */}
        {user && (
          <div className="bg-white border border-[#E5F4F7] rounded-2xl overflow-hidden">
            <div className="px-6 py-5 flex items-center gap-5 border-b border-[#EDF7F9]">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#06B6D4] to-[#4F46E5] flex items-center justify-center text-white text-[20px] font-bold shadow-sm flex-shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[18px] font-bold text-[#0F172A] leading-tight">{user.name}</div>
                <div className="text-[13px] font-mono text-[#94A3B8] mt-1">{user.email}</div>
              </div>
              <span className={`text-[11px] font-mono font-semibold px-2.5 py-1 rounded-lg ${tierColors[tier] || tierColors.free}`}>
                {tierLabel(tier)}
              </span>
            </div>

            {/* Fields grid */}
            <div className="px-6 py-5 grid grid-cols-3 gap-x-8 gap-y-4 border-b border-[#EDF7F9]">
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <User size={10} className="text-[#94A3B8]" />
                  <span className="text-[10.5px] font-medium text-[#94A3B8] uppercase tracking-wide">Role</span>
                </div>
                <span className="text-[13px] font-semibold text-[#111827]">Admin</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Building2 size={10} className="text-[#94A3B8]" />
                  <span className="text-[10.5px] font-medium text-[#94A3B8] uppercase tracking-wide">Workspace</span>
                </div>
                <span className="text-[13px] font-semibold text-[#111827]">{tierLabel(tier)} workspace</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Video size={10} className="text-[#94A3B8]" />
                  <span className="text-[10.5px] font-medium text-[#94A3B8] uppercase tracking-wide">Meetings</span>
                </div>
                <span className="text-[13px] font-semibold text-[#111827]">{used.toLocaleString()} this month</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Clock size={10} className="text-[#94A3B8]" />
                  <span className="text-[10.5px] font-medium text-[#94A3B8] uppercase tracking-wide">Joined</span>
                </div>
                <span className="text-[13px] font-semibold text-[#111827]">{formatDate(user.createdAt)}</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <HardDrive size={10} className="text-[#94A3B8]" />
                  <span className="text-[10.5px] font-medium text-[#94A3B8] uppercase tracking-wide">Last Updated</span>
                </div>
                <span className="text-[13px] font-semibold text-[#111827]">{formatDate(user.updatedAt)}</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <CreditCard size={10} className="text-[#94A3B8]" />
                  <span className="text-[10.5px] font-medium text-[#94A3B8] uppercase tracking-wide">Subscription</span>
                </div>
                <span className="text-[13px] font-semibold text-[#111827]">{subscription?.isSubscribed ? "Active" : "Inactive"}</span>
              </div>
            </div>

            {/* Meeting usage bar */}
            <div className="px-6 py-4 border-b border-[#EDF7F9]">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10.5px] font-medium text-[#94A3B8] uppercase tracking-wide">Monthly Meeting Usage</span>
                <span className="text-[12px] font-semibold text-[#374151]">{used} / {limit} · {usagePct.toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-[#EDF7F9] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#06B6D4] transition-all duration-500"
                  style={{ width: `${usagePct}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Coming soon notice */}
        <div className="bg-white border border-[#E5F4F7] rounded-2xl p-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#F5FEFF] border border-[#E5F4F7] flex items-center justify-center mx-auto mb-4">
            <Users size={22} className="text-[#06B6D4]" />
          </div>
          <h3 className="text-[15px] font-bold text-[#0F172A] mb-1.5">More Users Coming Soon</h3>
          <p className="text-[13px] text-[#64748B] max-w-md mx-auto leading-relaxed">
            User management features will be available when more users join the platform.
            Invite team members to unlock full admin capabilities.
          </p>
        </div>

      </div>
    </div>
  );
}
