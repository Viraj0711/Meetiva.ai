import { useState } from "react";
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
import { getToken } from "@/lib/api";
import type { Page } from "@/types";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!getToken());
  const [page, setPage] = useState<Page>("dashboard");

  if (!isLoggedIn) {
    return (
      <>
        <Toaster position="bottom-right" richColors closeButton />
        <LoginPage onLogin={() => setIsLoggedIn(true)} />
      </>
    );
  }

  return (
    <div className="h-screen bg-[#F5FEFF] overflow-hidden" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <Toaster position="bottom-right" richColors closeButton />
      <Sidebar current={page} onNav={setPage} />
      <div className="ml-[210px] h-full flex flex-col">
        <TopBar onNav={setPage} onLogout={() => setIsLoggedIn(false)} />
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
