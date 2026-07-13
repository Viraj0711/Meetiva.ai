import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, Calendar, Clock, TrendingUp } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
  LoadingSpinner,
} from '@/components/ui';
import EmptyState from '@/components/EmptyState';
import { useMeetings, useMeetingStats } from '@/hooks';
import { formatRelativeTime, getStatusColor, getStatusLabel } from '@/utils';

const DashboardPage: React.FC = () => {
  const { data: meetingsData, isLoading: meetingsLoading } = useMeetings({ limit: 5 });
  const { data: stats, isLoading: statsLoading } = useMeetingStats();

  const isLoading = meetingsLoading || statsLoading;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your meeting overview.</p>
        </div>
        <Link to="/upload">
          <Button>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            New Meeting
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <LoadingSpinner size="lg" className="py-12" />
      ) : (
        <>
          {/* Stats Grid */}
          <div className="mb-8 grid gap-6 md:grid-cols-3">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Meetings</p>
                    <p className="mt-2 text-3xl font-bold">{stats?.totalMeetings || 0}</p>
                  </div>
                  <Calendar className="h-10 w-10 text-primary" aria-hidden="true" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Completed</p>
                    <p className="mt-2 text-3xl font-bold">{stats?.completedMeetings || 0}</p>
                  </div>
                  <TrendingUp className="h-10 w-10 text-green-600" aria-hidden="true" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg. Duration</p>
                    <p className="mt-2 text-3xl font-bold">
                      {stats?.averageDuration ? `${Math.round(stats.averageDuration / 60)}m` : '0m'}
                    </p>
                  </div>
                  <Clock className="h-10 w-10 text-blue-600" aria-hidden="true" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Meetings */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Meetings</CardTitle>
              <CardDescription>Your latest meeting recordings and analyses</CardDescription>
            </CardHeader>
            <CardContent>
              {!meetingsData?.data || meetingsData.data.length === 0 ? (
                <EmptyState
                  title="No meetings yet"
                  description="Upload your first meeting recording to get started"
                  action={
                    <Link to="/upload">
                      <Button>
                        <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                        Upload Meeting
                      </Button>
                    </Link>
                  }
                />
              ) : (
                <div className="space-y-4">
                  {meetingsData.data.map((meeting) => (
                    <Link
                      key={meeting.id}
                      to={`/meetings/${meeting.id}`}
                      className="block rounded-lg border border-border p-4 transition-colors hover:bg-accent"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold">{meeting.title}</h3>
                          {meeting.description && (
                            <p className="mt-1 text-sm text-muted-foreground">
                              {meeting.description}
                            </p>
                          )}
                          <p className="mt-2 text-xs text-muted-foreground">
                            {formatRelativeTime(meeting.createdAt)}
                          </p>
                        </div>
                        <Badge className={getStatusColor(meeting.status)}>
                          {getStatusLabel(meeting.status)}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default DashboardPage;
