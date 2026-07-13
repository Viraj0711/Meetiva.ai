// @ts-nocheck - Recharts has type compatibility issues with React 18
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { meetingService, actionItemService } from '@/services';
import {
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  Plus,
  FileText,
  AlertCircle,
  BarChart3,
  Users,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const DashboardEnhanced: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMeetings: 0,
    completedActions: 0,
    averageDuration: 0,
    upcomingMeetings: 0,
  });
  const [weeklyData, setWeeklyData] = useState<{ name: string; meetings: number; actions: number }[]>([]);
  const [actionItemsByStatus, setActionItemsByStatus] = useState<{ name: string; value: number; color: string }[]>([]);
  const [recentMeetings, setRecentMeetings] = useState<any[]>([]);
  const [upcomingActions, setUpcomingActions] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch data from API
      const [meetingStats, meetings, actionItems] = await Promise.all([
        meetingService.getMeetingStats(),
        meetingService.getMeetings({ limit: 10, sort: '-createdAt' }),
        actionItemService.getActionItems({ limit: 100 })
      ]);

      // Set stats
      setStats({
        totalMeetings: meetingStats.total || 0,
        completedActions: actionItems.data.filter(item => item.status === 'completed').length,
        averageDuration: meetingStats.avgDuration || 0,
        upcomingMeetings: meetingStats.upcoming || 0,
      });

      // Process weekly data from meetings
      const weekData = meetingStats.weeklyActivity || [
        { name: 'Mon', meetings: 0, actions: 0 },
        { name: 'Tue', meetings: 0, actions: 0 },
        { name: 'Wed', meetings: 0, actions: 0 },
        { name: 'Thu', meetings: 0, actions: 0 },
        { name: 'Fri', meetings: 0, actions: 0 },
      ];
      setWeeklyData(weekData);

      // Process action items by status
      const statusCounts = {
        completed: actionItems.data.filter(item => item.status === 'completed').length,
        inProgress: actionItems.data.filter(item => item.status === 'in_progress').length,
        pending: actionItems.data.filter(item => item.status === 'pending').length,
        overdue: actionItems.data.filter(item => 
          item.dueDate && new Date(item.dueDate) < new Date() && item.status !== 'completed'
        ).length,
      };

      setActionItemsByStatus([
        { name: 'Completed', value: statusCounts.completed, color: '#10b981' },
        { name: 'In Progress', value: statusCounts.inProgress, color: '#3b82f6' },
        { name: 'Pending', value: statusCounts.pending, color: '#f59e0b' },
        { name: 'Overdue', value: statusCounts.overdue, color: '#ef4444' },
      ]);

      // Set recent meetings (last 3)
      setRecentMeetings(meetings.data.slice(0, 3));

      // Set upcoming action items (next 3 pending/in-progress)
      const upcoming = actionItems.data
        .filter(item => item.status !== 'completed')
        .sort((a, b) => {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        })
        .slice(0, 3);
      setUpcomingActions(upcoming);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Failed to load dashboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadDashboardData}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="mt-2 text-muted-foreground text-lg">
            Welcome back! Here's your meeting intelligence overview.
          </p>
        </div>
        <Link to="/dashboard/upload">
          <Button size="lg" className="shadow-lg hover:shadow-xl transition-shadow">
            <Plus className="w-5 h-5 mr-2" />
            Upload Meeting
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-blue-100">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Meetings</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalMeetings}</p>
                <p className="text-xs text-green-600 mt-1 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +12% from last month
                </p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-green-100">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed Actions</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.completedActions}</p>
                <p className="text-xs text-green-600 mt-1 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +8% completion rate
                </p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-purple-100">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Duration</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.averageDuration}m</p>
                <p className="text-xs text-blue-600 mt-1 flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  Optimal range
                </p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-amber-100">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Upcoming</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.upcomingMeetings}</p>
                <p className="text-xs text-gray-600 mt-1 flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  Next 7 days
                </p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Weekly Activity Chart */}
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
              Weekly Activity
            </CardTitle>
            <CardDescription>Meetings and action items this week</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={weeklyData}>
                <defs>
                  <linearGradient id="colorMeetings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorActions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="meetings"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#colorMeetings)"
                  name="Meetings"
                />
                <Area
                  type="monotone"
                  dataKey="actions"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorActions)"
                  name="Actions"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Action Items Status Chart */}
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle2 className="w-5 h-5 mr-2 text-green-600" />
              Action Items Status
            </CardTitle>
            <CardDescription>Distribution of action items by status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={actionItemsByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {actionItemsByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Upcoming Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Meetings */}
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-blue-600" />
                  Recent Meetings
                </CardTitle>
                <CardDescription>Your latest meeting summaries</CardDescription>
              </div>
              <Link to="/dashboard/meetings">
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowUpRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentMeetings.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No recent meetings</p>
              ) : (
                recentMeetings.map((meeting) => (
                  <Link
                    key={meeting.id}
                    to={`/dashboard/meetings/${meeting.id}`}
                    className="block p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {meeting.title}
                        </h3>
                        <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                          <span className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(meeting.createdAt || meeting.date).toLocaleDateString()}
                          </span>
                          {meeting.duration && (
                            <span className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {meeting.duration}m
                            </span>
                          )}
                        </div>
                      </div>
                      <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Action Items */}
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2 text-amber-600" />
                  Upcoming Actions
                </CardTitle>
                <CardDescription>Tasks that need your attention</CardDescription>
              </div>
              <Link to="/dashboard/action-items">
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowUpRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingActions.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No upcoming action items</p>
              ) : (
                upcomingActions.map((action) => (
                  <div
                    key={action.id}
                    className="p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{action.title || action.description}</h3>
                          {action.priority && (
                            <span
                              className={`text-xs px-2 py-1 rounded-full font-medium ${action.priority === 'high'
                                  ? 'bg-red-100 text-red-700'
                                  : action.priority === 'medium'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-blue-100 text-blue-700'
                                }`}
                            >
                              {action.priority}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                          {action.dueDate && (
                            <span className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              Due {new Date(action.dueDate).toLocaleDateString()}
                            </span>
                          )}
                          {action.assignee && (
                            <span className="flex items-center">
                              <Users className="w-4 h-4 mr-1" />
                              {action.assignee}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks to get you started</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/dashboard/upload">
              <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center gap-2 hover:bg-blue-50 hover:border-blue-300">
                <Plus className="w-6 h-6 text-blue-600" />
                <span className="text-sm font-medium">Upload Meeting</span>
              </Button>
            </Link>
            <Link to="/dashboard/meetings">
              <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center gap-2 hover:bg-green-50 hover:border-green-300">
                <FileText className="w-6 h-6 text-green-600" />
                <span className="text-sm font-medium">View Meetings</span>
              </Button>
            </Link>
            <Link to="/dashboard/action-items">
              <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center gap-2 hover:bg-purple-50 hover:border-purple-300">
                <CheckCircle2 className="w-6 h-6 text-purple-600" />
                <span className="text-sm font-medium">Action Items</span>
              </Button>
            </Link>
            <Link to="/dashboard/analytics">
              <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center gap-2 hover:bg-amber-50 hover:border-amber-300">
                <BarChart3 className="w-6 h-6 text-amber-600" />
                <span className="text-sm font-medium">Analytics</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardEnhanced;
