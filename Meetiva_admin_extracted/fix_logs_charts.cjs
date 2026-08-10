const fs = require('fs');
let src = fs.readFileSync('/workspaces/default/code/src/app/App.tsx', 'utf8');

// ── NEW: Insert 3 chart components before "function Logs()" ──────────────────
const logsChartsCode = `
// ── Logs bottom chart components (interactive hover) ──────────────────────

type TLPoint = { lbl: string; v: number };
function LogsTimelineChart({ data }: { data: TLPoint[] }) {
  const [hov, setHov] = useState<number | null>(null);
  const W = 420, H = 155, pL = 30, pR = 8, pT = 14, pB = 20;
  const cw = W - pL - pR, ch = H - pT - pB;
  const VMAX = 4400;
  const pts = data.map((d, i) => ({
    x: pL + i * (cw / (data.length - 1)),
    y: pT + ch - (d.v / VMAX) * ch,
  }));
  const lineSegs = pts.map((p, i) => {
    if (i === 0) return \`M\${p.x.toFixed(1)},\${p.y.toFixed(1)}\`;
    const pp = pts[i - 1];
    return \`C\${(pp.x+22).toFixed(1)},\${pp.y.toFixed(1)} \${(p.x-22).toFixed(1)},\${p.y.toFixed(1)} \${p.x.toFixed(1)},\${p.y.toFixed(1)}\`;
  });
  const linePath = lineSegs.join(" ");
  const areaPath = linePath + \` L\${(pL+cw).toFixed(1)},\${(pT+ch).toFixed(1)} L\${pL},\${(pT+ch).toFixed(1)} Z\`;
  const yTicks = [0, 1000, 2000, 3000, 4000];
  const colW = cw / (data.length - 1);

  const TipBox = ({ idx }: { idx: number }) => {
    const d = data[idx];
    const tx = pts[idx].x;
    const tw = 110, th = 48;
    const bx = Math.max(tw / 2 + pL, Math.min(W - pR - tw / 2, tx));
    const by = pT + 4;
    return (
      <g pointerEvents="none">
        <line x1={tx} y1={pT} x2={tx} y2={pT + ch} stroke="#06B6D4" strokeWidth="1" strokeDasharray="3,2" opacity="0.35" />
        <rect x={bx - tw / 2} y={by} width={tw} height={th} rx="7" fill="#0F172A" opacity="0.96" />
        <text x={bx} y={by + 15} textAnchor="middle" fill="#64748B" fontSize="9" fontFamily="Inter,sans-serif">{d.lbl}</text>
        <circle cx={bx - tw / 2 + 12} cy={by + 32} r="3.5" fill="#06B6D4" />
        <text x={bx - tw / 2 + 20} y={by + 36} fill="#67E8F9" fontSize="11" fontWeight="700" fontFamily="Inter,sans-serif">{d.v.toLocaleString()}</text>
        <text x={bx + tw / 2 - 7} y={by + 36} textAnchor="end" fill="#475569" fontSize="9" fontFamily="Inter,sans-serif">events</text>
      </g>
    );
  };

  return (
    <svg viewBox={\`0 0 \${W} \${H}\`} className="w-full" style={{ height: H }}>
      <defs>
        <linearGradient id="tlGrNew" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
        </linearGradient>
      </defs>
      {yTicks.map(v => {
        const y = pT + ch - (v / VMAX) * ch;
        return (
          <g key={v}>
            <line x1={pL} y1={y} x2={W - pR} y2={y} stroke="#EDF7F9" strokeWidth="1" />
            <text x={pL - 4} y={y + 3.5} textAnchor="end" fill="#94A3B8" fontSize="8.5" fontFamily="Inter,sans-serif">
              {v === 0 ? "0" : v / 1000 + "K"}
            </text>
          </g>
        );
      })}
      <path d={areaPath} fill="url(#tlGrNew)" />
      <path d={linePath} fill="none" stroke="#06B6D4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((_, i) => (
        <circle key={i} cx={pts[i].x} cy={pts[i].y} r={hov === i ? 5.5 : 3.5}
          fill={hov === i ? "#06B6D4" : "white"} stroke="#06B6D4" strokeWidth="2" />
      ))}
      {data.map((d, i) => (
        <text key={i} x={pts[i].x} y={H - 3} textAnchor="middle"
          fill={hov === i ? "#374151" : "#94A3B8"} fontSize="8.5" fontFamily="Inter,sans-serif">{d.lbl}</text>
      ))}
      {/* Hit zones */}
      {data.map((_, i) => (
        <rect key={\`tlh-\${i}\`}
          x={pts[i].x - colW / 2} y={pT} width={colW} height={ch}
          fill="transparent" style={{ cursor: "crosshair" }}
          onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)} />
      ))}
      {hov !== null && <TipBox idx={hov} />}
    </svg>
  );
}

type DonutSlice = { label: string; pct: number; cnt: string; clr: string };
function LogsDonutChart({ data }: { data: DonutSlice[] }) {
  const [hov, setHov] = useState<number | null>(null);
  const cx = 55, cy = 55, r = 48, ri = 28;
  let ang = -90;
  const paths = data.map((d, i) => {
    const a1 = ang * Math.PI / 180;
    ang += (d.pct / 100) * 360;
    const a2 = ang * Math.PI / 180;
    const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
    const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
    const xi1 = cx + ri * Math.cos(a2), yi1 = cy + ri * Math.sin(a2);
    const xi2 = cx + ri * Math.cos(a1), yi2 = cy + ri * Math.sin(a1);
    const lg = d.pct > 50 ? 1 : 0;
    const midAng = (a1 + a2) / 2;
    const tipR = (r + ri) / 2;
    return {
      ...d, i,
      path: \`M\${x1.toFixed(2)},\${y1.toFixed(2)} A\${r},\${r} 0 \${lg},1 \${x2.toFixed(2)},\${y2.toFixed(2)} L\${xi1.toFixed(2)},\${yi1.toFixed(2)} A\${ri},\${ri} 0 \${lg},0 \${xi2.toFixed(2)},\${yi2.toFixed(2)} Z\`,
      mx: cx + Math.cos(midAng) * tipR,
      my: cy + Math.sin(midAng) * tipR,
    };
  });

  const hovSlice = hov !== null ? paths[hov] : null;

  return (
    <svg viewBox="0 0 110 110" width={105} height={105} className="flex-shrink-0" style={{ overflow: "visible" }}>
      {paths.map((p, i) => (
        <path key={i} d={p.path}
          fill={p.clr}
          opacity={hov === null || hov === i ? 1 : 0.45}
          style={{ cursor: "pointer", transition: "opacity 0.15s" }}
          onMouseEnter={() => setHov(i)}
          onMouseLeave={() => setHov(null)}
        />
      ))}
      <circle cx={cx} cy={cy} r={ri} fill="white" />
      {hovSlice ? (
        <>
          <text x={cx} y={cy - 6} textAnchor="middle" fill="#0F172A" fontSize="11" fontWeight="800" fontFamily="Inter,sans-serif">{hovSlice.pct}%</text>
          <text x={cx} y={cy + 8} textAnchor="middle" fill="#94A3B8" fontSize="7" fontFamily="Inter,sans-serif">{hovSlice.cnt}</text>
        </>
      ) : (
        <text x={cx} y={cy + 4} textAnchor="middle" fill="#94A3B8" fontSize="8" fontFamily="Inter,sans-serif">24,790</text>
      )}
    </svg>
  );
}

type RadialHr = { h: number; v: number; norm: number };
function LogsRadialChart({ hrVals }: { hrVals: number[] }) {
  const [hov, setHov] = useState<number | null>(null);
  const cx = 55, cy = 55, rMin = 16, rMax = 44;
  const hrMax = Math.max(...hrVals);
  const spokes: RadialHr[] = hrVals.map((v, h) => ({ h, v, norm: v / hrMax }));
  const lbls = [
    { t: "12AM", h: 0 }, { t: "6AM", h: 6 }, { t: "12PM", h: 12 }, { t: "6PM", h: 18 },
  ];
  return (
    <svg viewBox="0 0 110 110" width={105} height={105} className="flex-shrink-0">
      <circle cx={cx} cy={cy} r={rMax + 8} fill="#F8FEFF" stroke="#EDF7F9" strokeWidth="1" />
      {spokes.map(({ h, norm }) => {
        const ang = (h / 24) * 2 * Math.PI - Math.PI / 2;
        const r2 = rMin + norm * (rMax - rMin);
        const clr = norm > 0.7 ? "#06B6D4" : norm > 0.3 ? "#67E8F9" : "#BAE6FD";
        return (
          <g key={h}>
            <line
              x1={cx + Math.cos(ang) * rMin} y1={cy + Math.sin(ang) * rMin}
              x2={cx + Math.cos(ang) * r2}   y2={cy + Math.sin(ang) * r2}
              stroke={hov === h ? "#0891B2" : clr}
              strokeWidth={norm > 0.05 ? 3 : 1.5}
              strokeLinecap="round"
              opacity={norm < 0.05 ? 0.2 : hov !== null && hov !== h ? 0.5 : 1}
              style={{ cursor: "pointer" }}
            />
            {/* Invisible fat hit zone */}
            <line
              x1={cx + Math.cos(ang) * rMin} y1={cy + Math.sin(ang) * rMin}
              x2={cx + Math.cos(ang) * rMax}  y2={cy + Math.sin(ang) * rMax}
              stroke="transparent" strokeWidth="10"
              onMouseEnter={() => setHov(h)} onMouseLeave={() => setHov(null)}
              style={{ cursor: "crosshair" }}
            />
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r={rMin} fill="white" stroke="#E5F4F7" strokeWidth="1" />
      <circle cx={cx} cy={cy} r="3" fill="#06B6D4" />
      {/* Center tooltip */}
      {hov !== null ? (
        <>
          <text x={cx} y={cy - 5} textAnchor="middle" fill="#0F172A" fontSize="9" fontWeight="700" fontFamily="Inter,sans-serif">
            {hov < 12 ? (hov === 0 ? "12AM" : \`\${hov}AM\`) : (hov === 12 ? "12PM" : \`\${hov - 12}PM\`)}
          </text>
          <text x={cx} y={cy + 7} textAnchor="middle" fill="#06B6D4" fontSize="8" fontWeight="600" fontFamily="Inter,sans-serif">
            {hrVals[hov].toLocaleString()} ev
          </text>
        </>
      ) : null}
      {/* Axis labels */}
      {lbls.map(({ t, h }) => {
        const ang = (h / 24) * 2 * Math.PI - Math.PI / 2;
        const lr = rMax + 15;
        return (
          <text key={t} x={cx + Math.cos(ang) * lr} y={cy + Math.sin(ang) * lr + 3.5}
            textAnchor="middle" fill="#94A3B8" fontSize="7" fontFamily="Inter,sans-serif">{t}</text>
        );
      })}
    </svg>
  );
}

`;

// Insert before "function Logs()"
const logsMarker = 'function Logs() {';
const logsIdx = src.indexOf(logsMarker);
if (logsIdx === -1) { console.error('function Logs() not found'); process.exit(1); }
src = src.slice(0, logsIdx) + logsChartsCode + src.slice(logsIdx);

// ── Replace the 3 IIFE blocks inside Logs ────────────────────────────────────

// 1. Activity Timeline IIFE → <LogsTimelineChart data={tlData}/>
const tlStart = `              {/* ── Activity Timeline ───────────────────────────────── */}
              <div className="bg-white border border-[#E5F4F7] rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-[13px] font-semibold text-[#111827]">Activity Timeline </span>
                    <span className="text-[11.5px] text-[#94A3B8]">This Week</span>
                  </div>
                </div>
                {(()=>{`;
const tlEnd = `                })()}
              </div>`;

const tlsi = src.indexOf(tlStart);
const tlei = src.indexOf(tlEnd, tlsi) + tlEnd.length;
if (tlsi === -1 || tlei <= tlStart.length) { console.error('TL IIFE not found'); process.exit(1); }

const tlReplacement = `              {/* ── Activity Timeline ───────────────────────────────── */}
              <div className="bg-white border border-[#E5F4F7] rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-[13px] font-semibold text-[#111827]">Activity Timeline </span>
                    <span className="text-[11.5px] text-[#94A3B8]">This Week · hover to inspect</span>
                  </div>
                </div>
                <LogsTimelineChart data={tlData} />
              </div>`;
src = src.slice(0, tlsi) + tlReplacement + src.slice(tlei);

// 2. Top Active Hours IIFE (radial) → <LogsRadialChart hrVals={hrVals}/>
const radStart = `                  {(()=>{
                    const cx=55, cy=55, rMin=16, rMax=44;
                    const hv=[0,0,0,0,0,0,0.15,0.35,0.6,0.88,1,0.88,0.65,0.45,0.6,0.5,0.38,0.28,0.18,0.12,0.08,0.04,0,0];`;
const radEnd = `                    );
                  })()}`;
const radsi = src.indexOf(radStart);
const radei = src.indexOf(radEnd, radsi) + radEnd.length;
if (radsi === -1 || radei <= radStart.length) { console.error('Radial IIFE not found', radsi); process.exit(1); }

// Convert hrVals (the Logs-scope local) to normalized values for LogsRadialChart
// The component expects raw values and normalises internally
// The current radial in Logs uses `hv` (0-1 normalised fractions) but the LogsRadialChart uses raw hrVals
// We'll pass the actual hrVals defined in Logs
const radReplacement = `                  <LogsRadialChart hrVals={hrVals} />`;
src = src.slice(0, radsi) + radReplacement + src.slice(radei);

// 3. Logs by Type donut IIFE → <LogsDonutChart data={donutSeries}/>
const donutStart = `                  {(()=>{
                    const cx=55, cy=55, r=48, ri=28;
                    let ang=-90;
                    const paths=donutSeries.map(d=>{`;
const donutEnd = `                    );
                  })()}
                  <div className="flex-1 space-y-2.5">`;
const dnsi = src.indexOf(donutStart);
const dnei = src.indexOf(donutEnd, dnsi) + donutEnd.length;
if (dnsi === -1 || dnei <= donutStart.length) { console.error('Donut IIFE not found', dnsi); process.exit(1); }

const donutReplacement = `                  <LogsDonutChart data={donutSeries} />
                  <div className="flex-1 space-y-2.5">`;
src = src.slice(0, dnsi) + donutReplacement + src.slice(dnei);

// ── Also update donutSeries to remove donutPaths (unused now) and fix types ──
// donutPaths is computed from donutSeries but now unused -- keep it for safety

fs.writeFileSync('/workspaces/default/code/src/app/App.tsx', src, 'utf8');

const open  = (src.match(/{/g) || []).length;
const close = (src.match(/}/g) || []).length;
console.log('Done. Lines:', src.split('\n').length);
console.log('Brace diff:', open - close, open === close ? '✓' : '✗ MISMATCH');
console.log('LogsTimelineChart defined:', src.includes('function LogsTimelineChart'));
console.log('LogsDonutChart defined:', src.includes('function LogsDonutChart'));
console.log('LogsRadialChart defined:', src.includes('function LogsRadialChart'));
console.log('LogsTimelineChart used:', src.includes('<LogsTimelineChart'));
console.log('LogsDonutChart used:', src.includes('<LogsDonutChart'));
console.log('LogsRadialChart used:', src.includes('<LogsRadialChart'));
