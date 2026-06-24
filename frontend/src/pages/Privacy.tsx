import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, Sparkles } from 'lucide-react';
import GradientOrbs from '@/components/GradientOrbs';

const sections = [
  {
    title: 'Information we collect',
    items: [
      'Account details such as your name, email address, and company information.',
      'Meeting recordings, transcripts, summaries, and extracted action items.',
      'Usage and device data required to keep the product stable and measurable.',
    ],
  },
  {
    title: 'How we use information',
    items: [
      'To provide transcription, summarization, and task extraction features.',
      'To improve reliability, security, and product quality over time.',
      'To send service notifications and support communications.',
    ],
  },
  {
    title: 'Data protection',
    items: [
      'Transport encryption, access controls, and secure storage practices.',
      'Operational monitoring to detect issues quickly and reduce risk.',
      'Retention controls that let us delete data when you request it.',
    ],
  },
];

const PrivacyPage: React.FC = () => {
  return (
    <div className="scene-shell relative min-h-screen overflow-hidden bg-background text-foreground">
      <GradientOrbs />
      <div className="absolute inset-0 fine-grid opacity-25" />

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-6 lg:px-8 lg:py-8">
        <div className="mb-10 flex items-center justify-between rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-5 py-4 backdrop-blur-2xl">
          <Link to="/" className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-primary text-white shadow-[0_18px_40px_rgba(124,92,255,0.35)]">
              <span className="font-bold">M</span>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-white/45">Meetiva.ai</p>
              <p className="text-sm font-medium text-white">Privacy</p>
            </div>
          </Link>
          <Link to="/register" className="text-sm text-cyan-300 transition hover:text-white">
            Create workspace
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-8 backdrop-blur-2xl lg:p-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300/80">
              <Shield className="h-3.5 w-3.5" /> Privacy policy
            </div>
            <h1 className="mt-6 font-display text-4xl font-bold tracking-tight text-white md:text-5xl">
              Privacy built for a product that listens, summarizes, and acts.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-white/60">
              Meetiva.ai is designed to handle meeting data with care. This policy explains what we collect, how we use it, and how you stay in control.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                ['Last updated', new Date().toLocaleDateString()],
                ['Encryption', 'Transport + at rest'],
                ['Retention', 'User-controlled'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-white/42">{label}</p>
                  <p className="mt-2 text-sm font-semibold text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {sections.map((section, index) => (
              <div key={section.title} className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
                <div className="flex items-start gap-4">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/[0.06] text-cyan-300">
                    <Lock className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-4">
                      <h2 className="text-xl font-semibold text-white">{section.title}</h2>
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/55">
                        0{index + 1}
                      </span>
                    </div>
                    <div className="mt-4 space-y-3">
                      {section.items.map((item) => (
                        <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-7 text-white/65">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.12fr_0.88fr]">
          <div className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(124,92,255,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(48,213,246,0.14),transparent_28%),rgba(255,255,255,0.03)] p-8 backdrop-blur-2xl lg:p-10">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-cyan-300" />
              <p className="text-xs uppercase tracking-[0.28em] text-cyan-300/70">Your rights</p>
            </div>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-white/60">
              You can access, correct, delete, or export your personal information, and you can contact us any time if you want help understanding how data is handled.
            </p>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 backdrop-blur-2xl lg:p-10">
            <h2 className="text-2xl font-semibold text-white">Contact</h2>
            <p className="mt-3 text-sm leading-7 text-white/60">
              privacy@meetiva.ai
              <br />
              123 Innovation Drive, San Francisco, CA 94102
            </p>
            <Link to="/contact" className="mt-6 inline-flex text-sm font-medium text-cyan-300 transition hover:text-white">
              Reach the team
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
