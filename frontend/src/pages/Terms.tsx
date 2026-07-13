import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Sparkles } from 'lucide-react';
import GradientOrbs from '@/components/GradientOrbs';

const TermsPage: React.FC = () => {
  return (
    <div className="scene-shell relative min-h-screen overflow-hidden bg-background text-foreground">
      <GradientOrbs />
      <div className="absolute inset-0 fine-grid opacity-25" />

      <div className="relative z-10 mx-auto max-w-5xl px-6 py-6 lg:px-8 lg:py-8">
        <div className="mb-10 flex items-center justify-between rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-5 py-4 backdrop-blur-2xl">
          <Link to="/" className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-primary text-white shadow-[0_18px_40px_rgba(124,92,255,0.35)]">
              <span className="font-bold">M</span>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-white/45">Meetiva.ai</p>
              <p className="text-sm font-medium text-white">Terms</p>
            </div>
          </Link>
          <Link to="/contact" className="text-sm text-cyan-300 transition hover:text-white">
            Contact support
          </Link>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-8 backdrop-blur-2xl lg:p-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300/80">
            <ShieldCheck className="h-3.5 w-3.5" /> Terms of service
          </div>
          <h1 className="mt-6 font-display text-4xl font-bold tracking-tight text-white md:text-5xl">
            Terms that match the product: clear, direct, and built for trust.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-white/60">
            By using Meetiva.ai, you agree to the terms below. They define the service, account responsibilities, acceptable use, and the practical boundaries around your data.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              ['Service', 'AI meeting intelligence and workspace tools.'],
              ['Accounts', 'You are responsible for activity on your account.'],
              ['Data', 'You control what you upload and what we process.'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-white/42">{label}</p>
                <p className="mt-2 text-sm font-semibold text-white">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {[
            {
              title: 'Acceptable use',
              body: 'Do not attempt to misuse the platform, disrupt services, or upload content you do not have the right to share.',
            },
            {
              title: 'Limitations',
              body: 'We provide the service as-is, with improvements and changes shipped over time as the product evolves.',
            },
            {
              title: 'Account safety',
              body: 'Keep your credentials secure and notify us if you suspect unauthorized access or account abuse.',
            },
            {
              title: 'Updates',
              body: 'We may revise these terms when necessary. The latest version will always be the one shown on this page.',
            },
          ].map((section) => (
            <div key={section.title} className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/[0.06] text-cyan-300">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-semibold text-white">{section.title}</h2>
              </div>
              <p className="mt-4 text-sm leading-7 text-white/60">{section.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
