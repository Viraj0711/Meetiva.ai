import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const plans = [
  {
    name: 'Starter',
    price: '$29',
    note: 'per seat / month',
    description: 'For focused teams that want premium meeting intelligence without complexity.',
    features: ['Unlimited summaries', 'Task extraction', 'Calendar sync', 'Team workspace'],
    highlighted: false,
  },
  {
    name: 'Growth',
    price: '$59',
    note: 'per seat / month',
    description: 'For teams that need structure, momentum, and clear accountability.',
    features: ['Everything in Starter', 'Advanced analytics', 'Role-based access', 'Priority support'],
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    note: 'tailored',
    description: 'For organizations with security, onboarding, and scale requirements.',
    features: ['SSO / SAML', 'Dedicated support', 'Custom onboarding', 'Policy controls'],
    highlighted: false,
  },
];

const PricingPage: React.FC = () => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(91,63,214,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(244,114,182,0.16),transparent_26%)]" />
      <div className="absolute inset-0 fine-grid opacity-35" />

      <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/60 backdrop-blur-2xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="group flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-primary shadow-[0_18px_40px_rgba(91,63,214,0.35)]">
              <span className="text-sm font-bold text-white">M</span>
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-white/45">Meetiva.ai</p>
              <p className="text-sm font-medium text-white">Pricing</p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login"><Button variant="ghost">Login</Button></Link>
            <Link to="/register"><Button>Start free trial</Button></Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-6 py-16 lg:py-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300/80 backdrop-blur-xl">
            <Sparkles className="h-3.5 w-3.5" />
            Transparent pricing
          </div>
          <h1 className="font-display text-5xl font-bold tracking-tight text-white md:text-6xl">Plans built for premium meeting momentum.</h1>
          <p className="max-w-2xl text-lg leading-8 text-white/60">Choose the tier that fits your team. Every plan keeps the same cinematic interface and AI-powered workflow.</p>
        </motion.div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <motion.div key={plan.name} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ delay: index * 0.08 }} whileHover={{ y: -6 }}>
              <Card className={`relative h-full p-7 ${plan.highlighted ? 'border-white/20 bg-[linear-gradient(180deg,rgba(91,63,214,0.18),rgba(255,255,255,0.04))] shadow-[0_40px_120px_rgba(91,63,214,0.16)]' : ''}`}>
                {plan.highlighted && <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-primary px-4 py-1 text-xs font-semibold text-white">Most popular</div>}
                <div className="space-y-3">
                  <h3 className="text-2xl font-semibold text-white">{plan.name}</h3>
                  <p className="text-sm leading-7 text-white/60">{plan.description}</p>
                </div>
                <div className="mt-6 flex items-end gap-2">
                  <span className="text-5xl font-bold tracking-tight text-white">{plan.price}</span>
                  <span className="pb-1 text-sm text-white/45">{plan.note}</span>
                </div>
                <ul className="mt-7 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-white/70">
                      <Check className="mt-0.5 h-4 w-4 text-cyan-300" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/register" className="mt-8 block">
                  <Button className="w-full" variant={plan.highlighted ? 'default' : 'outline'}>
                    {plan.highlighted ? 'Start with Growth' : plan.name === 'Enterprise' ? 'Talk to sales' : 'Start free'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </Card>
            </motion.div>
          ))}
        </div>

        <section className="mt-16 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="p-7">
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-300/70">What’s included</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">One product surface, many workflow benefits.</h2>
            <p className="mt-3 text-white/60 leading-8">Every tier gets the same premium motion system, layered lighting, and visual storytelling. Higher plans simply unlock more control and scale.</p>
          </Card>
          <Card className="p-7">
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-300/70">Questions</p>
            <div className="mt-4 space-y-4 text-sm text-white/65">
              <p><span className="font-semibold text-white">Can I change plans later?</span> Yes. Upgrade or downgrade at any time.</p>
              <p><span className="font-semibold text-white">Do you offer a trial?</span> Yes, every account starts with a 14-day trial.</p>
              <p><span className="font-semibold text-white">Do you support enterprise onboarding?</span> Yes, including SSO and custom setup.</p>
            </div>
          </Card>
        </section>

        <section className="mt-16 rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(91,63,214,0.18),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(244,114,182,0.14),transparent_28%),rgba(255,255,255,0.03)] p-8 text-center backdrop-blur-2xl lg:p-12">
          <p className="text-xs uppercase tracking-[0.32em] text-cyan-300/70">Ready to move</p>
          <h2 className="mt-4 font-display text-4xl font-bold tracking-tight text-white md:text-5xl">Start with the plan that fits your momentum.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-white/60">Switch to a workspace that feels advanced, immersive, and built for follow-through.</p>
          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Link to="/register"><Button size="lg">Start free trial</Button></Link>
            <Link to="/login"><Button size="lg" variant="outline">Sign in</Button></Link>
          </div>
        </section>
      </main>
    </div>
  );
};

export default PricingPage;


