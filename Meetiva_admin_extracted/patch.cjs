const fs = require('fs');
let src = fs.readFileSync('/workspaces/default/code/src/app/App.tsx', 'utf8');

// ── 1. Expand addTeamForm state to include department, website, members ────
src = src.replace(
  `  const [showAddTeam, setShowAddTeam]  = useState(false);
  const [addTeamForm, setAddTeamForm]  = useState({ name:"", owner:"", plan:"Free", description:"" });`,
  `  const [showAddTeam, setShowAddTeam]  = useState(false);
  const [addTeamForm, setAddTeamForm]  = useState({ name:"", owner:"", ownerEmail:"", department:"", website:"", description:"", plan:"Free" });
  const [teamMemberInput, setTeamMemberInput] = useState("");
  const [teamMemberList, setTeamMemberList]   = useState<{name:string;email:string;role:string}[]>([]);
  const [showWorkspace, setShowWorkspace]     = useState<typeof mockTeams[0] | null>(null);
  const [showManageMembers, setShowManageMembers] = useState<typeof mockTeams[0] | null>(null);`
);

// ── 2. Wire Open Workspace and Manage Members buttons ─────────────────────
src = src.replace(
  `                  <button onClick={() => toast.info("Opening workspace dashboard…")} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#06B6D4] text-white text-[12.5px] font-semibold hover:bg-[#0891B2] transition-colors cursor-pointer">
                    <Globe size={13} /> Open Workspace
                  </button>
                  <button onClick={() => toast.info("Member management coming soon")} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E5F4F7] bg-white text-[12.5px] font-semibold text-[#475569] hover:border-[#06B6D4] hover:text-[#06B6D4] transition-colors cursor-pointer">
                    <Users size={13} /> Manage Members
                  </button>`,
  `                  <button onClick={() => { setShowWorkspace(activeTeam); setActiveTeam(null); }} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#06B6D4] text-white text-[12.5px] font-semibold hover:bg-[#0891B2] transition-colors cursor-pointer">
                    <Globe size={13} /> Open Workspace
                  </button>
                  <button onClick={() => { setShowManageMembers(activeTeam); setActiveTeam(null); }} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E5F4F7] bg-white text-[12.5px] font-semibold text-[#475569] hover:border-[#06B6D4] hover:text-[#06B6D4] transition-colors cursor-pointer">
                    <Users size={13} /> Manage Members
                  </button>`
);

// ── 3. Replace the old Create Team modal with full version ─────────────────
const OLD_MODAL_START = `      {showAddTeam && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" onClick={()=>setShowAddTeam(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[3px]"/>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md border border-[#E5F4F7] overflow-hidden" onClick={e=>e.stopPropagation()}>`;
const OLD_MODAL_END = `      )}`;

const oldModalIdx = src.indexOf(OLD_MODAL_START);
const oldModalEndIdx = src.indexOf(OLD_MODAL_END, oldModalIdx) + OLD_MODAL_END.length;
const SECTION_AFTER = src.slice(oldModalEndIdx);

const NEW_CREATE_MODAL = `      {/* ── Create Team Modal ──────────────────────────────────────────── */}
      {showAddTeam && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" onClick={()=>{setShowAddTeam(false);setTeamMemberList([]);setTeamMemberInput("");}}>
          <div className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-[4px]"/>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-[#E5F4F7] overflow-hidden flex flex-col max-h-[90vh]" onClick={e=>e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#EDF7F9] bg-gradient-to-r from-[#F0FAFE] to-white flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#06B6D4] flex items-center justify-center shadow-sm">
                  <Building2 size={16} className="text-white"/>
                </div>
                <div>
                  <h2 className="text-[16px] font-bold text-[#0F172A]">Create New Team</h2>
                  <p className="text-[11.5px] text-[#94A3B8]">Set up a workspace for your organization</p>
                </div>
              </div>
              <button onClick={()=>{setShowAddTeam(false);setTeamMemberList([]);setTeamMemberInput("");}} className="w-8 h-8 rounded-xl flex items-center justify-center text-[#94A3B8] hover:bg-[#F5FEFF] hover:text-[#0F172A] transition-colors cursor-pointer"><X size={15}/></button>
            </div>
            {/* Body */}
            <div className="overflow-y-auto px-6 py-5 space-y-5 flex-1">
              {/* Team info */}
              <div>
                <p className="text-[11px] font-bold text-[#06B6D4] uppercase tracking-wider mb-3">Team Info</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">Team / Organization Name *</label>
                    <input value={addTeamForm.name} onChange={e=>setAddTeamForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Design Systems Guild"
                      className="w-full px-3 py-2.5 text-[13px] bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/10 transition-all"/>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">Department</label>
                    <input value={addTeamForm.department} onChange={e=>setAddTeamForm(f=>({...f,department:e.target.value}))} placeholder="e.g. Engineering"
                      className="w-full px-3 py-2.5 text-[13px] bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/10 transition-all"/>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">Website</label>
                    <input value={addTeamForm.website} onChange={e=>setAddTeamForm(f=>({...f,website:e.target.value}))} placeholder="https://company.com"
                      className="w-full px-3 py-2.5 text-[13px] bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/10 transition-all"/>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">Description</label>
                    <textarea value={addTeamForm.description} onChange={e=>setAddTeamForm(f=>({...f,description:e.target.value}))} rows={2} placeholder="What does this team work on?"
                      className="w-full px-3 py-2.5 text-[13px] bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/10 transition-all resize-none"/>
                  </div>
                </div>
              </div>
              {/* Owner */}
              <div>
                <p className="text-[11px] font-bold text-[#4F46E5] uppercase tracking-wider mb-3">Owner / Admin</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">Owner Full Name *</label>
                    <input value={addTeamForm.owner} onChange={e=>setAddTeamForm(f=>({...f,owner:e.target.value}))} placeholder="e.g. Sarah Chen"
                      className="w-full px-3 py-2.5 text-[13px] bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/10 transition-all"/>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">Owner Email</label>
                    <input type="email" value={addTeamForm.ownerEmail} onChange={e=>setAddTeamForm(f=>({...f,ownerEmail:e.target.value}))} placeholder="owner@company.com"
                      className="w-full px-3 py-2.5 text-[13px] bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/10 transition-all"/>
                  </div>
                </div>
              </div>
              {/* Plan */}
              <div>
                <p className="text-[11px] font-bold text-[#8B5CF6] uppercase tracking-wider mb-3">Subscription Plan</p>
                <div className="grid grid-cols-3 gap-3">
                  {([
                    {p:"Free",       price:"$0/mo",   features:["Up to 5 members","5 meetings/mo","1 GB storage"],       color:"#64748B", accent:"#F1F5F9"},
                    {p:"Pro",        price:"$12/mo",  features:["Up to 50 members","Unlimited meetings","20 GB storage"], color:"#06B6D4", accent:"#F0FAFE"},
                    {p:"Enterprise", price:"$49/mo",  features:["Unlimited members","Priority support","500 GB storage"], color:"#4F46E5", accent:"#EEF2FF"},
                  ] as const).map(({p,price,features,color,accent})=>(
                    <button key={p} onClick={()=>setAddTeamForm(f=>({...f,plan:p}))}
                      className={\`p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer \${addTeamForm.plan===p ? "border-["+color+"] shadow-md" : "border-[#E5F4F7] hover:border-["+color+"]"}\`}
                      style={{background: addTeamForm.plan===p ? accent : "white"}}>
                      <div className="text-[13px] font-bold mb-0.5" style={{color: addTeamForm.plan===p ? color : "#0F172A"}}>{p}</div>
                      <div className="text-[12px] font-semibold mb-2" style={{color: addTeamForm.plan===p ? color : "#94A3B8"}}>{price}</div>
                      {features.map(f=>(
                        <div key={f} className="flex items-center gap-1.5 text-[10.5px] text-[#64748B] mb-0.5">
                          <div className="w-1 h-1 rounded-full flex-shrink-0" style={{background:color}}/>
                          {f}
                        </div>
                      ))}
                    </button>
                  ))}
                </div>
              </div>
              {/* Add Members */}
              <div>
                <p className="text-[11px] font-bold text-[#10B981] uppercase tracking-wider mb-3">Add Members</p>
                <div className="flex gap-2 mb-3">
                  <input value={teamMemberInput} onChange={e=>setTeamMemberInput(e.target.value)}
                    onKeyDown={e=>{
                      if(e.key==="Enter"&&teamMemberInput.trim()){
                        const [name,...rest]=teamMemberInput.split(",");
                        const email=rest[0]?.trim()||"";
                        setTeamMemberList(l=>[...l,{name:name.trim(),email,role:"Member"}]);
                        setTeamMemberInput("");
                      }
                    }}
                    placeholder='Name, email  —  or press Enter to add'
                    className="flex-1 px-3 py-2.5 text-[13px] bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/10 transition-all"/>
                  <button onClick={()=>{
                    if(!teamMemberInput.trim())return;
                    const [name,...rest]=teamMemberInput.split(",");
                    const email=rest[0]?.trim()||"";
                    setTeamMemberList(l=>[...l,{name:name.trim(),email,role:"Member"}]);
                    setTeamMemberInput("");
                  }} className="px-4 py-2.5 rounded-xl bg-[#10B981] text-white text-[13px] font-semibold hover:bg-[#059669] transition-colors cursor-pointer flex items-center gap-1.5">
                    <Plus size={13}/> Add
                  </button>
                </div>
                {teamMemberList.length > 0 && (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {teamMemberList.map((m,i)=>(
                      <div key={i} className="flex items-center gap-2.5 px-3 py-2 bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl">
                        <div className="w-6 h-6 rounded-full bg-[#06B6D4] text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0">
                          {m.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-semibold text-[#0F172A] truncate">{m.name}</p>
                          {m.email && <p className="text-[10.5px] text-[#94A3B8] truncate">{m.email}</p>}
                        </div>
                        <select value={m.role} onChange={e=>setTeamMemberList(l=>l.map((x,j)=>j===i?{...x,role:e.target.value}:x))}
                          className="text-[11px] border border-[#E5F4F7] rounded-lg px-2 py-1 text-[#475569] bg-white outline-none cursor-pointer">
                          {["Member","Admin","Viewer"].map(r=><option key={r}>{r}</option>)}
                        </select>
                        <button onClick={()=>setTeamMemberList(l=>l.filter((_,j)=>j!==i))} className="w-5 h-5 rounded-lg flex items-center justify-center text-[#94A3B8] hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer">
                          <X size={11}/>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {teamMemberList.length === 0 && (
                  <p className="text-[11.5px] text-[#B0C4CB] text-center py-2">No members added yet. Type a name and press Enter.</p>
                )}
              </div>
            </div>
            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-[#EDF7F9] bg-[#FAFEFF] flex-shrink-0">
              <p className="text-[11.5px] text-[#94A3B8]">{teamMemberList.length} member{teamMemberList.length!==1?"s":""} will be invited</p>
              <div className="flex gap-2">
                <button onClick={()=>{setShowAddTeam(false);setTeamMemberList([]);setTeamMemberInput("");}} className="px-4 py-2 rounded-xl border border-[#E5F4F7] text-[13px] font-semibold text-[#64748B] hover:bg-[#F8FDFE] transition-colors cursor-pointer">Cancel</button>
                <button onClick={()=>{
                  if(!addTeamForm.name.trim()||!addTeamForm.owner.trim()){toast.error("Team name and owner are required");return;}
                  const newTeam={id:"t"+Date.now(),name:addTeamForm.name,owner:addTeamForm.owner,members:1+teamMemberList.length,status:"pending" as StatusV,created:new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}),plan:addTeamForm.plan};
                  setLocalTeams(t=>[newTeam,...t]);
                  setShowAddTeam(false);
                  setAddTeamForm({name:"",owner:"",ownerEmail:"",department:"",website:"",description:"",plan:"Free"});
                  setTeamMemberList([]);setTeamMemberInput("");
                  toast.success(\`Team "\${newTeam.name}" created with \${1+teamMemberList.length} member(s)\`);
                }} className="px-5 py-2 rounded-xl bg-[#06B6D4] text-white text-[13px] font-semibold hover:bg-[#0891B2] transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm">
                  <Building2 size={13}/> Create Team
                </button>
              </div>
            </div>
          </div>
        </div>
      )}`;

src = src.slice(0, oldModalIdx) + NEW_CREATE_MODAL + '\n' + SECTION_AFTER;

// ── 4. Replace Upgrade Plan modal with 3-column cards ────────────────────
src = src.replace(
  `      {/* ── Upgrade Plan modal ─────────────────────────────────────────────── */}
      {upgradeTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-[#0F172A]/15 backdrop-blur-[3px]" onClick={() => setUpgradeTeam(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-[#E5F4F7] w-[340px] p-7">
            <div className="flex items-start justify-between mb-1.5">
              <h3 className="meetiva-body-lg font-semibold text-[#0F172A] tracking-[-0.015em]">Change Plan</h3>
              <button onClick={() => setUpgradeTeam(null)}
                className="w-7 h-7 rounded-lg hover:bg-[#F5FEFF] flex items-center justify-center text-[#94A3B8] hover:text-[#475569] cursor-pointer transition-colors">
                <X size={14} />
              </button>
            </div>
            <p className="text-[12.5px] text-[#64748B] mb-5">
              Changing plan for <span className="font-semibold text-[#0F172A]">{upgradeTeam.name}</span>
            </p>
            <div className="space-y-2">
              {([
                { plan: "Free",       price: "$0/mo",   desc: "Up to 5 users, 5 meetings/mo" },
                { plan: "Pro",        price: "$12/mo",  desc: "Up to 50 users, unlimited meetings" },
                { plan: "Enterprise", price: "$49/mo",  desc: "Unlimited users & storage" },
              ] as { plan: string; price: string; desc: string }[]).map(({ plan, price, desc }) => {
                const active = upgradeTeam.plan === plan;
                return (
                  <button key={plan} onClick={() => applyPlan(upgradeTeam.id, plan)}
                    className={\`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-left transition-all cursor-pointer \${
                      active ? "border-[#06B6D4] bg-[#F0FAFE]" : "border-[#E5F4F7] bg-white hover:border-[#06B6D4] hover:bg-[#F9FCFD]"
                    }\`}>
                    <div>
                      <div className={\`text-[13px] font-semibold \${active ? "text-[#06B6D4]" : "text-[#0F172A]"}\`}>{plan}</div>
                      <div className="text-[11px] text-[#94A3B8] font-mono mt-0.5">{desc}</div>
                    </div>
                    <div className="flex items-center gap-2.5 flex-shrink-0">
                      <span className="text-[12px] font-mono font-semibold text-[#64748B]">{price}</span>
                      {active && <CheckCircle size={14} className="text-[#06B6D4]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}`,
  `      {/* ── Upgrade Plan modal — 3 vertical cards ────────────────────────── */}
      {upgradeTeam && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0F172A]/50 backdrop-blur-[5px]" onClick={() => setUpgradeTeam(null)} />
          <div className="relative z-10 w-full max-w-2xl">
            {/* Title */}
            <div className="flex items-center justify-between mb-5 px-1">
              <div>
                <h3 className="text-[20px] font-bold text-white tracking-tight">Upgrade Plan</h3>
                <p className="text-[13px] text-white/70 mt-0.5">Choose the right plan for <span className="font-semibold text-white">{upgradeTeam.name}</span></p>
              </div>
              <button onClick={() => setUpgradeTeam(null)}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white cursor-pointer transition-colors">
                <X size={16} />
              </button>
            </div>
            {/* 3 vertical cards */}
            <div className="grid grid-cols-3 gap-4">
              {([
                { plan:"Free",       price:"$0",    period:"/mo",  tagline:"Get started",     color:"#64748B", gradFrom:"#F8FAFC", gradTo:"#F1F5F9", border:"#CBD5E1",  textCol:"#334155",
                  features:["Up to 5 members","5 meetings / month","1 GB cloud storage","Basic analytics","Email support"] },
                { plan:"Pro",        price:"$12",   period:"/mo",  tagline:"Most popular",    color:"#06B6D4", gradFrom:"#F0FAFE", gradTo:"#E0F7FE", border:"#06B6D4",  textCol:"#0E7490",
                  features:["Up to 50 members","Unlimited meetings","20 GB cloud storage","Advanced analytics","Priority support","AI meeting summaries"] },
                { plan:"Enterprise", price:"$49",   period:"/mo",  tagline:"For large teams", color:"#4F46E5", gradFrom:"#EEF2FF", gradTo:"#E0E7FF", border:"#4F46E5",  textCol:"#3730A3",
                  features:["Unlimited members","Unlimited meetings","500 GB cloud storage","Custom analytics","Dedicated support","AI features + API access","SSO & SAML"] },
              ] as const).map(({plan,price,period,tagline,color,gradFrom,gradTo,border,textCol,features})=>{
                const active = upgradeTeam.plan === plan;
                return (
                  <button key={plan} onClick={() => applyPlan(upgradeTeam.id, plan)}
                    style={{background:\`linear-gradient(160deg, \${gradFrom}, \${gradTo})\`, borderColor: active ? color : "#E5F4F7", boxShadow: active ? \`0 0 0 2px \${color}40, 0 8px 32px \${color}30\` : "0 2px 12px rgba(0,0,0,0.06)"}}
                    className={\`relative flex flex-col p-5 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer \${active?"scale-[1.02]":"hover:scale-[1.01]"}\`}>
                    {active && (
                      <div style={{background:color}} className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-white text-[10px] font-bold whitespace-nowrap shadow-md">Current Plan</div>
                    )}
                    {plan==="Pro" && !active && (
                      <div style={{background:"#06B6D4"}} className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-white text-[10px] font-bold whitespace-nowrap shadow-md">Most Popular</div>
                    )}
                    <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{color}}>{tagline}</p>
                    <p className="text-[18px] font-extrabold tracking-tight mb-0.5" style={{color:textCol}}>{plan}</p>
                    <div className="flex items-end gap-0.5 mb-4">
                      <span className="text-[28px] font-black leading-none" style={{color}}>{price}</span>
                      <span className="text-[12px] font-semibold pb-1" style={{color:textCol+"99"}}>{period}</span>
                    </div>
                    <div className="flex-1 space-y-2 mb-4">
                      {features.map(f=>(
                        <div key={f} className="flex items-start gap-2 text-[11.5px]" style={{color:textCol}}>
                          <CheckCircle size={12} className="mt-0.5 flex-shrink-0" style={{color}}/>
                          {f}
                        </div>
                      ))}
                    </div>
                    <div style={{background: active ? color : "white", color: active ? "white" : color, border:\`1.5px solid \${color}\`}}
                      className="w-full py-2.5 rounded-xl text-[12.5px] font-bold text-center transition-all">
                      {active ? "Current Plan" : "Select Plan"}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}`
);

// ── 5. Inject Open Workspace + Manage Members modals before closing </div></div> of TeamManagement
const WORKSPACE_MODALS = `
      {/* ── Open Workspace Panel ─────────────────────────────────────────── */}
      {showWorkspace && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" onClick={()=>setShowWorkspace(null)}>
          <div className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-[4px]"/>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-[#E5F4F7] overflow-hidden" onClick={e=>e.stopPropagation()}>
            <div className="h-24 bg-gradient-to-r from-[#06B6D4] to-[#4F46E5] flex items-end px-6 pb-4 relative">
              <div className="w-12 h-12 rounded-2xl bg-white shadow-lg flex items-center justify-center text-[18px] font-black text-[#06B6D4]">
                {showWorkspace.name.split(" ").map(w=>w[0]).join("").slice(0,2)}
              </div>
              <button onClick={()=>setShowWorkspace(null)} className="absolute top-3 right-3 w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-white cursor-pointer transition-colors"><X size={14}/></button>
            </div>
            <div className="px-6 py-5">
              <h2 className="text-[17px] font-bold text-[#0F172A]">{showWorkspace.name}</h2>
              <p className="text-[12.5px] text-[#94A3B8] mb-4">Owner: {showWorkspace.owner} · {showWorkspace.plan} Plan</p>
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[{label:"Members",value:showWorkspace.members},{label:"Meetings",value:Math.floor(Math.random()*200+20)},{label:"Storage",value:"12 GB"}].map(s=>(
                  <div key={s.label} className="bg-[#F8FDFE] border border-[#EDF7F9] rounded-xl p-3 text-center">
                    <p className="text-[18px] font-bold text-[#0F172A]">{s.value}</p>
                    <p className="text-[11px] text-[#94A3B8] font-medium">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2 mb-5">
                <div className="flex items-center justify-between py-2 border-b border-[#F1F9FB]">
                  <span className="text-[12.5px] text-[#64748B]">Status</span>
                  <span className={\`text-[12px] font-semibold px-2.5 py-0.5 rounded-full \${showWorkspace.status==="verified"?"bg-emerald-50 text-emerald-700":showWorkspace.status==="pending"?"bg-amber-50 text-amber-700":"bg-red-50 text-red-600"}\`}>{showWorkspace.status}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-[#F1F9FB]">
                  <span className="text-[12.5px] text-[#64748B]">Created</span>
                  <span className="text-[12.5px] font-semibold text-[#0F172A]">{showWorkspace.created}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-[12.5px] text-[#64748B]">Workspace ID</span>
                  <span className="text-[11.5px] font-mono text-[#64748B]">WS-{showWorkspace.id.toUpperCase()}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={()=>{toast.success("Launched workspace for "+showWorkspace.name);setShowWorkspace(null);}} className="flex-1 py-2.5 rounded-xl bg-[#06B6D4] text-white text-[13px] font-semibold hover:bg-[#0891B2] transition-colors cursor-pointer">Launch Workspace</button>
                <button onClick={()=>{setShowManageMembers(showWorkspace);setShowWorkspace(null);}} className="flex-1 py-2.5 rounded-xl border border-[#E5F4F7] text-[13px] font-semibold text-[#475569] hover:border-[#06B6D4] hover:text-[#06B6D4] transition-colors cursor-pointer">Manage Members</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Manage Members Panel ──────────────────────────────────────────── */}
      {showManageMembers && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" onClick={()=>setShowManageMembers(null)}>
          <div className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-[4px]"/>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-[#E5F4F7] overflow-hidden" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#EDF7F9] bg-gradient-to-r from-[#F0FAFE] to-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#4F46E5] flex items-center justify-center"><Users size={15} className="text-white"/></div>
                <div>
                  <h2 className="text-[15px] font-bold text-[#0F172A]">Manage Members</h2>
                  <p className="text-[11.5px] text-[#94A3B8]">{showManageMembers.name} · {showManageMembers.members} members</p>
                </div>
              </div>
              <button onClick={()=>setShowManageMembers(null)} className="w-8 h-8 rounded-xl flex items-center justify-center text-[#94A3B8] hover:bg-[#F5FEFF] hover:text-[#0F172A] transition-colors cursor-pointer"><X size={15}/></button>
            </div>
            <div className="px-6 py-5">
              <div className="flex gap-2 mb-4">
                <input placeholder="Invite by name or email…" className="flex-1 px-3 py-2.5 text-[13px] bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/10 transition-all"/>
                <button onClick={()=>toast.success("Invitation sent")} className="px-4 py-2.5 rounded-xl bg-[#4F46E5] text-white text-[13px] font-semibold hover:bg-[#4338CA] transition-colors cursor-pointer flex items-center gap-1.5"><Plus size={13}/>Invite</button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {Array.from({length: Math.min(showManageMembers.members,6)}, (_,i)=>{
                  const names=["Sarah Chen","Marcus Williams","Priya Patel","Tom Eriksson","Aiko Tanaka","Diego Reyes"];
                  const roles=["Admin","Member","Member","Viewer","Member","Admin"];
                  return (
                    <div key={i} className="flex items-center gap-3 px-3 py-2.5 bg-[#F8FDFE] border border-[#EDF7F9] rounded-xl">
                      <div className="w-8 h-8 rounded-full bg-[#4F46E5] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                        {names[i].split(" ").map(w=>w[0]).join("")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12.5px] font-semibold text-[#0F172A] truncate">{names[i]}</p>
                        <p className="text-[11px] text-[#94A3B8]">{names[i].toLowerCase().replace(" ",".")}@company.com</p>
                      </div>
                      <select defaultValue={roles[i]} className="text-[11px] border border-[#E5F4F7] rounded-lg px-2 py-1 text-[#475569] bg-white outline-none cursor-pointer">
                        {["Admin","Member","Viewer"].map(r=><option key={r}>{r}</option>)}
                      </select>
                      <button onClick={()=>toast.error("Member removed")} className="w-6 h-6 rounded-lg flex items-center justify-center text-[#94A3B8] hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"><X size={11}/></button>
                    </div>
                  );
                })}
                {showManageMembers.members > 6 && (
                  <p className="text-center text-[11.5px] text-[#94A3B8] py-2">+{showManageMembers.members-6} more members</p>
                )}
              </div>
            </div>
            <div className="flex justify-end px-6 py-4 border-t border-[#EDF7F9] bg-[#FAFEFF]">
              <button onClick={()=>{toast.success("Member changes saved");setShowManageMembers(null);}} className="px-5 py-2 rounded-xl bg-[#4F46E5] text-white text-[13px] font-semibold hover:bg-[#4338CA] transition-colors cursor-pointer">Save Changes</button>
            </div>
          </div>
        </div>
      )}`;

// Inject workspace modals before the closing tags of TeamManagement's return
const TM_CLOSING = `    </div>
  );
}

function AIUsage()`;
src = src.replace(TM_CLOSING, WORKSPACE_MODALS + '\n' + TM_CLOSING);

fs.writeFileSync('/workspaces/default/code/src/app/App.tsx', src, 'utf8');
const open = (src.match(/{/g)||[]).length, close = (src.match(/}/g)||[]).length;
console.log('Lines:', src.split('\n').length, '| Brace diff:', open - close);
console.log('Create Team modal full:', src.includes('Owner / Admin'));
console.log('Members section:', src.includes('Add Members'));
console.log('Upgrade 3-col:', src.includes('Most popular'));
console.log('Open Workspace modal:', src.includes('Launch Workspace'));
console.log('Manage Members modal:', src.includes('Manage Members\n'));
