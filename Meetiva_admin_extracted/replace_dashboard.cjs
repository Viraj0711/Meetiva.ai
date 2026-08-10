const fs = require('fs');
const src = fs.readFileSync('/workspaces/default/code/src/app/App.tsx', 'utf8');

const startMarker = 'function Dashboard()';
const endMarker = '// ── User Management ────────────────────────────────────────────────────────';

const startIdx = src.indexOf(startMarker);
const endIdx = src.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
  console.error('Markers not found', startIdx, endIdx);
  process.exit(1);
}

const newDashboard = `function Dashboard() {
  const [period, setPeriod] = useState<"24H"|"7D"|"30D">("7D");
  const [workspace, setWorkspace] = useState("Meetiva Global");

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const dateStr  = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  const kpis = [
    { label: "Total Users",       value: "13,847", delta: "+284",  pct: "+8.4%",  up: true,  icon: Users,     color: "#06B6D4", bg: "#EFF9FB", spark: [42,55,49,68,61,84,91,84,99,114,128,138],          uid: "k-tu" },
    { label: "Individual Users",  value: "11,203", delta: "+196",  pct: "+7.1%",  up: true,  icon: User,      color: "#4F46E5", bg: "#EEF2FF", spark: [30,38,34,50,46,60,64,70,78,90,98,112],            uid: "k-iu" },
    { label: "Team Accounts",     value: "1,124",  delta: "+42",   pct: "+12.1%", up: true,  icon: Users2,    color: "#10B981", bg: "#F0FDF4", spark: [10,13,12,17,16,21,20,26,24,32,30,38],             uid: "k-ta" },
    { label: "Meetings Processed",value: "284,391",delta: "+4,521",pct: "+22.3%", up: true,  icon: Video,     color: "#F59E0B", bg: "#FFFBEB", spark: [260,295,280,330,355,390,405,425,455,485,508,540], uid: "k-mp" },
    { label: "Storage Used",      value: "7.9 TB", delta: "+0.4",  pct: "+5.3%",  up: true,  icon: HardDrive, color: "#EF4444", bg: "#FEF2F2", spark: [20,25,28,32,36,41,45,52,57,63,69,79],             uid: "k-su" },
    { label: "Today's AI Requests",value:"98,412", delta: "+8,231",pct: "+34.7%", up: true,  icon: Brain,     color: "#06B6D4", bg: "#EFF9FB", spark: [50,75,62,88,80,106,111,104,118,134,140,148],      uid: "k-ai" },
  ];

  const overviewData: Record<"24H"|"7D"|"30D", Array<{label:string;users:number;meetings:number;ai:number}>> = {
    "24H": [
      {label:"00",users:320,meetings:45,ai:2100},
      {label:"03",users:180,meetings:20,ai:980},
      {label:"06",users:290,meetings:38,ai:1600},
      {label:"09",users:810,meetings:142,ai:5400},
      {label:"12",users:1240,meetings:280,ai:9800},
      {label:"15",users:1380,meetings:310,ai:12000},
      {label:"18",users:980,meetings:201,ai:8200},
      {label:"21",users:640,meetings:128,ai:5100},
    ],
    "7D": [
      {label:"Mon",users:1820,meetings:284,ai:14200},
      {label:"Tue",users:2140,meetings:390,ai:17800},
      {label:"Wed",users:1980,meetings:341,ai:15600},
      {label:"Thu",users:2380,meetings:471,ai:22400},
      {label:"Fri",users:2620,meetings:520,ai:26100},
      {label:"Sat",users:1540,meetings:190,ai:11800},
      {label:"Sun",users:1260,meetings:148,ai:9400},
    ],
    "30D": [
      {label:"W1",users:8200,meetings:1420,ai:62000},
      {label:"W2",users:9800,meetings:1680,ai:74000},
      {label:"W3",users:11400,meetings:2100,ai:88000},
      {label:"W4",users:13847,meetings:2841,ai:98412},
    ],
  };

  const ovData = overviewData[period];

  const userGrowthData = [
    {label:"Feb",individual:7200,team:720},
    {label:"Mar",individual:8100,team:810},
    {label:"Apr",individual:9000,team:890},
    {label:"May",individual:9800,team:960},
    {label:"Jun",individual:10600,team:1020},
    {label:"Jul",individual:11203,team:1124},
  ];

  const aiUsageData = [
    {label:"Mon",gpt4:14200,claude:8400,llama:3100},
    {label:"Tue",gpt4:17800,claude:10200,llama:3800},
    {label:"Wed",gpt4:15600,claude:9100,llama:3400},
    {label:"Thu",gpt4:22400,claude:12800,llama:5200},
    {label:"Fri",gpt4:26100,claude:14900,llama:6200},
    {label:"Sat",gpt4:11800,claude:6900,llama:2800},
    {label:"Sun",gpt4:9400,claude:5400,llama:2100},
  ];

  const storageData = [
    {label:"Feb",used:4.2},{label:"Mar",used:4.9},{label:"Apr",used:5.6},
    {label:"May",used:6.1},{label:"Jun",used:7.0},{label:"Jul",used:7.9},
  ];

  const recentActivity = [
    {id:"a1",  icon:Users,    color:"#06B6D4", text:"Sarah Chen upgraded to Enterprise plan",     time:"2 min ago",  badge:"upgrade",  badgeColor:"#4F46E5"},
    {id:"a2",  icon:AlertCircle,color:"#EF4444",text:"API rate limit hit — workspace NordicCo",  time:"8 min ago",  badge:"alert",    badgeColor:"#EF4444"},
    {id:"a3",  icon:Users2,   color:"#10B981", text:"New team created: Design Systems Guild",     time:"14 min ago", badge:"new",      badgeColor:"#10B981"},
    {id:"a4",  icon:Shield,   color:"#F59E0B", text:"Failed login attempts on user@latamhub.io", time:"22 min ago", badge:"security", badgeColor:"#F59E0B"},
    {id:"a5",  icon:Brain,    color:"#06B6D4", text:"AI model switched to Claude 3.5 Sonnet",    time:"35 min ago", badge:"system",   badgeColor:"#64748B"},
    {id:"a6",  icon:CheckCircle,color:"#10B981",text:"Scheduled maintenance completed — DB01",   time:"1 hr ago",   badge:"done",     badgeColor:"#10B981"},
    {id:"a7",  icon:HardDrive,color:"#EF4444", text:"Storage quota warning: IndieStudio (92%)",  time:"2 hr ago",   badge:"warn",     badgeColor:"#F59E0B"},
    {id:"a8",  icon:CreditCard,color:"#4F46E5",text:"Invoice #8821 generated for 38 accounts",  time:"3 hr ago",   badge:"billing",  badgeColor:"#4F46E5"},
  ];

  const quickActions = [
    { icon: Plus,       label: "Add User",         color: "#06B6D4", bg: "#EFF9FB",  onClick: () => {} },
    { icon: Users2,     label: "Create Team",       color: "#4F46E5", bg: "#EEF2FF", onClick: () => {} },
    { icon: BarChart3,  label: "View Reports",      color: "#10B981", bg: "#F0FDF4", onClick: () => {} },
    { icon: ScrollText, label: "System Logs",       color: "#6B7280", bg: "#F9FAFB", onClick: () => {} },
    { icon: Brain,      label: "AI Usage",          color: "#06B6D4", bg: "#EFF9FB",  onClick: () => {} },
    { icon: HardDrive,  label: "Storage",           color: "#EF4444", bg: "#FEF2F2", onClick: () => {} },
    { icon: Shield,     label: "Security",          color: "#F59E0B", bg: "#FFFBEB", onClick: () => {} },
    { icon: Settings,   label: "Settings",          color: "#64748B", bg: "#F9FAFB", onClick: () => {} },
  ];

  const workspaces = ["Meetiva Global","Enterprise Org","Dev Sandbox"];

  // sparkline SVG
  const Spark = ({ data, color, uid }: { data: number[]; color: string; uid: string }) => {
    const w=80, h=28, pad=2;
    const min=Math.min(...data), max=Math.max(...data);
    const rng=max-min||1;
    const pts=data.map((v,i)=>[pad+i*((w-pad*2)/(data.length-1)),h-pad-(v-min)/rng*(h-pad*2)]);
    const d="M"+pts.map(p=>p.join(",")).join(" L");
    const fa="M"+pts[0][0]+","+h+" L"+pts.map(p=>p.join(",")).join(" L")+pts[pts.length-1][0]+","+h+" Z";
    return (
      <svg width={w} height={h} viewBox={\`0 0 \${w} \${h}\`} fill="none">
        <defs>
          <linearGradient id={\`sg-\${uid}\`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.18"/>
            <stop offset="100%" stopColor={color} stopOpacity="0"/>
          </linearGradient>
        </defs>
        <path d={fa} fill={\`url(#sg-\${uid})\`}/>
        <path d={d} stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  };

  // multi-series area chart
  const OverviewChart = () => {
    const w=800, h=200, padL=40, padR=16, padT=16, padB=32;
    const cw=w-padL-padR, ch=h-padT-padB;
    const cols = ovData.length;
    const xStep = cw/(cols-1);
    const maxVal = Math.max(...ovData.map(d=>Math.max(d.users,d.meetings,d.ai)));
    const px=(i:number)=>padL+i*xStep;
    const py=(v:number)=>padT+ch-(v/maxVal)*ch;
    const line=(key:"users"|"meetings"|"ai")=>ovData.map((d,i)=>(i===0?"M":"L")+px(i).toFixed(1)+","+py(d[key]).toFixed(1)).join(" ");
    const area=(key:"users"|"meetings"|"ai")=>{
      const pts=ovData.map((d,i)=>px(i).toFixed(1)+","+py(d[key]).toFixed(1));
      return "M"+padL+","+(padT+ch)+" L"+pts.join(" L ")+padL+xStep*(cols-1)+","+(padT+ch)+" Z";
    };
    const yTicks=[0,0.25,0.5,0.75,1].map(f=>({ v:Math.round(f*maxVal), y:padT+ch*(1-f) }));
    return (
      <svg viewBox={\`0 0 \${w} \${h}\`} className="w-full" style={{height:200}}>
        <defs>
          <linearGradient id="ov-u" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#06B6D4" stopOpacity="0.15"/><stop offset="100%" stopColor="#06B6D4" stopOpacity="0"/></linearGradient>
          <linearGradient id="ov-m" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4F46E5" stopOpacity="0.12"/><stop offset="100%" stopColor="#4F46E5" stopOpacity="0"/></linearGradient>
          <linearGradient id="ov-a" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10B981" stopOpacity="0.10"/><stop offset="100%" stopColor="#10B981" stopOpacity="0"/></linearGradient>
        </defs>
        {yTicks.map((t,i)=>(
          <g key={i}>
            <line x1={padL} y1={t.y} x2={w-padR} y2={t.y} stroke="#E5F4F7" strokeWidth="1"/>
            <text x={padL-6} y={t.y+4} fill="#94A3B8" fontSize={9} textAnchor="end">{t.v>=1000?Math.round(t.v/100)/10+"k":t.v}</text>
          </g>
        ))}
        <path d={area("ai")} fill="url(#ov-a)"/>
        <path d={area("meetings")} fill="url(#ov-m)"/>
        <path d={area("users")} fill="url(#ov-u)"/>
        <path d={line("ai")} stroke="#10B981" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        <path d={line("meetings")} stroke="#4F46E5" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        <path d={line("users")} stroke="#06B6D4" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        {ovData.map((d,i)=>(
          <text key={i} x={px(i)} y={h-6} fill="#94A3B8" fontSize={9} textAnchor="middle">{d.label}</text>
        ))}
      </svg>
    );
  };

  // stacked bar chart for user growth
  const UserGrowthChart = () => {
    const w=480, h=160, padL=36, padB=24, padT=12, padR=12;
    const cw=w-padL-padR, ch=h-padB-padT;
    const maxV=Math.max(...userGrowthData.map(d=>d.individual+d.team));
    const barW=Math.min(32, cw/userGrowthData.length*0.55);
    const gap=cw/userGrowthData.length;
    return (
      <svg viewBox={\`0 0 \${w} \${h}\`} className="w-full" style={{height:160}}>
        {[0,0.5,1].map((f,i)=>{
          const y=padT+ch*(1-f);
          const v=Math.round(f*maxV);
          return <g key={i}><line x1={padL} y1={y} x2={w-padR} y2={y} stroke="#E5F4F7" strokeWidth="1"/><text x={padL-4} y={y+4} fill="#94A3B8" fontSize={8} textAnchor="end">{v>=1000?Math.round(v/100)/10+"k":v}</text></g>;
        })}
        {userGrowthData.map((d,i)=>{
          const x=padL+i*gap+gap/2-barW/2;
          const hInd=((d.individual)/maxV)*ch;
          const hTeam=((d.team)/maxV)*ch;
          return (
            <g key={i}>
              <rect x={x} y={padT+ch-hInd-hTeam} width={barW} height={hTeam} fill="#4F46E5" rx="3"/>
              <rect x={x} y={padT+ch-hInd} width={barW} height={hInd} fill="#06B6D4" rx="3"/>
              <text x={x+barW/2} y={h-6} fill="#94A3B8" fontSize={8} textAnchor="middle">{d.label}</text>
            </g>
          );
        })}
      </svg>
    );
  };

  // AI usage bar chart
  const AiChart = () => {
    const w=480, h=160, padL=36, padB=24, padT=12, padR=12;
    const cw=w-padL-padR, ch=h-padB-padT;
    const maxV=Math.max(...aiUsageData.map(d=>d.gpt4+d.claude+d.llama));
    const barW=Math.min(28, cw/aiUsageData.length*0.5);
    const gap=cw/aiUsageData.length;
    return (
      <svg viewBox={\`0 0 \${w} \${h}\`} className="w-full" style={{height:160}}>
        {[0,0.5,1].map((f,i)=>{
          const y=padT+ch*(1-f);
          const v=Math.round(f*maxV);
          return <g key={i}><line x1={padL} y1={y} x2={w-padR} y2={y} stroke="#E5F4F7" strokeWidth="1"/><text x={padL-4} y={y+4} fill="#94A3B8" fontSize={8} textAnchor="end">{v>=1000?Math.round(v/1000)+"k":v}</text></g>;
        })}
        {aiUsageData.map((d,i)=>{
          const x=padL+i*gap+gap/2-barW/2;
          const hG=((d.gpt4)/maxV)*ch;
          const hC=((d.claude)/maxV)*ch;
          const hL=((d.llama)/maxV)*ch;
          return (
            <g key={i}>
              <rect x={x} y={padT+ch-hG-hC-hL} width={barW} height={hL} fill="#F59E0B" rx="2"/>
              <rect x={x} y={padT+ch-hG-hC} width={barW} height={hC} fill="#4F46E5" rx="2"/>
              <rect x={x} y={padT+ch-hG} width={barW} height={hG} fill="#06B6D4" rx="2"/>
              <text x={x+barW/2} y={h-6} fill="#94A3B8" fontSize={8} textAnchor="middle">{d.label.slice(0,3)}</text>
            </g>
          );
        })}
      </svg>
    );
  };

  // storage area chart
  const StorageChart = () => {
    const w=480, h=160, padL=36, padB=24, padT=12, padR=12;
    const cw=w-padL-padR, ch=h-padB-padT;
    const maxV=20;
    const n=storageData.length;
    const pts=storageData.map((d,i)=>[padL+i*(cw/(n-1)), padT+ch-(d.used/maxV)*ch] as [number,number]);
    const linePath="M"+pts.map(p=>p.join(",")).join(" L");
    const areaPath="M"+pts[0][0]+","+(padT+ch)+" L"+pts.map(p=>p.join(",")).join(" L")+" "+pts[n-1][0]+","+(padT+ch)+" Z";
    return (
      <svg viewBox={\`0 0 \${w} \${h}\`} className="w-full" style={{height:160}}>
        <defs><linearGradient id="st-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#EF4444" stopOpacity="0.15"/><stop offset="100%" stopColor="#EF4444" stopOpacity="0"/></linearGradient></defs>
        {[0,10,20].map((v,i)=>{
          const y=padT+ch-(v/maxV)*ch;
          return <g key={i}><line x1={padL} y1={y} x2={w-padR} y2={y} stroke="#E5F4F7" strokeWidth="1"/><text x={padL-4} y={y+4} fill="#94A3B8" fontSize={8} textAnchor="end">{v} TB</text></g>;
        })}
        <path d={areaPath} fill="url(#st-g)"/>
        <path d={linePath} stroke="#EF4444" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        {storageData.map((d,i)=>(
          <g key={i}>
            <circle cx={pts[i][0]} cy={pts[i][1]} r="3.5" fill="#EF4444"/>
            <text x={pts[i][0]} y={padT+ch+14} fill="#94A3B8" fontSize={8} textAnchor="middle">{d.label}</text>
          </g>
        ))}
      </svg>
    );
  };

  return (
    <div className="min-h-screen bg-[#F5FEFF]">
      <div className="max-w-[1280px] mx-auto px-8 py-7 space-y-6">

        {/* ── Top Bar ─────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-[#111827] tracking-tight">{greeting}, Alex 👋</h1>
            <p className="text-[13px] text-[#94A3B8] mt-0.5">{dateStr} · Meetiva Super Admin</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Workspace selector */}
            <div className="relative">
              <select
                value={workspace}
                onChange={e=>setWorkspace(e.target.value)}
                className="appearance-none text-[12.5px] font-semibold text-[#374151] bg-white border border-[#E5F4F7] rounded-xl px-4 py-2.5 pr-8 cursor-pointer focus:outline-none focus:border-[#06B6D4] shadow-sm"
              >
                {workspaces.map(w=><option key={w}>{w}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-3 text-[#94A3B8] pointer-events-none"/>
            </div>
            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-[#94A3B8]"/>
              <input className="text-[12.5px] bg-white border border-[#E5F4F7] rounded-xl pl-9 pr-4 py-2.5 w-52 focus:outline-none focus:border-[#06B6D4] shadow-sm placeholder-[#C4D9DE]" placeholder="Search users, teams…"/>
            </div>
            {/* Notifications */}
            <button className="relative w-9 h-9 bg-white rounded-xl border border-[#E5F4F7] shadow-sm flex items-center justify-center hover:border-[#C8E8F2] transition-colors cursor-pointer">
              <Bell size={15} className="text-[#64748B]"/>
              <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-[#EF4444] rounded-full text-[9px] font-bold text-white flex items-center justify-center leading-none" style={{width:17,height:17}}>4</span>
            </button>
          </div>
        </div>

        {/* ── KPI Cards ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-6 gap-4">
          {kpis.map(k=>{
            const Icon=k.icon;
            return (
              <div key={k.label} className="bg-white rounded-2xl border border-[#E5F4F7] p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{background:k.bg}}>
                    <Icon size={15} style={{color:k.color}}/>
                  </div>
                  <span className={\`text-[10.5px] font-semibold px-2 py-0.5 rounded-full \${k.up ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}\`}>{k.pct}</span>
                </div>
                <div>
                  <p className="text-[11px] text-[#94A3B8] font-medium">{k.label}</p>
                  <p className="text-[20px] font-bold text-[#111827] leading-tight mt-0.5">{k.value}</p>
                  <p className="text-[10.5px] text-[#94A3B8] mt-0.5">{k.delta} this week</p>
                </div>
                <Spark data={k.spark} color={k.color} uid={k.uid}/>
              </div>
            );
          })}
        </div>

        {/* ── Platform Overview + Recent Activity ─────────────────────────── */}
        <div className="grid grid-cols-12 gap-5">
          {/* Platform Overview */}
          <div className="col-span-8 bg-white rounded-2xl border border-[#E5F4F7] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[14px] font-bold text-[#111827]">Platform Overview</h3>
                <p className="text-[11px] text-[#94A3B8] mt-0.5">Users · Meetings · AI Requests</p>
              </div>
              <div className="flex items-center gap-4">
                {/* Legend */}
                <div className="flex items-center gap-3">
                  {[["Users","#06B6D4"],["Meetings","#4F46E5"],["AI Requests","#10B981"]].map(([l,c])=>(
                    <div key={l} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{background:c}}/>
                      <span className="text-[10.5px] text-[#94A3B8]">{l}</span>
                    </div>
                  ))}
                </div>
                {/* Period toggle */}
                <div className="flex bg-[#F5FEFF] border border-[#E5F4F7] rounded-xl overflow-hidden">
                  {(["24H","7D","30D"] as const).map(p=>(
                    <button key={p} onClick={()=>setPeriod(p)}
                      className={\`text-[11px] font-semibold px-3 py-1.5 transition-colors cursor-pointer \${period===p ? "bg-[#06B6D4] text-white" : "text-[#94A3B8] hover:text-[#374151]"}\`}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <OverviewChart/>
          </div>

          {/* Recent Activity */}
          <div className="col-span-4 bg-white rounded-2xl border border-[#E5F4F7] p-5 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[14px] font-bold text-[#111827]">Recent Activity</h3>
              <button className="text-[11px] font-semibold text-[#06B6D4] hover:text-[#0891B2] cursor-pointer flex items-center gap-0.5">
                View all <ArrowRight size={10}/>
              </button>
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto scrollbar-hide">
              {recentActivity.map(a=>{
                const Icon=a.icon;
                return (
                  <div key={a.id} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{background:a.color+"15"}}>
                      <Icon size={12} style={{color:a.color}}/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11.5px] text-[#374151] leading-snug">{a.text}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-[#94A3B8]">{a.time}</span>
                        <span className="text-[9.5px] font-semibold px-1.5 py-0.5 rounded-full" style={{background:a.badgeColor+"15",color:a.badgeColor}}>{a.badge}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Analytics Row: User Growth + AI Usage + Storage ─────────────── */}
        <div className="grid grid-cols-3 gap-5">
          {/* User Growth */}
          <div className="bg-white rounded-2xl border border-[#E5F4F7] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-[13.5px] font-bold text-[#111827]">User Growth</h3>
              <span className="text-[10px] font-mono text-[#94A3B8]">Feb – Jul</span>
            </div>
            <p className="text-[11px] text-[#94A3B8] mb-3">Individual vs. Team accounts</p>
            <UserGrowthChart/>
            <div className="mt-3 pt-3 border-t border-[#EDF7F9] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#06B6D4]"/><span className="text-[10px] text-[#94A3B8]">Individual</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#4F46E5]"/><span className="text-[10px] text-[#94A3B8]">Teams</span></div>
              </div>
              <button className="text-[11px] font-semibold text-[#06B6D4] hover:text-[#0891B2] cursor-pointer flex items-center gap-0.5">
                Details <ArrowRight size={10}/>
              </button>
            </div>
          </div>

          {/* AI Usage */}
          <div className="bg-white rounded-2xl border border-[#E5F4F7] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-[13.5px] font-bold text-[#111827]">AI Usage</h3>
              <span className="text-[10px] font-mono text-[#94A3B8]">This week</span>
            </div>
            <p className="text-[11px] text-[#94A3B8] mb-3">Requests by model (GPT-4 · Claude · LLaMA)</p>
            <AiChart/>
            <div className="mt-3 pt-3 border-t border-[#EDF7F9] flex items-center justify-between">
              <div className="flex items-center gap-3">
                {[["GPT-4","#06B6D4"],["Claude","#4F46E5"],["LLaMA","#F59E0B"]].map(([l,c])=>(
                  <div key={l} className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full" style={{background:c}}/><span className="text-[10px] text-[#94A3B8]">{l}</span></div>
                ))}
              </div>
              <button className="text-[11px] font-semibold text-[#06B6D4] hover:text-[#0891B2] cursor-pointer flex items-center gap-0.5">
                Details <ArrowRight size={10}/>
              </button>
            </div>
          </div>

          {/* Storage Usage */}
          <div className="bg-white rounded-2xl border border-[#E5F4F7] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-[13.5px] font-bold text-[#111827]">Storage Usage</h3>
              <span className="text-[10px] font-mono text-[#94A3B8]">Feb – Jul</span>
            </div>
            <p className="text-[11px] text-[#94A3B8] mb-3">Platform storage growth (TB) · Cap 20 TB</p>
            <StorageChart/>
            <div className="mt-3 pt-3 border-t border-[#EDF7F9] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-bold text-[#111827]">7.9 / 20 TB</span>
                <div className="h-1.5 w-20 bg-[#F5FEFF] rounded-full border border-[#E5F4F7] overflow-hidden">
                  <div className="h-full rounded-full bg-[#EF4444]" style={{width:"39.5%"}}/>
                </div>
                <span className="text-[10px] text-[#94A3B8]">39.5%</span>
              </div>
              <button className="text-[11px] font-semibold text-[#06B6D4] hover:text-[#0891B2] cursor-pointer flex items-center gap-0.5">
                Manage <ArrowRight size={10}/>
              </button>
            </div>
          </div>
        </div>

        {/* ── Quick Actions ────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-[#E5F4F7] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[14px] font-bold text-[#111827]">Quick Actions</h3>
            <span className="text-[11px] text-[#94A3B8]">Common admin tasks</span>
          </div>
          <div className="grid grid-cols-8 gap-3">
            {quickActions.map(qa=>{
              const Icon=qa.icon;
              return (
                <button key={qa.label} onClick={qa.onClick}
                  className="flex flex-col items-center gap-2 px-2 py-4 rounded-xl border border-[#E5F4F7] hover:border-[#C8E8F2] hover:shadow-sm transition-all duration-150 cursor-pointer group">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background:qa.bg}}>
                    <Icon size={16} style={{color:qa.color}}/>
                  </div>
                  <span className="text-[10.5px] font-semibold text-[#374151] text-center leading-tight group-hover:text-[#111827]">{qa.label}</span>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}


`;

const result = src.slice(0, startIdx) + newDashboard + src.slice(endIdx);
fs.writeFileSync('/workspaces/default/code/src/app/App.tsx', result, 'utf8');

const open = (result.match(/{/g)||[]).length;
const close = (result.match(/}/g)||[]).length;
console.log('Done. Lines:', result.split('\n').length);
console.log('Brace diff:', open - close, open === close ? '✓' : '✗');
