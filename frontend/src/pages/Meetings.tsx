import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAppSelector } from '@/store/hooks';
import { selectIsManagerOrLead } from '@/store/selectors/authSelectors';
import { useMeetings } from '@/hooks';
import { meetingService } from '@/services';
import { formatDate } from '@/utils';

const Meetings: React.FC = () => {
  const isManagerOrLead = useAppSelector(selectIsManagerOrLead);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showTeamMeetings, setShowTeamMeetings] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingMeetingId, setDeletingMeetingId] = useState<string | null>(null);

  const { data: meetingsResponse, isLoading } = useMeetings({
    page: currentPage,
    limit: 10,
    status: filterStatus === 'all' ? undefined : filterStatus,
  });

  const meetings = meetingsResponse?.data || [];
  const totalPages = meetingsResponse?.totalPages || 1;
  const myMeetings = userId ? meetings.filter((m) => m.userId === userId) : [];
  const displayedMeetings = showTeamMeetings ? meetings : myMeetings.length > 0 ? myMeetings : meetings;

  const filteredMeetings = displayedMeetings.filter((meeting) =>
    meeting.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'processing':
        return 'secondary';
      case 'failed':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const handleDeleteMeeting = async (meetingId: string, meetingTitle: string) => {
    const confirmed = window.confirm(`Delete \"${meetingTitle}\"? This action cannot be undone.`);
    if (!confirmed) {
      return;
    }

    try {
      setDeletingMeetingId(meetingId);
      await meetingService.deleteMeeting(meetingId);
      await queryClient.invalidateQueries({ queryKey: ['meetings'] });
    } catch (error) {
      console.error('Failed to delete meeting:', error);
      window.alert(error instanceof Error ? error.message : 'Failed to delete meeting. Please try again.');
    } finally {
      setDeletingMeetingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Meetings</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            View and manage all your meeting recordings and transcripts
          </p>
        </div>
        <Link to="/dashboard/upload">
          <Button>Upload Meeting</Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid gap-4 md:grid-cols-3">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Search</label>
            <Input
              type="text"
              placeholder="Search meetings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Status</label>
            <select
              className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">All Meetings</option>
              <option value="completed">Completed</option>
              <option value="processing">Processing</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Team Meetings Toggle (Managers/Leads Only) */}
          {isManagerOrLead && (
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">View</label>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowTeamMeetings(false);
                    setCurrentPage(1);
                  }}
                  className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    !showTeamMeetings
                      ? 'bg-primary text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  My Meetings
                </button>
                <button
                  onClick={() => {
                    setShowTeamMeetings(true);
                    setCurrentPage(1);
                  }}
                  className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    showTeamMeetings
                      ? 'bg-primary text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  Team Meetings
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Meetings List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredMeetings.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="mx-auto w-16 h-16 bg-gray-200 dark:bg-gray-700/50 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-500 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No meetings found</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {searchQuery ? 'Try adjusting your search' : 'Upload your first meeting to get started'}
          </p>
          {!searchQuery && (
            <Link to="/dashboard/upload">
              <Button>Upload Meeting</Button>
            </Link>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredMeetings.map((meeting) => (
            <Card key={meeting.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Link to={`/dashboard/meetings/${meeting.id}`}>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 hover:text-primary transition-colors">
                        {meeting.title}
                      </h3>
                    </Link>
                    <Badge variant={getStatusColor(meeting.status || 'pending')}>
                      {meeting.status || 'pending'}
                    </Badge>
                  </div>

                  <div className="grid gap-2 md:grid-cols-3 text-sm text-gray-600 dark:text-gray-300 mb-4">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatDate(meeting.createdAt)}
                    </div>
                    {meeting.duration && (
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {Math.round(meeting.duration / 60)} minutes
                      </div>
                    )}
                    {meeting.participants && meeting.participants.length > 0 && (
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {meeting.participants.length} participants
                      </div>
                    )}
                  </div>

                  {meeting.description && (
                    <p className="text-sm text-gray-300 line-clamp-2 mb-4">
                      {meeting.description}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <Link to={`/dashboard/meetings/${meeting.id}`}>
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteMeeting(meeting.id, meeting.title)}
                      disabled={deletingMeetingId === meeting.id}
                    >
                      {deletingMeetingId === meeting.id ? 'Deleting...' : 'Delete'}
                    </Button>
                    {meeting.status === 'completed' && (
                      <>
                        <Button size="sm" variant="ghost">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Export
                        </Button>
                        <Button size="sm" variant="ghost">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                          </svg>
                          Share
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {meeting.status === 'processing' && (
                  <div className="ml-4">
                    <LoadingSpinner size="sm" />
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? 'default' : 'outline'}
                onClick={() => setCurrentPage(page)}
                size="sm"
              >
                {page}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default Meetings;
