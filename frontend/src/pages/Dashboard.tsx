import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { meetingService, actionItemService } from '@/services';
import { Meeting, ActionItem } from '@/types';
import { formatDate } from '@/utils';

interface DashboardStats {
  totalMeetings: number;
  thisWeekMeetings: number;
  pendingActionItems: number;
  completedActionItems: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalMeetings: 0,
    thisWeekMeetings: 0,
    pendingActionItems: 0,
    completedActionItems: 0,
  });
  const [recentMeetings, setRecentMeetings] = useState<Meeting[]>([]);
  const [urgentActionItems, setUrgentActionItems] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const meetingsResponse = await meetingService.getMeetings({ page: 1, limit: 5 });
      setRecentMeetings(meetingsResponse.data || []);
      
      const actionItemsResponse = await actionItemService.getActionItems({ 
        page: 1, 
        limit: 5,
        status: 'pending'
      });
      setUrgentActionItems(actionItemsResponse.data || []);

      setStats({
        totalMeetings: meetingsResponse.total || 0,
        thisWeekMeetings: meetingsResponse.data?.length || 0,
        pendingActionItems: actionItemsResponse.total || 0,
        completedActionItems: 0,
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
      case 'urgent':
        return 'destructive';
      case 'medium':
        return 'secondary';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="mt-2 text-muted-foreground">
            Welcome back! Here's your meeting intelligence overview.
          </p>
        </div>
        <Link to="/dashboard/upload">
          <Button>Upload Meeting</Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Meetings</p>
              <p className="text-3xl font-bold mt-2">{stats.totalMeetings}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">This Week</p>
              <p className="text-3xl font-bold mt-2">{stats.thisWeekMeetings}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending Tasks</p>
              <p className="text-3xl font-bold mt-2">{stats.pendingActionItems}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Completed</p>
              <p className="text-3xl font-bold mt-2">{stats.completedActionItems}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Meetings */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Recent Meetings</h2>
            <Link to="/dashboard/meetings">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </div>
          <div className="space-y-4">
            {recentMeetings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No meetings yet</p>
                <Link to="/dashboard/upload">
                  <Button variant="outline" size="sm" className="mt-2">
                    Upload Your First Meeting
                  </Button>
                </Link>
              </div>
            ) : (
              recentMeetings.map((meeting) => (
                <Link 
                  key={meeting.id} 
                  to={`/dashboard/meetings/${meeting.id}`}
                  className="block"
                >
                  <div className="flex items-start justify-between p-4 rounded-lg border hover:bg-accent transition-colors">
                    <div className="flex-1">
                      <h3 className="font-semibold">{meeting.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatDate(meeting.createdAt)}
                      </p>
                      {meeting.duration && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Duration: {Math.round(meeting.duration / 60)} min
                        </p>
                      )}
                    </div>
                    <Badge variant={meeting.status === 'completed' ? 'default' : 'secondary'}>
                      {meeting.status}
                    </Badge>
                  </div>
                </Link>
              ))
            )}
          </div>
        </Card>

        {/* Urgent Action Items */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Urgent Action Items</h2>
            <Link to="/dashboard/action-items">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </div>
          <div className="space-y-4">
            {urgentActionItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No pending action items</p>
              </div>
            ) : (
              urgentActionItems.map((item) => (
                <div 
                  key={item.id} 
                  className="p-4 rounded-lg border hover:bg-accent transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{item.title}</h3>
                        {item.priority && (
                        <Badge variant={getPriorityColor(item.priority)}>
                            {item.priority}
                          </Badge>
                        )}
                      </div>
                      {item.assignee && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Assigned to: {item.assignee}
                        </p>
                      )}
                      {item.dueDate && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Due: {formatDate(item.dueDate)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Link to="/dashboard/upload">
            <Button variant="outline" className="w-full justify-start">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload New Meeting
            </Button>
          </Link>
          <Link to="/dashboard/meetings">
            <Button variant="outline" className="w-full justify-start">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Browse Meetings
            </Button>
          </Link>
          <Link to="/dashboard/analytics">
            <Button variant="outline" className="w-full justify-start">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              View Analytics
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
