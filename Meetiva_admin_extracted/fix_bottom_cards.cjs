const fs = require('fs');
let src = fs.readFileSync('/workspaces/default/code/src/app/App.tsx', 'utf8');

const OLD = `            {/* Bottom: Activity Timeline + Top Active Hours */}
            <div className="grid grid-cols-7 gap-4">

              {/* Activity Timeline */}
              <div className="col-span-3 bg-white border border-[#E5F4F7] rounded-2xl p-5 shadow-sm">
                <div className="mb-4">
                  <span className="text-[13px] font-bold text-[#111827]">Activity Timeline </span>
                  <span className="text-[12px] text-[#94A3B8]">This Week</span>
                </div>
                <div className="flex gap-3">
                  {/* Y-axis */}
                  <div className="flex flex-col justify-between text-right pb-5">
                    {["4K","3K","2K","1K","0"].map(l=>(
                      <span key={l} className="text-[9.5px] font-mono text-[#94A3B8] leading-none">{l}</span>
                    ))}
                  </div>
                  <div className="flex-1 min-w-0">
                    <svg viewBox={\`0 0 \${TW} \${TH}\`} className="w-full" style={{height:110}} preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="tlGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.1"/>
                          <stop offset="100%" stopColor="#06B6D4" stopOpacity="0"/>
                        </linearGradient>
                      </defs>
                      <path d={tarea} fill="url(#tlGrad)"/>
                      <path d={tline} fill="none" stroke="#06B6D4" strokeWidth="2.5" strokeLinecap="round"/>
                      {tpts.map((p,i)=>(
                        <circle key={i} cx={p.x} cy={p.y} r="4" fill="white" stroke="#06B6D4" strokeWidth="2"/>
                      ))}
                      {/* tooltip Thu 15 */}
                      {(()=>{
                        const tp=tpts[3];
                        return (
                          <g>
                            <circle cx={tp.x} cy={tp.y} r="5" fill="#06B6D4"/>
                            <rect x={tp.x-46} y={tp.y-40} width="92" height="30" rx="6" fill="#1E293B"/>
                            <text x={tp.x} y={tp.y-29} textAnchor="middle" fill="#CBD5E1" fontSize="8" fontFamily="Inter,sans-serif">Thu, May 15</text>
                            <text x={tp.x} y={tp.y-16} textAnchor="middle" fill="#67E8F9" fontSize="10" fontWeight="700" fontFamily="Inter,sans-serif">3,842 Events</text>
                          </g>
                        );
                      })()}
                    </svg>
                    <div className="flex justify-between mt-1.5">
                      {tlData.map(d=>(
                        <span key={d.lbl} className="text-[9.5px] font-mono text-[#94A3B8]">{d.lbl}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Active Hours */}
              <div className="col-span-2 bg-white border border-[#E5F4F7] rounded-2xl p-5 shadow-sm">
                <div className="mb-4">
                  <span className="text-[13px] font-bold text-[#111827]">Top Active Hours </span>
                  <span className="text-[12px] text-[#94A3B8]">This Week</span>
                </div>
                <div className="flex gap-3 items-center">
                  {/* Radial clock */}
                  <div className="flex-shrink-0">
                    <svg width="130" height="130" viewBox="0 0 130 130">
                      {radial.map((b,i)=>(
                        <line key={i} x1={b.x1} y1={b.y1} x2={b.x2} y2={b.y2}
                          stroke={b.clr} strokeWidth="4.5" strokeLinecap="round"/>
                      ))}
                      <circle cx={RCX} cy={RCY} r={RMIN-1} fill="white"/>
                      <circle cx={RCX} cy={RCY} r={RMIN-1} fill="none" stroke="#EDF7F9" strokeWidth="1"/>
                      {[
                        {t:"12 AM",x:RCX,      y:RCY-RMAX-9},
                        {t:"3 AM", x:RCX+RMAX+9,y:RCY+3    },
                        {t:"6 AM", x:RCX,      y:RCY+RMAX+12},
                        {t:"9 PM", x:RCX-RMAX-9,y:RCY+3    },
                      ].map(({t,x,y})=>(
                        <text key={t} x={x} y={y} textAnchor="middle" dominantBaseline="middle"
                          fontSize="7.5" fill="#94A3B8" fontFamily="Inter,monospace">{t}</text>
                      ))}
                    </svg>
                  </div>
                  {/* Hours table */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between mb-2 pb-1.5 border-b border-[#EDF7F9]">
                      <span className="text-[10px] font-mono font-semibold text-[#9CA3AF] uppercase tracking-[0.08em]">Time Range</span>
                      <span className="text-[10px] font-mono font-semibold text-[#9CA3AF] uppercase tracking-[0.08em]">Events</span>
                    </div>
                    <div className="space-y-2">
                      {[
                        {r:"10 AM – 11 AM",c:"2,451"},
                        {r:"11 AM – 12 PM",c:"2,187"},
                        {r:"9 AM – 10 AM", c:"1,982"},
                        {r:"2 PM – 3 PM",  c:"1,761"},
                        {r:"4 PM – 5 PM",  c:"1,309"},
                      ].map(({r,c})=>(
                        <div key={r} className="flex justify-between items-center">
                          <span className="text-[11.5px] text-[#374151]">{r}</span>
                          <span className="text-[11.5px] font-semibold font-mono text-[#111827]">{c}</span>
                        </div>
                      ))}
                    </div>
                    <button className="flex items-center gap-1 mt-3 text-[11.5px] font-semibold text-[#06B6D4] hover:text-[#0891B2] cursor-pointer transition-colors">
                      View Full Report<ArrowRight size={11}/>
                    </button>
                  </div>
                </div>
              </div>

              {/* Logs by Type */}
              <div className="col-span-2 bg-white border border-[#E5F4F7] rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-[13px] font-semibold text-[#111827]">Logs by Type </span>
                    <span className="text-[11px] text-[#94A3B8]">This Week</span>
                  </div>
                  <button className="text-[11.5px] font-semibold text-[#06B6D4] hover:text-[#0891B2] cursor-pointer">View All</button>
                </div>
                <div className="flex gap-3 items-center mb-3">
                  <svg width="90" height="90" viewBox="0 0 112 112" className="flex-shrink-0">
                    {donutPaths.map((s,i)=><path key={i} d={s.d} fill={s.clr}/>)}
                    <circle cx="56" cy="56" r="28" fill="white"/>
                  </svg>
                  <div className="space-y-1.5 flex-1">
                    {donutSeries.map(d=>(
                      <div key={d.label} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{backgroundColor:d.clr}}/>
                          <span className="text-[10.5px] text-[#64748B] truncate">{d.label.replace(" Events","")}</span>
                        </div>
                        <span className="text-[10px] font-mono text-[#94A3B8] whitespace-nowrap">{d.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>`;

const NEW = `            {/* Bottom: Activity Timeline + Top Active Hours + Logs by Type */}
            <div className="grid grid-cols-3 gap-4">

              {/* ── Activity Timeline ─────────────────────────────────── */}
              <div className="bg-white border border-[#E5F4F7] rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-[13px] font-semibold text-[#111827]">Activity Timeline </span>
                    <span className="text-[11.5px] text-[#94A3B8]">This Week</span>
                  </div>
                </div>
                {/* Self-contained SVG with axes inside */}
                {(()=>{
                  const W=420, H=160, padL=28, padR=8, padT=12, padB=22;
                  const cw=W-padL-padR, ch=H-padT-padB;
                  const VMAX=4400;
                  const pts=tlData.map((d,i)=>({
                    x: padL+i*(cw/(tlData.length-1)),
                    y: padT+ch-(d.v/VMAX)*ch,
                  }));
                  const line=pts.map((p,i)=>i===0?`M${p.x.toFixed(1)},${p.y.toFixed(1)}`:`C${(pts[i-1].x+24).toFixed(1)},${pts[i-1].y.toFixed(1)} ${(p.x-24).toFixed(1)},${p.y.toFixed(1)} ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
                  const area=line+` L${padL+cw},${padT+ch} L${padL},${padT+ch} Z`;
                  const yTicks=[0,1000,2000,3000,4000];
                  const tp=pts[3];
                  return (
                    <svg viewBox={\`0 0 \${W} \${H}\`} className="w-full" style={{height:160}}>
                      <defs>
                        <linearGradient id="tlGrad2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.15"/>
                          <stop offset="100%" stopColor="#06B6D4" stopOpacity="0"/>
                        </linearGradient>
                      </defs>
                      {/* Grid + Y labels */}
                      {yTicks.map(v=>{
                        const y=padT+ch-(v/VMAX)*ch;
                        return (
                          <g key={v}>
                            <line x1={padL} y1={y} x2={W-padR} y2={y} stroke="#EDF7F9" strokeWidth="1"/>
                            <text x={padL-4} y={y+3.5} textAnchor="end" fill="#94A3B8" fontSize="8.5" fontFamily="Inter,sans-serif">{v===0?"0":v/1000+"K"}</text>
                          </g>
                        );
                      })}
                      {/* Area + line */}
                      <path d={area} fill="url(#tlGrad2)"/>
                      <path d={line} fill="none" stroke="#06B6D4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      {/* Dots */}
                      {pts.map((p,i)=>(
                        <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="white" stroke="#06B6D4" strokeWidth="2"/>
                      ))}
                      {/* Thu tooltip */}
                      <circle cx={tp.x} cy={tp.y} r="5" fill="#06B6D4"/>
                      <rect x={tp.x-48} y={tp.y-44} width="96" height="32" rx="7" fill="#1E293B"/>
                      <text x={tp.x} y={tp.y-30} textAnchor="middle" fill="#94A3B8" fontSize="8" fontFamily="Inter,sans-serif">Thu, May 15</text>
                      <text x={tp.x} y={tp.y-17} textAnchor="middle" fill="#67E8F9" fontSize="10" fontWeight="700" fontFamily="Inter,sans-serif">3,842 Events</text>
                      {/* X labels */}
                      {pts.map((p,i)=>(
                        <text key={i} x={p.x} y={H-4} textAnchor="middle" fill="#94A3B8" fontSize="8.5" fontFamily="Inter,sans-serif">{tlData[i].lbl}</text>
                      ))}
                    </svg>
                  );
                })()}
              </div>

              {/* ── Top Active Hours ──────────────────────────────────── */}
              <div className="bg-white border border-[#E5F4F7] rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-[13px] font-semibold text-[#111827]">Top Active Hours </span>
                    <span className="text-[11.5px] text-[#94A3B8]">This Week</span>
                  </div>
                  <button className="text-[11px] font-semibold text-[#06B6D4] hover:text-[#0891B2] cursor-pointer transition-colors flex items-center gap-0.5">
                    View Full Report<ArrowRight size={10}/>
                  </button>
                </div>
                <div className="flex items-center gap-4">
                  {/* Radial clock — fixed 120×120 viewbox with safe margins */}
                  {(()=>{
                    const cx=60, cy=60, rMin=18, rMax=46;
                    const hrVals2=[0,0,0,0,0,0,0.2,0.4,0.65,0.9,1,0.9,0.7,0.5,0.65,0.55,0.4,0.3,0.2,0.15,0.1,0.05,0,0];
                    const spokes=hrVals2.map((v,h)=>{
                      const ang=(h/24)*2*Math.PI - Math.PI/2;
                      const r2=rMin+(v/1)*( rMax-rMin);
                      const clr=v>0.7?"#06B6D4":v>0.35?"#67E8F9":"#BAE6FD";
                      return { x1:cx+Math.cos(ang)*rMin, y1:cy+Math.sin(ang)*rMin, x2:cx+Math.cos(ang)*r2, y2:cy+Math.sin(ang)*r2, clr, v };
                    });
                    const lbls=[
                      {t:"12AM", ang:-Math.PI/2},
                      {t:"6AM",  ang:0},
                      {t:"12PM", ang:Math.PI/2},
                      {t:"6PM",  ang:Math.PI},
                    ];
                    return (
                      <svg viewBox="0 0 120 120" width={110} height={110} className="flex-shrink-0">
                        {/* outer ring */}
                        <circle cx={cx} cy={cy} r={rMax+6} fill="#F8FEFF" stroke="#EDF7F9" strokeWidth="1"/>
                        {/* spokes */}
                        {spokes.map((s,i)=>(
                          <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
                            stroke={s.clr} strokeWidth={s.v>0?"3.5":"1.5"} strokeLinecap="round" opacity={s.v===0?0.2:1}/>
                        ))}
                        {/* inner hole */}
                        <circle cx={cx} cy={cy} r={rMin} fill="white" stroke="#EDF7F9" strokeWidth="1"/>
                        <circle cx={cx} cy={cy} r="3" fill="#06B6D4"/>
                        {/* axis labels */}
                        {lbls.map(({t,ang})=>{
                          const lr=rMax+14;
                          return <text key={t} x={cx+Math.cos(ang)*lr} y={cy+Math.sin(ang)*lr+3} textAnchor="middle" fill="#94A3B8" fontSize="7" fontFamily="Inter,sans-serif">{t}</text>;
                        })}
                      </svg>
                    );
                  })()}
                  {/* Hours table */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between mb-2 pb-1.5 border-b border-[#EDF7F9]">
                      <span className="text-[9.5px] font-mono font-semibold text-[#9CA3AF] uppercase tracking-[0.08em]">Time Range</span>
                      <span className="text-[9.5px] font-mono font-semibold text-[#9CA3AF] uppercase tracking-[0.08em]">Events</span>
                    </div>
                    <div className="space-y-2.5">
                      {[
                        {r:"10 AM – 11 AM",c:"2,451"},
                        {r:"11 AM – 12 PM",c:"2,187"},
                        {r:"9 AM – 10 AM", c:"1,982"},
                        {r:"2 PM – 3 PM",  c:"1,761"},
                        {r:"4 PM – 5 PM",  c:"1,309"},
                      ].map(({r,c})=>(
                        <div key={r} className="flex justify-between items-center gap-2">
                          <span className="text-[11px] text-[#374151] whitespace-nowrap">{r}</span>
                          <span className="text-[11px] font-semibold font-mono text-[#111827]">{c}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Logs by Type ──────────────────────────────────────── */}
              <div className="bg-white border border-[#E5F4F7] rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-[13px] font-semibold text-[#111827]">Logs by Type </span>
                    <span className="text-[11.5px] text-[#94A3B8]">This Week</span>
                  </div>
                  <button className="text-[11.5px] font-semibold text-[#06B6D4] hover:text-[#0891B2] cursor-pointer">View All</button>
                </div>
                <div className="flex items-center gap-5">
                  {/* Donut — self-contained 120×120 viewBox */}
                  {(()=>{
                    const cx=60, cy=60, r=52, ri=30;
                    let ang=-90;
                    const paths=donutSeries.map(d=>{
                      const a1=ang*Math.PI/180;
                      ang+=(d.pct/100)*360;
                      const a2=ang*Math.PI/180;
                      const x1=cx+r*Math.cos(a1), y1=cy+r*Math.sin(a1);
                      const x2=cx+r*Math.cos(a2), y2=cy+r*Math.sin(a2);
                      const xi1=cx+ri*Math.cos(a2), yi1=cy+ri*Math.sin(a2);
                      const xi2=cx+ri*Math.cos(a1), yi2=cy+ri*Math.sin(a1);
                      const lg=d.pct>50?1:0;
                      return {...d, path:\`M\${x1.toFixed(2)},\${y1.toFixed(2)} A\${r},\${r} 0 \${lg},1 \${x2.toFixed(2)},\${y2.toFixed(2)} L\${xi1.toFixed(2)},\${yi1.toFixed(2)} A\${ri},\${ri} 0 \${lg},0 \${xi2.toFixed(2)},\${yi2.toFixed(2)} Z\`};
                    });
                    return (
                      <svg viewBox="0 0 120 120" width={110} height={110} className="flex-shrink-0">
                        {paths.map((p,i)=><path key={i} d={p.path} fill={p.clr}/>)}
                        <circle cx={cx} cy={cy} r={ri} fill="white"/>
                      </svg>
                    );
                  })()}
                  {/* Legend */}
                  <div className="flex-1 space-y-2">
                    {donutSeries.map(d=>(
                      <div key={d.label} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{backgroundColor:d.clr}}/>
                          <span className="text-[11px] text-[#374151] truncate">{d.label.replace(" Events","")}</span>
                        </div>
                        <span className="text-[11px] font-semibold font-mono text-[#64748B] whitespace-nowrap">{d.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>`;

const idx = src.indexOf(OLD);
if (idx === -1) {
  console.error('OLD block not found');
  // Try to find partial
  const partial = '            {/* Bottom: Activity Timeline + Top Active Hours */}';
  console.log('Partial found at:', src.indexOf(partial));
  process.exit(1);
}

src = src.slice(0, idx) + NEW + src.slice(idx + OLD.length);
fs.writeFileSync('/workspaces/default/code/src/app/App.tsx', src, 'utf8');

const open = (src.match(/{/g)||[]).length;
const close = (src.match(/}/g)||[]).length;
console.log('Done. Lines:', src.split('\n').length);
console.log('Brace diff:', open - close, open === close ? '✓' : '✗');
