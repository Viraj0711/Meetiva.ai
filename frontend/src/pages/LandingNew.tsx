import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
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
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';

const LandingPage: React.FC = () => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFlowStep, setActiveFlowStep] = useState(0);

  const glassCardClass =
    'bg-white/55 backdrop-blur-xl border border-white/60 shadow-[0_10px_32px_rgba(16,46,34,0.15)]';
  const glassButtonClass =
    'backdrop-blur-xl border border-white/60 shadow-[0_8px_24px_rgba(16,46,34,0.22)] transition-all duration-300';

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setMobileMenuOpen(false);
    }
  };

  const showNextFlowStep = () => {
    setActiveFlowStep((prev) => (prev + 1) % flowSteps.length);
  };

  const showPreviousFlowStep = () => {
    setActiveFlowStep((prev) => (prev - 1 + flowSteps.length) % flowSteps.length);
  };

  const features = [
    {
      icon: <Mic className="w-6 h-6" />,
      title: 'AI Transcription & Speaker ID',
      description:
        'Accurate real-time transcription with intelligent speaker identification, handling noisy audio and technical terminology.',
      color: 'bg-emerald-800',
    },
    {
      icon: <CheckCircle className="w-6 h-6" />,
      title: 'Smart Action Item Extraction',
      description:
        'Automatically detect and extract action items with assigned owners, deadlines, and priority levels.',
      color: 'bg-emerald-700',
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: 'Intelligent Summarization',
      description:
        'Generate structured summaries with key points, decisions, and discussion topics automatically.',
      color: 'bg-emerald-700',
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'Analytics & Insights',
      description:
        'Track meeting effectiveness, task completion rates, and productivity trends to improve performance.',
      color: 'bg-emerald-900',
    },
    {
      icon: <Calendar className="w-6 h-6" />,
      title: 'Seamless Integrations',
      description:
        'Sync with Google Calendar to coordinate meetings and reminders automatically.',
      color: 'bg-green-800',
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Real-Time Processing',
      description:
        'Lightning-fast AI processing ensures your meetings are analyzed and actionable within minutes.',
      color: 'bg-green-700',
    },
  ];

  const stats = [
    { value: '10,000+', label: 'Meetings Processed' },
    { value: '50,000+', label: 'Action Items Tracked' },
    { value: '99.9%', label: 'Uptime' },
    { value: '4.9/5', label: 'User Rating' },
  ];

  const plans = [
    {
      name: 'Starter',
      price: '$29',
      cadence: '/seat/mo',
      description: 'For small teams getting meeting workflows under control.',
      highlights: ['Unlimited summaries', 'Action item extraction', 'Team workspace'],
      featured: false,
    },
    {
      name: 'Growth',
      price: '$59',
      cadence: '/seat/mo',
      description: 'For teams that need velocity, ownership, and visibility.',
      highlights: ['Everything in Starter', 'Role-based team controls', 'Advanced analytics'],
      featured: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      cadence: '',
      description: 'For larger organizations with compliance and scale needs.',
      highlights: ['SSO and policy controls', 'Dedicated support', 'Custom onboarding'],
      featured: false,
    },
  ];

  const flowSteps = [
    {
      title: '1. Capture Meeting',
      subtitle: 'Audio, call, or uploaded file',
      description: 'Drop in recordings or connect live calls to pull every meeting into one workspace.',
      icon: Mic,
      accent: 'bg-emerald-900',
    },
    {
      title: '2. AI Understands',
      subtitle: 'Transcript + context + decisions',
      description:
        'Meetiva identifies speakers, summarizes key points, and highlights decisions in minutes.',
      icon: FileText,
      accent: 'bg-emerald-800',
    },
    {
      title: '3. Tasks Are Assigned',
      subtitle: 'Owners, deadlines, priorities',
      description:
        'Action items are auto-created with accountability so work does not get lost after calls.',
      icon: CheckCircle,
      accent: 'bg-emerald-700',
    },
    {
      title: '4. Team Executes',
      subtitle: 'Track completion and momentum',
      description: 'Leaders monitor progress and team health with a shared view of meeting outcomes.',
      icon: BarChart3,
      accent: 'bg-green-700',
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
      answer: 'Yes, Google Calendar integration is available today, and we are expanding support for additional tools.',
    },
  ];

  return (
    <div className="relative min-h-screen bg-[#edf2e8] overflow-hidden">
      <AnimatedBackground />
      <GradientOrbs />

      {/* Navbar */}
      <nav className="relative z-10 container mx-auto px-6 py-4">
        <div className={`flex justify-between items-center rounded-2xl px-6 py-4 ${glassCardClass}`}>
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-emerald-800 rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
              <span className="text-white font-bold text-xl">M</span>
            </div>
            <span className="text-2xl font-bold text-emerald-900">
              Meetiva.ai
            </span>
          </Link>
          <div className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => scrollToSection('features')}
              className="text-gray-700 hover:text-emerald-800 font-medium transition-colors cursor-pointer"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('pricing')}
              className="text-gray-700 hover:text-emerald-800 font-medium transition-colors cursor-pointer"
            >
              Pricing
            </button>
            <Link to="/login">
              <Button variant="ghost" className="font-medium">
                Login
              </Button>
            </Link>
            <Link to="/login">
              <Button className={`${glassButtonClass} bg-emerald-800 text-white hover:bg-emerald-700`}>
                Get Started <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-700 hover:text-emerald-800 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className={`md:hidden mt-4 rounded-2xl px-6 py-4 animate-fade-in ${glassCardClass}`}>
            <div className="flex flex-col space-y-4">
              <button
                onClick={() => scrollToSection('features')}
                className="text-gray-700 hover:text-emerald-800 font-medium transition-colors text-left"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection('pricing')}
                className="text-gray-700 hover:text-emerald-800 font-medium transition-colors text-left"
              >
                Pricing
              </button>
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="font-medium w-full">
                  Login
                </Button>
              </Link>
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button className={`w-full ${glassButtonClass} bg-emerald-800 text-white hover:bg-emerald-700`}>
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
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-900 px-4 py-2 rounded-full text-sm font-semibold mb-6">
            <Star className="w-4 h-4 fill-current" />
            Trusted by 1,000+ teams worldwide
          </div>

          <h1 className="text-6xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            Turn Meetings Into{' '}
            <span className="text-emerald-800">
              Results
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 mb-10 leading-relaxed max-w-3xl mx-auto">
            Stop losing productivity to manual note-taking. Meetiva automatically transcribes,
            summarizes, and extracts action items from your meetings so your team can focus on
            execution, not documentation.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link to="/login">
              <Button
                size="lg"
                className={`text-lg px-8 py-6 ${glassButtonClass} bg-emerald-800 text-white hover:bg-emerald-700`}
              >
                <Play className="w-5 h-5 mr-2" />
                Start Free Trial
              </Button>
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-800" />
              <span className="font-medium">Enterprise Security</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-700" />
              <span className="font-medium">Real-Time Processing</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-emerald-800" />
              <span className="font-medium">50+ Languages</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-700" />
              <span className="font-medium">Team Collaboration</span>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 max-w-4xl mx-auto">
          {stats.map((stat, index) => (
            <Card
              key={index}
              className={`rounded-2xl p-6 text-center transition-all hover:-translate-y-1 ${glassCardClass}`}
            >
              <CardContent className="p-0">
                <div className="text-4xl font-bold text-emerald-800 mb-2">{stat.value}</div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Product Flow Pictures */}
      <section className="relative z-10 container mx-auto px-6 py-12">
        <div className="max-w-7xl mx-auto rounded-[2rem] border border-white/60 bg-white/30 backdrop-blur-xl p-7 md:p-10 shadow-[0_24px_80px_rgba(16,46,34,0.12)]">
          <div className="text-center mb-10">
            <Badge variant="success" className="mb-4">Visual Product Tour</Badge>
            <h2 className="text-5xl font-bold text-gray-900 mb-4">How Meetiva Flows, In 4 Pictures</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              A visual sequence from raw conversation to team execution.
            </p>
          </div>

          <div className="mx-auto w-full max-w-4xl">
            <div className="relative h-[430px] md:h-[500px]">
              {(() => {
                const prevIndex = (activeFlowStep - 1 + flowSteps.length) % flowSteps.length;
                const nextIndex = (activeFlowStep + 1) % flowSteps.length;
                const activeStep = flowSteps[activeFlowStep];
                const ActiveIcon = activeStep.icon;

                return (
                  <>
                    <Card className="hidden md:block absolute left-0 top-14 w-[34%] rotate-[-6deg] border border-white/70 bg-white/55 backdrop-blur-xl shadow-[0_10px_24px_rgba(16,46,34,0.12)] transition-all duration-500">
                      <CardContent className="p-4">
                        <Badge variant="outline" className="mb-3 text-[11px]">Step {prevIndex + 1}</Badge>
                        <h4 className="text-sm font-bold text-gray-800">{flowSteps[prevIndex].title}</h4>
                        <p className="text-xs text-gray-600 mt-2">{flowSteps[prevIndex].subtitle}</p>
                        <div className="mt-3 space-y-1.5">
                          <div className="h-1.5 rounded bg-white/80" />
                          <div className="h-1.5 w-4/5 rounded bg-white/75" />
                          <div className="h-1.5 w-2/3 rounded bg-white/70" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="hidden md:block absolute right-0 top-14 w-[34%] rotate-[6deg] border border-white/70 bg-white/55 backdrop-blur-xl shadow-[0_10px_24px_rgba(16,46,34,0.12)] transition-all duration-500">
                      <CardContent className="p-4">
                        <Badge variant="outline" className="mb-3 text-[11px]">Step {nextIndex + 1}</Badge>
                        <h4 className="text-sm font-bold text-gray-800">{flowSteps[nextIndex].title}</h4>
                        <p className="text-xs text-gray-600 mt-2">{flowSteps[nextIndex].subtitle}</p>
                        <div className="mt-3 space-y-1.5">
                          <div className="h-1.5 rounded bg-white/80" />
                          <div className="h-1.5 w-4/5 rounded bg-white/75" />
                          <div className="h-1.5 w-2/3 rounded bg-white/70" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="absolute inset-x-0 mx-auto top-0 w-full md:w-[58%] overflow-hidden border border-white/70 bg-white/80 backdrop-blur-xl shadow-[0_18px_52px_rgba(14,44,33,0.2)] flow-card-enter-soft z-30">
                      <CardContent className="p-0">
                        <div className="p-4 border-b border-white/60 bg-white/45">
                          <div className="relative h-44 rounded-2xl border border-white/80 bg-gradient-to-br from-white to-emerald-50/80 p-3 overflow-hidden shadow-inner">
                            <div className="absolute -top-10 -left-8 h-18 w-18 rounded-full bg-emerald-200/40 blur-2xl" />
                            <div className="absolute -bottom-10 -right-8 h-18 w-18 rounded-full bg-emerald-300/25 blur-2xl" />
                            <div className="absolute top-3 left-3 inline-flex items-center rounded-full bg-emerald-900 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                              Step {activeFlowStep + 1}
                            </div>
                            <div className="absolute top-3 right-3 h-8 w-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center z-10">
                              <ActiveIcon className="h-4 w-4 text-emerald-900" />
                            </div>

                            {activeFlowStep === 0 && (
                              <div className="relative z-[1] h-full pt-6 pr-10 flex flex-col justify-between">
                                <div className="h-16 flex items-end gap-1.5">
                                  {[18, 34, 24, 52, 36, 45, 28, 40, 24].map((height, barIndex) => (
                                    <span
                                      key={barIndex}
                                      className="w-1.5 rounded-full bg-gradient-to-t from-emerald-800 to-emerald-300"
                                      style={{ height }}
                                    />
                                  ))}
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="h-7 rounded-lg border border-[#d9e4d7] bg-white/90" />
                                  <div className="h-7 rounded-lg border border-emerald-200 bg-emerald-100/80" />
                                </div>
                              </div>
                            )}

                            {activeFlowStep === 1 && (
                              <div className="relative z-[1] h-full pt-6 pr-10 flex flex-col justify-between">
                                <div className="grid grid-cols-12 gap-2">
                                  <div className="col-span-7 space-y-2">
                                    <div className="h-2 rounded bg-white" />
                                    <div className="h-2 rounded bg-white" />
                                    <div className="h-2 rounded bg-emerald-100" />
                                    <div className="h-2 rounded bg-white" />
                                  </div>
                                  <div className="col-span-5 rounded-lg border border-emerald-200 bg-emerald-50 p-2 space-y-1.5">
                                    <div className="h-1.5 rounded bg-emerald-200" />
                                    <div className="h-1.5 rounded bg-white" />
                                    <div className="h-1.5 rounded bg-white" />
                                  </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                  <div className="h-7 rounded-lg border border-emerald-200 bg-emerald-100/80" />
                                  <div className="h-7 rounded-lg border border-[#d9e4d7] bg-white/90" />
                                  <div className="h-7 rounded-lg border border-[#d9e4d7] bg-white/90" />
                                </div>
                              </div>
                            )}

                            {activeFlowStep === 2 && (
                              <div className="relative z-[1] h-full pt-6 pr-10 flex flex-col justify-between">
                                <div className="space-y-2.5">
                                  {['Owner: Alex', 'Owner: Priya', 'Owner: Sam'].map((label) => (
                                    <div key={label} className="flex items-center justify-between rounded-lg border border-[#d9e4d7] bg-white/90 px-2 py-1.5">
                                      <span className="text-[10px] font-medium text-gray-600">{label}</span>
                                      <CheckCircle className="h-3.5 w-3.5 text-emerald-700" />
                                    </div>
                                  ))}
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="h-7 rounded-lg border border-emerald-200 bg-emerald-100/80" />
                                  <div className="h-7 rounded-lg border border-[#d9e4d7] bg-white/90" />
                                </div>
                              </div>
                            )}

                            {activeFlowStep === 3 && (
                              <div className="relative z-[1] h-full pt-6 pr-10 flex flex-col justify-between">
                                <div className="h-20 rounded-xl border border-[#d9e4d7] bg-white/90 p-2">
                                  <div className="h-full flex items-end gap-1.5">
                                    <span className="w-2.5 rounded bg-emerald-200 h-4" />
                                    <span className="w-2.5 rounded bg-emerald-300 h-7" />
                                    <span className="w-2.5 rounded bg-emerald-400 h-10" />
                                    <span className="w-2.5 rounded bg-emerald-600 h-13" />
                                    <span className="w-2.5 rounded bg-emerald-800 h-16" />
                                  </div>
                                </div>
                                <div className="h-2 rounded bg-emerald-100" />
                                <div className="h-2 w-5/6 rounded bg-white" />
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="p-4">
                          <Badge variant="info" className="mb-3 text-[11px] tracking-wide">Product Flow</Badge>
                          <h3 className="text-lg font-bold text-gray-900">{activeStep.title}</h3>
                          <p className="text-sm font-semibold text-emerald-900 mt-1">{activeStep.subtitle}</p>
                          <p className="text-sm text-gray-600 mt-2 leading-relaxed">{activeStep.description}</p>
                          <div className="mt-4">
                            <span className={`inline-flex h-2.5 w-2.5 rounded-full ${activeStep.accent}`} />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                );
              })()}
            </div>

            <div className="mt-6 flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={showPreviousFlowStep}
                className="h-9 w-9 rounded-full border-emerald-800/40 bg-white/80 hover:bg-white"
                aria-label="Previous flow card"
              >
                <ChevronLeft className="h-4 w-4 text-emerald-900" />
              </Button>

              <div className="text-sm font-semibold text-emerald-900 min-w-12 text-center">
                {activeFlowStep + 1} / {flowSteps.length}
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={showNextFlowStep}
                className="h-9 w-9 rounded-full border-emerald-800/40 bg-white/80 hover:bg-white"
                aria-label="Next flow card"
              >
                <ChevronRight className="h-4 w-4 text-emerald-900" />
              </Button>
            </div>

            <div className="mt-4 flex items-center justify-center gap-2">
              {flowSteps.map((step, dotIndex) => (
                <button
                  key={step.title}
                  type="button"
                  onClick={() => setActiveFlowStep(dotIndex)}
                  aria-label={`Go to ${step.title}`}
                  className={`h-2.5 rounded-full transition-all ${
                    dotIndex === activeFlowStep ? 'w-8 bg-emerald-800' : 'w-2.5 bg-emerald-300/70'
                  }`}
                />
              ))}
            </div>
          </div>
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
            <Card
              key={index}
              className={`group rounded-2xl p-8 transition-all duration-300 hover:-translate-y-2 ${glassCardClass}`}
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="inline-flex items-center rounded-full bg-emerald-50/90 px-3 py-1 text-xs font-semibold tracking-wide text-emerald-900">
                  Feature {String(index + 1).padStart(2, '0')}
                </span>
              </div>
              <div
                className={`w-14 h-14 ${feature.color} rounded-xl flex items-center justify-center mb-6 text-white shadow-lg group-hover:scale-110 transition-transform`}
              >
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </Card>
          ))}
        </div>
      </section>

{/* Pricing Section */}
      <section id="pricing" className="relative z-10 container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
          <p className="text-xl text-gray-600">Choose the plan that works best for your team</p>
        </div>
        <div className="max-w-6xl mx-auto">
          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`rounded-2xl border p-7 shadow-lg transition-all duration-300 ${
                  plan.featured
                    ? 'bg-emerald-900/90 text-white border-emerald-800 -translate-y-1 backdrop-blur-xl'
                    : `${glassCardClass} text-gray-900`
                }`}
              >
                <p className={`text-sm font-semibold uppercase tracking-wider ${plan.featured ? 'text-emerald-100' : 'text-emerald-900'}`}>
                  {plan.name}
                </p>
                <div className="mt-3 flex items-end gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.cadence && <span className={`text-sm ${plan.featured ? 'text-emerald-100' : 'text-gray-600'}`}>{plan.cadence}</span>}
                </div>
                <p className={`mt-4 text-sm leading-relaxed ${plan.featured ? 'text-emerald-100' : 'text-gray-600'}`}>
                  {plan.description}
                </p>
                <ul className="mt-6 space-y-2 text-sm">
                  {plan.highlights.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className={`mt-1 inline-block h-1.5 w-1.5 rounded-full ${plan.featured ? 'bg-emerald-200' : 'bg-emerald-700'}`} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login">
              <Button
                size="lg"
                className={`px-8 py-6 text-lg ${glassButtonClass} bg-emerald-800 text-white hover:bg-emerald-700`}
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button
                size="lg"
                variant="outline"
                className={`px-8 py-6 text-lg border-emerald-800/60 text-emerald-900 hover:bg-white/80 ${glassButtonClass}`}
              >
                Talk To Sales
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
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
            <Card
              key={index}
              className={`rounded-xl overflow-hidden ${glassCardClass}`}
            >
              <button
                onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-emerald-50/60 transition-colors"
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
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 container mx-auto px-6 py-20">
        <div className="bg-emerald-900 rounded-3xl p-12 md:p-16 text-center text-white shadow-2xl relative overflow-hidden">
          <div className="absolute -top-16 -left-10 h-52 w-52 rounded-full bg-white/10" />
          <div className="absolute -bottom-16 right-0 h-48 w-48 rounded-full bg-white/10" />
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Ready to Transform Your Meetings?
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Join forward-thinking teams who have eliminated manual note-taking and turned their
              meetings into Meetiva with AI-powered intelligence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/login">
                <Button
                  size="lg"
                  className={`bg-white/90 text-emerald-800 hover:bg-white px-8 py-6 text-lg ${glassButtonClass}`}
                >
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button
                  size="lg"
                  className={`bg-white/90 text-emerald-800 hover:bg-white px-8 py-6 text-lg ${glassButtonClass}`}
                >
                  Contact Sales
                </Button>
              </Link>
            </div>
            <p className="text-sm mt-6 opacity-75">
              No credit card required  14-day free trial  Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 container mx-auto px-6 py-12 border-t border-gray-200/50">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-emerald-800 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">M</span>
              </div>
              <span className="text-lg font-bold text-emerald-900">
                Meetiva.ai
              </span>
            </div>
            <p className="text-gray-600 text-sm">
              Turn meetings into Meetiva with AI-powered intelligence.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link to="/features" className="hover:text-emerald-800">Features</Link></li>
              <li><Link to="/pricing" className="hover:text-emerald-800">Pricing</Link></li>
              <li><Link to="/integrations" className="hover:text-emerald-800">Integrations</Link></li>
              <li><Link to="/security" className="hover:text-emerald-800">Security</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link to="/about" className="hover:text-emerald-800">About</Link></li>
              <li><Link to="/contact" className="hover:text-emerald-800">Contact</Link></li>
              <li><Link to="/careers" className="hover:text-emerald-800">Careers</Link></li>
              <li><Link to="/blog" className="hover:text-emerald-800">Blog</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link to="/privacy" className="hover:text-emerald-800">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-emerald-800">Terms of Service</Link></li>
              <li><Link to="/cookies" className="hover:text-emerald-800">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="text-center text-gray-600 text-sm pt-8 border-t border-gray-200/50">
          <p>&copy; {new Date().getFullYear()} Meetiva.ai. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;


