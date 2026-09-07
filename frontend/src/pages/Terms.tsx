import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, FileText, ArrowLeft } from 'lucide-react';

const GRAD = '#5B3FD6';
const GRAD2 = '#8B5CF6';

const sections = [
  {
    title: '1. Description of Service',
    items: [
      'Meetiva allows users to upload audio or video recordings of meetings, or paste meeting transcripts, and receive AI-generated outputs including speech-to-text transcription, executive summaries, key discussion points, identified decisions, extracted action items with suggested owners and deadlines, and analytics on task completion, meeting effectiveness, and productivity trends.',
      'Optional integration with Google Calendar for event creation and syncing.',
      'The Service is provided on a workspace/team basis with role-based access (admin, editor, viewer), as configured by your organization\'s administrator.',
    ],
  },
  {
    title: '2. Eligibility and Accounts',
    items: [
      'You must be at least 18 years old to use the Service. If you are using Meetiva as a student or faculty member through an institutional account, your institution\'s own policies may also apply.',
      'You are responsible for maintaining the confidentiality of your login credentials and for all activity under your account. Notify us immediately at meetiva.ai@gmail.com of any unauthorized use.',
      'Accounts are authenticated via secure token-based sessions. We reserve the right to suspend or terminate accounts that violate these Terms.',
    ],
  },
  {
    title: '3. User Content and Meeting Data',
    items: [
      'Your Content: "User Content" means audio, video, transcripts, and any other material you upload, along with the summaries, action items, and analytics Meetiva generates from it.',
      'Ownership: You retain all ownership rights to your User Content. You grant Meetiva a limited, non-exclusive, worldwide license to host, process, transmit, and analyze your User Content solely to provide, maintain, and improve the Service.',
      'Consent to Record: You represent that you have obtained all necessary consents from meeting participants to record, transcribe, and process the meeting content you upload, in compliance with applicable wiretapping, recording-consent, and data protection laws in your jurisdiction.',
      'AI-Generated Output: Summaries, action items, and analytics are generated using automated AI models and may contain inaccuracies, omissions, or misattributions. Meetiva does not guarantee the accuracy, completeness, or fitness of AI-generated content for any particular purpose. You are responsible for reviewing and verifying outputs before relying on them.',
    ],
  },
  {
    title: '4. Third-Party AI and Sub-Processors',
    items: [
      'To deliver the Service, Meetiva transmits portions of your User Content to third-party AI infrastructure providers for processing (e.g., automated transcription and natural-language analysis). These providers process data as Meetiva\'s sub-processors under their own data-handling terms.',
    ],
  },
  {
    title: '5. Google Calendar and Third-Party Integrations',
    items: [
      'If you connect Meetiva to Google Calendar or other third-party services, you authorize Meetiva to access and use the applicable OAuth-scoped data solely to provide integration features such as event creation and scheduling sync.',
      'You may revoke this access at any time through your account settings or the third-party provider\'s own permissions dashboard.',
      'Meetiva\'s use of Google user data complies with the Google API Services User Data Policy.',
    ],
  },
  {
    title: '6. Acceptable Use',
    items: [
      'Upload content you do not have the right or consent to process.',
      'Use the Service to violate any applicable law, including privacy, recording-consent, or intellectual property law.',
      'Attempt to reverse-engineer, scrape, or interfere with the Service\'s infrastructure or AI pipeline.',
      'Use the Service to upload malicious code or attempt unauthorized access to other users\' or teams\' data.',
      'Use another user\'s account without permission.',
    ],
  },
  {
    title: '7. Subscription, Fees, and Billing',
    items: [
      'Pricing tiers, billing cycles, free-trial terms, refund policy, and auto-renewal disclosures will be detailed here once finalized.',
    ],
  },
  {
    title: '8. Data Security',
    items: [
      'Meetiva implements industry-standard safeguards, including AES-256 encryption at rest and TLS 1.3 encryption in transit, and role-based access controls to protect your data.',
      'No system is completely secure, and Meetiva cannot guarantee absolute security of transmitted or stored information.',
    ],
  },
  {
    title: '9. Intellectual Property',
    items: [
      'The Service, including its software, design, and underlying AI pipeline configuration, is the property of Meetiva and its licensors and is protected by intellectual property laws.',
      'Nothing in these Terms grants you rights to Meetiva\'s trademarks, branding, or proprietary technology beyond what is necessary to use the Service.',
    ],
  },
  {
    title: '10. Termination',
    items: [
      'We may suspend or terminate your access to the Service if you violate these Terms, upon reasonable notice where practicable.',
      'You may stop using the Service and request account deletion at any time in accordance with our Privacy Policy.',
    ],
  },
  {
    title: '11. Disclaimers',
    items: [
      'THE SERVICE, INCLUDING ALL AI-GENERATED OUTPUTS, IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR ACCURACY OF AI-GENERATED CONTENT.',
      'MEETIVA DOES NOT WARRANT THAT TRANSCRIPTIONS, SUMMARIES, OR ACTION ITEMS WILL BE ERROR-FREE.',
    ],
  },
  {
    title: '12. Limitation of Liability',
    items: [
      'TO THE MAXIMUM EXTENT PERMITTED BY LAW, MEETIVA AND ITS OFFICERS, EMPLOYEES, AND LICENSORS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF DATA, REVENUE, OR PROFITS, ARISING FROM YOUR USE OF THE SERVICE, INCLUDING RELIANCE ON AI-GENERATED OUTPUTS. OUR TOTAL LIABILITY SHALL NOT EXCEED THE FEES PAID BY YOU IN THE PRECEDING 12 MONTHS.',
    ],
  },
  {
    title: '13. Indemnification',
    items: [
      'You agree to indemnify and hold Meetiva harmless from claims arising out of your User Content, your violation of these Terms, or your failure to obtain necessary consents from meeting participants.',
    ],
  },
  {
    title: '14. Governing Law and Dispute Resolution',
    items: [
      'These Terms are governed by the laws of India, without regard to conflict-of-law principles.',
    ],
  },
  {
    title: '14A. India-Specific Terms — DPDP Act, 2023',
    items: [
      'If you access the Service from India, the following additional terms apply.',
      'Data Fiduciary Relationship: For personal data you submit or that is contained in your meeting recordings, Meetiva acts as a "Data Fiduciary" and you are a "Data Principal" under the Digital Personal Data Protection Act, 2023.',
      'Your Consent Obligations: By uploading meeting audio, video, or transcripts, you confirm that you have provided adequate notice to, and obtained valid consent from, all meeting participants whose personal data will be processed.',
      'Grievance Redressal: Meetiva has designated a Grievance Officer to handle complaints and data-principal requests under the DPDP Act. You agree to first raise DPDP-related grievances with our Grievance Officer before approaching the Data Protection Board of India.',
    ],
  },
  {
    title: '15. Changes to These Terms',
    items: [
      'We may update these Terms from time to time. Material changes will be notified via the Service or email. Continued use after changes take effect constitutes acceptance.',
    ],
  },
  {
    title: '16. Contact',
    items: [
      'Questions about these Terms may be directed to meetiva.ai@gmail.com.',
    ],
  },
];

const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen" style={{ background: '#FCFBFF' }}>
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
              <p className="text-sm font-medium text-[#1D1B22]">Terms & Conditions</p>
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

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="rounded-[2rem] border border-[#E4E0F5] bg-white p-8 lg:p-10 shadow-sm">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E4E0F5] bg-[#F5F3FF] px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em]"
            style={{ color: GRAD }}>
            <ShieldCheck className="h-3.5 w-3.5" /> Terms & Conditions
          </div>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-[#1D1B22] md:text-5xl">
            Terms that match the product: clear, direct, and built for trust.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-[#64607A]">
            These Terms and Conditions govern access to and use of Meetiva. By creating an
            account or otherwise using the Service, you agree to be bound by these Terms.
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

        <div className="mt-8 space-y-6">
          {sections.map((section, index) => (
            <div key={section.title} className="rounded-2xl border border-[#E4E0F5] bg-white p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-white"
                  style={{ background: `linear-gradient(135deg, ${GRAD}, ${GRAD2})` }}
                >
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="text-xl font-semibold text-[#1D1B22]">{section.title}</h2>
                    <span
                      className="rounded-full border border-[#E4E0F5] bg-[#F8F7FF] px-3 py-1 text-xs font-semibold"
                      style={{ color: GRAD }}
                    >
                      {String(index + 1).padStart(2, '0')}
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

        <div className="mt-8 rounded-[2rem] border border-[#E4E0F5] bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-[#1D1B22]">Contact</h2>
          <p className="mt-3 text-sm leading-7 text-[#64607A]">
            Questions about these Terms may be directed to meetiva.ai@gmail.com.
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
  );
};

export default TermsPage;
