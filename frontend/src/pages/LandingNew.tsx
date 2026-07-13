import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  CalendarClock,
  ClipboardList,
  Globe2,
  Mic,
  Sparkles,
  Workflow,
} from 'lucide-react';
import AnimatedBackground from '@/components/AnimatedBackground';
import GradientOrbs from '@/components/GradientOrbs';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const features = [
  {
    title: 'Automatic meeting capture',
    description: 'Record, upload, or connect live calls and let the pipeline structure the work.',
    icon: Mic,
  },
  {
    title: 'Decisions and tasks, extracted',
    description: 'AI identifies commitments, owners, deadlines, and follow-up paths in real time.',
    icon: ClipboardList,
  },
  {
    title: 'Calendar sync without friction',
    description: 'Feed reminders and action items into the team calendar as the meeting ends.',
    icon: CalendarClock,
  },
  {
    title: 'Workspace analytics',
    description: 'Measure completion, follow-through, and velocity across the whole team.',
    icon: BarChart3,
  },
];

const workflow = [
  {
    step: '01',
    title: 'Capture',
    body: 'Meetings land in the workspace from live calls, files, or manual uploads.',
  },
  {
    step: '02',
    title: 'Interpret',
    body: 'The model turns speech into summaries, tasks, and decision records.',
  },
  {
    step: '03',
    title: 'Move forward',
    body: 'What matters is pushed into calendars, dashboards, and shared ownership.',
  },
];

const stats = [
  { value: '99.9%', label: 'availability' },
  { value: '4 min', label: 'average setup' },
  { value: '3x', label: 'faster follow-through' },
];

const LandingPage: React.FC = () => {
  const heroRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroShift = useTransform(scrollYProgress, [0, 1], ['0px', '120px']);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.96]);
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 20 });

  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
  }, []);

  return (
    <div className="scene-shell relative min-h-screen overflow-hidden bg-background text-foreground">
      <AnimatedBackground />
      <GradientOrbs />

      <motion.div
        className="fixed left-0 top-0 z-50 h-1 origin-left bg-gradient-primary"
        style={{ scaleX: progress }}
      />

      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/55 backdrop-blur-2xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
          <Link to="/" className="group flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-primary shadow-[0_18px_40px_rgba(124,92,255,0.35)] transition duration-300 group-hover:scale-105">
              <span className="text-sm font-bold text-white">M</span>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-white/42">Meetiva.ai</p>
              <p className="text-sm font-medium text-white">Meeting intelligence</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {['Features', 'Workflow', 'Pricing'].map((label) => (
              <a key={label} href={`#${label.toLowerCase()}`} className="text-sm text-white/60 transition hover:text-white">
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/login"><Button variant="ghost">Login</Button></Link>
            <Link to="/register"><Button>Get started</Button></Link>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <section ref={heroRef} className="relative mx-auto max-w-7xl px-6 pb-16 pt-10 lg:px-8 lg:pb-24 lg:pt-16">
          <div className="grid gap-8 xl:grid-cols-[1.02fr_0.98fr] xl:items-center">
            <motion.div style={{ y: heroShift, scale: heroScale }} className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300/80 backdrop-blur-xl">
                <Sparkles className="h-3.5 w-3.5" /> AI meeting operating system
              </div>

              <div className="space-y-6">
                <h1 className="max-w-3xl font-display text-6xl font-bold tracking-tight text-white md:text-7xl xl:text-8xl">
                  Meetings become
                  <span className="mt-3 block bg-gradient-to-r from-violet-200 via-white to-cyan-300 bg-clip-text text-transparent">
                    structured momentum.
                  </span>
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-white/62 md:text-xl">
                  Meetiva turns the raw noise of a call into a clean execution layer: summaries, decisions, action items, and calendar-ready follow-up.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link to="/register"><Button size="lg" className="w-full sm:w-auto">Start free trial<ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
                <Link to="/login"><Button size="lg" variant="outline" className="w-full sm:w-auto">See the workspace</Button></Link>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {stats.map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 * index, duration: 0.45 }}
                    className="rounded-[1.45rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl"
                  >
                    <p className="text-xs uppercase tracking-[0.24em] text-white/42">{item.label}</p>
                    <p className="mt-2 text-3xl font-bold text-white">{item.value}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 28, rotateY: -14 }}
              animate={{ opacity: 1, y: 0, rotateY: 0 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="relative mx-auto w-full max-w-[760px]"
            >
              <div className="absolute left-[-5rem] top-16 h-48 w-48 rounded-full bg-purple-500/20 blur-3xl parallax-slow" />
              <div className="absolute right-[-4rem] bottom-0 h-52 w-52 rounded-full bg-cyan-400/20 blur-3xl parallax-medium" />

              <div className="relative overflow-hidden rounded-[2.2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-5 shadow-[0_40px_140px_rgba(0,0,0,0.5)] backdrop-blur-2xl lg:p-6">
                <div className="grid gap-4 lg:grid-cols-[1.12fr_0.88fr]">
                  <Card className="relative overflow-hidden p-5 lg:p-6">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,92,255,0.18),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(48,213,246,0.12),transparent_30%)]" />
                    <div className="relative space-y-5">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-[0.24em] text-white/42">Live meeting</p>
                          <h2 className="text-2xl font-semibold text-white">Product review sync</h2>
                        </div>
                        <div className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-cyan-300">recording</div>
                      </div>

                      <div className="rounded-[1.4rem] border border-white/10 bg-black/30 p-4">
                        <div className="flex items-start gap-3">
                          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-primary text-white">
                            <Mic className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm text-white/45">Transcript intelligence</p>
                            <p className="mt-1 text-sm font-medium leading-7 text-white">
                              “Finalize launch copy by Friday and sync design changes after legal sign-off.”
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3">
                        {[
                          ['Summary ready', '12 key bullets'],
                          ['Tasks extracted', '6 assigned actions'],
                          ['Calendar sync', '3 reminders created'],
                        ].map(([label, value]) => (
                          <div key={label} className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-4">
                            <p className="text-xs uppercase tracking-[0.2em] text-white/42">{label}</p>
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
                          <p className="text-xs uppercase tracking-[0.24em] text-white/42">Workflow</p>
                          <p className="text-sm font-medium text-white">Real-time AI pipeline</p>
                        </div>
                      </div>
                      <div className="mt-4 space-y-3">
                        {[
                          'Capture audio, video, or upload files',
                          'AI transcribes, summarizes, and detects decisions',
                          'Tasks and reminders flow into the team calendar',
                        ].map((item, index) => (
                          <div key={item} className="flex items-start gap-3 rounded-2xl bg-white/[0.03] p-3">
                            <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-primary text-xs font-bold text-white">
                              {index + 1}
                            </div>
                            <p className="text-sm text-white/70">{item}</p>
                          </div>
                        ))}
                      </div>
                    </Card>

                    <Card className="p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-[0.24em] text-white/42">Signal</p>
                          <p className="text-sm font-medium text-white">Context surfaced instantly</p>
                        </div>
                        <Globe2 className="h-5 w-5 text-cyan-300" />
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {['Decisions', 'Owners', 'Deadlines', 'Risks'].map((label) => (
                          <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/72">
                            {label}
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-7xl px-6 py-8 lg:py-12">
          <div className="mb-10 max-w-3xl space-y-4">
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/70">Built for momentum</p>
            <h2 className="max-w-2xl font-display text-4xl font-bold tracking-tight text-white md:text-5xl">
              A bento layout with depth, rhythm, and enough contrast to feel new.
            </h2>
            <p className="max-w-2xl text-lg leading-8 text-white/60">
              The interface leans into asymmetry, layered panels, and motion so the product feels intentional instead of generic.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5, delay: index * 0.06 }}
                  whileHover={{ y: -6 }}
                >
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

        <section id="workflow" className="mx-auto max-w-7xl px-6 py-16 lg:py-20">
          <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="space-y-6 rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.3em] text-white/45">Workflow</p>
              <h2 className="font-display text-4xl font-bold tracking-tight text-white">From capture to execution in three steps.</h2>
              <p className="text-lg leading-8 text-white/60">
                The product reads as a process, not a stack of features. Each step changes the rhythm of the page as you scroll.
              </p>
              <Link to="/register"><Button size="lg">Create your workspace</Button></Link>
            </div>
            <div className="grid gap-4">
              {workflow.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.45, delay: index * 0.06 }}
                >
                  <Card className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/[0.05] text-lg font-bold text-cyan-300">{item.step}</div>
                      <div>
                        <h3 className="text-xl font-semibold text-white">{item.title}</h3>
                        <p className="mt-2 text-sm leading-7 text-white/60">{item.body}</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="mx-auto max-w-7xl px-6 py-14 lg:py-16">
          <div className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-8 backdrop-blur-2xl lg:p-10">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl space-y-4">
                <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/70">Pricing</p>
                <h2 className="font-display text-4xl font-bold tracking-tight text-white md:text-5xl">Simple plans for teams that move fast.</h2>
                <p className="text-lg leading-8 text-white/60">
                  The rest of the product uses the same visual language: layered glass, deep contrast, and deliberate motion.
                </p>
              </div>
              <Link to="/pricing"><Button variant="outline">See full pricing</Button></Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-10 lg:py-20">
          <div className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(124,92,255,0.18),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(48,213,246,0.14),transparent_28%),rgba(255,255,255,0.03)] p-8 text-center backdrop-blur-2xl lg:p-12">
            <p className="text-xs uppercase tracking-[0.32em] text-cyan-300/70">Ready to ship</p>
            <h2 className="mt-4 font-display text-4xl font-bold tracking-tight text-white md:text-5xl">Make meetings feel engineered, not managed.</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-white/60">
              Start with the landing experience, then continue the same visual language through auth, upload, and the dashboard workspace.
            </p>
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
