import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Check, ArrowRight } from 'lucide-react';
import GradientOrbs from '@/components/GradientOrbs';

const PricingPage: React.FC = () => {
  const plans = [
    {
      name: 'Starter',
      price: '29',
      description: 'Perfect for small teams getting started',
      features: [
        'Up to 10 meetings/month',
        'AI transcription & summarization',
        'Action item extraction',
        'Basic integrations',
        '5 GB storage',
        'Email support',
      ],
      cta: 'Start Free Trial',
      highlighted: false,
    },
    {
      name: 'Professional',
      price: '99',
      description: 'For growing teams that need more',
      features: [
        'Unlimited meetings',
        'Advanced AI features',
        'Priority & sentiment analysis',
        'All integrations',
        '50 GB storage',
        'Priority support',
        'Custom workflows',
        'Analytics dashboard',
      ],
      cta: 'Start Free Trial',
      highlighted: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      description: 'For large organizations with specific needs',
      features: [
        'Everything in Professional',
        'Unlimited storage',
        'SSO & SAML',
        'Dedicated account manager',
        'Custom integrations',
        '99.9% SLA',
        'Advanced security',
        'On-premise deployment option',
      ],
      cta: 'Contact Sales',
      highlighted: false,
    },
  ];

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 overflow-hidden">
      <GradientOrbs />

      {/* Navbar */}
      <nav className="relative z-10 container mx-auto px-6 py-4">
        <div className="flex justify-between items-center backdrop-blur-sm bg-white/70 rounded-2xl px-6 py-4 shadow-lg border border-white/20">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">P</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Meetiva.ai
            </span>
          </Link>
          <div className="flex items-center space-x-4">
            <Link to="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link to="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-6 py-20 text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-6">
          Simple, Transparent <span className="bg-gradient-primary bg-clip-text text-transparent">Pricing</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Choose the perfect plan for your team. All plans include a 14-day free trial.
        </p>
      </section>

      {/* Pricing Cards */}
      <section className="relative z-10 container mx-auto px-6 py-12">
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg transition-all duration-300 border ${
                plan.highlighted
                  ? 'border-blue-500 ring-2 ring-blue-500 ring-offset-4 scale-105'
                  : 'border-white/50 hover:shadow-xl'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-primary text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </div>
              )}
              
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
              <p className="text-gray-600 mb-6">{plan.description}</p>
              
              <div className="mb-6">
                {typeof plan.price === 'number' || plan.price !== 'Custom' ? (
                  <>
                    <span className="text-5xl font-bold text-gray-900">${plan.price}</span>
                    <span className="text-gray-600">/month</span>
                  </>
                ) : (
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                )}
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start">
                    <Check className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full ${plan.highlighted ? '' : 'variant-outline'}`}
                size="lg"
              >
                {plan.cta}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative z-10 container mx-auto px-6 py-20">
        <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">Frequently Asked Questions</h2>
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/50">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Can I change plans later?</h3>
            <p className="text-gray-600">
              Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
            </p>
          </div>
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/50">
            <h3 className="text-lg font-bold text-gray-900 mb-2">What payment methods do you accept?</h3>
            <p className="text-gray-600">
              We accept all major credit cards (Visa, MasterCard, American Express) and offer invoice billing for Enterprise customers.
            </p>
          </div>
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/50">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Is there a setup fee?</h3>
            <p className="text-gray-600">
              No setup fees for any plan. Start using Meetiva immediately after signing up.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 container mx-auto px-6 py-20">
        <div className="bg-gradient-primary rounded-3xl p-12 text-center text-white shadow-2xl">
          <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 opacity-90">Start your 14-day free trial today. No credit card required.</p>
          <Link to="/register">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
              Start Free Trial
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 container mx-auto px-6 py-12 text-center border-t border-gray-200/50">
        <p className="text-gray-600">&copy; {new Date().getFullYear()} Meetiva.ai. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default PricingPage;
