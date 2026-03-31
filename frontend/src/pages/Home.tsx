import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAppSelector } from '@/store/hooks';
import AnimatedBackground from '@/components/AnimatedBackground';
import GradientOrbs from '@/components/GradientOrbs';
import {
  Calendar,
  Upload,
  ListTodo,
  BarChart3,
  FileText,
  CheckCircle,
  Clock,
  TrendingUp,
  Users,
  Zap,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

const Home: React.FC = () => {
  const user = useAppSelector((state) => state.auth.user);

  const quickActions = [
    {
      icon: <Upload className="w-6 h-6" />,
      title: 'Upload Meeting',
      description: 'Upload a new meeting recording or transcript',
      href: '/dashboard/upload',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: <Calendar className="w-6 h-6" />,
      title: 'Browse Meetings',
      description: 'View and manage all your meeting records',
      href: '/dashboard/meetings',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: <ListTodo className="w-6 h-6" />,
      title: 'Action Items',
      description: 'Track and manage pending action items',
      href: '/dashboard/action-items',
      color: 'from-orange-500 to-amber-500',
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'Analytics',
      description: 'View insights and productivity metrics',
      href: '/dashboard/analytics',
      color: 'from-green-500 to-emerald-500',
    },
  ];

  const features = [
    {
      icon: <FileText className="w-5 h-5" />,
      title: 'Smart Transcription',
      description: 'AI-powered transcription with speaker identification',
    },
    {
      icon: <CheckCircle className="w-5 h-5" />,
      title: 'Action Extraction',
      description: 'Automatically detect and extract action items',
    },
    {
      icon: <Clock className="w-5 h-5" />,
      title: 'Save Time',
      description: 'Eliminate manual note-taking and focus on discussion',
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      title: 'Track Progress',
      description: 'Monitor meeting effectiveness and task completion',
    },
  ];

  const tips = [
    {
      title: 'Upload your first meeting',
      description: 'Start by uploading a meeting recording to see the AI in action.',
      action: 'Upload Now',
      href: '/dashboard/upload',
    },
    {
      title: 'Explore integrations',
      description: 'Connect with JIRA, Trello, or Slack to streamline your workflow.',
      action: 'View Settings',
      href: '/dashboard/settings',
    },
    {
      title: 'Check your profile',
      description: 'View your account details, integrations, and notification settings.',
      action: 'Go to Profile',
      href: '/dashboard/profile',
    },
  ];

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />
      <GradientOrbs />
      
      <div className="relative z-10 space-y-8">
      {/* Welcome Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-600 p-8 text-white shadow-xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 flex items-start justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-6 h-6" />
              <span className="text-sm font-semibold uppercase tracking-wider opacity-90">
                Welcome Back
              </span>
            </div>
            <h1 className="text-4xl font-bold mb-3">
              Hello, {user?.name || 'there'}! 👋
            </h1>
            <p className="text-lg opacity-90 max-w-2xl">
              Ready to turn your meetings into Meetiva? Upload a meeting, review action items, or
              explore your analytics to stay on top of your team's productivity.
            </p>
          </div>
          <div className="flex-shrink-0">
            <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm border-4 border-white/30 flex items-center justify-center text-4xl font-bold shadow-xl">
              {user?.name?.charAt(0).toUpperCase() || '👤'}
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      {/* Quick Actions Grid */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Quick Actions</h2>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Get started with common tasks</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action, index) => (
            <Link key={index} to={action.href}>
              <Card className="group h-full p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer border-2 hover:border-blue-200">
                <div
                  className={`w-16 h-16 bg-gradient-to-br ${action.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg text-white`}
                >
                  {action.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-blue-400 transition-colors">
                  {action.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{action.description}</p>
                <div className="mt-4 flex items-center text-blue-400 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  Get Started <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Features & Tips Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Platform Features */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Platform Features</h2>
          </div>
          <div className="space-y-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <div className="text-blue-600 dark:text-blue-400">{feature.icon}</div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{feature.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Getting Started Tips */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Getting Started</h2>
          </div>
          <div className="space-y-4">
            {tips.map((tip, index) => (
              <div
                key={index}
                className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{tip.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{tip.description}</p>
                    <Link to={tip.href}>
                      <Button variant="outline" size="sm" className="text-xs">
                        {tip.action}
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  </div>
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Navigation Cards */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Explore More</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Link to="/dashboard/profile">
            <Card className="group p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer border-2 hover:border-purple-400">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-500/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-400 transition-colors" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Profile</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Manage your account, integrations, and preferences
              </p>
            </Card>
          </Link>

          <Link to="/dashboard/meetings">
            <Card className="group p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer border-2 hover:border-blue-400">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-500/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">All Meetings</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Browse, search, and manage your meeting history
              </p>
            </Card>
          </Link>

          <Link to="/dashboard/settings">
            <Card className="group p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer border-2 hover:border-green-400">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-500/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Zap className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-400 transition-colors" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Settings</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Configure integrations and customize your experience
              </p>
            </Card>
          </Link>
        </div>
      </div>
    </div>
    </div>
  );
};

export default Home;
