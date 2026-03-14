import React from 'react';
import { Link } from 'react-router-dom';
import GradientOrbs from '@/components/GradientOrbs';

const PrivacyPage: React.FC = () => {
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
              Meetiva
            </span>
          </Link>
        </div>
      </nav>

      {/* Content */}
      <section className="relative z-10 container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto bg-white/90 backdrop-blur-sm rounded-2xl p-12 shadow-xl border border-white/50">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <div className="prose prose-lg max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-700 leading-relaxed">
                At Meetiva, we take your privacy seriously. This Privacy Policy explains how we collect, use,
                disclose, and safeguard your information when you use our service. Please read this privacy policy
                carefully.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Personal Information</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li>Name and email address</li>
                <li>Company information</li>
                <li>Payment and billing information</li>
                <li>Account credentials</li>
              </ul>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Meeting Data</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li>Audio and video recordings you upload</li>
                <li>Transcriptions generated from your meetings</li>
                <li>Meeting summaries and action items</li>
                <li>Meeting metadata (date, duration, participants)</li>
              </ul>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Usage Information</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Log data and device information</li>
                <li>IP address and browser type</li>
                <li>Pages visited and features used</li>
                <li>Analytics and performance data</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>To provide, maintain, and improve our services</li>
                <li>To process your transactions and send related information</li>
                <li>To send administrative information and updates</li>
                <li>To respond to your comments and questions</li>
                <li>To analyze usage patterns and optimize user experience</li>
                <li>To detect, prevent, and address technical issues</li>
                <li>To comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Data Security</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We implement industry-standard security measures to protect your data:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>AES-256 encryption for data at rest</li>
                <li>TLS 1.3 encryption for data in transit</li>
                <li>Regular security audits and penetration testing</li>
                <li>Strict access controls and authentication</li>
                <li>Regular backups and disaster recovery procedures</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Retention</h2>
              <p className="text-gray-700 leading-relaxed">
                We retain your personal information and meeting data for as long as your account is active or as
                needed to provide you services. You can request deletion of your data at any time by contacting us.
                Upon request, we will delete your data within 30 days, except where we are required to retain it by
                law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Data Sharing and Disclosure</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We do not sell, trade, or rent your personal information to third parties. We may share your
                information only in the following circumstances:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>With your explicit consent</li>
                <li>With service providers who assist in our operations (under strict confidentiality agreements)</li>
                <li>To comply with legal obligations or protect our rights</li>
                <li>In connection with a merger, acquisition, or sale of assets (with prior notice)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Your Rights</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Under GDPR and other privacy laws, you have the right to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Access your personal data</li>
                <li>Correct inaccurate or incomplete data</li>
                <li>Request deletion of your data</li>
                <li>Object to processing of your data</li>
                <li>Request data portability</li>
                <li>Withdraw consent at any time</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Cookies and Tracking</h2>
              <p className="text-gray-700 leading-relaxed">
                We use cookies and similar tracking technologies to track activity on our service and hold certain
                information. You can instruct your browser to refuse all cookies or to indicate when a cookie is
                being sent.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Third-Party Services</h2>
              <p className="text-gray-700 leading-relaxed">
                Our service may integrate with third-party services (such as JIRA, Slack, or Google Calendar). These
                third parties have their own privacy policies, and we encourage you to review them.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Changes to This Policy</h2>
              <p className="text-gray-700 leading-relaxed">
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the
                new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this
                Privacy Policy periodically for any changes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Contact Us</h2>
              <p className="text-gray-700 leading-relaxed">
                If you have any questions about this Privacy Policy, please contact us at:
              </p>
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-gray-700">
                  <strong>Email:</strong> privacy@propelting.ai<br />
                  <strong>Address:</strong> 123 Innovation Drive, San Francisco, CA 94102
                </p>
              </div>
            </section>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 container mx-auto px-6 py-12 text-center border-t border-gray-200/50">
        <p className="text-gray-600">&copy; {new Date().getFullYear()} Meetiva. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default PrivacyPage;
