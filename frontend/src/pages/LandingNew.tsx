import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, BarChart3, CalendarClock, CheckCircle2, ClipboardList, Mic, Play, Sparkles, Workflow, MessageSquareQuote } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const features = [
  { title: 'Instant summaries', description: 'Generate polished recaps the moment a recording lands.', icon: MessageSquareQuote },
  { title: 'Task extraction', description: 'Surface owners, due dates, and priorities automatically.', icon: ClipboardList },
  { title: 'Calendar sync', description: 'Push follow-up actions into calendars to preserve momentum.', icon: CalendarClock },
  { title: 'Team intelligence', description: 'See trends across meetings, workstreams, and velocity.', icon: BarChart3 },
];

const workflow = [
  'Capture audio, video, or upload files',
  'AI transcribes, summarizes, and detects decisions',
  'Tasks and reminders flow into the team calendar',
];

const LandingPage: React.FC = () => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(124,92,255,0.18),transparent_28%),radial-gradient(circle_at_top_right,rgba(48,213,246,0.16),transparent_24%),radial-gradient(circle_at_bottom_center,rgba(212,175,55,0.08),transparent_30%)]" />
      <div className="absolute inset-0 fine-grid opacity-40" />

      <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/60 backdrop-blur-2xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="group flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-primary shadow-[0_18px_40px_rgba(124,92,255,0.35)]">
              <span className="text-sm font-bold text-white">M</span>
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-white/45">Meetiva.ai</p>
              <p className="text-sm font-medium text-white">Meeting intelligence</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-white/60 transition hover:text-white">Features</a>
            <a href="#workflow" className="text-sm text-white/60 transition hover:text-white">Workflow</a>
            <a href="#pricing" className="text-sm text-white/60 transition hover:text-white">Pricing</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login"><Button variant="ghost">Login</Button></Link>
            <Link to="/register"><Button>Get Started</Button></Link>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <section className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl items-center gap-12 px-6 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300/80 backdrop-blur-xl">
              <Sparkles className="h-3.5 w-3.5" /> AI meeting intelligence
            </div>
            <div className="space-y-5">
              <h1 className="max-w-3xl font-display text-6xl font-bold leading-[0.92] tracking-tight text-white md:text-7xl xl:text-8xl">
                Meetings that feel like
                <span className="block bg-gradient-to-r from-purple-300 via-white to-cyan-300 bg-clip-text text-transparent">the future</span>
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-white/65 md:text-xl">
                Meetiva turns calls into summaries, decisions, action items, and calendar-ready follow-ups in a premium workspace designed for momentum.
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link to="/register"><Button size="lg" className="w-full sm:w-auto">Start free trial<ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
              <button className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-white/85 transition hover:bg-white/[0.08] hover:text-white"><Play className="mr-2 h-4 w-4" />Watch workflow</button>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {[['99.9%', 'platform uptime'], ['5m', 'average setup time'], ['47%', 'faster follow-through']].map(([value, label]) => (
                <div key={label} className="glass-panel rounded-[1.5rem] p-5">
                  <p className="text-3xl font-bold text-white">{value}</p>
                  <p className="mt-1 text-sm text-white/55">{label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 32, rotateY: -12 }} animate={{ opacity: 1, y: 0, rotateY: 0 }} transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1], delay: 0.1 }} className="relative mx-auto w-full max-w-[720px]">
            <div className="absolute -left-8 top-10 h-44 w-44 rounded-full bg-purple-500/25 blur-3xl animate-drift" />
            <div className="absolute -right-8 bottom-6 h-44 w-44 rounded-full bg-cyan-400/20 blur-3xl animate-drift" />
            <div className="relative rounded-[2rem] border border-white/10 bg-slate-950/60 p-4 shadow-[0_40px_140px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
              <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                <Card className="relative overflow-hidden p-5">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,92,255,0.2),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(48,213,246,0.12),transparent_30%)]" />
                  <div className="relative space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-white/45">Live meeting</p>
                        <h3 className="text-xl font-semibold text-white">Product review sync</h3>
                      </div>
                      <div className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-cyan-300">recording</div>
                    </div>
                    <div className="rounded-[1.35rem] border border-white/10 bg-black/30 p-4">
                      <div className="flex items-center gap-3">
                        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-primary"><Mic className="h-5 w-5 text-white" /></div>
                        <div>
                          <p className="text-sm text-white/45">Transcript intelligence</p>
                          <p className="text-sm font-medium text-white">“Finalize launch copy by Friday and sync design changes after legal sign-off.”</p>
                        </div>
                      </div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-3">
                      {[['Summary ready', '12 key bullets'], ['Tasks extracted', '6 assigned actions'], ['Calendar sync', '3 reminders created']].map(([title, value]) => (
                        <div key={title} className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-3">
                          <p className="text-xs uppercase tracking-[0.2em] text-white/45">{title}</p>
                          <p className="mt-2 text-sm font-medium text-white">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>

                <div className="space-y-4">
                  <Card className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/[0.06] text-cyan-300"><Workflow className="h-5 w-5" /></div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-white/45">Workflow</p>
                        <p className="text-sm font-medium text-white">Real-time AI pipeline</p>
                      </div>
                    </div>
                    <div className="mt-4 space-y-3">
                      {workflow.map((item, index) => (
                        <div key={item} className="flex items-start gap-3 rounded-2xl bg-white/[0.03] p-3">
                          <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-primary text-xs font-bold text-white">{index + 1}</div>
                          <p className="text-sm text-white/70">{item}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                  <Card className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-white/45">Calendar</p>
                        <p className="text-sm font-medium text-white">AI reminders syncing</p>
                      </div>
                      <CheckCircle2 className="h-5 w-5 text-cyan-300" />
                    </div>
                    <div className="mt-4 space-y-3">
                      {['Follow up with design', 'Share transcript with leadership', 'Create next sprint review'].map((item) => (
                        <div key={item} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/75">
                          <span>{item}</span>
                          <span className="text-cyan-300">synced</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        <section id="features" className="mx-auto max-w-7xl px-6 py-8 lg:py-16">
          <div className="mb-10 max-w-3xl space-y-4">
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/70">Built for momentum</p>
            <h2 className="max-w-2xl font-display text-4xl font-bold tracking-tight text-white md:text-5xl">A premium workspace that never feels static.</h2>
            <p className="max-w-2xl text-lg leading-8 text-white/60">Every section uses depth, asymmetry, and motion so the experience reads like a funded startup product instead of another template.</p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div key={feature.title} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.5, delay: index * 0.06 }} whileHover={{ y: -6 }}>
                  <Card className="h-full p-6">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-primary text-white shadow-[0_18px_40px_rgba(124,92,255,0.35)]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-5 text-xl font-semibold text-white">{feature.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-white/60">{feature.description}</p>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </section>

        <section id="workflow" className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="space-y-6 rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.3em] text-white/45">Workflow</p>
              <h2 className="font-display text-4xl font-bold tracking-tight text-white">A guided story from upload to action.</h2>
              <p className="text-lg leading-8 text-white/60">Capture the meeting, reveal the decisions, and hand off the work without breaking the visual rhythm.</p>
              <Link to="/register"><Button size="lg">Create your workspace</Button></Link>
            </div>
            <div className="grid gap-4">
              {[
                ['1', 'Upload or connect live meetings', 'Drop recordings, transcripts, or call links into the workspace.'],
                ['2', 'AI extracts the signal', 'Summaries, action items, decisions, and priorities appear automatically.'],
                ['3', 'Momentum keeps moving', 'Calendar sync, reminders, and ownership keep the team aligned.'],
              ].map(([number, title, description]) => (
                <Card key={title} className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/[0.05] text-lg font-bold text-cyan-300">{number}</div>
                    <div>
                      <h3 className="text-xl font-semibold text-white">{title}</h3>
                      <p className="mt-2 text-sm leading-7 text-white/60">{description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="mx-auto max-w-7xl px-6 py-16">
          <div className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-8 backdrop-blur-2xl lg:p-10">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl space-y-4">
                <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/70">Pricing</p>
                <h2 className="font-display text-4xl font-bold tracking-tight text-white md:text-5xl">Transparent plans for premium teams.</h2>
                <p className="text-lg leading-8 text-white/60">Built for growing teams that want an expensive-feeling experience without the enterprise overhead.</p>
              </div>
              <Link to="/pricing"><Button variant="outline">See full pricing</Button></Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-10 lg:py-20">
          <div className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(124,92,255,0.18),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(48,213,246,0.14),transparent_28%),rgba(255,255,255,0.03)] p-8 text-center backdrop-blur-2xl lg:p-12">
            <p className="text-xs uppercase tracking-[0.32em] text-cyan-300/70">Ready to ship</p>
            <h2 className="mt-4 font-display text-4xl font-bold tracking-tight text-white md:text-5xl">Make meetings feel alive.</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-white/60">Start with the landing page, then continue the same visual language through auth, upload, and the dashboard workspace.</p>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Link to="/register"><Button size="lg">Start free trial</Button></Link>
              <Link to="/login"><Button size="lg" variant="outline">Sign in</Button></Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default LandingPage;
