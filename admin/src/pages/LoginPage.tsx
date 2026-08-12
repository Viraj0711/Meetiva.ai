import React, { useState } from "react";
import { toast } from "sonner";
import {
  Users, Users2, Brain, ScrollText, LayoutDashboard,
  Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight, Shield,
} from "lucide-react";
import { authApi, setToken } from "@/lib/api";
import type { MeUser } from "@/lib/api";

export function LoginPage({ onLogin }: { onLogin: (user: MeUser) => void }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) { setError("Please enter your email and password."); return; }
    setLoading(true);
    try {
      const { token, user } = await authApi.login(email, password);
      setToken(token);
      toast.success(`Welcome back, ${user.name}!`);
      onLogin(user);
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
      setLoading(false);
    }
  };

  const stats = [
    { icon: Users,      value: "—", label: "Users",       color: "#06B6D4", bg: "#F0FAFE" },
    { icon: Users2,     value: "—", label: "Teams",       color: "#4F46E5", bg: "#EEF2FF" },
    { icon: Brain,      value: "—", label: "AI Tokens",   color: "#8B5CF6", bg: "#F5F3FF" },
    { icon: ScrollText, value: "—", label: "Log Entries",  color: "#10B981", bg: "#ECFDF5" },
  ];

  return (
    <div className="h-screen overflow-hidden flex bg-[#F5FEFF]" style={{ fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      {/* Left panel */}
      <div className="hidden lg:flex w-[54%] flex-col bg-white border-r border-[#EDF7F9] relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.035]"
          style={{ backgroundImage: "radial-gradient(#06B6D4 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="absolute top-[-120px] right-[-120px] w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, #E0F7FE 0%, transparent 65%)" }} />
        <div className="absolute bottom-[-80px] left-[-80px] w-[380px] h-[380px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, #EEF2FF 0%, transparent 65%)" }} />

        <div className="relative z-10 flex flex-col h-full px-14 py-11">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#06B6D4] flex items-center justify-center shadow-sm shadow-[#06B6D4]/25">
              <span className="text-white font-black text-[16px]">M</span>
            </div>
            <div>
              <span className="text-[18px] font-black text-[#0F172A] tracking-tight">Meetiva</span>
              <span className="ml-2 text-[10.5px] font-bold text-[#06B6D4] uppercase tracking-widest">Admin</span>
            </div>
          </div>

          {/* Hero */}
          <div className="flex-1 flex flex-col justify-center max-w-md">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F0FAFE] border border-[#C9EEF7] mb-7 self-start">
              <div className="w-1.5 h-1.5 rounded-full bg-[#06B6D4] animate-pulse" />
              <span className="text-[11px] font-bold text-[#0E7490] uppercase tracking-wider">Super Admin Console</span>
            </div>
            <h1 className="text-[36px] font-black text-[#0F172A] leading-[1.15] tracking-tight mb-4">
              Full control of<br />
              <span className="text-[#06B6D4]">your platform</span>
            </h1>
            <p className="text-[14px] text-[#64748B] leading-relaxed mb-10">
              Manage users, teams, AI usage and system logs - all from one unified admin workspace.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {stats.map(({ icon: Ic, value, label, color, bg }) => (
                <div key={label} className="flex items-center gap-3 px-4 py-3.5 bg-white border border-[#E5F4F7] rounded-2xl shadow-sm">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
                    <Ic size={15} style={{ color }} />
                  </div>
                  <div>
                    <p className="text-[17px] font-black text-[#0F172A] leading-none">{value}</p>
                    <p className="text-[11px] text-[#94A3B8] font-medium mt-0.5">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom nav preview */}
          <div className="flex items-center gap-4 pt-6 border-t border-[#EDF7F9]">
            {[
              { icon: LayoutDashboard, label: "Dashboard" },
              { icon: Users,           label: "Users"     },
              { icon: Users2,          label: "Teams"     },
              { icon: Brain,           label: "AI Usage"  },
              { icon: ScrollText,      label: "Logs"      },
            ].map(({ icon: Ic, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-[11.5px] font-semibold text-[#94A3B8]">
                <Ic size={12} />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-8">
        <div className="w-full max-w-[390px]">

          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <div className="w-8 h-8 rounded-xl bg-[#06B6D4] flex items-center justify-center">
              <span className="text-white font-black text-[14px]">M</span>
            </div>
            <span className="text-[17px] font-black text-[#0F172A]">
              Meetiva <span className="text-[#06B6D4]">Admin</span>
            </span>
          </div>

          {/* Card */}
          <div className="bg-white border border-[#E5F4F7] rounded-2xl shadow-sm overflow-hidden">

            {/* Card header */}
            <div className="px-7 pt-7 pb-5 border-b border-[#EDF7F9]">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-8 h-8 rounded-xl bg-[#F0FAFE] border border-[#D9F2F8] flex items-center justify-center">
                  <Lock size={13} className="text-[#06B6D4]" />
                </div>
                <h2 className="text-[18px] font-black text-[#0F172A] tracking-tight">Sign in</h2>
              </div>
              <p className="text-[13px] text-[#94A3B8] ml-11">Access the Meetiva admin panel</p>
            </div>

            {/* Form */}
            <div className="px-7 py-6">
              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Email */}
                <div>
                  <label className="block text-[10.5px] font-bold text-[#64748B] uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#B0C4CB]" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setError(""); }}
                      placeholder="admin@meetiva.com"
                      className="w-full pl-10 pr-4 py-2.5 text-[13.5px] bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/10 text-[#0F172A] placeholder:text-[#C4D9DF] transition-all"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[10.5px] font-bold text-[#64748B] uppercase tracking-wider">
                      Password
                    </label>
                    <button type="button" onClick={() => toast.info("Password reset link sent")}
                      className="text-[11px] text-[#06B6D4] font-semibold hover:text-[#0891B2] transition-colors cursor-pointer">
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#B0C4CB]" />
                    <input
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={e => { setPassword(e.target.value); setError(""); }}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 text-[13.5px] bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/10 text-[#0F172A] placeholder:text-[#C4D9DF] transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(v => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#B0C4CB] hover:text-[#64748B] transition-colors cursor-pointer"
                    >
                      {showPw ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-100 rounded-xl">
                    <AlertCircle size={13} className="text-red-500 flex-shrink-0" />
                    <p className="text-[12px] text-red-600 font-medium">{error}</p>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-[#06B6D4] text-white text-[13.5px] font-bold hover:bg-[#0891B2] disabled:opacity-60 transition-colors cursor-pointer shadow-sm shadow-[#06B6D4]/20 flex items-center justify-center gap-2 mt-1"
                >
                  {loading ? (
                    <>
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>Sign In <ArrowRight size={14} /></>
                  )}
                </button>
              </form>
            </div>

            {/* Hint footer */}
            <div className="px-7 py-4 bg-[#F9FCFD] border-t border-[#EDF7F9] flex items-center gap-2">
              <Shield size={12} className="text-[#06B6D4] flex-shrink-0" />
              <p className="text-[11.5px] text-[#64748B]">
                Demo: <span className="font-bold text-[#0F172A]">admin@meetiva.com</span>
                <span className="mx-1 text-[#CBD5E1]">/</span>
                <span className="font-bold text-[#0F172A]">admin123</span>
              </p>
            </div>
          </div>

          <p className="text-center text-[11px] text-[#B0C4CB] mt-5">
            &copy; 2026 Meetiva Inc. &middot; Restricted to authorized personnel
          </p>
        </div>
      </div>
    </div>
  );
}
