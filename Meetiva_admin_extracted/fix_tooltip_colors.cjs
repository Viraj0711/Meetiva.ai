const fs = require('fs');
let src = fs.readFileSync('/workspaces/default/code/src/app/App.tsx', 'utf8');

// ── 1. Fix Dashboard scroll ──────────────────────────────────────────────────
// The main tag has overflow-hidden which clips the dashboard
// Change Dashboard outer div from min-h-screen to h-full overflow-y-auto
src = src.replace(
  `    <div className="min-h-screen bg-[#F5FEFF]">
      <div className="max-w-[1440px] mx-auto px-8 py-7 space-y-6">`,
  `    <div className="h-full overflow-y-auto bg-[#F5FEFF]" style={{scrollbarWidth:"none"}}>
      <div className="max-w-[1440px] mx-auto px-8 py-7 space-y-6">`
);

// ── 2. Theme all tooltip rect backgrounds (dark navy → white card) ──────────
// All tooltip rects use fill="#0F172A" opacity="0.95" or "0.96"
// Replace with white + themed shadow + border
// We do a global replace on the specific pattern in TipBox/tooltip contexts

// Pattern A: rx="9" fill="#0F172A" opacity="0.95" (OverviewAreaChart)
src = src.replace(
  /rx="([789])" fill="#0F172A" opacity="0\.\d+"/g,
  `rx="$1" fill="white" stroke="#D9F2F8" strokeWidth="1"`
);

// ── 3. Theme tooltip header text (date/label) from #64748B → themed teal ──
// In TipBox functions, the "header" text is the date/period label
// Pattern: fill="#64748B" fontSize="9..." in tooltip context
// The header texts inside TipBox look like:
//   fill="#64748B" fontSize="9.5" fontFamily="Inter,sans-serif">{d.label} · {period}
//   fill="#64748B" fontSize="9" fontFamily="Inter,sans-serif">{d.lbl}
// We need to be surgical - only change inside TipBox or tooltip <g> blocks

// Strategy: replace fill="#64748B" fontSize="9 (starts with 9) inside tooltip g blocks
// The tooltip <g> elements have pointerEvents="none" right at the start
// Let's use context-aware replacement by finding tooltip blocks

// Replace the date label text color in TipBox/tooltip contexts
// Each unique tip header text pattern:
src = src.replace(
  `fill="#64748B" fontSize="9.5" fontFamily="Inter,sans-serif">{d.label} · {period}`,
  `fill="#0891B2" fontSize="9.5" fontFamily="Inter,sans-serif" fontWeight="600">{d.label} · {period}`
);
src = src.replace(
  `fill="#64748B" fontSize="9" fontFamily="Inter,sans-serif">{d.label}</text>`,
  `fill="#0891B2" fontSize="9" fontFamily="Inter,sans-serif" fontWeight="600">{d.label}</text>`
);
src = src.replace(
  `fill="#64748B" fontSize="9" fontFamily="Inter,sans-serif">{d.lbl}</text>`,
  `fill="#0891B2" fontSize="9" fontFamily="Inter,sans-serif" fontWeight="600">{d.lbl}</text>`
);
src = src.replace(
  `fill="#64748B" fontSize="9" fontFamily="Inter,sans-serif">{d.label} 2025</text>`,
  `fill="#0891B2" fontSize="9" fontFamily="Inter,sans-serif" fontWeight="600">{d.label} 2025</text>`
);
// SvgAreaChart inline tooltip header
src = src.replace(
  `fill="#64748B" fontSize="9" fontFamily="Inter,sans-serif">
              {String(d.month ?? d.day ?? d.hour ?? hov)}`,
  `fill="#0891B2" fontSize="9" fontFamily="Inter,sans-serif" fontWeight="600">
              {String(d.month ?? d.day ?? d.hour ?? hov)}`
);
// SvgLineChart inline tooltip header
src = src.replace(
  `fill="#64748B" fontSize="9" fontFamily="Inter,sans-serif">
            {String(d.month ?? d.day ?? d.hour ?? hov)}`,
  `fill="#0891B2" fontSize="9" fontFamily="Inter,sans-serif" fontWeight="600">
            {String(d.month ?? d.day ?? d.hour ?? hov)}`
);

// ── 4. Theme series name labels from #475569 → #64748B (softer, on-theme) ─
// These are the right-aligned small labels showing series name in tooltip
src = src.replace(
  /fill="#475569" fontSize="9" fontFamily="Inter,sans-serif">/g,
  `fill="#94A3B8" fontSize="9" fontFamily="Inter,sans-serif">`
);

// ── 5. Add themed shadow to all tooltip <g> elements ─────────────────────
// All TipBox/tooltip <g> have pointerEvents="none" as first prop
// Add style with drop-shadow filter
src = src.replace(
  /<g pointerEvents="none">\n\s+<line[^>]+stroke="#06B6D4"[^>]+\/>/g,
  (match) => match.replace('<g pointerEvents="none">', '<g pointerEvents="none" style={{filter:"drop-shadow(0 4px 18px rgba(6,182,212,0.18))"}}>')
);
src = src.replace(
  /<g pointerEvents="none">\n\s+<line[^>]+stroke="#EF4444"[^>]+\/>/g,
  (match) => match.replace('<g pointerEvents="none">', '<g pointerEvents="none" style={{filter:"drop-shadow(0 4px 18px rgba(6,182,212,0.18))"}}>')
);
src = src.replace(
  /<g pointerEvents="none">\n\s+<line[^>]+stroke="#94A3B8"[^>]+\/>/g,
  (match) => match.replace('<g pointerEvents="none">', '<g pointerEvents="none" style={{filter:"drop-shadow(0 4px 18px rgba(6,182,212,0.18))"}}>')
);
// For tooltip g's that start directly with a rect (no crosshair line)
src = src.replace(
  /<g pointerEvents="none">\n\s+<rect/g,
  '<g pointerEvents="none" style={{filter:"drop-shadow(0 4px 18px rgba(6,182,212,0.18))"}}>\n        <rect'
);

// ── 6. Value colors: make them more on-theme ─────────────────────────────
// UserGrowth tooltip: individual value in #67E8F9 (light cyan) → keep
// UserGrowth tooltip: team value in #A5B4FC (light purple) → keep
// StorageAreaChart: #FCA5A5 (light red) → make it #EF4444 text on white tooltip
src = src.replace(
  `fill="#FCA5A5" fontSize="11" fontWeight="700" fontFamily="Inter,sans-serif">{d.used} TB</text>`,
  `fill="#EF4444" fontSize="11" fontWeight="700" fontFamily="Inter,sans-serif">{d.used} TB</text>`
);

// ── 7. Crosshair lines: theme to site color ───────────────────────────────
// Change gray crosshair in SvgLineChart tooltip from #94A3B8 to #06B6D4
src = src.replace(
  `stroke="#94A3B8" strokeWidth="1" strokeDasharray="3,2" opacity="0.4" />`,
  `stroke="#06B6D4" strokeWidth="1" strokeDasharray="3,2" opacity="0.3" />`
);

// ── 8. Logs donut hover center text: theme color ──────────────────────────
// Currently uses fill="#0F172A" for pct text
src = src.replace(
  `fill="#0F172A" fontSize="11" fontWeight="800" fontFamily="Inter,sans-serif">{hovSlice.pct}%</text>`,
  `fill="#06B6D4" fontSize="11" fontWeight="800" fontFamily="Inter,sans-serif">{hovSlice.pct}%</text>`
);
// Logs Radial center hover text
src = src.replace(
  `fill="#0F172A" fontSize="9" fontWeight="700" fontFamily="Inter,sans-serif">`,
  `fill="#0891B2" fontSize="9" fontWeight="700" fontFamily="Inter,sans-serif">`
);
// SvgDonutChart hover center
src = src.replace(
  `fill={hovSlice.color} fontSize="11" fontWeight="800" fontFamily="Inter,sans-serif">{hovSlice.value}%</text>`,
  `fill={hovSlice.color} fontSize="12" fontWeight="800" fontFamily="Inter,sans-serif">{hovSlice.value}%</text>`
);

fs.writeFileSync('/workspaces/default/code/src/app/App.tsx', src, 'utf8');

const open  = (src.match(/{/g) || []).length;
const close = (src.match(/}/g) || []).length;
console.log('Done. Lines:', src.split('\n').length);
console.log('Brace diff:', open - close, open === close ? '✓' : '✗ MISMATCH');

// Verify dark tooltips are gone
const darkTooltips = (src.match(/fill="#0F172A" opacity/g) || []).length;
console.log('Dark tooltip rects remaining:', darkTooltips, darkTooltips === 0 ? '✓ all themed' : '⚠ some remain');
// Verify white themed ones
const themedTooltips = (src.match(/fill="white" stroke="#D9F2F8"/g) || []).length;
console.log('White themed tooltip rects:', themedTooltips);
// Verify scroll fix
console.log('Dashboard h-full overflow-y-auto:', src.includes('h-full overflow-y-auto bg-[#F5FEFF]') ? '✓' : '✗');
