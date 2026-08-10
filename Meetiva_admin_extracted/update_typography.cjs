const fs = require('fs');
let src = fs.readFileSync('/workspaces/default/code/src/app/App.tsx', 'utf8');

// ── 1. Navigation links ──────────────────────────────────────────────────────
// Nav items: text-[13px] → text-[14px] + ensure font-medium (inactive) / font-semibold (active)
// The nav item className uses template literals — find the pattern
src = src.replace(
  /className={`w-full flex items-center gap-3 px-3 py-2\.5 rounded-xl text-\[13px\] transition-all duration-150 cursor-pointer \${/,
  'className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl meetiva-nav transition-all duration-150 cursor-pointer ${'
);

// ── 2. Sidebar brand ─────────────────────────────────────────────────────────
src = src.replace(
  /"text-\[13\.5px\] font-bold text-\[#0F172A\] leading-tight"/,
  '"text-[14px] font-semibold text-[#0F172A] leading-tight"'
);
src = src.replace(
  /"text-\[10px\] text-\[#94A3B8\] leading-tight"/,
  '"meetiva-caption text-[#94A3B8] leading-tight"'
);

// ── 3. Sidebar AI promo ──────────────────────────────────────────────────────
src = src.replace(
  /"text-\[12px\] font-bold text-\[#0F172A\]"/,
  '"text-[14px] font-semibold text-[#0F172A]"'
);
src = src.replace(
  /"text-\[10\.5px\] text-\[#64748B\] mb-2\.5 leading-snug"/,
  '"meetiva-caption text-[#64748B] mb-2.5 leading-snug"'
);
src = src.replace(
  /"w-full py-1\.5 rounded-xl bg-\[#06B6D4\] text-white text-\[11\.5px\] font-semibold hover:bg-\[#0891B2\] transition-colors cursor-pointer"/,
  '"w-full py-1.5 rounded-xl bg-[#06B6D4] text-white meetiva-caption font-semibold hover:bg-[#0891B2] transition-colors cursor-pointer"'
);

// ── 4. Sidebar user profile ──────────────────────────────────────────────────
src = src.replace(
  /"text-\[12px\] font-semibold text-\[#0F172A\] truncate"/,
  '"text-[14px] font-semibold text-[#0F172A] truncate"'
);
src = src.replace(
  /"text-\[10px\] text-\[#94A3B8\] truncate"/g,
  '"meetiva-caption text-[#94A3B8] truncate"'
);

// ── 5. Top bar ───────────────────────────────────────────────────────────────
// Date string
src = src.replace(
  /"text-\[11\.5px\] font-mono text-\[#94A3B8\] hidden lg:block"/,
  '"meetiva-caption font-mono text-[#94A3B8] hidden lg:block"'
);
// Top bar admin name
src = src.replace(
  /"text-\[12px\] font-semibold text-\[#0F172A\] hidden sm:block"/,
  '"text-[14px] font-semibold text-[#0F172A] hidden sm:block"'
);
// Search input in top bar
src = src.replace(
  /"w-full pl-9 pr-4 py-2 text-\[12\.5px\] bg-\[#F8FDFE\] border border-\[#EDF7F9\] rounded-xl outline-none focus:border-\[#06B6D4\] focus:ring-2 focus:ring-\[#06B6D4\]\/10 placeholder:text-\[#B0C4CB\] text-\[#0F172A\] transition-all"/,
  '"w-full pl-9 pr-4 py-2 meetiva-small bg-[#F8FDFE] border border-[#EDF7F9] rounded-xl outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/10 placeholder:text-[#B0C4CB] text-[#0F172A] transition-all"'
);

// ── 6. Section labels in section headers (e.g. "Today", "Settings") ──────────
src = src.replace(
  /"text-\[10px\] font-mono tracking-tight font-medium text-\[#94A3B8\] uppercase tracking-widest"/,
  '"meetiva-caption font-medium text-[#94A3B8] uppercase tracking-widest"'
);

// ── 7. KPI stat card values ───────────────────────────────────────────────────
// BigStatCard value: text-[26px] font-bold → meetiva-h3 (28px/600)
src = src.replace(
  /"text-\[26px\] font-bold text-\[#0F172A\] tracking-\[-0\.02em\] leading-none mb-2"/g,
  '"meetiva-h3 text-[#0F172A] leading-none mb-2"'
);

// ── 8. KPI card labels (caption above value) ─────────────────────────────────
src = src.replace(
  /"text-\[10px\] font-semibold text-\[#94A3B8\] uppercase tracking-\[0\.12em\] truncate"/g,
  '"meetiva-caption font-semibold text-[#94A3B8] uppercase tracking-[0.12em] truncate"'
);

// ── 9. KPI card sub/trend text ────────────────────────────────────────────────
src = src.replace(
  /"text-xs text-\[#94A3B8\] mt-0\.5 font-mono tracking-tight"/,
  '"meetiva-caption text-[#94A3B8] mt-0.5 font-mono"'
);
src = src.replace(
  /"text-\[11px\] font-mono text-\[#94A3B8\] truncate"/g,
  '"meetiva-caption font-mono text-[#94A3B8] truncate"'
);
src = src.replace(
  /"flex items-center gap-0\.5 text-\[10\.5px\] font-bold flex-shrink-0 tabular-nums \${trendUp \? "text-emerald-600" : "text-red-500"}"/,
  '"flex items-center gap-0.5 meetiva-caption font-bold flex-shrink-0 tabular-nums ${trendUp ? "text-emerald-600" : "text-red-500"}"'
);

// ── 10. Card section headings (card titles throughout app) ───────────────────
// text-[13.5px] font-bold → text-[15px] font-semibold (Body Large / 600)
src = src.replace(
  /className="text-\[13\.5px\] font-bold text-\[#0F172A\]/g,
  'className="text-[15px] font-semibold text-[#0F172A]'
);
src = src.replace(
  /className="text-\[13\.5px\] font-bold text-\[#111827\]/g,
  'className="text-[15px] font-semibold text-[#111827]'
);
src = src.replace(
  /className="text-\[14px\] font-bold text-\[#111827\]/g,
  'className="text-[15px] font-semibold text-[#111827]'
);
src = src.replace(
  /className="text-\[13px\] font-bold text-\[#0F172A\]/g,
  'className="text-[14px] font-semibold text-[#0F172A]'
);

// ── 11. Page titles (h1-level) ───────────────────────────────────────────────
// text-[22px] font-bold → meetiva-title (22px/600)
src = src.replace(
  /className="text-\[22px\] font-bold text-\[#111827\] tracking-tight"/g,
  'className="meetiva-title text-[#111827] tracking-tight"'
);
src = src.replace(
  /className="text-\[22px\] font-bold text-\[#0F172A\] tracking-tight"/g,
  'className="meetiva-title text-[#0F172A] tracking-tight"'
);

// ── 12. Table header labels (th) → caption ───────────────────────────────────
src = src.replace(
  /"text-\[11px\] font-semibold text-\[#64748B\]/g,
  '"meetiva-caption font-semibold text-[#64748B]'
);
src = src.replace(
  /"text-\[11px\] font-medium text-\[#64748B\]/g,
  '"meetiva-caption font-medium text-[#64748B]'
);

// ── 13. Pill / badge text → caption ──────────────────────────────────────────
src = src.replace(
  /"text-\[11px\] font-medium font-mono tracking-tight \${statusStyles\[variant\]}"/,
  '"meetiva-caption font-medium font-mono tracking-tight ${statusStyles[variant]}"'
);

// ── 14. AI chat messages ──────────────────────────────────────────────────────
src = src.replace(
  /text-\[11\.5px\] leading-relaxed \${/g,
  'meetiva-caption leading-relaxed ${'
);

// ── 15. Section subheadings (subtitle under page title) ──────────────────────
src = src.replace(
  /className="text-\[13px\] text-\[#94A3B8\] mt-0\.5"/g,
  'className="meetiva-small text-[#94A3B8] mt-0.5"'
);
src = src.replace(
  /className="text-\[13px\] text-\[#64748B\] mt-1"/g,
  'className="meetiva-small text-[#64748B] mt-1"'
);

// ── 16. Card body text / descriptions ────────────────────────────────────────
src = src.replace(
  /"text-\[11\.5px\] text-\[#374151\] leading-snug flex-1"/g,
  '"meetiva-caption text-[#374151] leading-snug flex-1"'
);
src = src.replace(
  /className="text-\[11\.5px\] text-\[#374151\] leading-snug"/g,
  'className="meetiva-caption text-[#374151] leading-snug"'
);

// ── 17. Card chart sub-labels ─────────────────────────────────────────────────
src = src.replace(
  /className="text-\[11px\] text-\[#94A3B8\] mb-3"/g,
  'className="meetiva-caption text-[#94A3B8] mb-3"'
);

// ── 18. Buttons with explicit size overrides → keep but ensure weight ─────────
// "View X" buttons typically text-[11px] → meetiva-caption font-semibold
src = src.replace(
  /"text-\[11px\] font-semibold text-\[#06B6D4\] hover:text-\[#0891B2\] cursor-pointer flex items-center gap-0\.5"/g,
  '"meetiva-caption font-semibold text-[#06B6D4] hover:text-[#0891B2] cursor-pointer flex items-center gap-0.5"'
);
src = src.replace(
  /"text-\[11px\] font-semibold text-\[#06B6D4\] hover:text-\[#0891B2\] cursor-pointer"/g,
  '"meetiva-caption font-semibold text-[#06B6D4] hover:text-[#0891B2] cursor-pointer"'
);

// ── 19. Quick action labels ───────────────────────────────────────────────────
src = src.replace(
  /"text-\[10\.5px\] font-semibold text-\[#374151\] text-center leading-tight group-hover:text-\[#0F172A\]"/g,
  '"meetiva-caption font-semibold text-[#374151] text-center leading-tight group-hover:text-[#0F172A]"'
);
src = src.replace(
  /"text-\[10\.5px\] font-semibold text-\[#374151\] text-center leading-tight group-hover:text-\[#111827\]"/g,
  '"meetiva-caption font-semibold text-[#374151] text-center leading-tight group-hover:text-[#111827]"'
);

// ── 20. Settings section headings ────────────────────────────────────────────
src = src.replace(
  /className="text-\[16px\] font-bold text-\[#0F172A\]/g,
  'className="meetiva-body-lg font-semibold text-[#0F172A]'
);

fs.writeFileSync('/workspaces/default/code/src/app/App.tsx', src, 'utf8');

const open = (src.match(/{/g)||[]).length;
const close = (src.match(/}/g)||[]).length;
console.log('Done. Lines:', src.split('\n').length);
console.log('Brace diff:', open - close, open === close ? '✓' : '✗');

// Count how many meetiva-* classes are now in the file
const meetivaCount = (src.match(/meetiva-/g)||[]).length;
console.log('meetiva-* class usages:', meetivaCount);
