const fs = require('fs');
let src = fs.readFileSync('/workspaces/default/code/src/app/App.tsx', 'utf8');
const helpers = fs.readFileSync('/workspaces/default/code/new_dashboard_helpers.txt', 'utf8');
const dashFn  = fs.readFileSync('/workspaces/default/code/new_dashboard_fn.txt', 'utf8');

// ── Step 1: Replace the helpers section ─────────────────────────────────────
// From the helpers comment to just before "function Dashboard"
const hStart = '// ── Dashboard helpers ──────────────────────────────────────────────────────';
const hEnd   = 'function Dashboard({ onNav }: { onNav: (p: Page) => void }) {';

const hsi = src.indexOf(hStart);
const hei = src.indexOf(hEnd);

if (hsi === -1 || hei === -1) {
  console.error('Helpers markers not found', hsi, hei);
  process.exit(1);
}

// Replace helpers section (hsi..hei) with new helpers + the Dashboard function start
src = src.slice(0, hsi) + helpers + src.slice(hei);

// ── Step 2: Replace the Dashboard function body ──────────────────────────────
// Now find "function Dashboard" and replace until just before "// ── User Management"
const dStart = 'function Dashboard({ onNav }: { onNav: (p: Page) => void }) {';
const dEnd   = '// ── User Management ────────────────────────────────────────────────────────';

const dsi = src.indexOf(dStart);
const dei = src.indexOf(dEnd, dsi);

if (dsi === -1 || dei === -1) {
  console.error('Dashboard markers not found', dsi, dei);
  process.exit(1);
}

src = src.slice(0, dsi) + dashFn + '\n' + src.slice(dei);

fs.writeFileSync('/workspaces/default/code/src/app/App.tsx', src, 'utf8');

const open  = (src.match(/{/g) || []).length;
const close = (src.match(/}/g) || []).length;
console.log('Done. Lines:', src.split('\n').length);
console.log('Brace diff:', open - close, open === close ? '✓' : '✗ MISMATCH');

const toasts = (src.match(/toast\.(success|info|error)/g) || []).length;
console.log('Toast calls:', toasts);
console.log('OverviewAreaChart:', src.includes('OverviewAreaChart'));
console.log('UserGrowthChart:', src.includes('UserGrowthChart'));
console.log('AiUsageChart:', src.includes('AiUsageChart'));
console.log('StorageAreaChart:', src.includes('StorageAreaChart'));
console.log('wsOpen:', src.includes('wsOpen'));
