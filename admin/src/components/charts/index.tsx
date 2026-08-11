import React from "react";

export function DashSparkline({ data, color, uid }: { data: number[]; color: string; uid: string }) {
  const W = 76, H = 28;
  if (!data || data.length < 2) {
    return (
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none">
        <line x1="0" y1={H / 2} x2={W} y2={H / 2} stroke={color} strokeWidth="1.5" strokeOpacity="0.3" />
      </svg>
    );
  }
  const min = Math.min(...data), range = (Math.max(...data) - min) || 1;
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * W,
    H - 2 - ((v - min) / range) * (H - 6),
  ]);
  const d = "M" + pts.map(p => p.join(",")).join(" L");
  const fa = `M0,${H} L` + pts.map(p => p.join(",")).join(" L") + ` L${W},${H} Z`;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none">
      <defs>
        <linearGradient id={`dsp-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fa} fill={`url(#dsp-${uid})`} />
      <path d={d} stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.5" fill={color} />
    </svg>
  );
}

export function OverviewAreaChart({ data, period }: { data: { label: string; users: number; meetings: number; ai: number }[]; period: string }) {
  const [hov, setHov] = React.useState<number | null>(null);
  const W = 500, H = 200, pL = 54, pR = 14, pT = 14, pB = 32;
  const cW = W - pL - pR, cH = H - pT - pB;
  const n = data.length;
  if (n === 0) {
    return (
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none">
        <text x={W / 2} y={H / 2} textAnchor="middle" fill="#94A3B8" fontSize="13" fontFamily="Inter, sans-serif">No data available</text>
      </svg>
    );
  }
  const maxV = Math.max(...data.flatMap(d => [d.users, d.meetings, d.ai])) || 1;
  const px = (i: number) => pL + (i / Math.max(n - 1, 1)) * cW;
  const py = (v: number) => pT + cH - (v / maxV) * cH;
  const colW = n > 1 ? cW / (n - 1) : cW;
  type Kk = "users" | "meetings" | "ai";
  const series: { key: Kk; color: string; label: string }[] = [
    { key: "users", color: "#06B6D4", label: "Users" },
    { key: "meetings", color: "#4F46E5", label: "Meetings" },
    { key: "ai", color: "#10B981", label: "AI Requests" },
  ];
  const makePath = (key: Kk) =>
    data.map((d, i) => `${i === 0 ? "M" : "L"}${px(i).toFixed(1)},${py(d[key]).toFixed(1)}`).join(" ");
  const makeArea = (key: Kk) => {
    const pts = data.map((d, i) => `${px(i).toFixed(1)},${py(d[key]).toFixed(1)}`);
    return `M${pL},${pT + cH} L${pts.join(" L")} L${px(n - 1)},${pT + cH} Z`;
  };
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => ({ v: Math.round(f * maxV), y: py(Math.round(f * maxV)) }));
  const fmt = (v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v);

  const TipBox = ({ idx }: { idx: number }) => {
    const d = data[idx];
    const tx = px(idx);
    const tw = 138, th = 86;
    const bx = Math.max(tw / 2 + 4, Math.min(W - pR - tw / 2 - 4, tx));
    const by = pT + 4;
    return (
      <g pointerEvents="none" style={{filter:"drop-shadow(0 4px 18px rgba(6,182,212,0.18))"}}>
        <line x1={tx} y1={pT} x2={tx} y2={pT + cH} stroke="#06B6D4" strokeWidth="1" strokeDasharray="3,2" opacity="0.35" />
        <rect x={bx - tw / 2} y={by} width={tw} height={th} rx="9" fill="white" stroke="#D9F2F8" strokeWidth="1.5" />
        <text x={bx} y={by + 16} textAnchor="middle" fill="#0891B2" fontSize="10" fontFamily="Inter,sans-serif" fontWeight="700">{d.label} · {period}</text>
        {series.map((s, si) => (
          <g key={s.key}>
            <circle cx={bx - tw / 2 + 13} cy={by + 30 + si * 18} r="3.5" fill={s.color} />
            <text x={bx - tw / 2 + 22} y={by + 35 + si * 18} fill={s.color} fontSize="11" fontWeight="700" fontFamily="Inter,sans-serif">{fmt(d[s.key])}</text>
            <text x={bx + tw / 2 - 8} y={by + 35 + si * 18} textAnchor="end" fill="#64748B" fontSize="9.5" fontFamily="Inter,sans-serif">{s.label}</text>
          </g>
        ))}
      </g>
    );
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      <defs>
        {series.map((s, i) => (
          <linearGradient key={`ovg-${i}-${period}`} id={`ovg-${i}-${period}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={s.color} stopOpacity="0.15" />
            <stop offset="100%" stopColor={s.color} stopOpacity="0" />
          </linearGradient>
        ))}
      </defs>
      {yTicks.map((t, ti) => (
        <g key={`ovyt-${ti}`}>
          <line x1={pL} x2={W - pR} y1={t.y} y2={t.y} stroke="#EDF7F9" strokeWidth="1" />
          <text x={pL - 7} y={t.y + 4} textAnchor="end" fill="#64748B" fontSize="12" fontWeight="500" fontFamily="Inter,sans-serif">
            {t.v >= 1000 ? `${Math.round(t.v / 1000)}k` : t.v}
          </text>
        </g>
      ))}
      {[...series].reverse().map((s, i) => (
        <path key={`ova-${i}`} d={makeArea(s.key)} fill={`url(#ovg-${series.length - 1 - i}-${period})`} />
      ))}
      {series.map(s => (
        <path key={`ovl-${s.key}`} d={makePath(s.key)} fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      ))}
      {hov !== null && series.map(s => (
        <circle key={`ovd-${s.key}`} cx={px(hov)} cy={py(data[hov][s.key])} r="4.5" fill="white" stroke={s.color} strokeWidth="2" />
      ))}
      {data.map((d, i) => (
        <text key={`ovx-${i}`} x={px(i)} y={H - 7} textAnchor="middle"
          fill={hov === i ? "#1E293B" : "#64748B"} fontSize="12" fontWeight="500" fontFamily="Inter,sans-serif">{d.label}</text>
      ))}
      {data.map((_, i) => (
        <rect key={`ovh-${i}`} x={px(i) - colW / 2} y={pT} width={colW} height={cH}
          fill="transparent" style={{ cursor: "crosshair" }}
          onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)} />
      ))}
      {hov !== null && <TipBox idx={hov} />}
    </svg>
  );
}

export function UserGrowthChart({ data }: { data: { label: string; individual: number; team: number }[] }) {
  const [hov, setHov] = React.useState<number | null>(null);
  const W = 480, H = 160, pL = 38, pR = 8, pT = 12, pB = 26;
  const cW = W - pL - pR, cH = H - pT - pB;
  if (!data || data.length === 0) {
    return (
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none">
        <text x={W / 2} y={H / 2} textAnchor="middle" fill="#94A3B8" fontSize="13" fontFamily="Inter, sans-serif">No data available</text>
      </svg>
    );
  }
  const maxV = Math.max(...data.map(d => d.individual + d.team)) || 1;
  const n = data.length;
  const slotW = cW / n;
  const barW = Math.min(28, slotW * 0.55);
  const bx = (i: number) => pL + i * slotW + slotW / 2 - barW / 2;
  const yTicks = [0, 0.5, 1];
  const TipBox = ({ idx }: { idx: number }) => {
    const d = data[idx];
    const cx = pL + idx * slotW + slotW / 2;
    const tw = 132, th = 62;
    const bxc = Math.max(tw / 2 + 4, Math.min(W - pR - tw / 2 - 4, cx));
    const by = pT + 2;
    return (
      <g pointerEvents="none" style={{filter:"drop-shadow(0 4px 18px rgba(6,182,212,0.18))"}}>
        <rect x={bxc - tw / 2} y={by} width={tw} height={th} rx="8" fill="white" stroke="#D9F2F8" strokeWidth="1" />
        <text x={bxc} y={by + 15} textAnchor="middle" fill="#0891B2" fontSize="9" fontFamily="Inter,sans-serif" fontWeight="600">{d.label}</text>
        <circle cx={bxc - tw / 2 + 13} cy={by + 29} r="3.5" fill="#06B6D4" />
        <text x={bxc - tw / 2 + 22} y={by + 33} fill="#67E8F9" fontSize="10.5" fontWeight="700" fontFamily="Inter,sans-serif">{(d.individual / 1000).toFixed(1)}k</text>
        <text x={bxc + tw / 2 - 8} y={by + 33} textAnchor="end" fill="#94A3B8" fontSize="9" fontFamily="Inter,sans-serif">Individual</text>
        <circle cx={bxc - tw / 2 + 13} cy={by + 47} r="3.5" fill="#4F46E5" />
        <text x={bxc - tw / 2 + 22} y={by + 51} fill="#A5B4FC" fontSize="10.5" fontWeight="700" fontFamily="Inter,sans-serif">{d.team}</text>
        <text x={bxc + tw / 2 - 8} y={by + 51} textAnchor="end" fill="#94A3B8" fontSize="9" fontFamily="Inter,sans-serif">Teams</text>
      </g>
    );
  };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      {yTicks.map((f, i) => {
        const v = Math.round(f * maxV);
        const y = pT + cH * (1 - f);
        return (
          <g key={`ugy-${i}`}>
            <line x1={pL} x2={W - pR} y1={y} y2={y} stroke="#EDF7F9" strokeWidth="1" />
            <text x={pL - 4} y={y + 4} textAnchor="end" fill="#B0C4CB" fontSize="8" fontFamily="Inter,sans-serif">
              {v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
            </text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const x = bx(i), isHov = hov === i;
        const hInd = (d.individual / maxV) * cH;
        const hTeam = (d.team / maxV) * cH;
        return (
          <g key={`ugb-${i}`}>
            <rect x={x} y={pT + cH - hInd - hTeam} width={barW} height={hTeam}
              fill={isHov ? "#6366F1" : "#4F46E5"} rx="3" />
            <rect x={x} y={pT + cH - hInd} width={barW} height={hInd}
              fill={isHov ? "#22D3EE" : "#06B6D4"} rx="3" />
            <text x={x + barW / 2} y={H - 7} textAnchor="middle"
              fill={isHov ? "#374151" : "#B0C4CB"} fontSize="8.5" fontFamily="Inter,sans-serif">{d.label}</text>
            <rect x={pL + i * slotW} y={pT} width={slotW} height={cH}
              fill="transparent" style={{ cursor: "crosshair" }}
              onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)} />
          </g>
        );
      })}
      {hov !== null && <TipBox idx={hov} />}
    </svg>
  );
}

export function AiUsageChart({ data }: { data: { label: string; gpt4: number; claude: number; llama: number }[] }) {
  const [hov, setHov] = React.useState<number | null>(null);
  const W = 480, H = 160, pL = 38, pR = 8, pT = 12, pB = 26;
  const cW = W - pL - pR, cH = H - pT - pB;
  if (!data || data.length === 0) {
    return (
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none">
        <text x={W / 2} y={H / 2} textAnchor="middle" fill="#94A3B8" fontSize="13" fontFamily="Inter, sans-serif">No data available</text>
      </svg>
    );
  }
  const maxV = Math.max(...data.map(d => d.gpt4 + d.claude + d.llama)) || 1;
  const n = data.length;
  const slotW = cW / n;
  const barW = Math.min(24, slotW * 0.5);
  const bx = (i: number) => pL + i * slotW + slotW / 2 - barW / 2;
  const yTicks = [0, 0.5, 1];
  const TipBox = ({ idx }: { idx: number }) => {
    const d = data[idx];
    const cx = pL + idx * slotW + slotW / 2;
    const tw = 140, th = 74;
    const bxc = Math.max(tw / 2 + 4, Math.min(W - pR - tw / 2 - 4, cx));
    const by = pT + 2;
    const rows = [
      { c: "#06B6D4", tc: "#67E8F9", label: "GPT-4o", v: d.gpt4 },
      { c: "#4F46E5", tc: "#A5B4FC", label: "Claude", v: d.claude },
      { c: "#F59E0B", tc: "#FCD34D", label: "LLaMA", v: d.llama },
    ];
    return (
      <g pointerEvents="none" style={{filter:"drop-shadow(0 4px 18px rgba(6,182,212,0.18))"}}>
        <rect x={bxc - tw / 2} y={by} width={tw} height={th} rx="8" fill="white" stroke="#D9F2F8" strokeWidth="1" />
        <text x={bxc} y={by + 15} textAnchor="middle" fill="#0891B2" fontSize="9" fontFamily="Inter,sans-serif" fontWeight="600">{d.label}</text>
        {rows.map((r, ri) => (
          <g key={ri}>
            <circle cx={bxc - tw / 2 + 13} cy={by + 28 + ri * 17} r="3.5" fill={r.c} />
            <text x={bxc - tw / 2 + 23} y={by + 32 + ri * 17} fill={r.tc} fontSize="10.5" fontWeight="700" fontFamily="Inter,sans-serif">
              {(r.v / 1000).toFixed(1)}k
            </text>
            <text x={bxc + tw / 2 - 8} y={by + 32 + ri * 17} textAnchor="end" fill="#94A3B8" fontSize="9" fontFamily="Inter,sans-serif">{r.label}</text>
          </g>
        ))}
      </g>
    );
  };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      {yTicks.map((f, i) => {
        const v = Math.round(f * maxV);
        const y = pT + cH * (1 - f);
        return (
          <g key={`aiy-${i}`}>
            <line x1={pL} x2={W - pR} y1={y} y2={y} stroke="#EDF7F9" strokeWidth="1" />
            <text x={pL - 4} y={y + 4} textAnchor="end" fill="#B0C4CB" fontSize="8" fontFamily="Inter,sans-serif">
              {v >= 1000 ? `${Math.round(v / 1000)}k` : v}
            </text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const x = bx(i), isHov = hov === i;
        const hG = (d.gpt4 / maxV) * cH;
        const hC = (d.claude / maxV) * cH;
        const hL = (d.llama / maxV) * cH;
        return (
          <g key={`aib-${i}`}>
            <rect x={x} y={pT + cH - hG - hC - hL} width={barW} height={hL} fill={isHov ? "#FCD34D" : "#F59E0B"} rx="2" />
            <rect x={x} y={pT + cH - hG - hC} width={barW} height={hC} fill={isHov ? "#818CF8" : "#4F46E5"} rx="2" />
            <rect x={x} y={pT + cH - hG} width={barW} height={hG} fill={isHov ? "#22D3EE" : "#06B6D4"} rx="2" />
            <text x={x + barW / 2} y={H - 7} textAnchor="middle"
              fill={isHov ? "#374151" : "#B0C4CB"} fontSize="8.5" fontFamily="Inter,sans-serif">{d.label.slice(0, 3)}</text>
            <rect x={pL + i * slotW} y={pT} width={slotW} height={cH}
              fill="transparent" style={{ cursor: "crosshair" }}
              onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)} />
          </g>
        );
      })}
      {hov !== null && <TipBox idx={hov} />}
    </svg>
  );
}

export function StorageAreaChart({ data }: { data: { label: string; used: number }[] }) {
  const [hov, setHov] = React.useState<number | null>(null);
  const W = 480, H = 160, pL = 40, pR = 8, pT = 12, pB = 26;
  const cW = W - pL - pR, cH = H - pT - pB;
  if (!data || data.length === 0) {
    return (
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none">
        <text x={W / 2} y={H / 2} textAnchor="middle" fill="#94A3B8" fontSize="13" fontFamily="Inter, sans-serif">No data available</text>
      </svg>
    );
  }
  const maxV = 20;
  const n = data.length;
  const px = (i: number) => pL + (i / Math.max(n - 1, 1)) * cW;
  const py = (v: number) => pT + cH - (v / maxV) * cH;
  const pts = data.map((d, i): [number, number] => [px(i), py(d.used)]);
  const linePath = "M" + pts.map(p => p.join(",")).join(" L");
  const areaPath = `M${pts[0][0]},${pT + cH} L${pts.map(p => p.join(",")).join(" L")} L${pts[n - 1][0]},${pT + cH} Z`;
  const colW = n > 1 ? cW / (n - 1) : cW;
  const TipBox = ({ idx }: { idx: number }) => {
    const d = data[idx];
    const tx = pts[idx][0];
    const tw = 112, th = 50;
    const bxc = Math.max(tw / 2 + 4, Math.min(W - pR - tw / 2 - 4, tx));
    const by = pT + 4;
    return (
      <g pointerEvents="none" style={{filter:"drop-shadow(0 4px 18px rgba(6,182,212,0.18))"}}>
        <line x1={tx} y1={pT} x2={tx} y2={pT + cH} stroke="#EF4444" strokeWidth="1" strokeDasharray="3,2" opacity="0.4" />
        <rect x={bxc - tw / 2} y={by} width={tw} height={th} rx="8" fill="white" stroke="#D9F2F8" strokeWidth="1" />
        <text x={bxc} y={by + 15} textAnchor="middle" fill="#0891B2" fontSize="9" fontFamily="Inter,sans-serif" fontWeight="600">{d.label} 2025</text>
        <circle cx={bxc - tw / 2 + 13} cy={by + 32} r="3.5" fill="#EF4444" />
        <text x={bxc - tw / 2 + 23} y={by + 36} fill="#EF4444" fontSize="11" fontWeight="700" fontFamily="Inter,sans-serif">{d.used} TB</text>
        <text x={bxc + tw / 2 - 8} y={by + 36} textAnchor="end" fill="#94A3B8" fontSize="9" fontFamily="Inter,sans-serif">used</text>
      </g>
    );
  };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      <defs>
        <linearGradient id="stg-dash" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EF4444" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 10, 20].map((v, i) => {
        const y = py(v);
        return (
          <g key={`sty-${i}`}>
            <line x1={pL} x2={W - pR} y1={y} y2={y} stroke="#EDF7F9" strokeWidth="1" />
            <text x={pL - 4} y={y + 4} textAnchor="end" fill="#B0C4CB" fontSize="8" fontFamily="Inter,sans-serif">{v} TB</text>
          </g>
        );
      })}
      <path d={areaPath} fill="url(#stg-dash)" />
      <path d={linePath} stroke="#EF4444" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((_, i) => (
        <circle key={`std-${i}`} cx={pts[i][0]} cy={pts[i][1]}
          r={hov === i ? 5.5 : 3.5}
          fill={hov === i ? "#EF4444" : "white"} stroke="#EF4444" strokeWidth="2" />
      ))}
      {data.map((d, i) => (
        <text key={`stlbl-${i}`} x={pts[i][0]} y={H - 7} textAnchor="middle"
          fill={hov === i ? "#374151" : "#B0C4CB"} fontSize="8.5" fontFamily="Inter,sans-serif">{d.label}</text>
      ))}
      {data.map((_, i) => {
        const zx = i === 0 ? pL - colW / 2 : pts[i][0] - colW / 2;
        const zw = i === 0 || i === n - 1 ? colW * 0.75 : colW;
        return (
          <rect key={`sth-${i}`} x={zx} y={pT} width={zw} height={cH}
            fill="transparent" style={{ cursor: "crosshair" }}
            onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)} />
        );
      })}
      {hov !== null && <TipBox idx={hov} />}
    </svg>
  );
}

export function SvgAreaChart({ data, keys, colors, labels, uid }: {
  data: NumRecord[]; keys: string[]; colors: string[]; labels?: string[]; uid: string;
}) {
  const [hov, setHov] = React.useState<number | null>(null);
  const W = 560; const H = 160; const PAD = { t: 10, r: 8, b: 30, l: 38 };
  const cW = W - PAD.l - PAD.r; const cH = H - PAD.t - PAD.b;
  const allVals = data.flatMap(d => keys.map(k => Number(d[k])));
  const maxVal = Math.max(...allVals) || 1;
  const pts = (key: string) => data.map((d, i) => ({
    x: PAD.l + (i / (data.length - 1)) * cW,
    y: PAD.t + cH - (Number(d[key]) / maxVal) * cH,
  }));
  const xLabels = data.map((d, i) => ({ x: PAD.l + (i / (data.length - 1)) * cW, label: String(d.month ?? d.day ?? d.hour ?? i) }));
  const yTicks = [0, 0.5, 1].map(f => ({ y: PAD.t + cH - f * cH, val: Math.round(maxVal * f) }));
  const colW = data.length > 1 ? cW / (data.length - 1) : cW;

  function svgPath(points: { x: number; y: number }[], smooth = false): string {
    if (points.length < 2) return "";
    if (!smooth) return points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
    let d = `M${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx = (prev.x + curr.x) / 2;
      d += ` C${cpx},${prev.y} ${cpx},${curr.y} ${curr.x},${curr.y}`;
    }
    return d;
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      <defs>
        {keys.map((k, i) => (
          <linearGradient key={`${uid}-g${i}`} id={`${uid}-g${i}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors[i]} stopOpacity={0.18} />
            <stop offset="100%" stopColor={colors[i]} stopOpacity={0} />
          </linearGradient>
        ))}
      </defs>
      {yTicks.map((t, ti) => (
        <g key={`${uid}-yt-${ti}`}>
          <line x1={PAD.l} x2={W - PAD.r} y1={t.y} y2={t.y} stroke="#E5F4F7" strokeDasharray="3 3" />
          <text x={PAD.l - 6} y={t.y + 4} textAnchor="end" fontSize={9} fill="#94A3B8" fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace">
            {t.val >= 1000 ? `${(t.val / 1000).toFixed(0)}k` : t.val}
          </text>
        </g>
      ))}
      {keys.map((k, i) => {
        const p = pts(k);
        const linePath = svgPath(p, true);
        const areaPath = `${linePath} L${p[p.length - 1].x},${PAD.t + cH} L${p[0].x},${PAD.t + cH} Z`;
        return (
          <g key={`${uid}-area-${i}`}>
            <path d={areaPath} fill={`url(#${uid}-g${i})`} />
            <path d={linePath} fill="none" stroke={colors[i]} strokeWidth={2} strokeLinejoin="round" />
          </g>
        );
      })}
      {hov !== null && keys.map((k, i) => {
        const p = pts(k);
        return <circle key={`${uid}-hd-${i}`} cx={p[hov].x} cy={p[hov].y} r={4} fill="white" stroke={colors[i]} strokeWidth={2} />;
      })}
      {data.map((d, i) => {
        const x0 = PAD.l + (i / (data.length - 1)) * cW;
        return (
          <rect key={`${uid}-hz-${i}`} x={x0 - colW / 2} y={PAD.t} width={colW} height={cH}
            fill="transparent" style={{ cursor: "crosshair" }}
            onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)} />
        );
      })}
      {hov !== null && (() => {
        const d = data[hov];
        const tx = PAD.l + (hov / (data.length - 1)) * cW;
        const tw = 120, th = 14 + keys.length * 18 + 10;
        const bx = Math.max(tw / 2 + PAD.l, Math.min(W - PAD.r - tw / 2, tx));
        const by = PAD.t + 4;
        return (
          <g pointerEvents="none">
            <line x1={tx} y1={PAD.t} x2={tx} y2={PAD.t + cH} stroke={colors[0]} strokeWidth="1" strokeDasharray="3,2" opacity="0.35" />
            <rect x={bx - tw / 2} y={by} width={tw} height={th} rx="7" fill="white" stroke="#D9F2F8" strokeWidth="1" />
            <text x={bx} y={by + 14} textAnchor="middle" fill="#0891B2" fontSize="9" fontFamily="Inter,sans-serif" fontWeight="600">
              {String(d.month ?? d.day ?? d.hour ?? hov)}
            </text>
            {keys.map((k, i) => (
              <g key={k}>
                <circle cx={bx - tw / 2 + 12} cy={by + 24 + i * 18} r="3" fill={colors[i]} />
                <text x={bx - tw / 2 + 20} y={by + 28 + i * 18} fill={colors[i]} fontSize="10" fontWeight="700" fontFamily="Inter,sans-serif">
                  {Number(d[k]) >= 1000 ? `${(Number(d[k]) / 1000).toFixed(1)}k` : String(d[k])}
                </text>
                {labels && <text x={bx + tw / 2 - 6} y={by + 28 + i * 18} textAnchor="end" fill="#475569" fontSize="9" fontFamily="Inter,sans-serif">{labels[i]}</text>}
              </g>
            ))}
          </g>
        );
      })()}
      {xLabels.map(({ x, label }, xi) => (
        <text key={`${uid}-xl-${xi}`} x={x} y={H - 6} textAnchor="middle" fontSize={9}
          fill={hov === xi ? "#374151" : "#94A3B8"} fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace">{label}</text>
      ))}
    </svg>
  );
}

type NumRecord = Record<string, number | string>;

export function SvgBarChart({ data, dataKey, color, uid }: {
  data: NumRecord[]; dataKey: string; color: string; uid: string;
}) {
  const W = 400; const H = 160; const PAD = { t: 10, r: 8, b: 30, l: 38 };
  const cW = W - PAD.l - PAD.r; const cH = H - PAD.t - PAD.b;
  const maxVal = Math.max(...data.map(d => Number(d[dataKey]))) || 1;
  const barW = Math.max(6, (cW / data.length) * 0.55);
  const gap = cW / data.length;
  const yTicks = [0, 0.5, 1].map(f => ({ y: PAD.t + cH - f * cH, val: Math.round(maxVal * f) }));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      {yTicks.map((t, ti) => (
        <g key={`${uid}-yt-${ti}`}>
          <line x1={PAD.l} x2={W - PAD.r} y1={t.y} y2={t.y} stroke="#E5F4F7" strokeDasharray="3 3" />
          <text x={PAD.l - 6} y={t.y + 4} textAnchor="end" fontSize={9} fill="#94A3B8" fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace">
            {t.val >= 1000 ? `${(t.val / 1000).toFixed(0)}k` : t.val}
          </text>
        </g>
      ))}
      {data.map((d, i) => {
        const barH = (Number(d[dataKey]) / maxVal) * cH;
        const x = PAD.l + i * gap + gap / 2 - barW / 2;
        const y = PAD.t + cH - barH;
        const label = String(d.day ?? d.month ?? i);
        return (
          <g key={`${uid}-bar-${i}`}>
            <rect x={x} y={y} width={barW} height={barH} rx={4} fill={color} opacity={0.85} />
            <text x={x + barW / 2} y={H - 6} textAnchor="middle" fontSize={9} fill="#94A3B8" fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace">{label}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function SvgLineChart({ data, keys, colors, labels, uid }: {
  data: NumRecord[]; keys: string[]; colors: string[]; labels?: string[]; uid: string;
}) {
  const [hov, setHov] = React.useState<number | null>(null);
  const W = 400; const H = 160; const PAD = { t: 10, r: 8, b: 30, l: 42 };
  const cW = W - PAD.l - PAD.r; const cH = H - PAD.t - PAD.b;
  const allVals = data.flatMap(d => keys.map(k => Number(d[k])));
  const maxVal = Math.max(...allVals) || 1;
  const pts = (key: string) => data.map((d, i) => ({
    x: PAD.l + (i / (data.length - 1)) * cW,
    y: PAD.t + cH - (Number(d[key]) / maxVal) * cH,
  }));
  const xLabels = data.map((d, i) => ({ x: PAD.l + (i / (data.length - 1)) * cW, label: String(d.month ?? d.day ?? d.hour ?? i) }));
  const yTicks = [0, 0.5, 1].map(f => ({ y: PAD.t + cH - f * cH, val: Math.round(maxVal * f) }));
  const colW = data.length > 1 ? cW / (data.length - 1) : cW;

  function svgPath(points: { x: number; y: number }[], smooth = false): string {
    if (points.length < 2) return "";
    if (!smooth) return points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
    let d = `M${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx = (prev.x + curr.x) / 2;
      d += ` C${cpx},${prev.y} ${cpx},${curr.y} ${curr.x},${curr.y}`;
    }
    return d;
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      {yTicks.map((t, ti) => (
        <g key={`${uid}-yt-${ti}`}>
          <line x1={PAD.l} x2={W - PAD.r} y1={t.y} y2={t.y} stroke="#E5F4F7" strokeDasharray="3 3" />
          <text x={PAD.l - 6} y={t.y + 4} textAnchor="end" fontSize={9} fill="#94A3B8" fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace">
            {t.val >= 1000 ? `${(t.val / 1000).toFixed(0)}k` : t.val}
          </text>
        </g>
      ))}
      {keys.map((k, i) => {
        const p = pts(k);
        return (
          <g key={`${uid}-line-${i}`}>
            <path d={svgPath(p, true)} fill="none" stroke={colors[i]} strokeWidth={2}
              strokeDasharray={i === 1 ? "5 3" : undefined} strokeLinejoin="round" />
            {p.map((pt, j) => (
              <circle key={`${uid}-dot-${i}-${j}`} cx={pt.x} cy={pt.y}
                r={hov === j ? 5 : 2.5}
                fill={colors[i]} stroke="white"
                strokeWidth={hov === j ? 1.5 : 0} />
            ))}
          </g>
        );
      })}
      {hov !== null && (() => {
        const d = data[hov];
        const tx = PAD.l + (hov / (data.length - 1)) * cW;
        const tw = 130, th = 14 + keys.length * 18 + 10;
        const bx = Math.max(tw / 2 + PAD.l, Math.min(W - PAD.r - tw / 2, tx));
        const by = PAD.t + 4;
        return (
          <g pointerEvents="none" style={{filter:"drop-shadow(0 4px 18px rgba(6,182,212,0.18))"}}>
            <line x1={tx} y1={PAD.t} x2={tx} y2={PAD.t + cH} stroke="#06B6D4" strokeWidth="1" strokeDasharray="3,2" opacity="0.3" />
            <rect x={bx - tw / 2} y={by} width={tw} height={th} rx="7" fill="white" stroke="#D9F2F8" strokeWidth="1" />
            <text x={bx} y={by + 14} textAnchor="middle" fill="#0891B2" fontSize="9" fontWeight="600" fontFamily="Inter,sans-serif">
              {String(d.month ?? d.day ?? d.hour ?? hov)}
            </text>
            {keys.map((k, i) => (
              <g key={k}>
                <circle cx={bx - tw / 2 + 12} cy={by + 24 + i * 18} r="3" fill={colors[i]} />
                <text x={bx - tw / 2 + 20} y={by + 28 + i * 18} fill={colors[i]} fontSize="10" fontWeight="700" fontFamily="Inter,sans-serif">
                  {Number(d[k]) >= 1000 ? `${(Number(d[k]) / 1000).toFixed(1)}k` : `${Number(d[k])} ms`}
                </text>
                {labels && <text x={bx + tw / 2 - 6} y={by + 28 + i * 18} textAnchor="end" fill="#94A3B8" fontSize="9" fontFamily="Inter,sans-serif">{labels[i]}</text>}
              </g>
            ))}
          </g>
        );
      })()}
      {data.map((_, i) => {
        const x0 = PAD.l + (i / (data.length - 1)) * cW;
        return (
          <rect key={`${uid}-hz-${i}`} x={x0 - colW / 2} y={PAD.t} width={colW} height={cH}
            fill="transparent" style={{ cursor: "crosshair" }}
            onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)} />
        );
      })}
      {xLabels.map(({ x, label }, xi) => (
        <text key={`${uid}-xl-${xi}`} x={x} y={H - 6} textAnchor="middle" fontSize={9}
          fill={hov === xi ? "#374151" : "#94A3B8"} fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace">{label}</text>
      ))}
      {labels && (
        <g>
          {keys.map((k, i) => (
            <g key={k} transform={`translate(${PAD.l + i * 90}, ${H - 2})`}>
              <line x1={0} y1={-5} x2={10} y2={-5} stroke={colors[i]} strokeWidth={2} strokeDasharray={i === 1 ? "4 2" : undefined} />
              <text x={14} y={-2} fontSize={9} fill="#94A3B8" fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace">{labels[i]}</text>
            </g>
          ))}
        </g>
      )}
    </svg>
  );
}

export function SvgDonutChart({ data, uid }: {
  data: { name: string; value: number; color: string }[]; uid: string;
}) {
  const [hov, setHov] = React.useState<number | null>(null);
  const size = 160; const cx = size / 2; const cy = size / 2;
  const outerR = 68; const innerR = 44;
  const total = data.reduce((s, d) => s + d.value, 0);
  let startAngle = -Math.PI / 2;
  const slices = data.map((d, idx) => {
    const angle = (d.value / total) * 2 * Math.PI;
    const endAngle = startAngle + angle;
    const x1 = cx + outerR * Math.cos(startAngle); const y1 = cy + outerR * Math.sin(startAngle);
    const x2 = cx + outerR * Math.cos(endAngle); const y2 = cy + outerR * Math.sin(endAngle);
    const ix1 = cx + innerR * Math.cos(endAngle); const iy1 = cy + innerR * Math.sin(endAngle);
    const ix2 = cx + innerR * Math.cos(startAngle); const iy2 = cy + innerR * Math.sin(startAngle);
    const large = angle > Math.PI ? 1 : 0;
    const path = `M${x1},${y1} A${outerR},${outerR} 0 ${large} 1 ${x2},${y2} L${ix1},${iy1} A${innerR},${innerR} 0 ${large} 0 ${ix2},${iy2} Z`;
    const result = { ...d, path, idx };
    startAngle = endAngle;
    return result;
  });
  const hovSlice = hov !== null ? slices[hov] : null;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
      {slices.map((s, i) => (
        <path key={`${uid}-slice-${i}`} d={s.path}
          fill={s.color}
          opacity={hov === null || hov === i ? 0.9 : 0.4}
          style={{ cursor: "pointer", transition: "opacity 0.15s" }}
          onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)} />
      ))}
      <circle cx={cx} cy={cy} r={innerR} fill="white" />
      {hovSlice ? (
        <>
          <text x={cx} y={cy - 8} textAnchor="middle" fill={hovSlice.color} fontSize="12" fontWeight="800" fontFamily="Inter,sans-serif">{hovSlice.value}%</text>
          <text x={cx} y={cy + 5} textAnchor="middle" fill="#64748B" fontSize="8" fontFamily="Inter,sans-serif">{hovSlice.name}</text>
        </>
      ) : (
        <text x={cx} y={cy + 4} textAnchor="middle" fill="#94A3B8" fontSize="9" fontFamily="Inter,sans-serif">hover</text>
      )}
    </svg>
  );
}
