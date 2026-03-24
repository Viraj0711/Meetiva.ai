import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAppSelector } from '@/store/hooks';
import { selectIsManagerOrLead, selectUserTeams } from '@/store/selectors/authSelectors';
import { meetingService, actionItemService } from '@/services';
import { Meeting, ActionItem, MeetingStats } from '@/types';
import { formatDate } from '@/utils';

interface TeamMemberStats {
  userId: string;
  name: string;
  totalMeetings: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  recentMeetings: Meeting[];
  recentTasks: ActionItem[];
}

const TeamReport: React.FC = () => {
  const isManagerOrLead = useAppSelector(selectIsManagerOrLead);
  const userTeams = useAppSelector(selectUserTeams);

  const [stats, setStats] = useState<MeetingStats | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isManagerOrLead) {
      setError('You do not have permission to view team reports. Only managers and leads can access this page.');
      setLoading(false);
      return;
    }

    loadTeamData();
  }, [isManagerOrLead]);

  const loadTeamData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch stats, meetings, and action items
      const [statsData, meetingsData, actionItemsData] = await Promise.all([
        meetingService.getMeetingStats(),
        meetingService.getMeetings({ limit: 100 }),
        actionItemService.getActionItems({ limit: 100 }),
      ]);

      setStats(statsData);
      setMeetings(meetingsData.data || []);
      setActionItems(actionItemsData.data || []);
    } catch (err) {
      console.error('Failed to load team data:', err);
      setError('Failed to load team report data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isManagerOrLead) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Team Report</h1>
        </div>
        <Card className="p-8 text-center">
          <p className="text-gray-600 dark:text-gray-300">
            You do not have permission to view team reports.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Only managers and project leads can access this page.
          </p>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  // Calculate team member statistics
  const teamMembersMap = new Map<string, TeamMemberStats>();

  meetings.forEach((meeting) => {
    const userId = meeting.userId;
    if (!teamMembersMap.has(userId)) {
      teamMembersMap.set(userId, {
        userId,
        name: meeting.userId, // Will be updated with actual name if available
        totalMeetings: 0,
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        inProgressTasks: 0,
        recentMeetings: [],
        recentTasks: [],
      });
    }

    const member = teamMembersMap.get(userId)!;
    member.totalMeetings += 1;
    if (member.recentMeetings.length < 3) {
      member.recentMeetings.push(meeting);
    }
  });

  actionItems.forEach((item) => {
    const userId = item.userId;
    if (!teamMembersMap.has(userId)) {
      teamMembersMap.set(userId, {
        userId,
        name: userId,
        totalMeetings: 0,
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        inProgressTasks: 0,
        recentMeetings: [],
        recentTasks: [],
      });
    }

    const member = teamMembersMap.get(userId)!;
    member.totalTasks += 1;

    if (item.status === 'completed') {
      member.completedTasks += 1;
    } else if (item.status === 'in_progress') {
      member.inProgressTasks += 1;
    } else if (item.status === 'pending') {
      member.pendingTasks += 1;
    }

    if (member.recentTasks.length < 3) {
      member.recentTasks.push(item);
    }
  });

  const teamMembers = Array.from(teamMembersMap.values()).sort(
    (a, b) => b.totalMeetings - a.totalMeetings || b.totalTasks - a.totalTasks
  );

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'in_progress':
        return 'secondary';
      case 'pending':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const completionRate = stats?.totalActionItems
    ? Math.round(
        ((stats.totalMeetings || 0) / (stats.totalActionItems || 1)) * 100
      )
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Team Report</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          View and monitor your team's work progress
        </p>
      </div>

      {error && (
        <Card className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </Card>
      )}

      {/* Team Statistics */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-6">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Meetings</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
              {stats.totalMeetings}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {stats.completedMeetings} completed
            </p>
          </Card>

          <Card className="p-6">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Team Members</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
              {teamMembers.length}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {userTeams.length} team(s)
            </p>
          </Card>

          <Card className="p-6">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Meeting Duration</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
              {stats.avgDuration}m
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Per meeting
            </p>
          </Card>

          <Card className="p-6">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Tasks/Meeting</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
              {stats.avgActionItems}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Action items per meeting
            </p>
          </Card>
        </div>
      )}

      {/* Top Participants */}
      {stats?.topParticipants && stats.topParticipants.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Top Participants
          </h2>
          <div className="space-y-3">
            {stats.topParticipants.map((participant, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-sm font-bold text-blue-900 dark:text-blue-100">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {participant.name}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {participant.meetingCount} meetings
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Team Members List */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Team Members Performance
        </h2>
        <div className="grid gap-6">
          {teamMembers.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-600 dark:text-gray-300">
                No team member data available yet.
              </p>
            </Card>
          ) : (
            teamMembers.map((member) => (
              <Card key={member.userId} className="p-6">
                {/* Member Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {member.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      ID: {member.userId}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {member.totalMeetings} meetings
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {member.totalTasks} tasks
                    </p>
                  </div>
                </div>

                {/* Task Status Overview */}
                <div className="grid gap-4 md:grid-cols-4 mb-4">
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Completed</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {member.completedTasks}
                    </p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                    <p className="text-xs text-gray-600 dark:text-gray-400">In Progress</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {member.inProgressTasks}
                    </p>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                      {member.pendingTasks}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900/20 rounded-lg p-3">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Completion Rate</p>
                    <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                      {member.totalTasks > 0
                        ? Math.round((member.completedTasks / member.totalTasks) * 100)
                        : 0}
                      %
                    </p>
                  </div>
                </div>

                {/* Recent Tasks */}
                {member.recentTasks.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                      Recent Tasks
                    </p>
                    <div className="space-y-2">
                      {member.recentTasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900 dark:text-gray-100 truncate">
                              {task.title}
                            </p>
                          </div>
                          <Badge variant={getTaskStatusColor(task.status)} className="ml-2 whitespace-nowrap">
                            {task.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Meetings */}
                {member.recentMeetings.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                      Recent Meetings
                    </p>
                    <div className="space-y-2">
                      {member.recentMeetings.map((meeting) => (
                        <div
                          key={meeting.id}
                          className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900 dark:text-gray-100 truncate">
                              {meeting.title}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(meeting.createdAt)}
                            </p>
                          </div>
                          <Badge variant="outline" className="ml-2 whitespace-nowrap">
                            {meeting.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamReport;
