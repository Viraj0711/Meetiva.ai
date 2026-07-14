import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Play, Zap, Target, Users, Check, Brain, Calendar, FileText } from 'lucide-react';
import { toast } from 'sonner';

const LP = '#5B3FD6';
const LS = '#8B5CF6';
const LA = '#F472B6';
const LBG = '#FCFBFF';

const DOT: React.CSSProperties = {
  backgroundImage: 'radial-gradient(circle, rgba(91,63,214,0.07) 1.5px, transparent 1.5px)',
  backgroundSize: '28px 28px',
};
const CS = '0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(91,63,214,0.08), inset 0 1px 0 rgba(255,255,255,0.9)';
const CH = '0 4px 8px rgba(0,0,0,0.06), 0 24px 60px rgba(91,63,214,0.14), inset 0 1px 0 rgba(255,255,255,1)';

const FEATURES = [
  { icon: Zap, title: 'Instant summaries', desc: 'AI generates polished recaps the moment a recording lands.', color: LP },
  { icon: Target, title: 'Task extraction', desc: 'Surface owners, due dates, and priorities automatically.', color: LA },
  { icon: Calendar, title: 'Calendar sync', desc: 'Push follow-up actions into calendars to preserve momentum.', color: '#0EA5E9' },
  { icon: Brain, title: 'Team intelligence', desc: 'See trends across meetings, workstreams, and velocity.', color: LS },
];

const STEPS = [
  { n: '01', title: 'Upload or connect live meetings', desc: 'Drop recordings, transcripts, or call links directly into the workspace.' },
  { n: '02', title: 'AI extracts the signal', desc: 'Summaries, action items, decisions, and priorities appear automatically.' },
  { n: '03', title: 'Momentum keeps moving', desc: 'Calendar sync, reminders, and ownership keep the entire team aligned.' },
];

const TESTIMONIALS = [
  { quote: 'Meetiva cut our post-meeting admin time in half. Summaries are accurate and action items sync directly into our calendar.', name: 'Sarah K.', role: 'Head of Product, Vercel', initials: 'SK', color: LP },
  { quote: 'The AI extracts exactly the right signal. Our team spends zero time writing recaps and 100% time executing.', name: 'James L.', role: 'Engineering Lead, Linear', initials: 'JL', color: LA },
  { quote: 'It feels like having an executive assistant in every meeting. The quality of decisions we capture has improved dramatically.', name: 'Priya M.', role: 'COO, Notion', initials: 'PM', color: LS },
];

const PRICING = [
  {
    name: 'Starter', price: 'Free', period: '', desc: 'Perfect for individuals and small teams getting started.',
    features: ['5 meetings / month', 'AI summaries', 'Action item extraction', '7-day history'],
    cta: 'Get started free', highlight: false,
  },
  {
    name: 'Pro', price: '$29', period: '/mo', desc: 'For growing teams that need unlimited intelligence.',
    features: ['Unlimited meetings', 'Calendar sync', 'Team workspaces', 'Priority support', '30-day history', 'Slack integration'],
    cta: 'Start free trial', highlight: true,
  },
  {
    name: 'Enterprise', price: 'Custom', period: '', desc: 'Tailored for large organisations with advanced needs.',
    features: ['Everything in Pro', 'SSO & SCIM', 'Custom data retention', 'SLA guarantee', 'Dedicated success manager'],
    cta: 'Contact sales', highlight: false,
  },
];

function GlobalStyles() {
  return (
    <style>{`
      @keyframes float {
        0%,100% { transform: translateY(0px) rotate(0deg); }
        40%      { transform: translateY(-10px) rotate(0.8deg); }
        70%      { transform: translateY(-5px) rotate(-0.5deg); }
      }
      @keyframes float-slow {
        0%,100% { transform: translateY(0px); }
        50%      { transform: translateY(-8px); }
      }
      @keyframes pulse-ring {
        0%   { transform: scale(1); opacity: 0.7; }
        100% { transform: scale(2.4); opacity: 0; }
      }
      @keyframes ping-slow {
        0%   { transform: scale(1); opacity: 0.5; }
        100% { transform: scale(1.9); opacity: 0; }
      }
      .card-float   { animation: float 7s ease-in-out infinite; }
      .premium-card { transition: transform 0.25s ease, box-shadow 0.25s ease; }
      .premium-card:hover { transform: translateY(-4px); }
      .live-dot::after {
        content: '';
        position: absolute; inset: 0;
        border-radius: 50%;
        background: #F472B6;
        animation: pulse-ring 1.8s ease-out infinite;
      }
      .ping-circle {
        animation: ping-slow 2s ease-out infinite;
      }
    `}</style>
  );
}

const LandingNew: React.FC = () => {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState<string | null>(null);

  const scrollTo = (id: string) => {
    setActiveNav(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={{ minHeight: '100vh', background: LBG }}>
      <GlobalStyles />

      {/* ── NAV ── */}
      <header className="sticky top-0 z-50" style={{ background: 'rgba(252,251,255,0.85)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${LP}08`, boxShadow: `0 1px 0 ${LP}04` }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg" style={{ background: `linear-gradient(135deg, ${LP}, ${LS})` }}>M</div>
            <span className="font-bold text-[#0F0A1E] text-xl tracking-tight">Meetiva</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: `${LP}12`, color: LP }}>AI</span>
          </div>
          <nav className="hidden md:flex items-center gap-2">
            {(['Features', 'Workflow', 'Pricing'] as const).map((l) => {
              const isActive = activeNav === l.toLowerCase();
              return (
                <button key={l} onClick={() => scrollTo(l.toLowerCase())}
                  className="text-sm font-medium px-3.5 py-1.5 rounded-lg transition-all"
                  style={{
                    color: isActive ? LP : '#64607A',
                    background: isActive ? `${LP}10` : 'transparent',
                    fontWeight: isActive ? 700 : 500,
                  }}
                  onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.color = '#0F0A1E'; (e.currentTarget as HTMLElement).style.background = `${LP}07`; } }}
                  onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.color = '#64607A'; (e.currentTarget as HTMLElement).style.background = 'transparent'; } }}>
                  {l}
                </button>
              );
            })}
          </nav>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/login')}
              className="text-sm font-medium px-3 py-2 transition-colors"
              style={{ color: '#64607A' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#0F0A1E'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#64607A'; }}>
              Login
            </button>
            <button onClick={() => navigate('/register')}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 hover:scale-[1.015] active:scale-[0.98]"
              style={{ background: `linear-gradient(135deg, ${LP}, ${LS})`, boxShadow: `0 4px 16px ${LP}35` }}>
              Get started
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section id="hero" className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={DOT} />
        <div className="absolute -top-40 right-[-80px] w-[680px] h-[680px] rounded-full pointer-events-none"
          style={{ background: `radial-gradient(circle, ${LP}14 0%, transparent 65%)`, filter: 'blur(50px)' }} />
        <div className="absolute top-32 right-32 w-[360px] h-[360px] rounded-full pointer-events-none"
          style={{ background: `radial-gradient(circle, ${LA}0E 0%, transparent 70%)`, filter: 'blur(60px)' }} />

        <div className="max-w-6xl mx-auto px-6 pt-10 pb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full mb-5"
                style={{ background: `${LP}0D`, border: `1px solid ${LP}1C` }}>
                <span className="relative w-2 h-2 flex-shrink-0">
                  <span className="live-dot absolute inset-0 rounded-full" style={{ background: LA }} />
                  <span className="relative block w-2 h-2 rounded-full" style={{ background: LA }} />
                </span>
                <span className="text-[11px] font-bold tracking-widest uppercase" style={{ color: LP }}>AI Meeting Intelligence — Now in Beta</span>
              </div>

              <h1 className="mb-6"
                style={{ fontSize: 'clamp(36px, 4.5vw, 56px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.08, color: '#0F0A1E' }}>
                Every meeting becomes<br />
                <span style={{ background: `linear-gradient(135deg, ${LP} 0%, ${LA} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  a decision engine.
                </span>
              </h1>

              <p className="mb-6" style={{ fontSize: 18, color: '#64607A', lineHeight: 1.72, maxWidth: 440 }}>
                Meetiva listens, extracts the signal, and hands your team summaries, action items, and calendar sync — before you close the tab.
              </p>

              <div className="flex flex-wrap gap-3 mb-7">
                <button onClick={() => navigate('/register')}
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 hover:scale-[1.015] active:scale-[0.98]"
                  style={{ background: `linear-gradient(135deg, ${LP}, ${LS})`, boxShadow: `0 8px 32px ${LP}40` }}>
                  Start for free <ArrowRight size={15} />
                </button>
                <button onClick={() => scrollTo('workflow')}
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-semibold transition-all"
                  style={{ color: LP, border: `1px solid ${LP}22`, background: `${LP}06` }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${LP}0F`; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = `${LP}06`; }}>
                  <Play size={13} /> See how it works
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {[LP, LS, LA, '#059669'].map((c, i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] font-bold"
                      style={{ background: c }}>
                      {['SK','JL','PM','AR'][i]}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="text-sm font-bold text-[#0F0A1E]">10,000+ teams</div>
                  <div className="text-xs text-[#64607A]">trust Meetiva every day</div>
                </div>
              </div>
            </div>

            {/* RIGHT — Mockup */}
            <div className="relative hidden lg:block">
              <div className="card-float relative rounded-3xl overflow-hidden"
                style={{ background: '#FFF', border: `1px solid ${LP}12`, boxShadow: `0 0 0 1px ${LP}06, 0 40px 100px ${LP}16, 0 8px 24px rgba(0,0,0,0.06)` }}>
                <div className="border-b px-4 py-2.5 flex items-center gap-3" style={{ background: '#F7F6FF', borderColor: `${LP}10` }}>
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 rounded-lg py-1 px-3 text-[11px] text-[#64607A]" style={{ background: `${LP}08` }}>
                    app.meetiva.ai/workspace
                  </div>
                </div>
                <div className="p-5" style={{ background: '#F7F6FF' }}>
                  <div className="bg-white rounded-2xl p-5 mb-3" style={{ border: `1px solid ${LP}10`, boxShadow: `0 2px 12px ${LP}08` }}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: '#9B97B0' }}>Product Review · Today</div>
                        <div className="text-sm font-bold text-[#0F0A1E]">Q3 Design Sync</div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700">Completed</span>
                    </div>
                    <div className="rounded-xl p-3.5 mb-3" style={{ background: `${LP}08`, border: `1px solid ${LP}12` }}>
                      <div className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: LP }}>✦ AI Summary</div>
                      <p className="text-[12px] leading-relaxed text-[#0F0A1E]">Aligned on dashboard revisions. Sarah to finalize token system by Friday. James to review API endpoints before Thursday deploy.</p>
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      {['3 action items','2 decisions','Calendar synced'].map(t => (
                        <span key={t} className="px-2.5 py-1 rounded-full text-[10px] font-semibold"
                          style={{ background: `${LP}0D`, color: LP, border: `1px solid ${LP}14` }}>{t}</span>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { icon: FileText, label: 'Summary ready', sub: '47s ago', color: LP },
                      { icon: Target, label: '3 tasks', sub: 'Assigned', color: LA },
                      { icon: Calendar, label: 'Synced', sub: '2 events', color: '#059669' },
                    ].map(item => (
                      <div key={item.label} className="bg-white rounded-xl p-3 flex flex-col gap-1.5"
                        style={{ border: `1px solid ${item.color}10`, boxShadow: `0 2px 8px ${item.color}08` }}>
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${item.color}12` }}>
                          <item.icon size={13} style={{ color: item.color }} />
                        </div>
                        <div className="text-[11px] font-bold text-[#0F0A1E]">{item.label}</div>
                        <div className="text-[10px] text-[#64607A]">{item.sub}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 pb-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { v: '99.9%', l: 'Transcription accuracy', icon: Target, color: LP },
              { v: '< 60s', l: 'Time to first summary', icon: Zap, color: LS },
              { v: '47%', l: 'Faster task follow-through', icon: ArrowRight, color: LA },
              { v: '10k+', l: 'Teams onboarded', icon: Users, color: '#059669' },
            ].map(s => (
              <div key={s.l} className="bg-white rounded-2xl p-5 flex items-start gap-3"
                style={{ border: `1px solid ${s.color}12`, boxShadow: `0 2px 8px ${s.color}08, 0 8px 24px ${s.color}05`, transition: 'transform 0.2s, box-shadow 0.2s' }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-3px)'; el.style.boxShadow = `0 4px 16px ${s.color}16, 0 16px 40px ${s.color}0C`; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = ''; el.style.boxShadow = `0 2px 8px ${s.color}08, 0 8px 24px ${s.color}05`; }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${s.color}12` }}>
                  <s.icon size={18} style={{ color: s.color }} />
                </div>
                <div>
                  <div className="text-2xl font-bold tracking-tight leading-none mb-1" style={{ color: s.color }}>{s.v}</div>
                  <div className="text-xs text-[#64607A] leading-snug">{s.l}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="relative py-14 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={DOT} />
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse 70% 50% at 50% 0%, ${LP}08 0%, transparent 60%)` }} />

        <div className="relative max-w-6xl mx-auto px-6">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-3"
              style={{ background: `${LP}0D`, border: `1px solid ${LP}1A` }}>
              <span className="text-[11px] font-bold tracking-widest uppercase" style={{ color: LP }}>Built for momentum</span>
            </div>
            <h2 className="text-[38px] font-bold text-[#0F0A1E] tracking-tight leading-tight">
              Everything your team needs,<br />extracted automatically.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-2 relative rounded-[28px] p-8 overflow-hidden premium-card"
              style={{ background: `linear-gradient(135deg, ${LP}0A 0%, white 55%)`, border: `1px solid ${LP}18`, boxShadow: CS }}>
              <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-[28px]" style={{ background: `linear-gradient(90deg, ${LP}, ${LS})` }} />
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5" style={{ background: `${LP}14`, boxShadow: `0 4px 14px ${LP}22` }}>
                <Zap size={22} style={{ color: LP }} />
              </div>
              <div className="font-bold text-[#0F0A1E] text-lg mb-2">Instant AI summaries</div>
              <div className="text-[15px] text-[#64607A] leading-relaxed mb-6 max-w-sm">Every recording becomes a structured summary in under 60 seconds. No editing. No templates. Just signal.</div>
              <div className="flex gap-2 flex-wrap">
                {['Decisions captured','Context preserved','Shareable instantly'].map(t => (
                  <span key={t} className="px-3 py-1.5 rounded-full text-[11px] font-semibold"
                    style={{ background: `${LP}0D`, color: LP, border: `1px solid ${LP}18` }}>{t}</span>
                ))}
              </div>
            </div>

            <div className="relative rounded-[28px] p-7 overflow-hidden premium-card"
              style={{ background: `linear-gradient(145deg, ${LA}09 0%, white 60%)`, border: `1px solid ${LA}1C`, boxShadow: CS }}>
              <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-[28px]" style={{ background: `linear-gradient(90deg, ${LA}, #FB923C)` }} />
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5" style={{ background: `${LA}15` }}>
                <Target size={22} style={{ color: LA }} />
              </div>
              <div className="font-bold text-[#0F0A1E] text-base mb-2">Task extraction</div>
              <div className="text-[14px] text-[#64607A] leading-relaxed mb-5">Owners, due dates, and priorities surface automatically from the conversation.</div>
              <div className="space-y-3">
                {['Assign owners','Set due dates','Priority ranking'].map(t => (
                  <div key={t} className="flex items-center gap-2.5 text-[13px] text-[#0F0A1E]">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${LA}18` }}>
                      <Check size={10} style={{ color: LA }} />
                    </div>
                    {t}
                  </div>
                ))}
              </div>
            </div>

            {[
              { icon: Calendar, title: 'Calendar sync', desc: 'Follow-up events created automatically in Google or Outlook.', color: '#0EA5E9' },
              { icon: Brain, title: 'Team intelligence', desc: 'Spot trends across meetings, teams, and velocity over time.', color: LS },
              { icon: Users, title: 'Collaboration hub', desc: 'Shared workspaces so every teammate stays aligned and unblocked.', color: '#059669' },
            ].map(f => (
              <div key={f.title} className="relative rounded-[28px] p-6 overflow-hidden cursor-pointer premium-card"
                onClick={() => navigate('/register')}
                style={{ background: `linear-gradient(145deg, ${f.color}09 0%, white 60%)`, border: `1px solid ${f.color}1C`, boxShadow: CS }}>
                <div className="absolute top-0 left-0 right-0 h-[2.5px] rounded-t-[28px]" style={{ background: f.color }} />
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: `${f.color}14` }}>
                  <f.icon size={18} style={{ color: f.color }} />
                </div>
                <div className="font-bold text-[#0F0A1E] text-sm mb-1.5">{f.title}</div>
                <div className="text-sm text-[#64607A] leading-relaxed">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WORKFLOW ── */}
      <section id="workflow" className="relative py-14 overflow-hidden"
        style={{ background: `linear-gradient(180deg, ${LBG} 0%, #EDE9FF 50%, ${LBG} 100%)` }}>
        <div className="absolute inset-0 pointer-events-none" style={DOT} />

        <div className="relative max-w-5xl mx-auto px-6">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-3"
              style={{ background: `${LS}0D`, border: `1px solid ${LS}1A` }}>
              <span className="text-[11px] font-bold tracking-widest uppercase" style={{ color: LS }}>Workflow</span>
            </div>
            <h2 className="text-[38px] font-bold text-[#0F0A1E] tracking-tight leading-tight">
              From upload to action<br />in three steps.
            </h2>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="hidden md:block absolute top-[26px] left-[calc(16.67%+28px)] right-[calc(16.67%+28px)] h-[2px] pointer-events-none"
              style={{ background: `linear-gradient(90deg, ${LP}, ${LS}, ${LA})`, opacity: 0.28 }} />

            {STEPS.map((step, i) => (
              <div key={step.n} className="flex flex-col items-center text-center">
                <div className="relative w-14 h-14 rounded-full flex items-center justify-center mb-6"
                  style={i === 1
                    ? { background: `linear-gradient(135deg, ${LP}, ${LS})`, boxShadow: `0 8px 24px ${LP}40` }
                    : { background: 'white', border: `2px solid ${LP}1C`, boxShadow: `0 4px 12px ${LP}10` }}>
                  <span className="text-sm font-bold" style={{ color: i === 1 ? 'white' : LP }}>{step.n}</span>
                  {i === 1 && (
                    <div className="ping-circle absolute inset-0 rounded-full" style={{ background: `${LP}1E` }} />
                  )}
                </div>
                <div className="bg-white rounded-2xl p-6 w-full"
                  style={{ border: `1px solid ${LP}12`, boxShadow: CS }}>
                  <div className="font-bold text-[#0F0A1E] text-sm mb-2">{step.title}</div>
                  <div className="text-sm text-[#64607A] leading-relaxed">{step.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <button onClick={() => navigate('/register')}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 hover:scale-[1.015] active:scale-[0.98]"
              style={{ background: `linear-gradient(135deg, ${LP}, ${LS})`, boxShadow: `0 8px 32px ${LP}40` }}>
              Get started — it's free <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="relative py-14">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-3"
              style={{ background: `${LA}0D`, border: `1px solid ${LA}1E` }}>
              <span className="text-[11px] font-bold tracking-widest uppercase" style={{ color: LA }}>Loved by teams</span>
            </div>
            <h2 className="text-[38px] font-bold text-[#0F0A1E] tracking-tight leading-tight">What our customers say</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <div key={t.name}
                className={`relative bg-white rounded-[28px] p-8 flex flex-col gap-5 ${i === 1 ? 'md:-translate-y-4' : ''}`}
                style={{ border: `1px solid ${LP}0C`, boxShadow: i === 1 ? `0 20px 60px ${LP}14, 0 4px 12px rgba(0,0,0,0.04)` : CS }}>
                <div style={{ fontSize: 72, lineHeight: 0.7, color: `${LP}18`, fontFamily: 'Georgia, serif' }}>"</div>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, si) => (
                    <span key={si} style={{ color: LA, fontSize: 14 }}>★</span>
                  ))}
                </div>
                <p className="text-[15px] text-[#0F0A1E] leading-relaxed flex-1">"{t.quote}"</p>
                <div className="flex items-center gap-3 pt-5" style={{ borderTop: `1px solid ${LP}08` }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{
                      background: i === 0 ? `linear-gradient(135deg, ${LP}, ${LS})` : i === 1 ? `linear-gradient(135deg, ${LA}, #FB923C)` : `linear-gradient(135deg, ${LS}, ${LP})`,
                      boxShadow: `0 4px 12px ${t.color}30`
                    }}>
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#0F0A1E]">{t.name}</div>
                    <div className="text-[11px] text-[#64607A]">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="relative py-14 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={DOT} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full pointer-events-none"
          style={{ background: `radial-gradient(ellipse, ${LP}09 0%, transparent 65%)`, filter: 'blur(40px)' }} />

        <div className="relative max-w-5xl mx-auto px-6">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-3"
              style={{ background: `${LP}0D`, border: `1px solid ${LP}1A` }}>
              <span className="text-[11px] font-bold tracking-widest uppercase" style={{ color: LP }}>Pricing</span>
            </div>
            <h2 className="text-[38px] font-bold text-[#0F0A1E] tracking-tight leading-tight">
              Transparent plans for<br />every stage of growth.
            </h2>
            <p className="mt-4 text-[16px] text-[#64607A] max-w-sm mx-auto leading-relaxed">
              Start free. Upgrade when you're ready. No hidden fees, no enterprise surprises.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
            {PRICING.map((plan) => (
              <div key={plan.name}
                className={`relative rounded-[28px] flex flex-col overflow-hidden ${plan.highlight ? 'scale-[1.04]' : ''}`}
                style={plan.highlight
                  ? { background: `linear-gradient(145deg, ${LP}, ${LS})`, border: `1px solid ${LS}40`, boxShadow: `0 0 0 1px ${LP}1A, 0 32px 80px ${LP}40, 0 8px 24px ${LP}25` }
                  : { background: 'white', border: `1px solid ${LP}10`, boxShadow: CS }
                }>
                {plan.highlight && (
                  <div className="absolute top-5 right-5">
                    <span className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-white"
                      style={{ background: `linear-gradient(135deg, ${LA}, #FB923C)`, boxShadow: `0 4px 12px ${LA}40` }}>
                      ✦ Most popular
                    </span>
                  </div>
                )}
                <div className="p-8 flex-1">
                  <div className="text-[11px] font-bold uppercase tracking-widest mb-3"
                    style={{ color: plan.highlight ? 'rgba(255,255,255,0.55)' : '#9B97B0' }}>{plan.name}</div>
                  <div className="flex items-end gap-1 mb-3">
                    <span className="text-[44px] font-bold tracking-tight leading-none"
                      style={{ color: plan.highlight ? 'white' : '#0F0A1E' }}>{plan.price}</span>
                    {plan.period && <span className="text-sm mb-2"
                      style={{ color: plan.highlight ? 'rgba(255,255,255,0.55)' : '#64607A' }}>{plan.period}</span>}
                  </div>
                  <p className="text-sm leading-relaxed mb-8"
                    style={{ color: plan.highlight ? 'rgba(255,255,255,0.65)' : '#64607A' }}>{plan.desc}</p>
                  <div className="space-y-3.5">
                    {plan.features.map(f => (
                      <div key={f} className="flex items-center gap-3 text-sm">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: plan.highlight ? 'rgba(255,255,255,0.18)' : `${LP}12` }}>
                          <Check size={10} style={{ color: plan.highlight ? 'white' : LP }} />
                        </div>
                        <span style={{ color: plan.highlight ? 'rgba(255,255,255,0.92)' : '#0F0A1E' }}>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="px-8 pb-8">
                  <button onClick={() => navigate('/register')}
                    className="w-full py-3.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-[0.98]"
                    style={plan.highlight
                      ? { background: 'white', color: LP }
                      : { border: `1.5px solid ${LP}1C`, color: LP, background: `${LP}06` }}>
                    {plan.cta}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="px-6 py-6 pb-14">
        <div className="max-w-6xl mx-auto">
          <div className="relative rounded-[32px] overflow-hidden py-16 px-8 text-center"
            style={{ background: '#0F0A1E', boxShadow: '0 40px 100px rgba(0,0,0,0.32)' }}>
            <div className="absolute -top-32 left-1/4 w-[600px] h-[400px] rounded-full pointer-events-none"
              style={{ background: `radial-gradient(ellipse, ${LP}55 0%, transparent 60%)`, filter: 'blur(80px)', opacity: 0.6 }} />
            <div className="absolute -bottom-24 right-1/4 w-[500px] h-[400px] rounded-full pointer-events-none"
              style={{ background: `radial-gradient(ellipse, ${LA}40 0%, transparent 60%)`, filter: 'blur(80px)', opacity: 0.4 }} />
            <div className="absolute inset-0 pointer-events-none"
              style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1.5px, transparent 1.5px)', backgroundSize: '28px 28px' }} />
            <div className="hidden md:flex absolute top-7 left-9 items-center gap-2.5 px-4 py-2.5 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', backdropFilter: 'blur(8px)' }}>
              <div className="w-5 h-5 rounded-lg flex items-center justify-center" style={{ background: `${LP}30` }}>
                <Brain size={11} style={{ color: LS }} />
              </div>
              <span className="text-[11px] font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>Meetiva Intelligence</span>
            </div>

            <div className="relative">
              <div className="text-[11px] font-bold uppercase tracking-widest mb-5" style={{ color: 'rgba(255,255,255,0.28)' }}>Ready to ship</div>
              <h2 className="text-[48px] font-bold text-white tracking-tight mb-5 leading-tight">Make every meeting count.</h2>
              <p className="text-[17px] mb-7 max-w-md mx-auto leading-relaxed" style={{ color: 'rgba(255,255,255,0.42)' }}>
                Join 10,000+ teams who've replaced messy notes and forgotten action items with Meetiva's AI workspace.
              </p>
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <button onClick={() => navigate('/register')}
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-bold text-white transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: `linear-gradient(135deg, ${LP}, ${LS})`, boxShadow: `0 8px 32px ${LP}60` }}>
                  Start for free <ArrowRight size={16} />
                </button>
                <button onClick={() => navigate('/login')}
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-semibold transition-all"
                  style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.72)', border: '1px solid rgba(255,255,255,0.11)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.12)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)'; }}>
                  Sign in
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: `1px solid ${LP}0C`, background: LBG }}>
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-8">
            <div className="col-span-2">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg" style={{ background: `linear-gradient(135deg, ${LP}, ${LS})` }}>M</div>
                <span className="font-bold text-[#0F0A1E] text-xl">Meetiva AI</span>
              </div>
              <p className="text-sm text-[#64607A] leading-relaxed mb-6 max-w-[200px]">
                The AI-powered meeting workspace built for momentum.
              </p>
              <div className="flex gap-2">
                <input type="email" placeholder="your@email.com"
                  className="flex-1 px-3 py-2 rounded-lg text-xs outline-none"
                  style={{ border: `1px solid ${LP}18`, background: 'white', color: '#0F0A1E' }}
                  onFocus={e => { (e.target as HTMLElement).style.borderColor = `${LP}40`; }}
                  onBlur={e => { (e.target as HTMLElement).style.borderColor = `${LP}18`; }}
                />
                <button onClick={() => toast.success('Subscribed!', { description: "You're on the list." })}
                  className="px-3 py-2 rounded-lg text-xs font-bold text-white"
                  style={{ background: `linear-gradient(135deg, ${LP}, ${LS})` }}>
                  Subscribe
                </button>
              </div>
            </div>

            {[
              { heading: 'Product', links: ['Features', 'Workflow', 'Pricing', 'Changelog'] },
              { heading: 'Company', links: ['About', 'Blog', 'Careers', 'Press'] },
              { heading: 'Legal', links: ['Privacy', 'Terms', 'Security', 'Cookies'] },
            ].map(col => (
              <div key={col.heading}>
                <div className="text-[11px] font-bold uppercase tracking-widest mb-4 text-[#0F0A1E]">{col.heading}</div>
                <div className="space-y-3">
                  {col.links.map(l => (
                    <button key={l}
                      className="block text-sm text-left transition-colors"
                      style={{ color: '#64607A' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = LP; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#64607A'; }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8"
            style={{ borderTop: `1px solid ${LP}0C` }}>
            <div className="text-xs text-[#9B97B0]">© 2025 Meetiva, Inc. All rights reserved.</div>
            <div className="flex items-center gap-5">
              {['Twitter', 'GitHub', 'LinkedIn'].map(s => (
                <button key={s}
                  className="text-xs font-medium transition-colors"
                  style={{ color: '#9B97B0' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = LP; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#9B97B0'; }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingNew;
