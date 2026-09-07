import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Sparkles, ArrowLeft } from 'lucide-react';

const GRAD = '#5B3FD6';
const GRAD2 = '#8B5CF6';

const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen" style={{ background: '#FCFBFF' }}>
      {/* Top bar */}
      <div className="border-b border-[#E4E0F5] bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold"
              style={{ background: `linear-gradient(135deg, ${GRAD}, ${GRAD2})` }}
            >
              M
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[#64607A]">Meetiva.ai</p>
              <p className="text-sm font-medium text-[#1D1B22]">Terms</p>
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

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Hero card */}
        <div className="rounded-[2rem] border border-[#E4E0F5] bg-white p-8 lg:p-10 shadow-sm">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E4E0F5] bg-[#F5F3FF] px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em]"
            style={{ color: GRAD }}>
            <ShieldCheck className="h-3.5 w-3.5" /> Terms of service
          </div>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-[#1D1B22] md:text-5xl">
            Terms that match the product: clear, direct, and built for trust.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-[#64607A]">
            By using Meetiva.ai, you agree to the terms below. They define the service,
            account responsibilities, acceptable use, and the practical boundaries around your data.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              ['Service', 'AI meeting intelligence and workspace tools.'],
              ['Accounts', 'You are responsible for activity on your account.'],
              ['Data', 'You control what you upload and what we process.'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-[#E4E0F5] bg-[#F8F7FF] p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-[#64607A]">{label}</p>
                <p className="mt-2 text-sm font-semibold text-[#1D1B22]">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Section cards */}
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
            <div key={section.title} className="rounded-2xl border border-[#E4E0F5] bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div
                  className="grid h-11 w-11 place-items-center rounded-2xl text-white"
                  style={{ background: `linear-gradient(135deg, ${GRAD}, ${GRAD2})` }}
                >
                  <Sparkles className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-semibold text-[#1D1B22]">{section.title}</h2>
              </div>
              <p className="mt-4 text-sm leading-7 text-[#64607A]">{section.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
