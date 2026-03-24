import React from 'react';
import { Link } from 'react-router-dom';
import GradientOrbs from '@/components/GradientOrbs';

const TermsPage: React.FC = () => {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 overflow-hidden">
      <GradientOrbs />

      {/* Navbar */}
      <nav className="relative z-10 container mx-auto px-6 py-4">
        <div className="flex justify-between items-center backdrop-blur-sm bg-white/70 rounded-2xl px-6 py-4 shadow-lg border border-white/20">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">M</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Meetiva.ai
            </span>
          </Link>
        </div>
      </nav>

      {/* Content */}
      <section className="relative z-10 container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto bg-white/90 backdrop-blur-sm rounded-2xl p-12 shadow-xl border border-white/50">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <div className="prose prose-lg max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                By accessing and using Meetiva.ai ("Service"), you accept and agree to be bound by the terms and
                provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Use License</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Permission is granted to temporarily use Meetiva.ai for personal and commercial use. This is the
                grant of a license, not a transfer of title, and under this license you may not:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Modify or copy the materials</li>
                <li>Use the materials for any commercial purpose without proper licensing</li>
                <li>Attempt to decompile or reverse engineer any software contained on Meetiva.ai</li>
                <li>Remove any copyright or other proprietary notations from the materials</li>
                <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Data and Privacy</h2>
              <p className="text-gray-700 leading-relaxed">
                Your use of the Service is also governed by our Privacy Policy. We collect and process data as
                described in our Privacy Policy. You retain all rights to your data, and we will never sell your
                data to third parties.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Account Terms</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>You must be 18 years or older to use this Service</li>
                <li>You must provide your legal full name, valid email address, and any other information requested</li>
                <li>You are responsible for maintaining the security of your account and password</li>
                <li>You are responsible for all activities that occur under your account</li>
                <li>You may not use the Service for any illegal or unauthorized purpose</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Payment Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                Valid payment information is required for paid accounts. You will be charged in advance on a
                recurring basis. Fees are non-refundable except when required by law. We reserve the right to
                change our fees with 30 days notice.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Cancellation and Termination</h2>
              <p className="text-gray-700 leading-relaxed">
                You may cancel your account at any time. We reserve the right to suspend or terminate your account
                if you breach these Terms of Service. Upon termination, your right to use the Service will
                immediately cease.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Limitation of Liability</h2>
              <p className="text-gray-700 leading-relaxed">
                In no event shall Meetiva.ai or its suppliers be liable for any damages (including, without
                limitation, damages for loss of data or profit, or due to business interruption) arising out of the
                use or inability to use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Changes to Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                We reserve the right to modify these terms at any time. We will notify users of any material changes
                via email or through the Service. Continued use of the Service after such modifications constitutes
                acceptance of the updated terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Contact Information</h2>
              <p className="text-gray-700 leading-relaxed">
                If you have any questions about these Terms, please contact us at legal@meetiva.ai
              </p>
            </section>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 container mx-auto px-6 py-12 text-center border-t border-gray-200/50">
        <p className="text-gray-600">&copy; {new Date().getFullYear()} Meetiva.ai. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default TermsPage;
