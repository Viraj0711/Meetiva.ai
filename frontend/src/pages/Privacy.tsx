import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, Sparkles, ArrowLeft } from 'lucide-react';

const GRAD = '#5B3FD6';
const GRAD2 = '#8B5CF6';

const sections = [
  {
    title: 'Information we collect',
    items: [
      'Account details such as your name, email address, and company information.',
      'Meeting recordings, transcripts, summaries, and extracted tasks.',
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
    <div className="min-h-screen" style={{ background: '#FCFBFF' }}>
      {/* Top bar */}
      <div className="border-b border-[#E4E0F5] bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold"
              style={{ background: `linear-gradient(135deg, ${GRAD}, ${GRAD2})` }}
            >
              M
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[#64607A]">Meetiva.ai</p>
              <p className="text-sm font-medium text-[#1D1B22]">Privacy</p>
            </div>
          </Link>
          <Link
            to="/"
            className="flex items-center gap-2 text-sm font-medium text-[#64607A] hover:text-[#1D1B22] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
          {/* Hero card */}
          <div className="rounded-[2rem] border border-[#E4E0F5] bg-white p-8 lg:p-10 shadow-sm">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E4E0F5] bg-[#F5F3FF] px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em]"
              style={{ color: GRAD }}>
              <Shield className="h-3.5 w-3.5" /> Privacy policy
            </div>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-[#1D1B22] md:text-5xl">
              Privacy built for a product that listens, summarizes, and acts.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-[#64607A]">
              Meetiva.ai is designed to handle meeting data with care. This policy explains
              what we collect, how we use it, and how you stay in control.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                ['Last updated', new Date().toLocaleDateString()],
                ['Encryption', 'Transport + at rest'],
                ['Retention', 'User-controlled'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-[#E4E0F5] bg-[#F8F7FF] p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-[#64607A]">{label}</p>
                  <p className="mt-2 text-sm font-semibold text-[#1D1B22]">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Section cards */}
          <div className="space-y-4">
            {sections.map((section, index) => (
              <div key={section.title} className="rounded-2xl border border-[#E4E0F5] bg-white p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-white"
                    style={{ background: `linear-gradient(135deg, ${GRAD}, ${GRAD2})` }}
                  >
                    <Lock className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-4">
                      <h2 className="text-xl font-semibold text-[#1D1B22]">{section.title}</h2>
                      <span
                        className="rounded-full border border-[#E4E0F5] bg-[#F8F7FF] px-3 py-1 text-xs font-semibold"
                        style={{ color: GRAD }}
                      >
                        0{index + 1}
                      </span>
                    </div>
                    <div className="mt-4 space-y-3">
                      {section.items.map((item) => (
                        <div
                          key={item}
                          className="rounded-2xl border border-[#E4E0F5] bg-[#F8F7FF] p-4 text-sm leading-7 text-[#64607A]"
                        >
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

        {/* Bottom row */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.12fr_0.88fr]">
          <div
            className="rounded-[2rem] border border-[#E4E0F5] p-8 lg:p-10 shadow-sm"
            style={{ background: `linear-gradient(135deg, ${GRAD}0A, ${GRAD2}0A, #FCFBFF)` }}
          >
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5" style={{ color: GRAD }} />
              <p className="text-xs uppercase tracking-[0.28em] font-semibold" style={{ color: GRAD }}>
                Your rights
              </p>
            </div>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-[#64607A]">
              You can access, correct, delete, or export your personal information, and you
              can contact us any time if you want help understanding how data is handled.
            </p>
          </div>

          <div className="rounded-[2rem] border border-[#E4E0F5] bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-semibold text-[#1D1B22]">Contact</h2>
            <p className="mt-3 text-sm leading-7 text-[#64607A]">
              privacy@meetiva.ai
              <br />
              123 Innovation Drive, San Francisco, CA 94102
            </p>
            <Link
              to="/contact"
              className="mt-6 inline-flex text-sm font-semibold transition-colors"
              style={{ color: GRAD }}
            >
              Reach the team
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
