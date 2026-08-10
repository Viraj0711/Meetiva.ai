const fs = require('fs');
let src = fs.readFileSync('/workspaces/default/code/src/app/App.tsx', 'utf8');

// ── Upgrade SvgAreaChart with hover tooltip ──────────────────────────────────
const oldArea = `function SvgAreaChart({ data, keys, colors, labels, uid }: {
  data: NumRecord[]; keys: string[]; colors: string[]; labels?: string[]; uid: string;
}) {
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
  return (
    <svg viewBox={\`0 0 \${W} \${H}\`} className="w-full" style={{ height: H }}>
      <defs>
        {keys.map((k, i) => (
          <linearGradient key={\`\${uid}-g\${i}\`} id={\`\${uid}-g\${i}\`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors[i]} stopOpacity={0.18} />
            <stop offset="100%" stopColor={colors[i]} stopOpacity={0} />
          </linearGradient>
        ))}
      </defs>
      {yTicks.map((t, ti) => (
        <g key={\`\${uid}-yt-\${ti}\`}>
          <line x1={PAD.l} x2={W - PAD.r} y1={t.y} y2={t.y} stroke="#E5F4F7" strokeDasharray="3 3" />
          <text x={PAD.l - 6} y={t.y + 4} textAnchor="end" fontSize={9} fill="#94A3B8" fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace">
            {t.val >= 1000 ? \`\${(t.val / 1000).toFixed(0)}k\` : t.val}
          </text>
        </g>
      ))}
      {keys.map((k, i) => {
        const p = pts(k);
        const linePath = svgPath(p, true);
        const areaPath = \`\${linePath} L\${p[p.length - 1].x},\${PAD.t + cH} L\${p[0].x},\${PAD.t + cH} Z\`;
        return (
          <g key={\`\${uid}-area-\${i}\`}>
            <path d={areaPath} fill={\`url(#\${uid}-g\${i})\`} />
            <path d={linePath} fill="none" stroke={colors[i]} strokeWidth={2} strokeLinejoin="round" />
          </g>
        );
      })}
      {xLabels.map(({ x, label }, xi) => (
        <text key={\`\${uid}-xl-\${xi}\`} x={x} y={H - 6} textAnchor="middle" fontSize={9} fill="#94A3B8" fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace">{label}</text>
      ))}
      {labels && (
        <g>
          {keys.map((k, i) => (
            <g key={k} transform={\`translate(\${PAD.l + i * 80}, \${H - 2})\`}>
              <rect x={0} y={-7} width={8} height={3} rx={1.5} fill={colors[i]} />
              <text x={12} y={-3} fontSize={9} fill="#94A3B8" fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace">{labels[i]}</text>
            </g>
          ))}
        </g>
      )}
    </svg>
  );
}`;

const newArea = `function SvgAreaChart({ data, keys, colors, labels, uid }: {
  data: NumRecord[]; keys: string[]; colors: string[]; labels?: string[]; uid: string;
}) {
  const [hov, setHov] = useState<number | null>(null);
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
  return (
    <svg viewBox={\`0 0 \${W} \${H}\`} className="w-full" style={{ height: H }}>
      <defs>
        {keys.map((k, i) => (
          <linearGradient key={\`\${uid}-g\${i}\`} id={\`\${uid}-g\${i}\`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors[i]} stopOpacity={0.18} />
            <stop offset="100%" stopColor={colors[i]} stopOpacity={0} />
          </linearGradient>
        ))}
      </defs>
      {yTicks.map((t, ti) => (
        <g key={\`\${uid}-yt-\${ti}\`}>
          <line x1={PAD.l} x2={W - PAD.r} y1={t.y} y2={t.y} stroke="#E5F4F7" strokeDasharray="3 3" />
          <text x={PAD.l - 6} y={t.y + 4} textAnchor="end" fontSize={9} fill="#94A3B8" fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace">
            {t.val >= 1000 ? \`\${(t.val / 1000).toFixed(0)}k\` : t.val}
          </text>
        </g>
      ))}
      {keys.map((k, i) => {
        const p = pts(k);
        const linePath = svgPath(p, true);
        const areaPath = \`\${linePath} L\${p[p.length - 1].x},\${PAD.t + cH} L\${p[0].x},\${PAD.t + cH} Z\`;
        return (
          <g key={\`\${uid}-area-\${i}\`}>
            <path d={areaPath} fill={\`url(#\${uid}-g\${i})\`} />
            <path d={linePath} fill="none" stroke={colors[i]} strokeWidth={2} strokeLinejoin="round" />
          </g>
        );
      })}
      {/* Hover dots */}
      {hov !== null && keys.map((k, i) => {
        const p = pts(k);
        return <circle key={\`\${uid}-hd-\${i}\`} cx={p[hov].x} cy={p[hov].y} r={4} fill="white" stroke={colors[i]} strokeWidth={2} />;
      })}
      {/* Hit zones */}
      {data.map((d, i) => {
        const x0 = PAD.l + (i / (data.length - 1)) * cW;
        return (
          <rect key={\`\${uid}-hz-\${i}\`} x={x0 - colW / 2} y={PAD.t} width={colW} height={cH}
            fill="transparent" style={{ cursor: "crosshair" }}
            onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)} />
        );
      })}
      {/* Tooltip */}
      {hov !== null && (() => {
        const d = data[hov];
        const tx = PAD.l + (hov / (data.length - 1)) * cW;
        const tw = 120, th = 14 + keys.length * 18 + 10;
        const bx = Math.max(tw / 2 + PAD.l, Math.min(W - PAD.r - tw / 2, tx));
        const by = PAD.t + 4;
        return (
          <g pointerEvents="none">
            <line x1={tx} y1={PAD.t} x2={tx} y2={PAD.t + cH} stroke={colors[0]} strokeWidth="1" strokeDasharray="3,2" opacity="0.35" />
            <rect x={bx - tw / 2} y={by} width={tw} height={th} rx="7" fill="#0F172A" opacity="0.95" />
            <text x={bx} y={by + 14} textAnchor="middle" fill="#64748B" fontSize="9" fontFamily="Inter,sans-serif">
              {String(d.month ?? d.day ?? d.hour ?? hov)}
            </text>
            {keys.map((k, i) => (
              <g key={k}>
                <circle cx={bx - tw / 2 + 12} cy={by + 24 + i * 18} r="3" fill={colors[i]} />
                <text x={bx - tw / 2 + 20} y={by + 28 + i * 18} fill={colors[i]} fontSize="10" fontWeight="700" fontFamily="Inter,sans-serif">
                  {Number(d[k]) >= 1000 ? \`\${(Number(d[k]) / 1000).toFixed(1)}k\` : String(d[k])}
                </text>
                {labels && <text x={bx + tw / 2 - 6} y={by + 28 + i * 18} textAnchor="end" fill="#475569" fontSize="9" fontFamily="Inter,sans-serif">{labels[i]}</text>}
              </g>
            ))}
          </g>
        );
      })()}
      {xLabels.map(({ x, label }, xi) => (
        <text key={\`\${uid}-xl-\${xi}\`} x={x} y={H - 6} textAnchor="middle" fontSize={9}
          fill={hov === xi ? "#374151" : "#94A3B8"} fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace">{label}</text>
      ))}
    </svg>
  );
}`;

if (!src.includes(oldArea)) {
  console.error('SvgAreaChart old not found');
  process.exit(1);
}
src = src.replace(oldArea, newArea);

// ── Upgrade SvgLineChart with hover tooltip ──────────────────────────────────
const oldLine = `function SvgLineChart({ data, keys, colors, labels, uid }: {
  data: NumRecord[]; keys: string[]; colors: string[]; labels?: string[]; uid: string;
}) {
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
  return (
    <svg viewBox={\`0 0 \${W} \${H}\`} className="w-full" style={{ height: H }}>
      {yTicks.map((t, ti) => (
        <g key={\`\${uid}-yt-\${ti}\`}>
          <line x1={PAD.l} x2={W - PAD.r} y1={t.y} y2={t.y} stroke="#E5F4F7" strokeDasharray="3 3" />
          <text x={PAD.l - 6} y={t.y + 4} textAnchor="end" fontSize={9} fill="#94A3B8" fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace">
            {t.val >= 1000 ? \`\${(t.val / 1000).toFixed(0)}k\` : t.val}
          </text>
        </g>
      ))}
      {keys.map((k, i) => {
        const p = pts(k);
        return (
          <g key={\`\${uid}-line-\${i}\`}>
            <path d={svgPath(p, true)} fill="none" stroke={colors[i]} strokeWidth={2}
              strokeDasharray={i === 1 ? "5 3" : undefined} strokeLinejoin="round" />
            {p.map((pt, j) => <circle key={\`\${uid}-dot-\${i}-\${j}\`} cx={pt.x} cy={pt.y} r={2.5} fill={colors[i]} />)}
          </g>
        );
      })}
      {xLabels.map(({ x, label }, xi) => (
        <text key={\`\${uid}-xl-\${xi}\`} x={x} y={H - 6} textAnchor="middle" fontSize={9} fill="#94A3B8" fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace">{label}</text>
      ))}
      {labels && (
        <g>
          {keys.map((k, i) => (
            <g key={k} transform={\`translate(\${PAD.l + i * 90}, \${H - 2})\`}>
              <line x1={0} y1={-5} x2={10} y2={-5} stroke={colors[i]} strokeWidth={2} strokeDasharray={i === 1 ? "4 2" : undefined} />
              <text x={14} y={-2} fontSize={9} fill="#94A3B8" fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace">{labels[i]}</text>
            </g>
          ))}
        </g>
      )}
    </svg>
  );
}`;

const newLine = `function SvgLineChart({ data, keys, colors, labels, uid }: {
  data: NumRecord[]; keys: string[]; colors: string[]; labels?: string[]; uid: string;
}) {
  const [hov, setHov] = useState<number | null>(null);
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
  return (
    <svg viewBox={\`0 0 \${W} \${H}\`} className="w-full" style={{ height: H }}>
      {yTicks.map((t, ti) => (
        <g key={\`\${uid}-yt-\${ti}\`}>
          <line x1={PAD.l} x2={W - PAD.r} y1={t.y} y2={t.y} stroke="#E5F4F7" strokeDasharray="3 3" />
          <text x={PAD.l - 6} y={t.y + 4} textAnchor="end" fontSize={9} fill="#94A3B8" fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace">
            {t.val >= 1000 ? \`\${(t.val / 1000).toFixed(0)}k\` : t.val}
          </text>
        </g>
      ))}
      {keys.map((k, i) => {
        const p = pts(k);
        return (
          <g key={\`\${uid}-line-\${i}\`}>
            <path d={svgPath(p, true)} fill="none" stroke={colors[i]} strokeWidth={2}
              strokeDasharray={i === 1 ? "5 3" : undefined} strokeLinejoin="round" />
            {p.map((pt, j) => (
              <circle key={\`\${uid}-dot-\${i}-\${j}\`} cx={pt.x} cy={pt.y}
                r={hov === j ? 5 : 2.5}
                fill={hov === j ? colors[i] : colors[i]} stroke="white"
                strokeWidth={hov === j ? 1.5 : 0} />
            ))}
          </g>
        );
      })}
      {/* Crosshair + tooltip */}
      {hov !== null && (() => {
        const d = data[hov];
        const tx = PAD.l + (hov / (data.length - 1)) * cW;
        const tw = 130, th = 14 + keys.length * 18 + 10;
        const bx = Math.max(tw / 2 + PAD.l, Math.min(W - PAD.r - tw / 2, tx));
        const by = PAD.t + 4;
        return (
          <g pointerEvents="none">
            <line x1={tx} y1={PAD.t} x2={tx} y2={PAD.t + cH} stroke="#94A3B8" strokeWidth="1" strokeDasharray="3,2" opacity="0.4" />
            <rect x={bx - tw / 2} y={by} width={tw} height={th} rx="7" fill="#0F172A" opacity="0.95" />
            <text x={bx} y={by + 14} textAnchor="middle" fill="#64748B" fontSize="9" fontFamily="Inter,sans-serif">
              {String(d.month ?? d.day ?? d.hour ?? hov)}
            </text>
            {keys.map((k, i) => (
              <g key={k}>
                <circle cx={bx - tw / 2 + 12} cy={by + 24 + i * 18} r="3" fill={colors[i]} />
                <text x={bx - tw / 2 + 20} y={by + 28 + i * 18} fill={colors[i]} fontSize="10" fontWeight="700" fontFamily="Inter,sans-serif">
                  {Number(d[k]) >= 1000 ? \`\${(Number(d[k]) / 1000).toFixed(1)}k\` : \`\${Number(d[k])} ms\`}
                </text>
                {labels && <text x={bx + tw / 2 - 6} y={by + 28 + i * 18} textAnchor="end" fill="#475569" fontSize="9" fontFamily="Inter,sans-serif">{labels[i]}</text>}
              </g>
            ))}
          </g>
        );
      })()}
      {/* Hit zones */}
      {data.map((_, i) => {
        const x0 = PAD.l + (i / (data.length - 1)) * cW;
        return (
          <rect key={\`\${uid}-hz-\${i}\`} x={x0 - colW / 2} y={PAD.t} width={colW} height={cH}
            fill="transparent" style={{ cursor: "crosshair" }}
            onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)} />
        );
      })}
      {xLabels.map(({ x, label }, xi) => (
        <text key={\`\${uid}-xl-\${xi}\`} x={x} y={H - 6} textAnchor="middle" fontSize={9}
          fill={hov === xi ? "#374151" : "#94A3B8"} fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace">{label}</text>
      ))}
      {labels && (
        <g>
          {keys.map((k, i) => (
            <g key={k} transform={\`translate(\${PAD.l + i * 90}, \${H - 2})\`}>
              <line x1={0} y1={-5} x2={10} y2={-5} stroke={colors[i]} strokeWidth={2} strokeDasharray={i === 1 ? "4 2" : undefined} />
              <text x={14} y={-2} fontSize={9} fill="#94A3B8" fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace">{labels[i]}</text>
            </g>
          ))}
        </g>
      )}
    </svg>
  );
}`;

if (!src.includes(oldLine)) {
  console.error('SvgLineChart old not found');
  process.exit(1);
}
src = src.replace(oldLine, newLine);

// ── Upgrade SvgDonutChart with hover tooltip ─────────────────────────────────
const oldDonut = `function SvgDonutChart({ data, uid }: {
  data: { name: string; value: number; color: string }[]; uid: string;
}) {
  const size = 160; const cx = size / 2; const cy = size / 2;
  const outerR = 68; const innerR = 44;
  const total = data.reduce((s, d) => s + d.value, 0);
  let startAngle = -Math.PI / 2;
  const slices = data.map(d => {
    const angle = (d.value / total) * 2 * Math.PI;
    const endAngle = startAngle + angle;
    const x1 = cx + outerR * Math.cos(startAngle); const y1 = cy + outerR * Math.sin(startAngle);
    const x2 = cx + outerR * Math.cos(endAngle); const y2 = cy + outerR * Math.sin(endAngle);
    const ix1 = cx + innerR * Math.cos(endAngle); const iy1 = cy + innerR * Math.sin(endAngle);
    const ix2 = cx + innerR * Math.cos(startAngle); const iy2 = cy + innerR * Math.sin(startAngle);
    const large = angle > Math.PI ? 1 : 0;
    const path = \`M\${x1},\${y1} A\${outerR},\${outerR} 0 \${large} 1 \${x2},\${y2} L\${ix1},\${iy1} A\${innerR},\${innerR} 0 \${large} 0 \${ix2},\${iy2} Z\`;
    const result = { ...d, path };
    startAngle = endAngle;
    return result;
  });
  return (
    <svg viewBox={\`0 0 \${size} \${size}\`} width={size} height={size}>
      {slices.map((s, i) => <path key={\`\${uid}-slice-\${i}\`} d={s.path} fill={s.color} opacity={0.9} />)}
    </svg>
  );
}`;

const newDonut = `function SvgDonutChart({ data, uid }: {
  data: { name: string; value: number; color: string }[]; uid: string;
}) {
  const [hov, setHov] = useState<number | null>(null);
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
    const path = \`M\${x1},\${y1} A\${outerR},\${outerR} 0 \${large} 1 \${x2},\${y2} L\${ix1},\${iy1} A\${innerR},\${innerR} 0 \${large} 0 \${ix2},\${iy2} Z\`;
    const result = { ...d, path, idx };
    startAngle = endAngle;
    return result;
  });
  const hovSlice = hov !== null ? slices[hov] : null;
  return (
    <svg viewBox={\`0 0 \${size} \${size}\`} width={size} height={size}>
      {slices.map((s, i) => (
        <path key={\`\${uid}-slice-\${i}\`} d={s.path}
          fill={s.color}
          opacity={hov === null || hov === i ? 0.9 : 0.4}
          style={{ cursor: "pointer", transition: "opacity 0.15s" }}
          onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)} />
      ))}
      <circle cx={cx} cy={cy} r={innerR} fill="white" />
      {hovSlice ? (
        <>
          <text x={cx} y={cy - 8} textAnchor="middle" fill={hovSlice.color} fontSize="11" fontWeight="800" fontFamily="Inter,sans-serif">{hovSlice.value}%</text>
          <text x={cx} y={cy + 5} textAnchor="middle" fill="#64748B" fontSize="8" fontFamily="Inter,sans-serif">{hovSlice.name}</text>
        </>
      ) : (
        <text x={cx} y={cy + 4} textAnchor="middle" fill="#94A3B8" fontSize="9" fontFamily="Inter,sans-serif">hover</text>
      )}
    </svg>
  );
}`;

if (!src.includes(oldDonut)) {
  console.error('SvgDonutChart old not found');
  process.exit(1);
}
src = src.replace(oldDonut, newDonut);

fs.writeFileSync('/workspaces/default/code/src/app/App.tsx', src, 'utf8');

const open  = (src.match(/{/g) || []).length;
const close = (src.match(/}/g) || []).length;
console.log('Done. Lines:', src.split('\n').length);
console.log('Brace diff:', open - close, open === close ? '✓' : '✗ MISMATCH');
