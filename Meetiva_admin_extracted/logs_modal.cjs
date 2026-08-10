const fs = require('fs');
let src = fs.readFileSync('/workspaces/default/code/src/app/App.tsx', 'utf8');

// ── 1. Remove right panel + close the two-col flex, replace with modal ────────
const rightPanelStart = `          </div>{/* end LEFT */}\n\n          {/* ════ RIGHT PANEL ════ */}`;
const rightPanelEnd   = `        </div>{/* end two-col */}`;

const rStart = src.indexOf(rightPanelStart);
const rEnd   = src.indexOf(rightPanelEnd) + rightPanelEnd.length;

if (rStart === -1 || rEnd === -1) {
  console.error('right panel markers not found', rStart, rEnd);
  process.exit(1);
}

const modalReplacement = `          </div>{/* end LEFT */}

        </div>{/* end two-col */}

        {/* ── Log Detail Modal ──────────────────────────────────────────── */}
        {selectedLog && (()=>{
          const sl = selectedLog;
          const {Icon:DI, bg, color} = evMeta(sl.event, sl.cat);
          const fields = [
            {Icon:User,        lbl:"User",        val:sl.user  },
            {Icon:Mail,        lbl:"Email",        val:sl.email },
            {Icon:Building2,   lbl:"Workspace",    val:sl.ws    },
            {Icon:Globe,       lbl:"IP Address",   val:sl.ip    },
            {Icon:Monitor,     lbl:"User Agent",   val:sl.agent },
            {Icon:MapPin,      lbl:"Location",     val:sl.loc   },
            {Icon:Hash,        lbl:"Session ID",   val:sl.sid   },
            {Icon:Hash,        lbl:"Event ID",     val:sl.eid   },
            {Icon:ScrollText,  lbl:"Description",  val:sl.desc  },
          ] as {Icon:React.ElementType;lbl:string;val:string}[];
          return (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{backgroundColor:"rgba(15,23,42,0.45)", backdropFilter:"blur(4px)"}}
              onClick={()=>setSelectedLog(null)}
            >
              <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
                style={{boxShadow:"0 24px 64px rgba(6,182,212,0.12), 0 8px 24px rgba(0,0,0,0.14)"}}
                onClick={e=>e.stopPropagation()}
              >
                {/* Modal header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#EDF7F9]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{backgroundColor:bg}}>
                      <DI size={17} style={{color}}/>
                    </div>
                    <div>
                      <div className="text-[15px] font-semibold text-[#111827] leading-tight">{sl.event}</div>
                      <div className="text-[11px] font-mono text-[#94A3B8] mt-0.5">{sl.time.replace("May 18,","May 18, 2025 at")}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={\`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border \${sl.ok?"bg-emerald-50 text-emerald-600 border-emerald-100":"bg-red-50 text-red-600 border-red-100"}\`}>
                      <span className={\`w-1.5 h-1.5 rounded-full \${sl.ok?"bg-emerald-500":"bg-red-500"}\`}/>
                      {sl.ok?"Success":"Failed"}
                    </span>
                    <button
                      onClick={()=>setSelectedLog(null)}
                      className="w-8 h-8 rounded-xl border border-[#E5F4F7] flex items-center justify-center text-[#94A3B8] hover:text-[#374151] hover:border-[#C8E8F2] hover:bg-[#F5FEFF] transition-all cursor-pointer"
                    >
                      <X size={15}/>
                    </button>
                  </div>
                </div>

                {/* Fields grid */}
                <div className="px-6 py-4 grid grid-cols-2 gap-x-8 gap-y-3.5">
                  {fields.slice(0,-1).map(({Icon:FI,lbl,val})=>(
                    <div key={lbl}>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <FI size={10} className="text-[#94A3B8] flex-shrink-0"/>
                        <span className="text-[10.5px] font-medium text-[#94A3B8] uppercase tracking-wide">{lbl}</span>
                      </div>
                      <span className="text-[12.5px] font-medium text-[#111827] break-all leading-snug">{val}</span>
                    </div>
                  ))}
                </div>

                {/* Description full-width */}
                <div className="px-6 pb-4">
                  <div className="flex items-center gap-1.5 mb-1">
                    <ScrollText size={10} className="text-[#94A3B8]"/>
                    <span className="text-[10.5px] font-medium text-[#94A3B8] uppercase tracking-wide">Description</span>
                  </div>
                  <p className="text-[13px] text-[#374151] leading-relaxed bg-[#F8FEFF] border border-[#E5F4F7] rounded-xl px-4 py-3">{sl.desc}</p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-[#EDF7F9] bg-[#FAFEFF]">
                  <button
                    onClick={()=>setSelectedLog(null)}
                    className="text-[13px] font-semibold text-[#64748B] hover:text-[#374151] cursor-pointer transition-colors"
                  >
                    Close
                  </button>
                  <button className="flex items-center gap-1.5 text-[13px] font-semibold text-[#06B6D4] hover:text-[#0891B2] cursor-pointer transition-colors">
                    View Full Details <ArrowUpRight size={13}/>
                  </button>
                </div>
              </div>
            </div>
          );
        })()}`;

src = src.slice(0, rStart) + modalReplacement + src.slice(rEnd);

// ── 2. Remove the highlight on selected row (no longer needed for sidebar) ─────
// Keep the row click but don't visually highlight — or keep a light highlight for last-clicked
// The isAct highlight references selectedLog?.id — this is now the modal trigger, keep it subtle
src = src.replace(
  '`cursor-pointer transition-colors ${isLast?"":"border-b border-[#F0F9FB]"} ${isAct?"bg-[#EFF9FC]":isCk?"bg-[#F0FAFE]":"hover:bg-[#FAFCFD]"}`',
  '`cursor-pointer transition-colors ${isLast?"":"border-b border-[#F0F9FB]"} ${isCk?"bg-[#F0FAFE]":"hover:bg-[#FAFCFD]"}`'
);

// ── 3. Make arrow button open the modal too (already works via row click) ──────
// The ArrowRight in the Details column — make it obvious it opens modal
src = src.replace(
  '<ArrowRight size={14} className="text-[#94A3B8] hover:text-[#06B6D4] transition-colors"/>',
  '<button onClick={e=>{e.stopPropagation();setSelectedLog(r);}} className="w-7 h-7 rounded-lg border border-[#E5F4F7] flex items-center justify-center hover:border-[#06B6D4] hover:bg-[#EFF9FB] transition-all cursor-pointer"><ArrowRight size={13} className="text-[#94A3B8] group-hover:text-[#06B6D4]"/></button>'
);

fs.writeFileSync('/workspaces/default/code/src/app/App.tsx', src, 'utf8');

const open = (src.match(/{/g)||[]).length;
const close = (src.match(/}/g)||[]).length;
console.log('Done. Lines:', src.split('\n').length);
console.log('Brace diff:', open - close, open === close ? '✓' : '✗');
console.log('Modal present:', src.includes('fixed inset-0 z-50 flex items-center justify-center'));
console.log('Right panel removed:', !src.includes('end RIGHT'));
