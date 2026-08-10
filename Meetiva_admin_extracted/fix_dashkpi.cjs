const fs = require('fs');
let src = fs.readFileSync('/workspaces/default/code/src/app/App.tsx', 'utf8');

// Re-insert DashKPI right after DashSparkline (needed by AIUsage page)
const insertAfter = `    <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.5" fill={color} />
    </svg>
  );
}

// ── Platform Overview (multi-series area, hover tooltip) ─────────────────`;

const dashKpiCode = `    <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.5" fill={color} />
    </svg>
  );
}

// ── DashKPI card (used by AI Usage page) ──────────────────────────────────
function DashKPI({ label, value, sub, icon: Icon, trend, trendUp, spark, sparkColor, uid }: {
  label: string; value: string; sub: string; icon: React.ElementType;
  trend?: string; trendUp?: boolean; spark?: number[]; sparkColor?: string; uid: string;
}) {
  return (
    <Card className="p-5 cursor-default transition-all duration-200 hover:border-[#C5E8F2] hover:shadow-sm">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-[#F0FAFE] border border-[#E0F3F8] flex items-center justify-center flex-shrink-0">
            <Icon size={12} className="text-[#06B6D4]" />
          </div>
          <span className="text-[10.5px] font-semibold text-[#94A3B8] uppercase tracking-[0.12em] truncate">{label}</span>
        </div>
        {spark && <DashSparkline data={spark} color={sparkColor || "#06B6D4"} uid={uid} />}
      </div>
      <div className="text-[24px] font-bold text-[#0F172A] leading-none mb-2"
        style={{ fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        {value}
      </div>
      <div className="flex items-center justify-between gap-1">
        <span className="text-[11px] font-mono text-[#94A3B8] truncate">{sub}</span>
        {trend && (
          <div className={\`flex items-center gap-0.5 text-[10.5px] font-bold flex-shrink-0 \${trendUp ? "text-emerald-600" : "text-red-500"}\`}>
            {trendUp ? <TrendingUp size={9} strokeWidth={2.5} /> : <TrendingDown size={9} strokeWidth={2.5} />}
            {trend}
          </div>
        )}
      </div>
    </Card>
  );
}

// ── Platform Overview (multi-series area, hover tooltip) ─────────────────`;

if (!src.includes(insertAfter)) {
  console.error('insertAfter marker not found');
  process.exit(1);
}

src = src.replace(insertAfter, dashKpiCode);

fs.writeFileSync('/workspaces/default/code/src/app/App.tsx', src, 'utf8');

const open  = (src.match(/{/g) || []).length;
const close = (src.match(/}/g) || []).length;
console.log('Done. Lines:', src.split('\n').length);
console.log('Brace diff:', open - close, open === close ? '✓' : '✗ MISMATCH');
console.log('DashKPI defined:', src.includes('function DashKPI'));
