import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAppSelector } from '@/store/hooks';
import { selectIsManagerOrLead } from '@/store/selectors/authSelectors';
import { meetingService, actionItemService } from '@/services';
import { getTeamChatStats } from '@/services/teams.service';

interface AnalyticsData {
  meetingTrends: {
    month: string;
    count: number;
  }[];
  actionItemStats: {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
  };
  productivityMetrics: {
    avgMeetingDuration: number;
    avgActionItemsPerMeeting: number;
    completionRate: number;
  };
  topParticipants: {
    name: string;
    meetingCount: number;
  }[];
  teamFollowUpChat: {
    totalMessages: number;
    followUpsLast7Days: number;
    dailyTrend: Array<{ date: string; count: number }>;
    teamStats: Array<{
      teamId: string;
      teamName: string;
      messageCount: number;
      activeParticipants: number;
      lastMessageAt: string | null;
    }>;
  };
}

const Analytics: React.FC = () => {
  const isManagerOrLead = useAppSelector(selectIsManagerOrLead);

  const [analytics, setAnalytics] = useState<AnalyticsData>({
    meetingTrends: [],
    actionItemStats: {
      total: 0,
      completed: 0,
      pending: 0,
      overdue: 0,
    },
    productivityMetrics: {
      avgMeetingDuration: 0,
      avgActionItemsPerMeeting: 0,
      completionRate: 0,
    },
    topParticipants: [],
    teamFollowUpChat: {
      totalMessages: 0,
      followUpsLast7Days: 0,
      dailyTrend: [],
      teamStats: [],
    },
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [showTeamAnalytics, setShowTeamAnalytics] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange, showTeamAnalytics]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      const [meetingStats, actionItems, chatStats] = await Promise.all([
        meetingService.getMeetingStats(),
        actionItemService.getActionItems({ limit: 1000 }),
        getTeamChatStats(timeRange),
      ]);

      const totalActions = actionItems.data?.length || 0;
      const completedActions = actionItems.data?.filter(item => item.status === 'completed').length || 0;
      const pendingActions = actionItems.data?.filter(item => item.status === 'pending' || item.status === 'in_progress').length || 0;
      const overdueActions = actionItems.data?.filter(item => 
        item.dueDate && new Date(item.dueDate) < new Date() && item.status !== 'completed'
      ).length || 0;
      
      const realData: AnalyticsData = {
        meetingTrends: meetingStats.trends || [],
        actionItemStats: {
          total: totalActions,
          completed: completedActions,
          pending: pendingActions,
          overdue: overdueActions,
        },
        productivityMetrics: {
          avgMeetingDuration: meetingStats.avgDuration || 0,
          avgActionItemsPerMeeting: meetingStats.avgActionItems || 0,
          completionRate: totalActions > 0 ? (completedActions / totalActions) * 100 : 0,
        },
        topParticipants: meetingStats.topParticipants || [],
        teamFollowUpChat: {
          totalMessages: chatStats.totalMessages || 0,
          followUpsLast7Days: chatStats.followUpsLast7Days || 0,
          dailyTrend: chatStats.dailyTrend || [],
          teamStats: chatStats.teamStats || [],
        },
      };
      
      setAnalytics(realData);
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setAnalytics({
        meetingTrends: [],
        actionItemStats: {
          total: 0,
          completed: 0,
          pending: 0,
          overdue: 0,
        },
        productivityMetrics: {
          avgMeetingDuration: 0,
          avgActionItemsPerMeeting: 0,
          completionRate: 0,
        },
        topParticipants: [],
        teamFollowUpChat: {
          totalMessages: 0,
          followUpsLast7Days: 0,
          dailyTrend: [],
          teamStats: [],
        },
      });
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

  const maxCount = analytics.meetingTrends.length > 0 
    ? Math.max(...analytics.meetingTrends.map(t => t.count))
    : 1;

  const hasNoData = analytics.actionItemStats.total === 0 && analytics.meetingTrends.length === 0;

  return (
    <div className="space-y-6">
      {/* Empty State Banner */}
      {hasNoData && (
        <Card className="p-6 text-emerald-800 dark:text-emerald-800 text-emerald-800">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-emerald-800 dark:text-emerald-800 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-gray-100">No Data Yet</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Upload your first meeting to start seeing analytics and insights about your meetings and action items.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Analytics</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Insights and trends from your meetings and action items
          </p>
        </div>
        <div className="flex gap-2 items-center">
          {isManagerOrLead && (
            <div className="flex gap-2">
              <button
                onClick={() => setShowTeamAnalytics(false)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  !showTeamAnalytics
                    ? 'bg-primary text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                My Analytics
              </button>
              <button
                onClick={() => setShowTeamAnalytics(true)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  showTeamAnalytics
                    ? 'bg-primary text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Team Analytics
              </button>
            </div>
          )}
          <select
            className="min-w-[150px] px-3 py-2 border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
          </select>
          <Button variant="outline" className="hover:bg-[text-emerald-800] hover:text-white hover:border-[text-emerald-800] transition-colors">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-600 dark:text-gray-300">Avg. Meeting Duration</h3>
            <div className="w-10 h-10 text-emerald-800 dark:text-emerald-800 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-800 dark:text-emerald-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold">{analytics.productivityMetrics.avgMeetingDuration} min</p>
          <p className="text-sm text-green-600 mt-2">? 5% from last period</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-600 dark:text-gray-300">Tasks per Meeting</h3>
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold">{analytics.productivityMetrics.avgActionItemsPerMeeting}</p>
          <p className="text-sm text-green-600 mt-2">? 12% from last period</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-600 dark:text-gray-300">Completion Rate</h3>
            <div className="w-10 h-10 bg-green-100 dark:bg-green-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold">{analytics.productivityMetrics.completionRate}%</p>
          <p className="text-sm text-green-600 mt-2">? 8% from last period</p>
        </Card>

        <Card className="p-6 md:col-span-3 lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-600 dark:text-gray-300">Team Follow-ups (7d)</h3>
            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-4 4v-4z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold">{analytics.teamFollowUpChat.followUpsLast7Days}</p>
          <p className="text-sm text-muted-foreground mt-2">
            {analytics.teamFollowUpChat.totalMessages} total follow-up messages
          </p>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Meeting Trends */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">Meeting Trends</h2>
          {analytics.meetingTrends.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700/50 rounded-full flex items-center justify-center mb-3">
                <svg className="w-8 h-8 text-gray-500 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-gray-900 dark:text-gray-100 font-medium">No meeting data yet</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Upload meetings to see trends</p>
            </div>
          ) : (
            <div className="space-y-4">
              {analytics.meetingTrends.map((trend, index) => (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-gray-900 dark:text-gray-100">{trend.month}</span>
                    <span className="text-gray-600 dark:text-gray-300">{trend.count} meetings</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-primary h-3 rounded-full transition-all"
                      style={{ width: `${(trend.count / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Action Item Distribution */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">Action Item Distribution</h2>
          <div className="space-y-6">
            <div className="flex items-center justify-center h-48">
              <div className="relative w-48 h-48">
                <svg viewBox="0 0 100 100" className="transform -rotate-90">
                  {/* Completed */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="20"
                    strokeDasharray={`${(analytics.actionItemStats.completed / analytics.actionItemStats.total) * 251.2} 251.2`}
                  />
                  {/* Pending */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="20"
                    strokeDasharray={`${(analytics.actionItemStats.pending / analytics.actionItemStats.total) * 251.2} 251.2`}
                    strokeDashoffset={`-${(analytics.actionItemStats.completed / analytics.actionItemStats.total) * 251.2}`}
                  />
                  {/* Overdue */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="20"
                    strokeDasharray={`${(analytics.actionItemStats.overdue / analytics.actionItemStats.total) * 251.2} 251.2`}
                    strokeDashoffset={`-${((analytics.actionItemStats.completed + analytics.actionItemStats.pending) / analytics.actionItemStats.total) * 251.2}`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-3xl font-bold">{analytics.actionItemStats.total}</p>
                  <p className="text-sm text-muted-foreground">Total Tasks</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2" />
                  <span className="text-sm font-medium">Completed</span>
                </div>
                <p className="text-2xl font-bold">{analytics.actionItemStats.completed}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <div className="w-3 h-3 bg-orange-500 rounded-full mr-2" />
                  <span className="text-sm font-medium">Pending</span>
                </div>
                <p className="text-2xl font-bold">{analytics.actionItemStats.pending}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2" />
                  <span className="text-sm font-medium">Overdue</span>
                </div>
                <p className="text-2xl font-bold">{analytics.actionItemStats.overdue}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Top Participants */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">Top Participants</h2>
        {analytics.topParticipants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700/50 rounded-full flex items-center justify-center mb-3">
              <svg className="w-8 h-8 text-gray-500 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-gray-900 dark:text-gray-100 font-medium">No participants yet</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">Upload meetings to see top participants</p>
          </div>
        ) : (
          <div className="space-y-4">
            {analytics.topParticipants.map((participant, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center flex-1">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                    <span className="font-semibold text-primary">
                      {participant.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{participant.name}</p>
                    <div className="flex items-center mt-1">
                      <div className="flex-1 max-w-xs bg-gray-200 rounded-full h-2 mr-3">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${(participant.meetingCount / analytics.topParticipants[0].meetingCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <span className="text-lg font-bold text-muted-foreground">{participant.meetingCount}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Team Follow-up Chat Analytics */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Team Follow-up Activity</h2>
          <span className="text-sm text-muted-foreground">Collaboration signals from team chat</span>
        </div>

        {analytics.teamFollowUpChat.dailyTrend.length === 0 && analytics.teamFollowUpChat.teamStats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-14 h-14 rounded-full bg-gray-200 dark:bg-gray-700/50 flex items-center justify-center mb-3">
              <svg className="w-7 h-7 text-gray-500 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-4 4v-4z" />
              </svg>
            </div>
            <p className="font-medium text-gray-900 dark:text-gray-100">No follow-up activity yet</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">Use team chat to track project follow-ups.</p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">Daily Follow-up Trend</h3>
              <div className="space-y-3">
                {analytics.teamFollowUpChat.dailyTrend.map((point) => {
                  const maxTrendCount = Math.max(...analytics.teamFollowUpChat.dailyTrend.map((entry) => entry.count), 1);
                  return (
                    <div key={point.date}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{new Date(point.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                        <span className="text-muted-foreground">{point.count}</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                        <div
                          className="h-2.5 rounded-full bg-indigo-500"
                          style={{ width: `${(point.count / maxTrendCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">By Team</h3>
              <div className="space-y-3">
                {analytics.teamFollowUpChat.teamStats
                  .slice()
                  .sort((a, b) => b.messageCount - a.messageCount)
                  .map((team) => (
                    <div key={team.teamId} className="rounded-lg border p-3 bg-white dark:bg-gray-800/40">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{team.teamName}</p>
                        <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-300">{team.messageCount} msgs</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {team.activeParticipants} active participants
                        {team.lastMessageAt ? ` • Last follow-up ${new Date(team.lastMessageAt).toLocaleString()}` : ''}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Insights */}
      {!hasNoData && (
        <Card className="p-6 bg-gradient-to-br from-purple-900/20 text-emerald-800">
          <h2 className="text-xl font-bold text-gray-100 mb-4">Key Insights</h2>
          <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-start">
            <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center mr-3 flex-shrink-0">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-100">Strong Completion Rate</p>
              <p className="text-sm text-gray-300">
                Your team completed 68% of action items, above the 60% average
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="w-8 h-8 rounded-lg text-emerald-800 flex items-center justify-center mr-3 flex-shrink-0">
              <svg className="w-5 h-5 text-emerald-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-100">Efficient Meetings</p>
              <p className="text-sm text-gray-300">
                Average meeting duration decreased by 5 minutes this month
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center mr-3 flex-shrink-0">
              <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-100">Watch Overdue Tasks</p>
              <p className="text-sm text-gray-300">
                12 tasks are overdue - consider reassigning or extending deadlines
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center mr-3 flex-shrink-0">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-100">High Engagement</p>
              <p className="text-sm text-gray-300">
                Top 5 participants attended 63% of all meetings
              </p>
            </div>
          </div>
        </div>
        </Card>
      )}
    </div>
  );
};

export default Analytics;


