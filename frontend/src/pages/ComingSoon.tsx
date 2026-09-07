import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Construction } from 'lucide-react';

const GRAD = '#5B3FD6';
const GRAD2 = '#8B5CF6';

const PAGE_DATA: Record<string, { title: string; description: string }> = {
  changelog: {
    title: 'Changelog',
    description:
      'We are working on a detailed changelog to keep you updated on every improvement, fix, and new feature shipped to Meetiva. Stay tuned.',
  },
  about: {
    title: 'About Meetiva',
    description:
      'Our story, mission, and the team behind Meetiva. We are building AI-powered meeting intelligence that turns every conversation into actionable momentum.',
  },
  blog: {
    title: 'Blog',
    description:
      'Insights on meeting productivity, AI workflows, and how teams are using Meetiva to move faster. Articles and guides coming soon.',
  },
  careers: {
    title: 'Careers',
    description:
      'Meetiva is growing. We are looking for passionate people who want to shape the future of how teams collaborate. Open roles coming soon.',
  },
  press: {
    title: 'Press',
    description:
      'Media kit, brand assets, press releases, and coverage of Meetiva in the news. Resources for journalists and partners coming soon.',
  },
  security: {
    title: 'Security',
    description:
      'AES-256 encryption at rest, TLS 1.3 in transit, SOC 2 compliance in progress, and role-based access controls. Full security documentation coming soon.',
  },
  cookies: {
    title: 'Cookie Policy',
    description:
      'How Meetiva uses cookies and similar technologies to provide, secure, and improve our service. Detailed cookie policy coming soon.',
  },
  twitter: {
    title: 'Twitter',
    description:
      'Follow us on Twitter for product updates, tips, and the latest from Meetiva. Our Twitter presence is launching soon.',
  },
  linkedin: {
    title: 'LinkedIn',
    description:
      'Connect with Meetiva on LinkedIn for company news, career opportunities, and industry insights. Coming soon.',
  },
};

const ComingSoonPage: React.FC = () => {
  const { page } = useParams<{ page: string }>();
  const data = PAGE_DATA[page ?? ''] ?? {
    title: 'Coming Soon',
    description: 'This page is under construction. Check back soon.',
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#FCFBFF' }}>
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
              <p className="text-sm font-medium text-[#1D1B22]">{data.title}</p>
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

      <div className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="max-w-xl text-center">
          <div
            className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-3xl text-white"
            style={{ background: `linear-gradient(135deg, ${GRAD}, ${GRAD2})` }}
          >
            <Construction className="h-9 w-9" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-[#1D1B22] md:text-5xl">
            {data.title}
          </h1>
          <p className="mt-5 text-lg leading-8 text-[#64607A]">{data.description}</p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: `linear-gradient(135deg, ${GRAD}, ${GRAD2})` }}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComingSoonPage;
