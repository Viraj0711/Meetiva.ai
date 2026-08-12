import { useState, useEffect } from "react";
import { Toaster } from "sonner";
import { Sidebar, TopBar } from "@/components/Layout";
import { LoginPage } from "@/pages/LoginPage";
import { Dashboard } from "@/pages/Dashboard";
import { UserManagement } from "@/pages/Users";
import { TeamManagement } from "@/pages/Teams";
import { Organization } from "@/pages/Organization";
import { AiUsage } from "@/pages/AiUsage";
import { Logs } from "@/pages/Logs";
import { Settings } from "@/pages/Settings";
import { ProfilePage } from "@/pages/Profile";
import { getToken, authApi } from "@/lib/api";
import type { MeUser } from "@/lib/api";
import type { Page } from "@/types";

const PANEL_ROLES = ["super_admin", "admin", "manager"];

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!getToken());
  const [user, setUser] = useState<MeUser | null>(null);
  const [page, setPage] = useState<Page>("dashboard");

  useEffect(() => {
    if (!isLoggedIn) return;
    authApi.me().then(setUser).catch(() => {
      setIsLoggedIn(false);
      setUser(null);
    });
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return (
      <>
        <Toaster position="bottom-right" richColors closeButton />
        <LoginPage onLogin={(u) => { setIsLoggedIn(true); setUser(u); }} />
      </>
    );
  }

  if (user && !PANEL_ROLES.includes(user.orgRole ?? "")) {
    return (
      <div className="h-screen bg-[#F5FEFF] flex items-center justify-center" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <Toaster position="bottom-right" richColors closeButton />
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-[#FEE2E2] flex items-center justify-center mx-auto mb-4">
            <span className="text-[#EF4444] text-2xl">!</span>
          </div>
          <h2 className="text-xl font-semibold text-[#0F172A] mb-2">Access Restricted</h2>
          <p className="text-[#64748B] mb-6">
            The admin panel is only available to Super Admins, Admins, and Managers.
            Your role is <strong>{user.orgRole ?? "Member"}</strong>.
          </p>
          <button
            onClick={() => { setIsLoggedIn(false); setUser(null); localStorage.removeItem("admin_token"); }}
            className="px-4 py-2 bg-[#06B6D4] text-white rounded-lg font-medium hover:bg-[#0891B2] transition-colors cursor-pointer"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  if (user?.forcePasswordChange) {
    return (
      <div className="h-screen bg-[#F5FEFF] flex items-center justify-center" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <Toaster position="bottom-right" richColors closeButton />
        <div className="text-center max-w-md">
          <h2 className="text-xl font-semibold text-[#0F172A] mb-2">Password Change Required</h2>
          <p className="text-[#64748B] mb-6">You must change your password before continuing.</p>
          <p className="text-[#94A3B8] text-sm mb-4">Please use the main application to update your password.</p>
          <button
            onClick={() => { setIsLoggedIn(false); setUser(null); localStorage.removeItem("admin_token"); }}
            className="px-4 py-2 bg-[#06B6D4] text-white rounded-lg font-medium hover:bg-[#0891B2] transition-colors cursor-pointer"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#F5FEFF] overflow-hidden" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <Toaster position="bottom-right" richColors closeButton />
      <Sidebar current={page} onNav={setPage} user={user} />
      <div className="ml-[210px] h-full flex flex-col">
        <TopBar onNav={setPage} onLogout={() => { setIsLoggedIn(false); setUser(null); }} />
        <div className="flex-1 overflow-y-auto">
          {page === "dashboard" && <Dashboard onNav={setPage} />}
          {page === "users" && <UserManagement />}
          {page === "teams" && <TeamManagement />}
          {page === "organization" && <Organization />}
          {page === "ai" && <AiUsage />}
          {page === "logs" && <Logs />}
          {page === "settings" && <Settings />}
          {page === "profile" && <ProfilePage />}
        </div>
      </div>
    </div>
  );
}
