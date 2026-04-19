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
      <section className="relative z-10 container mx-auto px-6 py-12 sm:py-16">
        <div className="relative overflow-hidden rounded-[2rem] border border-white/60 bg-white/35 p-6 shadow-[0_24px_80px_rgba(16,46,34,0.12)] backdrop-blur-xl md:p-10 lg:p-12">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.8),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(192,243,204,0.45),transparent_35%)]" />

          <div className="relative mx-auto max-w-7xl space-y-10 lg:space-y-12">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-end">
              <div className="max-w-3xl">
                <Badge variant="success" className="mb-4 bg-emerald-100 text-emerald-900">
                  Visual Product Tour
                </Badge>
                <h2 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
                  How Meetiva flows from conversation to execution.
                </h2>
                <p className="mt-5 max-w-2xl text-lg leading-8 text-gray-600 sm:text-xl">
                  A guided tour of the pipeline that turns one meeting into clear decisions,
                  owners, and follow-through.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:justify-self-end">
                <div className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                    Steps
                  </div>
                  <div className="mt-2 text-2xl font-bold text-emerald-900">4</div>
                  <div className="mt-1 text-sm text-gray-600">core stages</div>
                </div>
                <div className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                    Focus
                  </div>
                  <div className="mt-2 text-2xl font-bold text-emerald-900">Live</div>
                  <div className="mt-1 text-sm text-gray-600">stateful tour</div>
                </div>
                <div className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                    Outcome
                  </div>
                  <div className="mt-2 text-2xl font-bold text-emerald-900">Clarity</div>
                  <div className="mt-1 text-sm text-gray-600">and ownership</div>
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(220px,280px)_minmax(0,1fr)_minmax(220px,280px)] lg:items-center">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                {flowSteps.slice(0, 2).map((step, index) => (
                  <button
                    key={step.title}
                    type="button"
                    onClick={() => setActiveFlowStep(index)}
                    aria-label={`Show ${step.title}`}
                    aria-pressed={index === activeFlowStep}
                    className={`hidden w-full cursor-pointer text-left sm:block rounded-[1.5rem] border border-white/70 bg-white/65 shadow-[0_10px_24px_rgba(16,46,34,0.12)] backdrop-blur-xl transition-all duration-500 ${
                      index === activeFlowStep ? 'scale-100 opacity-100' : 'scale-[0.985] opacity-85'
                    }`}
                  >
                    <CardContent className="p-5">
                      <Badge variant="outline" className="mb-3 text-[11px]">
                        Step {index + 1}
                      </Badge>
                      <h4 className="text-sm font-bold text-gray-800">{step.title}</h4>
                      <p className="mt-2 text-sm text-gray-600">{step.subtitle}</p>
                      <div className="mt-4 space-y-2">
                        <div className="h-1.5 rounded-full bg-emerald-100" />
                        <div className="h-1.5 w-4/5 rounded-full bg-white/85" />
                        <div className="h-1.5 w-2/3 rounded-full bg-white/75" />
                      </div>
                    </CardContent>
                  </button>
                ))}
              </div>

              <div className="relative min-h-[520px] md:min-h-[560px]">
                {(() => {
                  const activeStep = flowSteps[activeFlowStep];
                  const ActiveIcon = activeStep.icon;

                  return (
                    <Card className="absolute inset-x-0 top-0 z-30 mx-auto overflow-hidden border-white/75 bg-white/85 shadow-[0_24px_72px_rgba(14,44,33,0.18)] backdrop-blur-xl flow-card-enter-soft md:w-[92%]">
                      <CardContent className="p-0">
                        <div className="border-b border-white/70 bg-white/55 px-5 py-4 sm:px-6">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <Badge variant="info" className="mb-3 text-[11px] tracking-wide">
                                Product Flow
                              </Badge>
                              <h3 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                                {activeStep.title}
                              </h3>
                              <p className="mt-1 text-sm font-semibold text-emerald-900">
                                {activeStep.subtitle}
                              </p>
                            </div>

                            <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-3 py-2 text-sm font-semibold text-emerald-900 shadow-sm">
                              <ActiveIcon className="h-4 w-4" />
                              Step {activeFlowStep + 1} of {flowSteps.length}
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-0 md:grid-cols-[minmax(0,1fr)_minmax(260px,0.86fr)]">
                          <div className="relative min-h-[320px] bg-gradient-to-br from-white via-emerald-50/55 to-lime-50/55 p-4 sm:p-5">
                            <div className="absolute -left-10 top-6 h-28 w-28 rounded-full bg-emerald-200/35 blur-3xl" />
                            <div className="absolute -right-8 bottom-0 h-24 w-24 rounded-full bg-lime-200/35 blur-3xl" />

                            <div className="relative h-full rounded-[1.5rem] border border-white/80 bg-white/70 p-4 shadow-inner sm:p-5">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <div className="inline-flex items-center rounded-full bg-emerald-900 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                                    {activeStep.title}
                                  </div>
                                  <div className="mt-3 text-sm font-semibold text-emerald-900">
                                    {activeStep.subtitle}
                                  </div>
                                </div>
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-900 shadow-sm">
                                  <ActiveIcon className="h-4 w-4" />
                                </div>
                              </div>

                              <div className="relative z-[1] mt-5 flex h-full min-h-[220px] flex-col justify-between">
                                {activeFlowStep === 0 && (
                                  <>
                                    <div className="grid items-stretch gap-3 sm:grid-cols-2">
                                      <div className="flex min-h-[148px] flex-col justify-between rounded-2xl border border-[#dbe7d8] bg-white/90 p-3.5 shadow-sm">
                                        <div className="flex items-center justify-between gap-3">
                                          <div>
                                            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
                                              Incoming signal
                                            </div>
                                            <div className="mt-1 text-sm font-semibold text-emerald-900">
                                              Recording pulse
                                            </div>
                                          </div>
                                        </div>

                                        <div className="mt-3 self-start rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] leading-none text-emerald-900">
                                          Live
                                        </div>

                                        <div className="mt-3 flex flex-1 items-end gap-1.5">
                                          {[18, 34, 24, 52, 36, 45, 28, 40, 24].map((height, barIndex) => (
                                            <span
                                              key={barIndex}
                                              className="w-1.5 rounded-full bg-gradient-to-t from-emerald-800 to-emerald-300"
                                              style={{ height }}
                                            />
                                          ))}
                                        </div>
                                      </div>
                                      <div className="flex min-h-[148px] flex-col justify-between rounded-2xl border border-[#dbe7d8] bg-emerald-50 p-3.5 shadow-sm">
                                        <div>
                                          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-800/70">
                                            Capture status
                                          </div>
                                          <div className="mt-1 text-sm font-semibold text-emerald-900">
                                            Audio is being indexed
                                          </div>
                                        </div>
                                        <div className="space-y-2">
                                          <div className="h-2 rounded-full bg-emerald-200" />
                                          <div className="h-2 rounded-full bg-white" />
                                          <div className="h-2 rounded-full bg-white" />
                                        </div>
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2.5">
                                      <div className="h-9 rounded-2xl border border-[#dbe7d8] bg-white/95" />
                                      <div className="h-9 rounded-2xl border border-emerald-200 bg-emerald-100/85" />
                                      <div className="h-9 rounded-2xl border border-[#dbe7d8] bg-white/95" />
                                    </div>
                                  </>
                                )}

                                {activeFlowStep === 1 && (
                                  <>
                                    <div className="relative grid gap-3 sm:grid-cols-2 sm:items-stretch">
                                      <div className="flex h-full min-h-[138px] flex-col justify-between rounded-2xl border border-[#dbe7d8] bg-white/90 p-4 pr-12 shadow-sm sm:pr-4">
                                        <div className="flex items-center justify-between gap-3">
                                          <div>
                                            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
                                              Live transcript
                                            </div>
                                            <div className="mt-1 text-sm font-semibold text-emerald-900">
                                              “Let’s align on next steps...”
                                            </div>
                                          </div>
                                          <FileText className="h-5 w-5 text-emerald-700" />
                                        </div>

                                        <div className="mt-4 space-y-2">
                                          <div className="h-2 rounded-full bg-emerald-100" />
                                          <div className="h-2 w-11/12 rounded-full bg-white" />
                                          <div className="h-2 w-9/12 rounded-full bg-emerald-100" />
                                        </div>
                                      </div>

                                      <div className="flex h-full min-h-[138px] flex-col justify-between rounded-2xl border border-emerald-200 bg-emerald-50 p-4 pl-12 shadow-sm sm:pl-4">
                                        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-800/70">
                                          <Zap className="h-4 w-4" />
                                          AI insight
                                        </div>
                                        <div className="mt-3 flex flex-col gap-2">
                                          <div className="flex min-h-[38px] items-center justify-start rounded-full border border-white/90 bg-white/90 px-4 shadow-sm">
                                            <div className="text-[9px] font-semibold uppercase tracking-[0.14em] leading-tight text-gray-500">
                                              Summary
                                            </div>
                                          </div>
                                          <div className="flex min-h-[38px] items-center justify-start rounded-full border border-white/90 bg-white/90 px-4 shadow-sm">
                                            <div className="text-[9px] font-semibold uppercase tracking-[0.14em] leading-tight text-gray-500">
                                              Owners
                                            </div>
                                          </div>
                                          <div className="flex min-h-[38px] items-center justify-start rounded-full border border-white/90 bg-white/90 px-4 shadow-sm">
                                            <div className="text-[9px] font-semibold uppercase tracking-[0.14em] leading-tight text-gray-500">
                                              Tasks
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="pointer-events-none absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800 shadow-sm">
                                        <ArrowRight className="h-4 w-4" />
                                      </div>
                                    </div>
                                  </>
                                )}

                                {activeFlowStep === 2 && (
                                  <>
                                    <div className="space-y-2.5">
                                      {['Owner: Alex', 'Owner: Priya', 'Owner: Sam'].map((label) => (
                                        <div
                                          key={label}
                                          className="flex items-center justify-between rounded-2xl border border-[#dbe7d8] bg-white/95 px-3 py-2.5 shadow-sm"
                                        >
                                          <span className="text-xs font-medium text-gray-600">{label}</span>
                                          <CheckCircle className="h-4 w-4 text-emerald-700" />
                                        </div>
                                      ))}
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                      <div className="h-10 rounded-2xl border border-emerald-200 bg-emerald-100/85" />
                                      <div className="h-10 rounded-2xl border border-[#dbe7d8] bg-white/95" />
                                    </div>
                                  </>
                                )}

                                {activeFlowStep === 3 && (
                                  <>
                                    <div className="rounded-2xl border border-[#dbe7d8] bg-white/95 p-4 shadow-sm">
                                      <div className="flex h-32 items-end gap-2">
                                        <span className="w-3 rounded-full bg-emerald-200" style={{ height: 24 }} />
                                        <span className="w-3 rounded-full bg-emerald-300" style={{ height: 44 }} />
                                        <span className="w-3 rounded-full bg-emerald-400" style={{ height: 64 }} />
                                        <span className="w-3 rounded-full bg-emerald-600" style={{ height: 88 }} />
                                        <span className="w-3 rounded-full bg-emerald-800" style={{ height: 120 }} />
                                      </div>
                                    </div>
                                    <div className="grid gap-3 sm:grid-cols-[1fr_0.8fr]">
                                      <div className="h-10 rounded-2xl bg-emerald-100/90" />
                                      <div className="h-10 rounded-2xl bg-white" />
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="border-t border-white/70 bg-white/65 p-5 sm:p-6 md:border-l md:border-t-0">
                            <div className="flex h-full flex-col justify-between gap-6">
                              <div>
                                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">
                                  <span className={`inline-flex h-2.5 w-2.5 rounded-full ${activeStep.accent}`} />
                                  Flow snapshot
                                </div>
                                <p className="mt-4 text-sm leading-7 text-gray-600">
                                  {activeStep.description}
                                </p>

                                <div className="mt-5 grid gap-3 sm:grid-cols-2 md:grid-cols-1 xl:grid-cols-2">
                                  <div className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm">
                                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                                      Output
                                    </div>
                                    <div className="mt-2 text-sm font-semibold text-gray-900">
                                      {activeFlowStep === 0
                                        ? 'Audio captured'
                                        : activeFlowStep === 1
                                        ? 'Structured transcript'
                                        : activeFlowStep === 2
                                        ? 'Action items assigned'
                                        : 'Team execution visible'}
                                    </div>
                                  </div>

                                  <div className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm">
                                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                                      Result
                                    </div>
                                    <div className="mt-2 text-sm font-semibold text-emerald-900">
                                      {activeFlowStep + 1} / {flowSteps.length}
                                    </div>
                                  </div>
                                </div>

                                <div className="rounded-3xl border border-white/80 bg-gradient-to-br from-emerald-950 via-emerald-900 to-green-800 p-5 text-white shadow-[0_16px_36px_rgba(16,46,34,0.2)]">
                                  <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">
                                    Current focus
                                  </div>
                                  <h4 className="mt-2 text-lg font-semibold">{activeStep.title}</h4>
                                  <p className="mt-2 text-sm leading-6 text-white/75">
                                    {activeStep.subtitle}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })()}
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                {flowSteps.slice(2).map((step, index) => {
                  const actualIndex = index + 2;
                  const isActive = actualIndex === activeFlowStep;

                  return (
                    <button
                      key={step.title}
                      type="button"
                      onClick={() => setActiveFlowStep(actualIndex)}
                      aria-label={`Show ${step.title}`}
                      aria-pressed={isActive}
                      className={`hidden w-full cursor-pointer text-left sm:block min-h-[148px] rounded-[1.5rem] border border-white/70 bg-white/65 shadow-[0_10px_24px_rgba(16,46,34,0.12)] backdrop-blur-xl transition-all duration-500 ${
                        isActive ? 'scale-100 opacity-100' : 'scale-[0.985] opacity-85'
                      }`}
                    >
                      <CardContent className="flex h-full flex-col justify-between p-5">
                        <Badge variant="outline" className="mb-3 text-[11px]">
                          Step {actualIndex + 1}
                        </Badge>
                        <h4 className="text-sm font-bold text-gray-800">{step.title}</h4>
                        <p className="mt-2 text-sm text-gray-600">{step.subtitle}</p>
                        <div className="mt-4 space-y-2">
                          <div className="h-1.5 rounded-full bg-emerald-100" />
                          <div className="h-1.5 w-4/5 rounded-full bg-white/85" />
                          <div className="h-1.5 w-2/3 rounded-full bg-white/75" />
                        </div>
                      </CardContent>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={showPreviousFlowStep}
                  className="h-10 w-10 rounded-full border-emerald-800/40 bg-white/85 hover:bg-white"
                  aria-label="Previous flow card"
                >
                  <ChevronLeft className="h-4 w-4 text-emerald-900" />
                </Button>

                <div className="min-w-20 text-center text-sm font-semibold text-emerald-900">
                  {activeFlowStep + 1} / {flowSteps.length}
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={showNextFlowStep}
                  className="h-10 w-10 rounded-full border-emerald-800/40 bg-white/85 hover:bg-white"
                  aria-label="Next flow card"
                >
                  <ChevronRight className="h-4 w-4 text-emerald-900" />
                </Button>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2.5">
                {flowSteps.map((step, dotIndex) => (
                  <button
                    key={step.title}
                    type="button"
                    onClick={() => setActiveFlowStep(dotIndex)}
                    aria-label={`Go to ${step.title}`}
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      dotIndex === activeFlowStep ? 'w-10 bg-emerald-900' : 'w-2.5 bg-emerald-300/70 hover:bg-emerald-400'
                    }`}
                  />
                ))}
              </div>
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


