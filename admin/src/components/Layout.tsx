import React, { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import {
  LayoutDashboard, Users, Users2, Brain, ScrollText, Settings,
  Bell, Search, LogOut, ChevronDown, User, Building2, Pencil,
} from "lucide-react";
import { authApi, clearToken } from "@/lib/api";
import type { Page } from "@/types";

const sidebarNav: { id: Page; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: Users },
  { id: "teams", label: "Teams", icon: Users2 },
  { id: "organization", label: "Organization", icon: Building2 },
  { id: "ai", label: "AI Usage", icon: Brain },
  { id: "logs", label: "Logs", icon: ScrollText },
  { id: "settings", label: "Settings", icon: Settings },
];

export function Sidebar({ current, onNav }: { current: Page; onNav: (p: Page) => void }) {
  const profileActive = current === "profile";

  return (
    <aside className="fixed left-0 top-0 h-screen flex flex-col bg-white border-r border-[#EDF7F9] z-50" style={{ width: "210px" }}>
      <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-[#EDF7F9]">
        <div className="w-8 h-8 rounded-xl bg-[#06B6D4] flex items-center justify-center flex-shrink-0 shadow-sm shadow-[#06B6D4]/25">
          <span className="text-white font-bold text-[15px]">M</span>
        </div>
        <div>
          <div className="text-[14px] font-semibold text-[#0F172A] leading-tight">Meetiva</div>
          <div className="text-[12px] font-medium text-[#94A3B8] leading-tight">Admin Console</div>
        </div>
      </div>

      <nav className="flex-1 py-3 px-3 overflow-y-auto">
        <ul className="space-y-0.5">
          {sidebarNav.map(({ id, label, icon: Icon }) => {
            const active = current === id;
            return (
              <li key={id}>
                <button
                  onClick={() => onNav(id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all duration-150 cursor-pointer ${
                    active
                      ? "bg-[#EFF9FB] text-[#06B6D4] font-semibold"
                      : "text-[#64748B] hover:bg-[#F8FDFE] hover:text-[#0F172A]"
                  }`}
                >
                  <Icon size={15} className="flex-shrink-0" />
                  <span>{label}</span>
                  {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#06B6D4] flex-shrink-0" />}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <button
        onClick={() => onNav("profile")}
        className={`flex items-center gap-2.5 px-4 py-3 border-t border-[#EDF7F9] transition-colors cursor-pointer w-full text-left group ${profileActive ? "bg-[#EFF9FB]" : "hover:bg-[#F8FDFE]"}`}
      >
        <div className={`w-7 h-7 rounded-full text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 ${profileActive ? "bg-[#06B6D4]" : "bg-[#4F46E5]"}`}>SA</div>
        <div className="flex-1 min-w-0">
          <div className={`text-[14px] font-semibold truncate transition-colors ${profileActive ? "text-[#06B6D4]" : "text-[#0F172A] group-hover:text-[#06B6D4]"}`}>Super Admin</div>
          <div className="text-[12px] font-medium text-[#94A3B8] truncate">admin@meetiva.com</div>
        </div>
        <Pencil size={11} className={`flex-shrink-0 transition-colors ${profileActive ? "text-[#06B6D4]" : "text-[#CBD5E1] group-hover:text-[#06B6D4]"}`} />
      </button>
    </aside>
  );
}

export function TopBar({ onNav, onLogout }: { onNav?: (p: Page) => void; onLogout?: () => void }) {
  const dateStr = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const [searchVal, setSearchVal] = useState("");
  const [searchFocus, setSearchFocus] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const adminRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (adminRef.current && !adminRef.current.contains(e.target as Node)) setAdminOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const notifications = [
    { id: 1, icon: Bell, color: "#EF4444", bg: "#FEE2E2", title: "API rate limit hit", sub: "Workspace NordicCo · 8 min ago", read: false },
    { id: 2, icon: Bell, color: "#F59E0B", bg: "#FEF3C7", title: "Failed login attempts", sub: "user@latamhub.io · 22 min ago", read: false },
    { id: 3, icon: Bell, color: "#10B981", bg: "#D1FAE5", title: "Maintenance completed", sub: "DB01 server · 1 hr ago", read: false },
  ];

  return (
    <div className="flex items-center gap-4 px-6 py-3.5 border-b border-[#EDF7F9] bg-white flex-shrink-0">
      <div className="relative flex-1 max-w-sm" onClick={e => e.stopPropagation()}>
        <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
        <input
          value={searchVal}
          onChange={e => { setSearchVal(e.target.value); setSearchFocus(true); }}
          onFocus={() => setSearchFocus(true)}
          onBlur={() => setTimeout(() => setSearchFocus(false), 150)}
          onKeyDown={e => {
            if (e.key === "Enter" && searchVal.trim()) {
              const dest = searchVal.toLowerCase().includes("team") ? "teams"
                : searchVal.toLowerCase().includes("log") ? "logs"
                : searchVal.toLowerCase().includes("ai") ? "ai"
                : searchVal.toLowerCase().includes("setting") ? "settings"
                : "users";
              onNav?.(dest as Page);
              setSearchVal(""); setSearchFocus(false);
            }
            if (e.key === "Escape") { setSearchVal(""); setSearchFocus(false); }
          }}
          className="w-full pl-9 pr-4 py-2 text-[14px] bg-[#F8FDFE] border border-[#EDF7F9] rounded-xl outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/10 placeholder:text-[#B0C4CB] text-[#0F172A] transition-all"
          placeholder="Search users, teams, meetings, logs…"
        />
        {searchVal.trim() && searchFocus && (() => {
          const q = searchVal.toLowerCase();
          const userHits = [
            { id:"u1", name:"Sarah Chen", email:"sarah.chen@acme.com", page:"users" as Page },
            { id:"u2", name:"Marcus Williams", email:"m.williams@orion.io", page:"users" as Page },
          ].filter(u => u.name.toLowerCase().includes(q) || u.email.includes(q));
          const pageHits = [
            { label:"Users", icon:"\u{1F465}", page:"users" as Page },
            { label:"Teams", icon:"\u{1F3E2}", page:"teams" as Page },
            { label:"AI Usage", icon:"\u{1F916}", page:"ai" as Page },
            { label:"Logs", icon:"\u{1F4CB}", page:"logs" as Page },
            { label:"Settings", icon:"\u{2699}\u{FE0F}", page:"settings" as Page },
          ].filter(p => p.label.toLowerCase().includes(q));
          const allHits = [...userHits.slice(0,4), ...pageHits.slice(0,3)];
          if (!allHits.length) return null;
          return (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E5F4F7] rounded-2xl shadow-2xl z-[100] overflow-hidden">
              {userHits.slice(0,4).length > 0 && (
                <>
                  <p className="px-3 pt-2.5 pb-1 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Users</p>
                  {userHits.slice(0,4).map(u => (
                    <button key={u.id}
                      onMouseDown={() => { onNav?.(u.page); setSearchVal(""); setSearchFocus(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[#F8FDFE] transition-colors cursor-pointer text-left">
                      <div className="w-6 h-6 rounded-full bg-[#4F46E5] text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0">
                        {u.name.split(" ").map(w=>w[0]).join("").slice(0,2)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[12px] font-semibold text-[#0F172A] truncate">{u.name}</p>
                        <p className="text-[10.5px] text-[#94A3B8] truncate">{u.email}</p>
                      </div>
                    </button>
                  ))}
                </>
              )}
              {pageHits.slice(0,3).length > 0 && (
                <>
                  <p className="px-3 pt-2 pb-1 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider border-t border-[#F1F9FB] mt-1">Pages</p>
                  {pageHits.slice(0,3).map(p => (
                    <button key={p.page}
                      onMouseDown={() => { onNav?.(p.page); setSearchVal(""); setSearchFocus(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[#F8FDFE] transition-colors cursor-pointer text-left">
                      <span className="text-base">{p.icon}</span>
                      <span className="text-[12px] font-medium text-[#374151]">{p.label}</span>
                    </button>
                  ))}
                </>
              )}
              <p className="px-3 py-2 text-[10.5px] text-[#94A3B8] border-t border-[#F1F9FB]">Press Enter to navigate</p>
            </div>
          );
        })()}
      </div>

      <div className="flex items-center gap-2.5 ml-auto">
        <span className="text-[12px] font-medium font-mono text-[#94A3B8] hidden lg:block">{dateStr}</span>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F0FAFE] border border-[#D9F2F8]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4] animate-pulse" />
          <span className="text-[11px] font-bold text-[#06B6D4]">{notifications.filter(n => !n.read).length}</span>
        </div>

        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setNotifOpen(o => !o); setAdminOpen(false); }}
            className="relative w-8 h-8 rounded-xl bg-white border border-[#EDF7F9] flex items-center justify-center text-[#6B7280] hover:border-[#06B6D4] hover:text-[#06B6D4] transition-all cursor-pointer">
            <Bell size={14} />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#EF4444] rounded-full border-2 border-white" />
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-[320px] bg-white border border-[#E5F4F7] rounded-2xl shadow-2xl z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 pt-3.5 pb-2 border-b border-[#EDF7F9]">
                <span className="text-[13px] font-bold text-[#0F172A]">Notifications</span>
                <button onClick={() => { toast.success("All notifications marked as read"); setNotifOpen(false); }}
                  className="text-[11px] font-semibold text-[#06B6D4] hover:text-[#0891B2] cursor-pointer transition-colors">Mark all read</button>
              </div>
              <div className="divide-y divide-[#F1F9FB]">
                {notifications.map(n => (
                  <div key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-[#F8FDFE] transition-colors cursor-pointer" onClick={() => { toast.info(n.title); setNotifOpen(false); }}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: n.bg }}>
                      <n.icon size={13} style={{ color: n.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12.5px] font-semibold text-[#0F172A] leading-snug">{n.title}</p>
                      <p className="text-[11px] text-[#94A3B8] mt-0.5">{n.sub}</p>
                    </div>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-[#06B6D4] flex-shrink-0 mt-1.5" />}
                  </div>
                ))}
              </div>
              <div className="px-4 py-3 border-t border-[#EDF7F9]">
                <button onClick={() => { onNav?.("logs"); setNotifOpen(false); }}
                  className="w-full text-center text-[12px] font-semibold text-[#06B6D4] hover:text-[#0891B2] cursor-pointer transition-colors">
                  View all in Logs →
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={adminRef}>
          <button
            onClick={() => { setAdminOpen(o => !o); setNotifOpen(false); }}
            className="flex items-center gap-2 px-2.5 py-1.5 bg-white border border-[#EDF7F9] rounded-xl cursor-pointer hover:border-[#06B6D4] transition-all">
            <div className="w-6 h-6 rounded-full bg-[#4F46E5] text-white text-[9px] font-bold flex items-center justify-center">SA</div>
            <span className="text-[14px] font-semibold text-[#0F172A] hidden sm:block">Super Admin</span>
            <ChevronDown size={11} className={`text-[#94A3B8] transition-transform duration-200 ${adminOpen ? "rotate-180" : ""}`} />
          </button>
          {adminOpen && (
            <div className="absolute right-0 top-full mt-2 w-[200px] bg-white border border-[#E5F4F7] rounded-2xl shadow-2xl z-50 overflow-hidden py-1.5">
              {[
                { label: "My Profile", icon: User, page: "profile" as Page },
                { label: "Settings", icon: Settings, page: "settings" as Page },
              ].map(item => (
                <button key={item.label}
                  onClick={() => { onNav?.(item.page); setAdminOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#374151] hover:bg-[#F8FDFE] hover:text-[#06B6D4] transition-colors cursor-pointer">
                  <item.icon size={13} className="text-[#94A3B8]" /> {item.label}
                </button>
              ))}
              <div className="mx-3 my-1 border-t border-[#EDF7F9]" />
              <button
                onClick={async () => {
                  try { await authApi.logout(); } catch {}
                  clearToken();
                  setAdminOpen(false);
                  onLogout?.();
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#EF4444] hover:bg-[#FEF2F2] transition-colors cursor-pointer">
                <LogOut size={13} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
