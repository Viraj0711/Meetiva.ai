import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useAppSelector } from '@/store/hooks';
import { selectIsManagerOrLead } from '@/store/selectors/authSelectors';
import { actionItemService, meetingService } from '@/services';
import { ActionItem, Meeting, CreateActionItemRequest, MeetingPriority } from '@/types';
import { formatDate } from '@/utils';

const ActionItems: React.FC = () => {
  const isManagerOrLead = useAppSelector(selectIsManagerOrLead);
  const userId = useAppSelector((state) => state.auth.user?.id);

  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [showTeamItems, setShowTeamItems] = useState(false);
  const [currentPage] = useState(1);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);

  // ── Create action item modal ────────────────────────────────────────────
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loadingMeetings, setLoadingMeetings] = useState(false);
  const [createForm, setCreateForm] = useState({
    meetingId: '',
    title: '',
    description: '',
    assignee: '',
    dueDate: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
  });
  const [createError, setCreateError] = useState<string | null>(null);

  const loadActionItems = useCallback(async () => {
    try {
      setLoading(true);
      const response = await actionItemService.getActionItems({
        page: currentPage,
        limit: 20,
        status: filterStatus === 'all' ? undefined : filterStatus,
        priority: filterPriority === 'all' ? undefined : filterPriority,
      });
      setActionItems(response.data || []);
    } catch (error) {
      console.error('Failed to load action items:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filterStatus, filterPriority, showTeamItems]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard data-fetching pattern called from effect
    loadActionItems();
  }, [loadActionItems]);

  // Fetch meetings for the create modal meeting selector
  useEffect(() => {
    if (!showCreateModal) return;
    const fetchMeetings = async () => {
      try {
        setLoadingMeetings(true);
        const response = await meetingService.getMeetings({ limit: 100, status: 'completed' });
        setMeetings(response.data || []);
      } catch {
        setMeetings([]);
      } finally {
        setLoadingMeetings(false);
      }
    };
    fetchMeetings();
  }, [showCreateModal]);

  const handleCreateFormChange = (field: keyof typeof createForm, value: string) => {
    setCreateForm((prev) => ({ ...prev, [field]: value }));
    setCreateError(null);
  };

  const resetCreateForm = () => {
    setCreateForm({
      meetingId: '',
      title: '',
      description: '',
      assignee: '',
      dueDate: '',
      priority: 'medium',
    });
    setCreateError(null);
  };

  const handleCreateActionItem = async () => {
    if (!createForm.meetingId) {
      setCreateError('Please select a meeting.');
      return;
    }
    if (!createForm.title.trim()) {
      setCreateError('Title is required.');
      return;
    }

    try {
      setCreating(true);
      setCreateError(null);

      const data: CreateActionItemRequest = {
        meetingId: createForm.meetingId,
        title: createForm.title.trim(),
        description: createForm.description.trim() || undefined,
        assignee: createForm.assignee.trim() || undefined,
        dueDate: createForm.dueDate || undefined,
        priority: createForm.priority as MeetingPriority,
      };

      await actionItemService.createActionItem(data);
      setShowCreateModal(false);
      resetCreateForm();
      loadActionItems();
    } catch (error: unknown) {
      setCreateError(error instanceof Error ? error.message : 'Failed to create task.');
    } finally {
      setCreating(false);
    }
  };

  const handleCompleteTask = async (id: string) => {
    setSelectedTaskId(id);
    setShowCompleteDialog(true);
  };

  const confirmCompleteTask = async () => {
    if (!selectedTaskId) return;
    
    try {
      await actionItemService.completeActionItem(selectedTaskId);
      setShowCompleteDialog(false);
      setSelectedTaskId(null);
      loadActionItems();
    } catch (error) {
      console.error('Failed to complete task:', error);
    }
  };

  const filteredItems = actionItems.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayedItems = showTeamItems ? filteredItems : filteredItems.filter((item) => item.userId === userId);

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

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
      case 'urgent':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
      case 'medium':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const isOverdue = (dueDate?: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const groupedItems = {
    overdue: displayedItems.filter(item => item.status !== 'completed' && isOverdue(item.dueDate)),
    today: displayedItems.filter(item => {
      if (item.status === 'completed' || !item.dueDate) return false;
      const today = new Date().setHours(0, 0, 0, 0);
      const due = new Date(item.dueDate).setHours(0, 0, 0, 0);
      return due === today;
    }),
    upcoming: displayedItems.filter(item => {
      if (item.status === 'completed' || !item.dueDate) return false;
      const today = new Date().setHours(0, 0, 0, 0);
      const due = new Date(item.dueDate).setHours(0, 0, 0, 0);
      return due > today;
    }),
    noDueDate: displayedItems.filter(item => item.status !== 'completed' && !item.dueDate),
    completed: displayedItems.filter(item => item.status === 'completed'),
  };

  return (
    <div className="flex-1 overflow-y-auto"
      style={{ background: 'radial-gradient(ellipse 70% 50% at 15% 5%, rgba(91,63,214,0.07) 0%, transparent 55%),radial-gradient(ellipse 50% 40% at 90% 90%, rgba(244,114,182,0.05) 0%, transparent 55%),#FCFBFF' }}>
      <div className="max-w-5xl mx-auto p-7">
        <div className="space-y-6">
          <ConfirmDialog
        isOpen={showCompleteDialog}
        title="Mark Task as Complete?"
        message="Are you sure you want to mark this task as completed? This action can be undone from the completed tasks section."
        confirmText="Mark Complete"
        cancelText="Cancel"
        variant="info"
        onConfirm={confirmCompleteTask}
        onCancel={() => {
          setShowCompleteDialog(false);
          setSelectedTaskId(null);
        }}
      />

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => { if (!creating) { setShowCreateModal(false); resetCreateForm(); } }}>
          <div className="w-full max-w-lg mx-4 rounded-2xl border border-[#E4E0F5] bg-white shadow-2xl" onClick={(e) => e.stopPropagation()} style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 8px 32px rgba(91,63,214,0.12)' }}>
            <div className="flex items-center justify-between border-b border-[#E4E0F5] px-6 py-4">
              <h2 className="text-xl font-bold text-[#1D1B22]">Create Task</h2>
              <button
                className="text-[#64607A] hover:text-[#1D1B22] transition-colors"
                onClick={() => { setShowCreateModal(false); resetCreateForm(); }}
                disabled={creating}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4 px-6 py-5">
              {/* Error */}
              {createError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {createError}
                </div>
              )}

              {/* Meeting selector */}
              <div>
                <label className="block text-sm font-medium text-[#1D1B22] mb-1.5">
                  Meeting <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full rounded-xl border border-[#E4E0F5] bg-white px-4 py-2.5 text-sm text-[#1D1B22] outline-none transition-all focus:border-[#5B3FD6] focus:ring-2 focus:ring-[#5B3FD6]/20"
                  value={createForm.meetingId}
                  onChange={(e) => handleCreateFormChange('meetingId', e.target.value)}
                  disabled={creating}
                >
                  <option value="">{loadingMeetings ? 'Loading meetings...' : 'Select a meeting'}</option>
                  {meetings.map((m) => (
                    <option key={m.id} value={m.id}>{m.title}</option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-[#1D1B22] mb-1.5">
                  Title <span className="text-red-500">*</span>
                </label>
                <Input
                  value={createForm.title}
                  onChange={(e) => handleCreateFormChange('title', e.target.value)}
                  placeholder="What needs to be done?"
                  disabled={creating}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-[#1D1B22] mb-1.5">Description</label>
                <textarea
                  className="w-full min-h-[80px] rounded-xl border border-[#E4E0F5] bg-white px-4 py-2.5 text-sm text-[#1D1B22] outline-none transition-all focus:border-[#5B3FD6] focus:ring-2 focus:ring-[#5B3FD6]/20 resize-none placeholder:text-[#64607A]"
                  value={createForm.description}
                  onChange={(e) => handleCreateFormChange('description', e.target.value)}
                  placeholder="Optional details..."
                  disabled={creating}
                />
              </div>

              {/* Assignee + Due Date */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-[#1D1B22] mb-1.5">Assignee</label>
                  <Input
                    value={createForm.assignee}
                    onChange={(e) => handleCreateFormChange('assignee', e.target.value)}
                    placeholder="Person responsible"
                    disabled={creating}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1D1B22] mb-1.5">Due Date</label>
                  <Input
                    type="date"
                    value={createForm.dueDate}
                    onChange={(e) => handleCreateFormChange('dueDate', e.target.value)}
                    disabled={creating}
                  />
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-[#1D1B22] mb-1.5">Priority</label>
                <select
                  className="w-full rounded-xl border border-[#E4E0F5] bg-white px-4 py-2.5 text-sm text-[#1D1B22] outline-none transition-all focus:border-[#5B3FD6] focus:ring-2 focus:ring-[#5B3FD6]/20"
                  value={createForm.priority}
                  onChange={(e) => handleCreateFormChange('priority', e.target.value)}
                  disabled={creating}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 border-t border-[#E4E0F5] px-6 py-4">
              <Button variant="outline" className="rounded-full" onClick={() => { setShowCreateModal(false); resetCreateForm(); }} disabled={creating}>
                Cancel
              </Button>
              <Button className="rounded-full" onClick={handleCreateActionItem} isLoading={creating}>
                {creating ? 'Creating...' : 'Create Task'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tasks</h1>
          <p className="mt-2 text-muted-foreground">
            Track and manage all tasks extracted from your meetings
          </p>
        </div>
        <Button className="rounded-full" onClick={() => { resetCreateForm(); setShowCreateModal(true); }}>Create Task</Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex gap-2 items-center justify-between flex-wrap">
          <div className="flex gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Status</label>
              <select
                className="min-w-[140px] px-2 py-1 border rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Priority</label>
              <select
                className="min-w-[140px] px-2 py-1 border rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
              >
                <option value="all">All</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {/* Team Items Toggle (Managers/Leads Only) */}
          {isManagerOrLead && (
            <div className="flex gap-2">
              <button
                onClick={() => setShowTeamItems(false)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  !showTeamItems
                    ? 'bg-primary text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                My Items
              </button>
              <button
                onClick={() => setShowTeamItems(true)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  showTeamItems
                    ? 'bg-primary text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Team Items
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{displayedItems.length}</p>
            </div>
            <div className="w-10 h-10 text-cyan-300 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Overdue</p>
              <p className="text-2xl font-bold text-red-600">{groupedItems.overdue.length}</p>
            </div>
            <div className="w-10 h-10 bg-white/[0.03] rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">In Progress</p>
              <p className="text-2xl font-bold">{groupedItems.upcoming.length + groupedItems.today.length}</p>
            </div>
            <div className="w-10 h-10 bg-white/[0.03] rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold text-cyan-300">{groupedItems.completed.length}</p>
            </div>
            <div className="w-10 h-10 bg-white/[0.03] rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Search</label>
            <Input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Status</label>
            <select
              className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
              }}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Priority</label>
            <select
              className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
              value={filterPriority}
              onChange={(e) => {
                setFilterPriority(e.target.value);
              }}
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Action Items List */}
      {loading ? (
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Overdue */}
          {groupedItems.overdue.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 text-red-600 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Overdue ({groupedItems.overdue.length})
              </h2>
              <div className="space-y-3">
                {groupedItems.overdue.map((item) => (
                  <Card key={item.id} className="p-4 border-l-4 border-l-red-500">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{item.title}</h3>
                          {item.priority && (
                            <Badge variant={getPriorityColor(item.priority)}>
                              {getPriorityIcon(item.priority)}
                              <span className="ml-1">{item.priority}</span>
                            </Badge>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                        )}
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          {item.assignee && (
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              {item.assignee}
                            </span>
                          )}
                          {item.dueDate && (
                            <span className="flex items-center text-red-600">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {formatDate(item.dueDate)}
                            </span>
                          )}
                          {item.meetingId && (
                            <Link to={`/dashboard/meetings/${item.meetingId}`} className="flex items-center hover:text-primary">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                              </svg>
                              View Meeting
                            </Link>
                          )}
                        </div>
                      </div>
                      <Button size="sm" className="rounded-full" onClick={() => handleCompleteTask(item.id)}>
                        Complete
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Today */}
          {groupedItems.today.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Due Today ({groupedItems.today.length})
              </h2>
              <div className="space-y-3">
                {groupedItems.today.map((item) => (
                  <Card key={item.id} className="p-4 border-l-4 border-l-orange-500">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{item.title}</h3>
                          {item.priority && (
                            <Badge variant={getPriorityColor(item.priority)}>
                              {getPriorityIcon(item.priority)}
                              <span className="ml-1">{item.priority}</span>
                            </Badge>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                        )}
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          {item.assignee && (
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              {item.assignee}
                            </span>
                          )}
                          {item.meetingId && (
                            <Link to={`/dashboard/meetings/${item.meetingId}`} className="flex items-center hover:text-primary">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                              </svg>
                              View Meeting
                            </Link>
                          )}
                        </div>
                      </div>
                      <Button size="sm" className="rounded-full" onClick={() => handleCompleteTask(item.id)}>
                        Complete
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming */}
          {groupedItems.upcoming.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Upcoming ({groupedItems.upcoming.length})
              </h2>
              <div className="space-y-3">
                {groupedItems.upcoming.map((item) => (
                  <Card key={item.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{item.title}</h3>
                          {item.priority && (
                            <Badge variant={getPriorityColor(item.priority)}>
                              {getPriorityIcon(item.priority)}
                              <span className="ml-1">{item.priority}</span>
                            </Badge>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                        )}
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          {item.assignee && (
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              {item.assignee}
                            </span>
                          )}
                          {item.dueDate && (
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {formatDate(item.dueDate)}
                            </span>
                          )}
                          {item.meetingId && (
                            <Link to={`/dashboard/meetings/${item.meetingId}`} className="flex items-center hover:text-primary">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                              </svg>
                              View Meeting
                            </Link>
                          )}
                        </div>
                      </div>
                      <Button size="sm" className="rounded-full" onClick={() => handleCompleteTask(item.id)}>
                        Complete
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {filteredItems.length === 0 && (
            <Card className="p-12 text-center">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">No tasks found</h3>
              <p className="text-muted-foreground mb-4">
                Upload meetings to automatically extract tasks
              </p>
              <Link to="/dashboard/upload">
                <Button className="rounded-full">Upload Meeting</Button>
              </Link>
            </Card>
          )}
        </div>
      )}
        </div>
      </div>
    </div>
  );
};

export default ActionItems;


