import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import AnimatedBackground from '@/components/AnimatedBackground';
import GradientOrbs from '@/components/GradientOrbs';
import {
  Mic,
  FileText,
  CheckCircle,
  BarChart3,
  Calendar,
  Zap,
  Shield,
  Globe,
  Users,
  ArrowRight,
  Play,
  Star,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';

const LandingPage: React.FC = () => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setMobileMenuOpen(false);
    }
  };

  const features = [
    {
      icon: <Mic className="w-6 h-6" />,
      title: 'AI Transcription & Speaker ID',
      description:
        'Accurate real-time transcription with intelligent speaker identification, handling noisy audio and technical terminology.',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: <CheckCircle className="w-6 h-6" />,
      title: 'Smart Action Item Extraction',
      description:
        'Automatically detect and extract action items with assigned owners, deadlines, and priority levels.',
      color: 'from-cyan-500 to-blue-600',
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: 'Intelligent Summarization',
      description:
        'Generate structured summaries with key points, decisions, and discussion topics automatically.',
      color: 'from-blue-600 to-indigo-500',
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'Analytics & Insights',
      description:
        'Track meeting effectiveness, task completion rates, and productivity trends to improve performance.',
      color: 'from-indigo-500 to-purple-500',
    },
    {
      icon: <Calendar className="w-6 h-6" />,
      title: 'Seamless Integrations',
      description:
        'Sync with JIRA, Trello, Asana, Google Calendar, and Slack. Create tickets and notify teams automatically.',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Real-Time Processing',
      description:
        'Lightning-fast AI processing ensures your meetings are analyzed and actionable within minutes.',
      color: 'from-amber-500 to-orange-500',
    },
  ];

  const stats = [
    { value: '10,000+', label: 'Meetings Processed' },
    { value: '50,000+', label: 'Action Items Tracked' },
    { value: '99.9%', label: 'Uptime' },
    { value: '4.9/5', label: 'User Rating' },
  ];

  const testimonials = [
    {
      quote: 'Meetiva has transformed how our team handles meetings. We\'ve saved hours every week and nothing falls through the cracks anymore.',
      author: 'Sarah Chen',
      role: 'VP of Product, TechCorp',
      avatar: '👩‍💼',
    },
    {
      quote: 'The AI-powered action item extraction is incredibly accurate. It\'s like having a personal assistant in every meeting.',
      author: 'Michael Rodriguez',
      role: 'Engineering Manager, StartupXYZ',
      avatar: '👨‍💻',
    },
    {
      quote: 'Integration with our existing tools was seamless. Meetiva fits perfectly into our workflow without any disruption.',
      author: 'Emily Watson',
      role: 'CTO, InnovateLabs',
      avatar: '👩‍💼',
    },
  ];

  const faqs = [
    {
      question: 'How accurate is the transcription?',
      answer: 'Our AI-powered transcription achieves 95%+ accuracy, even with accents, background noise, and technical terminology. Speaker identification is also highly accurate.',
    },
    {
      question: 'What file formats are supported?',
      answer: 'We support MP3, WAV, M4A, AAC, MP4, MPEG, MOV, and AVI formats up to 500MB. Longer files can be processed with our enterprise plan.',
    },
    {
      question: 'How secure is my data?',
      answer: 'We use AES-256 encryption at rest and TLS 1.3 in transit. All data is GDPR-compliant with role-based access control and regular security audits.',
    },
    {
      question: 'Can I try it before purchasing?',
      answer: 'Yes! We offer a 14-day free trial with full access to all features. No credit card required.',
    },
    {
      question: 'Do you integrate with our existing tools?',
      answer: 'Yes, we integrate with JIRA, Trello, Asana, Linear, Google Calendar, Outlook, Slack, and Microsoft Teams. Custom integrations are available for enterprise customers.',
    },
  ];

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 overflow-hidden">
      <AnimatedBackground />
      <GradientOrbs />

      {/* Navbar */}
      <nav className="relative z-10 container mx-auto px-6 py-4">
        <div className="flex justify-between items-center backdrop-blur-sm bg-white/70 rounded-2xl px-6 py-4 shadow-lg border border-white/20">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
              <span className="text-white font-bold text-xl">M</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Meetiva
            </span>
          </Link>
          <div className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => scrollToSection('features')}
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors cursor-pointer"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('pricing')}
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors cursor-pointer"
            >
              Pricing
            </button>
            <button
              onClick={() => scrollToSection('testimonials')}
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors cursor-pointer"
            >
              Testimonials
            </button>
            <Link to="/login">
              <Button variant="ghost" className="font-medium">
                Login
              </Button>
            </Link>
            <Link to="/register">
              <Button className="shadow-lg hover:shadow-xl transition-shadow">
                Get Started <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-700 hover:text-blue-600 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 backdrop-blur-sm bg-white/70 rounded-2xl px-6 py-4 shadow-lg border border-white/20 animate-fade-in">
            <div className="flex flex-col space-y-4">
              <button
                onClick={() => scrollToSection('features')}
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors text-left"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection('pricing')}
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors text-left"
              >
                Pricing
              </button>
              <button
                onClick={() => scrollToSection('testimonials')}
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors text-left"
              >
                Testimonials
              </button>
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="font-medium w-full">
                  Login
                </Button>
              </Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                <Button className="shadow-lg hover:shadow-xl transition-shadow w-full">
                  Get Started <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-6 py-20">
        <div className="text-center max-w-5xl mx-auto animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
            <Star className="w-4 h-4 fill-current" />
            Trusted by 1,000+ teams worldwide
          </div>
          
          <h1 className="text-6xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            Freely attend your Meeting,{' '}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Meetiva is ready for Reporting
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 mb-10 leading-relaxed max-w-3xl mx-auto">
            Stop losing productivity to manual note-taking. Meetiva automatically transcribes,
            summarizes, and extracts action items from your meetings—so your team can focus on
            execution, not documentation.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link to="/register">
              <Button size="lg" className="text-lg px-8 py-6 shadow-2xl hover:shadow-3xl transition-all">
                <Play className="w-5 h-5 mr-2" />
                Start Free Trial
              </Button>
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              <span className="font-medium">Enterprise Security</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-600" />
              <span className="font-medium">Real-Time Processing</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-cyan-600" />
              <span className="font-medium">50+ Languages</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <span className="font-medium">Team Collaboration</span>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 max-w-4xl mx-auto">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-shadow border border-white/50"
            >
              <div className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
                {stat.value}
              </div>
              <div className="text-gray-600 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-4">
            Everything You Need for Productive Meetings
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Powerful features that eliminate the gap between discussion and execution
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-white/50 hover:-translate-y-2"
            >
              <div
                className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-6 text-white shadow-lg group-hover:scale-110 transition-transform`}
              >
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="relative z-10 container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-4">Loved by Teams Worldwide</h2>
          <p className="text-xl text-gray-600">See what our customers have to say</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-white/50"
            >
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-gray-700 mb-6 italic leading-relaxed">&ldquo;{testimonial.quote}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="text-3xl">{testimonial.avatar}</div>
                <div>
                  <div className="font-bold text-gray-900">{testimonial.author}</div>
                  <div className="text-sm text-gray-600">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative z-10 container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
          <p className="text-xl text-gray-600">Choose the plan that works best for your team</p>
        </div>
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-12 md:p-16 border border-white/50 relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-4xl font-bold text-gray-900 mb-6">Ready to Transform Your Meetings?</h3>
              <p className="text-xl mb-8 text-gray-600 max-w-2xl mx-auto">
                Start with our 14-day free trial. No credit card required. Experience the full power of AI-driven meeting intelligence.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Link to="/register">
                  <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 shadow-xl px-8 py-6 text-lg">
                    Start Free Trial
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link to="/pricing">
                  <Button
                    size="lg"
                    className="bg-white text-black hover:bg-gray-100 shadow-xl px-8 py-6 text-lg"
                  >
                    View Pricing Plans
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative z-10 container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
          <p className="text-xl text-gray-600">Everything you need to know about Meetiva</p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 overflow-hidden"
            >
              <button
                onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-blue-50/50 transition-colors"
              >
                <span className="font-semibold text-gray-900 text-lg">{faq.question}</span>
                <ChevronRight
                  className={`w-5 h-5 text-gray-600 transition-transform ${
                    activeFaq === index ? 'rotate-90' : ''
                  }`}
                />
              </button>
              {activeFaq === index && (
                <div className="px-6 pb-6 text-gray-600 leading-relaxed animate-fade-in">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 container mx-auto px-6 py-20">
        <div className="bg-gradient-primary rounded-3xl p-12 md:p-16 text-center text-white shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Ready to Transform Your Meetings?
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Join forward-thinking teams who have eliminated manual note-taking and turned their
              meetings into momentum with AI-powered intelligence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 shadow-xl px-8 py-6 text-lg">
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-gray-100 shadow-xl px-8 py-6 text-lg"
                >
                  Contact Sales
                </Button>
              </Link>
            </div>
            <p className="text-sm mt-6 opacity-75">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 container mx-auto px-6 py-12 border-t border-gray-200/50">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">M</span>
              </div>
              <span className="text-lg font-bold bg-gradient-primary bg-clip-text text-transparent">
                Meetiva
              </span>
            </div>
            <p className="text-gray-600 text-sm">
              Freely attend your Meeting, Meetiva is ready for Reporting.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold text-gray-900 mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link to="/features" className="hover:text-blue-600">Features</Link></li>
              <li><Link to="/pricing" className="hover:text-blue-600">Pricing</Link></li>
              <li><Link to="/integrations" className="hover:text-blue-600">Integrations</Link></li>
              <li><Link to="/security" className="hover:text-blue-600">Security</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-gray-900 mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link to="/about" className="hover:text-blue-600">About</Link></li>
              <li><Link to="/contact" className="hover:text-blue-600">Contact</Link></li>
              <li><Link to="/careers" className="hover:text-blue-600">Careers</Link></li>
              <li><Link to="/blog" className="hover:text-blue-600">Blog</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-gray-900 mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link to="/privacy" className="hover:text-blue-600">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-blue-600">Terms of Service</Link></li>
              <li><Link to="/cookies" className="hover:text-blue-600">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="text-center text-gray-600 text-sm pt-8 border-t border-gray-200/50">
          <p>&copy; {new Date().getFullYear()} Meetiva. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
