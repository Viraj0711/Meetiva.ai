const fs = require('fs');
let src = fs.readFileSync('/workspaces/default/code/src/app/App.tsx', 'utf8');

// ── 1. TOPBAR: Replace search with live suggestions ────────────────────────
src = src.replace(
`  const [searchVal, setSearchVal] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);`,
`  const [searchVal, setSearchVal] = useState("");
  const [searchFocus, setSearchFocus] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);`
);

// Replace the search input block in TopBar
src = src.replace(
`      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
        <input
          value={searchVal}
          onChange={e => setSearchVal(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && searchVal.trim()) {
              toast.info(\`Searching for "\${searchVal.trim()}"…\`);
              setSearchVal("");
            }
          }}
          className="w-full pl-9 pr-4 py-2 meetiva-small bg-[#F8FDFE] border border-[#EDF7F9] rounded-xl outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/10 placeholder:text-[#B0C4CB] text-[#0F172A] transition-all"
          placeholder="Search users, teams, meetings, logs…"
        />
      </div>`,
`      {/* Search with live suggestions */}
      <div className="relative flex-1 max-w-sm" onClick={e => e.stopPropagation()}>
        <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
        <input
          value={searchVal}
          onChange={e => { setSearchVal(e.target.value); setSearchFocus(true); }}
          onFocus={() => setSearchFocus(true)}
          onBlur={() => setTimeout(() => setSearchFocus(false), 150)}
          onKeyDown={e => {
            if (e.key === "Enter" && searchVal.trim()) {
              const dest = searchVal.toLowerCase().includes("team") ? "teams"
                : searchVal.toLowerCase().includes("log") ? "logs"
                : searchVal.toLowerCase().includes("ai") ? "ai"
                : searchVal.toLowerCase().includes("setting") ? "settings"
                : "users";
              onNav?.(dest as Page);
              setSearchVal(""); setSearchFocus(false);
            }
            if (e.key === "Escape") { setSearchVal(""); setSearchFocus(false); }
          }}
          className="w-full pl-9 pr-4 py-2 meetiva-small bg-[#F8FDFE] border border-[#EDF7F9] rounded-xl outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/10 placeholder:text-[#B0C4CB] text-[#0F172A] transition-all"
          placeholder="Search users, teams, meetings, logs…"
        />
        {searchVal.trim() && searchFocus && (() => {
          const q = searchVal.toLowerCase();
          const userHits = [
            { id:"u1", name:"Sarah Chen",       email:"sarah.chen@acme.com",    page:"users"  as Page },
            { id:"u2", name:"Marcus Williams",  email:"m.williams@orion.io",    page:"users"  as Page },
            { id:"u3", name:"Priya Patel",      email:"priya@nexus.tech",       page:"users"  as Page },
            { id:"u5", name:"Aiko Tanaka",      email:"aiko.tanaka@mitsuko.jp", page:"users"  as Page },
            { id:"u7", name:"Fatima Al-Hassan", email:"f.alhassan@gulf.ae",     page:"users"  as Page },
            { id:"u8", name:"Tom Eriksson",     email:"tom.e@nordic.se",        page:"users"  as Page },
          ].filter(u => u.name.toLowerCase().includes(q) || u.email.includes(q));
          const pageHits = [
            { label:"Users",     icon:"👥", page:"users"    as Page },
            { label:"Teams",     icon:"🏢", page:"teams"    as Page },
            { label:"AI Usage",  icon:"🤖", page:"ai"       as Page },
            { label:"Logs",      icon:"📋", page:"logs"     as Page },
            { label:"Settings",  icon:"⚙️", page:"settings" as Page },
            { label:"My Profile",icon:"👤", page:"profile"  as Page },
          ].filter(p => p.label.toLowerCase().includes(q));
          const allHits = [...userHits.slice(0,4), ...pageHits.slice(0,3)];
          if (!allHits.length) return null;
          return (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E5F4F7] rounded-2xl shadow-2xl z-[100] overflow-hidden">
              {userHits.slice(0,4).length > 0 && (
                <>
                  <p className="px-3 pt-2.5 pb-1 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Users</p>
                  {userHits.slice(0,4).map(u => (
                    <button key={u.id}
                      onMouseDown={() => { onNav?.(u.page); setSearchVal(""); setSearchFocus(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[#F8FDFE] transition-colors cursor-pointer text-left">
                      <div className="w-6 h-6 rounded-full bg-[#4F46E5] text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0">
                        {u.name.split(" ").map(w=>w[0]).join("").slice(0,2)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[12px] font-semibold text-[#0F172A] truncate">{u.name}</p>
                        <p className="text-[10.5px] text-[#94A3B8] truncate">{u.email}</p>
                      </div>
                    </button>
                  ))}
                </>
              )}
              {pageHits.slice(0,3).length > 0 && (
                <>
                  <p className="px-3 pt-2 pb-1 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider border-t border-[#F1F9FB] mt-1">Pages</p>
                  {pageHits.slice(0,3).map(p => (
                    <button key={p.page}
                      onMouseDown={() => { onNav?.(p.page); setSearchVal(""); setSearchFocus(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[#F8FDFE] transition-colors cursor-pointer text-left">
                      <span className="text-base">{p.icon}</span>
                      <span className="text-[12px] font-medium text-[#374151]">{p.label}</span>
                    </button>
                  ))}
                </>
              )}
              <p className="px-3 py-2 text-[10.5px] text-[#94A3B8] border-t border-[#F1F9FB]">Press Enter to navigate</p>
            </div>
          );
        })()}
      </div>`
);

// ── 2. USERS: Add sort state + wire Sort button + Add User modal ───────────
src = src.replace(
`  const [openMenuId, setOpenMenuId]       = useState<string | null>(null);`,
`  const [openMenuId, setOpenMenuId]       = useState<string | null>(null);
  const [sortBy, setSortBy]               = useState<"name"|"email"|"joined"|"meetings"|"plan">("name");
  const [sortDir, setSortDir]             = useState<"asc"|"desc">("asc");
  const [sortOpen, setSortOpen]           = useState(false);
  const [showAddUser, setShowAddUser]     = useState(false);
  const [addUserForm, setAddUserForm]     = useState({ name:"", email:"", role:"Member", plan:"Free", phone:"", status:"active" });`
);

// wire filtered to also sort
src = src.replace(
`  }), [search, planFilter, statusFilter, roleFilter, localUsers]);`,
`  }), [search, planFilter, statusFilter, roleFilter, localUsers]);

  const sorted = useMemo(() => [...filtered].sort((a,b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    if (sortBy === "name")     return dir * a.name.localeCompare(b.name);
    if (sortBy === "email")    return dir * a.email.localeCompare(b.email);
    if (sortBy === "joined")   return dir * a.joined.localeCompare(b.joined);
    if (sortBy === "meetings") return dir * (a.meetings - b.meetings);
    if (sortBy === "plan")     return dir * a.plan.localeCompare(b.plan);
    return 0;
  }), [filtered, sortBy, sortDir]);`
);

// ── 3. Replace "Add User" button + Sort button ─────────────────────────────
src = src.replace(
`          <button onClick={() => toast.success("Add User form coming soon")} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#06B6D4] text-white text-[13px] font-semibold hover:bg-[#0891B2] transition-colors cursor-pointer flex-shrink-0 shadow-sm">
            <Plus size={14} /> Add User
          </button>`,
`          <button onClick={() => setShowAddUser(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#06B6D4] text-white text-[13px] font-semibold hover:bg-[#0891B2] transition-colors cursor-pointer flex-shrink-0 shadow-sm">
            <Plus size={14} /> Add User
          </button>`
);

src = src.replace(
`          <button className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-[#E5F4F7] bg-white text-[13px] font-medium text-[#475569] hover:border-[#06B6D4] hover:text-[#06B6D4] transition-all cursor-pointer">
            <ChevronDown size={13} /> Sort
          </button>`,
`          <div className="relative">
            <button onClick={() => setSortOpen(o => !o)} className={\`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border bg-white text-[13px] font-medium transition-all cursor-pointer \${sortOpen?"border-[#06B6D4] text-[#06B6D4]":"border-[#E5F4F7] text-[#475569] hover:border-[#06B6D4] hover:text-[#06B6D4]"}\`}>
              <ChevronDown size={13} className={\`transition-transform \${sortOpen?"rotate-180":""}\`}/> Sort
            </button>
            {sortOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-[#E5F4F7] rounded-xl shadow-xl z-50 py-1 min-w-[180px]" onClick={e=>e.stopPropagation()}>
                {([["name","Name"],["email","Email"],["joined","Date Joined"],["meetings","Meetings"],["plan","Plan"]] as const).map(([k,lbl])=>(
                  <button key={k} onClick={()=>{if(sortBy===k)setSortDir(d=>d==="asc"?"desc":"asc");else{setSortBy(k);setSortDir("asc");}setSortOpen(false);}}
                    className={\`w-full flex items-center justify-between px-3 py-2 text-[12px] hover:bg-[#F8FDFE] cursor-pointer transition-colors \${sortBy===k?"text-[#06B6D4] font-semibold":"text-[#374151]"}\`}>
                    {lbl}{sortBy===k&&<span className="text-[10px]">{sortDir==="asc"?"↑":"↓"}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>`
);

// ── 4. Replace sorted data in table rows (filtered → sorted) ───────────────
// The paginated slice is likely "filtered.slice(...)" — replace with sorted
const paginationOld = `const PER_PAGE = 8;`;
// find the pagination cut pattern after sorted is defined
src = src.replace(
  /const paginated = filtered\.slice/g,
  'const paginated = sorted.slice'
);
// also replace if totalPages uses filtered.length
// find the pattern for pagination total
src = src.replace(
  /const totalPages = Math\.ceil\(filtered\.length/g,
  'const totalPages = Math.ceil(sorted.length'
);

// ── 5. Inject Add User modal before UserManagement return ─────────────────
const ADD_USER_MODAL = `
      {/* ── Add User Modal ───────────────────────────────────────────────── */}
      {showAddUser && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" onClick={()=>setShowAddUser(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[3px]"/>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-[#E5F4F7] overflow-hidden" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#EDF7F9]">
              <div>
                <h2 className="text-[16px] font-bold text-[#0F172A]">Add New User</h2>
                <p className="text-[11.5px] text-[#94A3B8] mt-0.5">Fill in the details to create a new user account</p>
              </div>
              <button onClick={()=>setShowAddUser(false)} className="w-8 h-8 rounded-xl flex items-center justify-center text-[#94A3B8] hover:bg-[#F5FEFF] hover:text-[#0F172A] transition-colors cursor-pointer"><X size={15}/></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">Full Name *</label>
                  <input value={addUserForm.name} onChange={e=>setAddUserForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Jane Smith"
                    className="w-full px-3 py-2.5 text-[13px] bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/10 transition-all"/>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">Email Address *</label>
                  <input type="email" value={addUserForm.email} onChange={e=>setAddUserForm(f=>({...f,email:e.target.value}))} placeholder="jane@company.com"
                    className="w-full px-3 py-2.5 text-[13px] bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/10 transition-all"/>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">Phone Number</label>
                <input type="tel" value={addUserForm.phone} onChange={e=>setAddUserForm(f=>({...f,phone:e.target.value}))} placeholder="+1 (555) 000-0000"
                  className="w-full px-3 py-2.5 text-[13px] bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/10 transition-all"/>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">Role</label>
                  <select value={addUserForm.role} onChange={e=>setAddUserForm(f=>({...f,role:e.target.value}))}
                    className="w-full px-3 py-2.5 text-[13px] bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] transition-all cursor-pointer">
                    {["Member","Admin","Owner"].map(r=><option key={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">Plan</label>
                  <select value={addUserForm.plan} onChange={e=>setAddUserForm(f=>({...f,plan:e.target.value}))}
                    className="w-full px-3 py-2.5 text-[13px] bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] transition-all cursor-pointer">
                    {["Free","Pro","Enterprise"].map(p=><option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">Status</label>
                  <select value={addUserForm.status} onChange={e=>setAddUserForm(f=>({...f,status:e.target.value}))}
                    className="w-full px-3 py-2.5 text-[13px] bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] transition-all cursor-pointer">
                    {["active","inactive","pending"].map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#EDF7F9] bg-[#FAFEFF]">
              <button onClick={()=>setShowAddUser(false)} className="px-4 py-2 rounded-xl border border-[#E5F4F7] text-[13px] font-semibold text-[#64748B] hover:bg-[#F8FDFE] transition-colors cursor-pointer">Cancel</button>
              <button onClick={()=>{
                if(!addUserForm.name.trim()||!addUserForm.email.trim()){toast.error("Name and email are required");return;}
                const newUser={id:"u"+Date.now(),name:addUserForm.name,email:addUserForm.email,role:addUserForm.role,plan:addUserForm.plan,status:addUserForm.status as StatusV,storage:"0 GB",meetings:0,joined:new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}),phone:addUserForm.phone,avatar:addUserForm.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()};
                setLocalUsers(u=>[newUser,...u]);
                setShowAddUser(false);
                setAddUserForm({name:"",email:"",role:"Member",plan:"Free",phone:"",status:"active"});
                toast.success(\`User "\${newUser.name}" added successfully\`);
              }} className="px-5 py-2 rounded-xl bg-[#06B6D4] text-white text-[13px] font-semibold hover:bg-[#0891B2] transition-colors cursor-pointer flex items-center gap-1.5">
                <Plus size={13}/> Add User
              </button>
            </div>
          </div>
        </div>
      )}`;

src = src.replace(
  `        {/* ── Overview Cards ───────────────────────────────────────────────── */}`,
  ADD_USER_MODAL + `\n        {/* ── Overview Cards ───────────────────────────────────────────────── */}`
);

// ── 6. Teams: Add sort + Create Team modal ─────────────────────────────────
src = src.replace(
  `  const [openMenuId, setOpenMenuId]   = useState<string | null>(null);
  const [upgradeTeam, setUpgradeTeam] = useState<typeof mockTeams[0] | null>(null);`,
  `  const [openMenuId, setOpenMenuId]   = useState<string | null>(null);
  const [upgradeTeam, setUpgradeTeam] = useState<typeof mockTeams[0] | null>(null);
  const [teamSortBy, setTeamSortBy]   = useState<"name"|"members"|"created"|"plan">("name");
  const [teamSortDir, setTeamSortDir] = useState<"asc"|"desc">("asc");
  const [teamSortOpen, setTeamSortOpen] = useState(false);
  const [showAddTeam, setShowAddTeam]  = useState(false);
  const [addTeamForm, setAddTeamForm]  = useState({ name:"", owner:"", plan:"Free", description:"" });`
);

// Add sort to teams create button
src = src.replace(
  `            <button onClick={() => toast.success("Create Team dialog coming soon")} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#06B6D4] text-white text-[13px] font-semibold hover:bg-[#0891B2] transition-colors cursor-pointer shadow-sm">
              <Plus size={14} /> Create Team
            </button>`,
  `            <button onClick={() => setShowAddTeam(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#06B6D4] text-white text-[13px] font-semibold hover:bg-[#0891B2] transition-colors cursor-pointer shadow-sm">
              <Plus size={14} /> Create Team
            </button>`
);

// Inject Add Team modal before Teams return statement
const ADD_TEAM_MODAL = `
      {/* ── Add Team Modal ────────────────────────────────────────────────── */}
      {showAddTeam && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" onClick={()=>setShowAddTeam(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[3px]"/>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md border border-[#E5F4F7] overflow-hidden" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#EDF7F9]">
              <div>
                <h2 className="text-[16px] font-bold text-[#0F172A]">Create New Team</h2>
                <p className="text-[11.5px] text-[#94A3B8] mt-0.5">Set up a new workspace for your organization</p>
              </div>
              <button onClick={()=>setShowAddTeam(false)} className="w-8 h-8 rounded-xl flex items-center justify-center text-[#94A3B8] hover:bg-[#F5FEFF] hover:text-[#0F172A] transition-colors cursor-pointer"><X size={15}/></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">Team / Organization Name *</label>
                <input value={addTeamForm.name} onChange={e=>setAddTeamForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Design Systems Guild"
                  className="w-full px-3 py-2.5 text-[13px] bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/10 transition-all"/>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">Owner Name *</label>
                <input value={addTeamForm.owner} onChange={e=>setAddTeamForm(f=>({...f,owner:e.target.value}))} placeholder="e.g. Sarah Chen"
                  className="w-full px-3 py-2.5 text-[13px] bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/10 transition-all"/>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">Description</label>
                <textarea value={addTeamForm.description} onChange={e=>setAddTeamForm(f=>({...f,description:e.target.value}))} rows={2} placeholder="What does this team do?"
                  className="w-full px-3 py-2.5 text-[13px] bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/10 transition-all resize-none"/>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">Plan</label>
                <div className="grid grid-cols-3 gap-2">
                  {["Free","Pro","Enterprise"].map(p=>(
                    <button key={p} onClick={()=>setAddTeamForm(f=>({...f,plan:p}))}
                      className={\`py-2 rounded-xl border text-[13px] font-semibold transition-all cursor-pointer \${addTeamForm.plan===p?"border-[#06B6D4] bg-[#F0FAFE] text-[#06B6D4]":"border-[#E5F4F7] text-[#475569] hover:border-[#06B6D4]"}\`}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#EDF7F9] bg-[#FAFEFF]">
              <button onClick={()=>setShowAddTeam(false)} className="px-4 py-2 rounded-xl border border-[#E5F4F7] text-[13px] font-semibold text-[#64748B] hover:bg-[#F8FDFE] transition-colors cursor-pointer">Cancel</button>
              <button onClick={()=>{
                if(!addTeamForm.name.trim()||!addTeamForm.owner.trim()){toast.error("Team name and owner are required");return;}
                const newTeam={id:"t"+Date.now(),name:addTeamForm.name,owner:addTeamForm.owner,members:1,status:"pending" as StatusV,created:new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}),plan:addTeamForm.plan};
                setLocalTeams(t=>[newTeam,...t]);
                setShowAddTeam(false);
                setAddTeamForm({name:"",owner:"",plan:"Free",description:""});
                toast.success(\`Team "\${newTeam.name}" created successfully\`);
              }} className="px-5 py-2 rounded-xl bg-[#06B6D4] text-white text-[13px] font-semibold hover:bg-[#0891B2] transition-colors cursor-pointer flex items-center gap-1.5">
                <Plus size={13}/> Create Team
              </button>
            </div>
          </div>
        </div>
      )}`;

// Find where TeamManagement returns its JSX and inject modal before first section header
src = src.replace(
  `        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-end justify-between gap-6">
          <div>
            <h1 className="text-[28px] font-bold text-[#0F172A]`,
  ADD_TEAM_MODAL + `\n        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-end justify-between gap-6">
          <div>
            <h1 className="text-[28px] font-bold text-[#0F172A]`
);

fs.writeFileSync('/workspaces/default/code/src/app/App.tsx', src, 'utf8');
const open = (src.match(/{/g)||[]).length, close = (src.match(/}/g)||[]).length;
console.log('Done. Lines:', src.split('\n').length);
console.log('Brace balance:', open === close ? '✓' : '✗ diff=' + (open-close));
console.log('Search suggestions:', src.includes('searchFocus'));
console.log('sortBy state users:', src.includes("useState<\"name\"|\"email\"|\"joined\"|\"meetings\"|\"plan\">"));
console.log('sorted memo:', src.includes('const sorted = useMemo'));
console.log('Add User modal:', src.includes('Add New User'));
console.log('Add Team modal:', src.includes('Create New Team'));
