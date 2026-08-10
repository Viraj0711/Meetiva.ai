const fs = require('fs');
let src = fs.readFileSync('/workspaces/default/code/src/app/App.tsx', 'utf8');

// ── 1. Add sonner import ─────────────────────────────────────────────────────
src = src.replace(
  `import React, { useState, useMemo, useRef, useEffect } from "react";`,
  `import React, { useState, useMemo, useRef, useEffect } from "react";
import { toast, Toaster } from "sonner";`
);

// ── 2. Add Toaster to App root ───────────────────────────────────────────────
src = src.replace(
  `  return (
    <div className="h-screen bg-[#F5FEFF] overflow-hidden" style={{ fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <Sidebar current={page} onNav={setPage} />`,
  `  return (
    <div className="h-screen bg-[#F5FEFF] overflow-hidden" style={{ fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <Toaster position="bottom-right" richColors closeButton />
      <Sidebar current={page} onNav={setPage} />`
);

// ── 3. TopBar — pass setPage / nav to bell ───────────────────────────────────
// TopBar receives no props currently; we'll just wire the bell to a toast
src = src.replace(
  `function TopBar() {`,
  `function TopBar({ onNav }: { onNav?: (p: Page) => void }) {`
);
// Wire bell button
src = src.replace(
  `className="relative w-8 h-8 rounded-xl bg-white border border-[#EDF7F9] flex items-center justify-center text-[#6B7280] hover:border-[#06B6D4] hover:text-[#06B6D4] transition-all cursor-pointer">
              <Bell size={15} />`,
  `onClick={() => toast.info("You have 3 unread notifications")}
              className="relative w-8 h-8 rounded-xl bg-white border border-[#EDF7F9] flex items-center justify-center text-[#6B7280] hover:border-[#06B6D4] hover:text-[#06B6D4] transition-all cursor-pointer">
              <Bell size={15} />`
);
// Pass onNav to TopBar in App
src = src.replace(
  `<TopBar />`,
  `<TopBar onNav={setPage} />`
);

// ── 4. Dashboard — pass setPage as prop ─────────────────────────────────────
src = src.replace(
  `function Dashboard() {`,
  `function Dashboard({ onNav }: { onNav: (p: Page) => void }) {`
);
src = src.replace(
  `{page === "dashboard" && <Dashboard />}`,
  `{page === "dashboard" && <Dashboard onNav={setPage} />}`
);

// Quick Actions — wire each to correct page or toast
src = src.replace(
  `{ icon: Plus,       label: "Add User",         color: "#06B6D4", bg: "#EFF9FB",  onClick: () => {} },
    { icon: Users2,     label: "Create Team",       color: "#4F46E5", bg: "#EEF2FF", onClick: () => {} },
    { icon: BarChart3,  label: "View Reports",      color: "#10B981", bg: "#F0FDF4", onClick: () => {} },
    { icon: ScrollText, label: "System Logs",       color: "#6B7280", bg: "#F9FAFB", onClick: () => {} },
    { icon: Brain,      label: "AI Usage",          color: "#06B6D4", bg: "#EFF9FB",  onClick: () => {} },
    { icon: HardDrive,  label: "Storage",           color: "#EF4444", bg: "#FEF2F2", onClick: () => {} },
    { icon: Shield,     label: "Security",          color: "#F59E0B", bg: "#FFFBEB", onClick: () => {} },
    { icon: Settings,   label: "Settings",          color: "#64748B", bg: "#F9FAFB", onClick: () => {} },`,
  `{ icon: Plus,       label: "Add User",         color: "#06B6D4", bg: "#EFF9FB",  onClick: () => onNav("users") },
    { icon: Users2,     label: "Create Team",       color: "#4F46E5", bg: "#EEF2FF", onClick: () => onNav("teams") },
    { icon: BarChart3,  label: "View Reports",      color: "#10B981", bg: "#F0FDF4", onClick: () => onNav("logs") },
    { icon: ScrollText, label: "System Logs",       color: "#6B7280", bg: "#F9FAFB", onClick: () => onNav("logs") },
    { icon: Brain,      label: "AI Usage",          color: "#06B6D4", bg: "#EFF9FB",  onClick: () => onNav("ai") },
    { icon: HardDrive,  label: "Storage",           color: "#EF4444", bg: "#FEF2F2", onClick: () => onNav("settings") },
    { icon: Shield,     label: "Security",          color: "#F59E0B", bg: "#FFFBEB", onClick: () => onNav("settings") },
    { icon: Settings,   label: "Settings",          color: "#64748B", bg: "#F9FAFB", onClick: () => onNav("settings") },`
);

// Dashboard "View all" Recent Activity
src = src.replace(
  `className="text-[12.5px] font-semibold text-[#06B6D4] hover:text-[#0891B2] cursor-pointer flex items-center gap-0.5">
                View all <ArrowRight size={10}/>`,
  `onClick={() => onNav("logs")} className="text-[12.5px] font-semibold text-[#06B6D4] hover:text-[#0891B2] cursor-pointer flex items-center gap-0.5">
                View all <ArrowRight size={10}/>`
);

// Dashboard chart "Details" links → navigate
src = src.replace(
  `className="text-[11px] font-semibold text-[#06B6D4] hover:text-[#0891B2] cursor-pointer flex items-center gap-0.5">
                      Details <ArrowRight size={10}/>
                    </button>
                  </div>
                </div>
              </div>

              {/* AI Usage */}`,
  `onClick={() => onNav("users")} className="text-[11px] font-semibold text-[#06B6D4] hover:text-[#0891B2] cursor-pointer flex items-center gap-0.5">
                      Details <ArrowRight size={10}/>
                    </button>
                  </div>
                </div>
              </div>

              {/* AI Usage */}`
);
src = src.replace(
  `className="text-[11px] font-semibold text-[#06B6D4] hover:text-[#0891B2] cursor-pointer flex items-center gap-0.5">
                      Details <ArrowRight size={10}/>
                    </button>
                  </div>
                </div>
              </div>

              {/* Storage Usage */}`,
  `onClick={() => onNav("ai")} className="text-[11px] font-semibold text-[#06B6D4] hover:text-[#0891B2] cursor-pointer flex items-center gap-0.5">
                      Details <ArrowRight size={10}/>
                    </button>
                  </div>
                </div>
              </div>

              {/* Storage Usage */}`
);
// Storage "Manage" link
src = src.replace(
  `className="text-[11px] font-semibold text-[#06B6D4] hover:text-[#0891B2] cursor-pointer flex items-center gap-0.5">
                      Manage <ArrowRight size={10}/>`,
  `onClick={() => onNav("settings")} className="text-[11px] font-semibold text-[#06B6D4] hover:text-[#0891B2] cursor-pointer flex items-center gap-0.5">
                      Manage <ArrowRight size={10}/>`
);

// ── 5. Users — wire remaining dead buttons ───────────────────────────────────
// "Add User" header button
src = src.replace(
  `className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#06B6D4] text-white text-[12.5px] font-semibold hover:bg-[#0891B2] transition-colors cursor-pointer shadow-sm">
              <Plus size={13} /> Add User`,
  `onClick={() => toast.success("Add User form coming soon")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#06B6D4] text-white text-[12.5px] font-semibold hover:bg-[#0891B2] transition-colors cursor-pointer shadow-sm">
              <Plus size={13} /> Add User`
);
// "Export" button
src = src.replace(
  `className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E5F4F7] bg-white text-[12.5px] font-semibold text-[#374151] hover:border-[#06B6D4] hover:text-[#06B6D4] transition-colors cursor-pointer shadow-sm">
              <Download size={13} /> Export`,
  `onClick={() => toast.success("Exporting users as CSV…")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E5F4F7] bg-white text-[12.5px] font-semibold text-[#374151] hover:border-[#06B6D4] hover:text-[#06B6D4] transition-colors cursor-pointer shadow-sm">
              <Download size={13} /> Export`
);
// "Sort" button (if exists without onClick)
src = src.replace(
  `className="flex items-center gap-1 px-2.5 py-2 rounded-xl border border-[#E5F4F7] bg-white text-[12px] font-medium text-[#64748B] hover:border-[#06B6D4] hover:text-[#06B6D4] transition-colors cursor-pointer">
              <ArrowUpRight size={13}/> Sort`,
  `onClick={() => toast.info("Sort options coming soon")} className="flex items-center gap-1 px-2.5 py-2 rounded-xl border border-[#E5F4F7] bg-white text-[12px] font-medium text-[#64748B] hover:border-[#06B6D4] hover:text-[#06B6D4] transition-colors cursor-pointer">
              <ArrowUpRight size={13}/> Sort`
);
// "View all" platform activity
src = src.replace(
  `className="text-[12px] font-semibold text-[#06B6D4] hover:text-[#0891B2] cursor-pointer transition-colors">View all</button>
          </div>
          <div className="relative">
            {/* Timeline line */}`,
  `onClick={() => toast.info("Full activity report coming soon")} className="text-[12px] font-semibold text-[#06B6D4] hover:text-[#0891B2] cursor-pointer transition-colors">View all</button>
          </div>
          <div className="relative">
            {/* Timeline line */}`
);
// "Reset Password" in row menu
src = src.replace(
  `<button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-[11.5px] font-medium text-[#374151] hover:bg-[#F5FEFF] transition-colors cursor-pointer">
                                  <Key size={12} className="text-[#94A3B8]" /> Reset Password`,
  `<button onClick={() => toast.success("Password reset email sent")} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-[11.5px] font-medium text-[#374151] hover:bg-[#F5FEFF] transition-colors cursor-pointer">
                                  <Key size={12} className="text-[#94A3B8]" /> Reset Password`
);
// "View Profile" in modal
src = src.replace(
  `<button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#06B6D4] text-white text-[12.5px] font-semibold hover:bg-[#0891B2] transition-colors cursor-pointer">
                    <Eye size={13} /> View Profile`,
  `<button onClick={() => toast.info("Full profile view coming soon")} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#06B6D4] text-white text-[12.5px] font-semibold hover:bg-[#0891B2] transition-colors cursor-pointer">
                    <Eye size={13} /> View Profile`
);
// "Reset Password" in modal
src = src.replace(
  `<button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E5F4F7] bg-white text-[12.5px] font-semibold text-[#475569] hover:border-[#06B6D4] hover:text-[#06B6D4] transition-colors cursor-pointer">
                    <Key size={13} /> Reset Password`,
  `<button onClick={() => toast.success("Password reset email sent")} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E5F4F7] bg-white text-[12.5px] font-semibold text-[#475569] hover:border-[#06B6D4] hover:text-[#06B6D4] transition-colors cursor-pointer">
                    <Key size={13} /> Reset Password`
);

// ── 6. Teams — wire dead buttons ─────────────────────────────────────────────
// "Create Team" header
src = src.replace(
  `className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#06B6D4] text-white text-[12.5px] font-bold hover:bg-[#0891B2] transition-colors cursor-pointer shadow-sm">
            <Plus size={14} /> Create Team`,
  `onClick={() => toast.success("Create Team form coming soon")} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#06B6D4] text-white text-[12.5px] font-bold hover:bg-[#0891B2] transition-colors cursor-pointer shadow-sm">
            <Plus size={14} /> Create Team`
);
// "Open Workspace" in modal
src = src.replace(
  `<button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#06B6D4] text-white text-[12.5px] font-semibold hover:bg-[#0891B2] transition-colors cursor-pointer">
                    <Globe size={13} /> Open Workspace`,
  `<button onClick={() => toast.info("Opening workspace dashboard…")} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#06B6D4] text-white text-[12.5px] font-semibold hover:bg-[#0891B2] transition-colors cursor-pointer">
                    <Globe size={13} /> Open Workspace`
);
// "Manage Members" in modal
src = src.replace(
  `<button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E5F4F7] bg-white text-[12.5px] font-semibold text-[#475569] hover:border-[#06B6D4] hover:text-[#06B6D4] transition-colors cursor-pointer">
                    <Users size={13} /> Manage Members`,
  `<button onClick={() => toast.info("Member management coming soon")} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E5F4F7] bg-white text-[12.5px] font-semibold text-[#475569] hover:border-[#06B6D4] hover:text-[#06B6D4] transition-colors cursor-pointer">
                    <Users size={13} /> Manage Members`
);
// Teams "View all" activity
src = src.replace(
  `className="text-[12px] font-semibold text-[#06B6D4] hover:text-[#0891B2] cursor-pointer transition-colors">View all</button>
          </div>
          <div className="relative">
            <div className="absolute top-4 left-0 right-0 h-px bg-[#EDF7F9]" />`,
  `onClick={() => toast.info("Full activity report coming soon")} className="text-[12px] font-semibold text-[#06B6D4] hover:text-[#0891B2] cursor-pointer transition-colors">View all</button>
          </div>
          <div className="relative">
            <div className="absolute top-4 left-0 right-0 h-px bg-[#EDF7F9]" />`
);

// ── 7. AI Usage — "Refresh" ──────────────────────────────────────────────────
src = src.replace(
  `className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5F4F7] bg-white text-[11.5px] font-semibold text-[#475569] hover:border-[#06B6D4] cursor-pointer transition-colors">
              <RefreshCw size={12} /> Refresh`,
  `onClick={() => toast.success("Refreshing model requests…")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5F4F7] bg-white text-[11.5px] font-semibold text-[#475569] hover:border-[#06B6D4] cursor-pointer transition-colors">
              <RefreshCw size={12} /> Refresh`
);

// ── 8. Logs — wire dead buttons ──────────────────────────────────────────────
// Export Logs
src = src.replace(
  `className="flex items-center gap-2 text-[12.5px] font-semibold text-[#374151] bg-white border border-[#E5F4F7] rounded-xl px-4 py-2.5 hover:border-[#C8E8F2] shadow-sm cursor-pointer">
              <Download size={14}/> Export Logs`,
  `onClick={() => toast.success("Exporting logs as CSV…")} className="flex items-center gap-2 text-[12.5px] font-semibold text-[#374151] bg-white border border-[#E5F4F7] rounded-xl px-4 py-2.5 hover:border-[#C8E8F2] shadow-sm cursor-pointer">
              <Download size={14}/> Export Logs`
);
// "Columns" button
src = src.replace(
  `className="flex items-center gap-1.5 text-[11.5px] font-medium text-[#64748B] hover:text-[#374151] px-3 py-2 cursor-pointer ml-2 shrink-0">
                  <MoreHorizontal size={14}/> Columns`,
  `onClick={() => toast.info("Column customisation coming soon")} className="flex items-center gap-1.5 text-[11.5px] font-medium text-[#64748B] hover:text-[#374151] px-3 py-2 cursor-pointer ml-2 shrink-0">
                  <MoreHorizontal size={14}/> Columns`
);
// "View Full Details" in log modal
src = src.replace(
  `<button className="flex items-center gap-1.5 text-[13px] font-semibold text-[#06B6D4] hover:text-[#0891B2] cursor-pointer transition-colors">
                    View Full Details <ArrowUpRight size={13}/>`,
  `<button onClick={() => toast.info("Detailed log view coming soon")} className="flex items-center gap-1.5 text-[13px] font-semibold text-[#06B6D4] hover:text-[#0891B2] cursor-pointer transition-colors">
                    View Full Details <ArrowUpRight size={13}/>`
);
// "View Full Report" (Top Active Hours)
src = src.replace(
  `<button className="text-[11px] font-semibold text-[#06B6D4] hover:text-[#0891B2] cursor-pointer transition-colors flex items-center gap-0.5">
                    View Full Report<ArrowRight size={10}/>`,
  `<button onClick={() => toast.info("Full report coming soon")} className="text-[11px] font-semibold text-[#06B6D4] hover:text-[#0891B2] cursor-pointer transition-colors flex items-center gap-0.5">
                    View Full Report<ArrowRight size={10}/>`
);
// "View All" Logs by Type
src = src.replace(
  `<button className="text-[11.5px] font-semibold text-[#06B6D4] hover:text-[#0891B2] cursor-pointer">View All</button>`,
  `<button onClick={() => toast.info("Full log type breakdown coming soon")} className="text-[11.5px] font-semibold text-[#06B6D4] hover:text-[#0891B2] cursor-pointer">View All</button>`
);

// ── 9. Settings — wire all "Save" and danger buttons via Btn component ────────
// The Btn component renders a <button>. Settings uses <Btn> with no onClick.
// Find Save buttons pattern and wire them
const savePatterns = [
  ['Save Changes</Btn>\n            </div>\n          </div>\n\n          {/* Localization', 'Platform identity saved'],
  ['Save Changes</Btn>\n            </div>\n          </div>\n\n          {/* Danger', 'Localisation settings saved'],
  ['Save AI Settings</Btn>', 'AI settings saved'],
  ['Save Storage Settings</Btn>', 'Storage settings saved'],
  ['Save Upload Settings</Btn>', 'Upload settings saved'],
  ['Save Billing Settings</Btn>', 'Billing settings saved'],
];

// Instead of patching Btn usage, let's patch the Btn component itself to accept onClick
src = src.replace(
  `function Btn({ children, variant = "primary", size = "sm", danger = false }: {`,
  `function Btn({ children, variant = "primary", size = "sm", danger = false, onClick }: {`
);
src = src.replace(
  `  children: React.ReactNode; variant?: "primary"|"secondary"|"ghost"; size?: "sm"|"md"; danger?: boolean`,
  `  children: React.ReactNode; variant?: "primary"|"secondary"|"ghost"; size?: "sm"|"md"; danger?: boolean; onClick?: () => void`
);
src = src.replace(
  `  return <button className={cls}>`,
  `  return <button className={cls} onClick={onClick}>`
);

// Now patch the individual Save / Danger buttons in Settings
// Save platform identity
src = src.replace(
  `<Btn>Save Changes</Btn>\n            </div>\n          </div>\n\n          {/* Localization`,
  `<Btn onClick={() => toast.success("Platform settings saved")}>Save Changes</Btn>\n            </div>\n          </div>\n\n          {/* Localization`
);
// Save localization
src = src.replace(
  `<Btn>Save Changes</Btn>\n            </div>\n          </div>\n\n          {/* Danger`,
  `<Btn onClick={() => toast.success("Localisation settings saved")}>Save Changes</Btn>\n            </div>\n          </div>\n\n          {/* Danger`
);
src = src.replace(
  `<Btn>Save AI Settings</Btn>`,
  `<Btn onClick={() => toast.success("AI settings saved")}>Save AI Settings</Btn>`
);
src = src.replace(
  `<Btn>Save Storage Settings</Btn>`,
  `<Btn onClick={() => toast.success("Storage settings saved")}>Save Storage Settings</Btn>`
);
src = src.replace(
  `<Btn>Save Upload Settings</Btn>`,
  `<Btn onClick={() => toast.success("Upload settings saved")}>Save Upload Settings</Btn>`
);
src = src.replace(
  `<Btn>Save Billing Settings</Btn>`,
  `<Btn onClick={() => toast.success("Billing settings saved")}>Save Billing Settings</Btn>`
);

// Maintenance action buttons
src = src.replace(
  `<Btn variant="secondary">Rebuild Search Indexes</Btn>`,
  `<Btn variant="secondary" onClick={() => toast.success("Rebuilding search indexes…")}>Rebuild Search Indexes</Btn>`
);
src = src.replace(
  `<Btn variant="secondary">Flush Cache</Btn>`,
  `<Btn variant="secondary" onClick={() => toast.success("Cache flushed successfully")}>Flush Cache</Btn>`
);
src = src.replace(
  `<Btn variant="secondary">Force Sync Storage</Btn>`,
  `<Btn variant="secondary" onClick={() => toast.success("Storage sync initiated")}>Force Sync Storage</Btn>`
);

// Danger zone buttons in Settings
src = src.replace(
  `<Btn danger>Reset All Settings</Btn>`,
  `<Btn danger onClick={() => toast.error("All settings reset to defaults")}>Reset All Settings</Btn>`
);
src = src.replace(
  `<Btn danger>Purge All Logs</Btn>`,
  `<Btn danger onClick={() => toast.error("All logs purged")}>Purge All Logs</Btn>`
);
src = src.replace(
  `<Btn danger>Export & Delete All Data</Btn>`,
  `<Btn danger onClick={() => toast.error("Data export and deletion initiated")}>Export & Delete All Data</Btn>`
);

fs.writeFileSync('/workspaces/default/code/src/app/App.tsx', src, 'utf8');

const open = (src.match(/{/g)||[]).length;
const close = (src.match(/}/g)||[]).length;
console.log('Done. Lines:', src.split('\n').length);
console.log('Brace diff:', open - close, open === close ? '✓' : '✗');

// Count toasts wired
const toastCount = (src.match(/toast\.(success|info|error)/g)||[]).length;
console.log('Toast calls wired:', toastCount);
console.log('Toaster present:', src.includes('<Toaster'));
