import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { meetingService, taskService } from '@/services';
import { Meeting, MeetingSummary, Transcript, Task, UpdateTaskRequest, MeetingPriority } from '@/types';
import { formatDate } from '@/utils';
import { getAccessToken } from '@/services/api.client';
import { API_BASE_URL } from '@/services/api.config';

const MeetingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [summary, setSummary] = useState<MeetingSummary | null>(null);
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'summary' | 'transcript' | 'actions' | 'minutes'>('summary');

  // Edit / Complete state
  const [editingItem, setEditingItem] = useState<Task | null>(null);
  const [editForm, setEditForm] = useState({
    title: '', description: '', assignee: '', dueDate: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    status: 'pending' as 'pending' | 'in_progress' | 'completed' | 'cancelled',
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (id) {
      loadMeetingDetails();
    }
  }, [id]);

  const loadMeetingDetails = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const [meetingData, summaryData, tasksData] = await Promise.all([
        meetingService.getMeetingById(id),
        meetingService.getMeetingSummary(id).catch(() => null),
        meetingService.getMeetingTasks(id).catch(() => []),
      ]);

      setMeeting(meetingData);
      setSummary(summaryData);
      setTasks(tasksData);

      const transcriptData = await meetingService.getMeetingTranscript(id).catch(() => null);
      setTranscript(transcriptData);
    } catch (error) {
      console.error('Failed to load meeting details:', error);
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

  // ── Edit handlers ────────────────────────────────────────────────────
  const handleEditTask = (item: Task) => {
    setEditingItem(item);
    setEditForm({
      title: item.title,
      description: item.description || '',
      assignee: item.assignee || '',
      dueDate: item.dueDate ? item.dueDate.slice(0, 10) : '',
      priority: (item.priority as 'low' | 'medium' | 'high' | 'urgent') || 'medium',
      status: item.status,
    });
  };

  const handleEditFormChange = (field: keyof typeof editForm, value: string) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    try {
      setSavingEdit(true);
      const data: UpdateTaskRequest = {
        title: editForm.title,
        description: editForm.description || undefined,
        assignee: editForm.assignee || undefined,
        dueDate: editForm.dueDate || undefined,
        priority: editForm.priority as MeetingPriority,
        status: editForm.status,
      };
      await taskService.updateTask(editingItem.id, data);
      setEditingItem(null);
      await loadMeetingDetails();
    } catch (error) {
      console.error('Failed to update task:', error);
    } finally {
      setSavingEdit(false);
    }
  };

  // ── Process handler (generate tasks/minutes) ─────────────────────────
  const processMeeting = async (mode: 'tasks' | 'minutes' | 'both') => {
    if (!id) return;
    try {
      setProcessing(true);
      const token = getAccessToken();
      const res = await fetch(`${API_BASE_URL}/meetings/${id}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ mode }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Processing failed');
      }
      await loadMeetingDetails();
    } catch (err) {
      console.error('Failed to process meeting:', err);
    } finally {
      setProcessing(false);
    }
  };

  // ── Complete handler ──────────────────────────────────────────────────
  const handleCompleteTask = async (itemId: string) => {
    try {
      setCompletingId(itemId);
      await taskService.completeTask(itemId);
      await loadMeetingDetails();
    } catch (error) {
      console.error('Failed to complete task:', error);
    } finally {
      setCompletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!meeting) {
    return (
      <Card className="p-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Meeting Not Found</h2>
        <p className="text-muted-foreground mb-4">The meeting you are looking for does not exist.</p>
        <Link to="/dashboard/meetings">
          <Button>Back to Meetings</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard/meetings')}
            className="mb-2"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Meetings
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{meeting.title}</h1>
            <Badge variant={meeting.status === 'completed' ? 'default' : 'secondary'}>
              {meeting.status}
            </Badge>
          </div>
          <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
            <span>{formatDate(meeting.createdAt)}</span>
            {meeting.duration && <span>&bull;</span>}
            {meeting.duration && <span>{Math.round(meeting.duration / 60)} minutes</span>}
            {meeting.participants && meeting.participants.length > 0 && <span>&bull;</span>}
            {meeting.participants && meeting.participants.length > 0 && (
              <span>{meeting.participants.length} participants</span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={async () => {
            const token = getAccessToken();
            try {
              const response = await fetch(`${API_BASE_URL}/meetings/${id}/minutes/export`, {
                headers: { 'Authorization': `Bearer ${token}` },
              });
              if (!response.ok) return;
              const blob = await response.blob();
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${meeting?.title || 'meeting'}_minutes.pdf`;
              a.click();
              URL.revokeObjectURL(url);
            } catch { /* ignore */ }
          }}>
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download PDF
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-4">
          <button
            className={`pb-3 px-1 font-medium border-b-2 transition-colors ${
              activeTab === 'summary'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('summary')}
          >
            Summary
          </button>
          <button
            className={`pb-3 px-1 font-medium border-b-2 transition-colors ${
              activeTab === 'transcript'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('transcript')}
          >
            Transcript
          </button>
          <button
            className={`pb-3 px-1 font-medium border-b-2 transition-colors ${
              activeTab === 'actions'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('actions')}
          >
            Tasks ({tasks.length})
          </button>
          <button
            className={`pb-3 px-1 font-medium border-b-2 transition-colors ${
              activeTab === 'minutes'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('minutes')}
          >
            Minutes
          </button>
        </div>
      </div>

      {/* Summary Tab */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          {summary ? (
            <Card className="p-6">
              {/* ponytail: render fullSummary as markdown if available, fall back to executiveSummary */}
              {summary.fullSummary ? (
                <div className="prose prose-invert max-w-none text-muted-foreground leading-relaxed">
                  {summary.fullSummary.split('\n').map((line: string, i: number) => {
                    if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold mt-6 mb-3 text-foreground">{line.slice(2)}</h1>;
                    if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold mt-5 mb-2 text-foreground">{line.slice(3)}</h2>;
                    if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-semibold mt-4 mb-2 text-foreground">{line.slice(4)}</h3>;
                    if (line.startsWith('| ') && line.includes('|')) {
                      // Simple table row rendering
                      const cells = line.split('|').filter((c: string) => c.trim()).map((c: string) => c.trim());
                      if (cells.every((c: string) => c.match(/^-+$/))) return null; // skip separator rows
                      return (
                        <div key={i} className="grid gap-2 py-1.5 border-b border-white/5 text-sm" style={{ gridTemplateColumns: `repeat(${cells.length}, 1fr)` }}>
                          {cells.map((cell: string, ci: number) => <span key={ci}>{cell}</span>)}
                        </div>
                      );
                    }
                    if (line.startsWith('- ')) return <li key={i} className="ml-4 list-disc">{line.slice(2)}</li>;
                    if (line.match(/^\d+\. /)) return <li key={i} className="ml-4 list-decimal">{line.replace(/^\d+\. /, '')}</li>;
                    if (line.trim() === '') return <div key={i} className="h-2" />;
                    return <p key={i} className="mb-1">{line}</p>;
                  })}
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold mb-4">Executive Summary</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      {summary.executiveSummary || 'No executive summary available yet.'}
                    </p>
                  </div>
                  {summary.keyPoints && summary.keyPoints.length > 0 && (
                    <div>
                      <h2 className="text-xl font-bold mb-4">Key Discussion Points</h2>
                      <ul className="space-y-3">
                        {summary.keyPoints.map((point: string, index: number) => (
                          <li key={index} className="flex items-start">
                            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold mr-3 flex-shrink-0 mt-0.5">
                              {index + 1}
                            </span>
                            <span className="text-muted-foreground">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {summary.decisions && summary.decisions.length > 0 && (
                    <div>
                      <h2 className="text-xl font-bold mb-4">Decisions Made</h2>
                      <ul className="space-y-3">
                        {summary.decisions.map((decision: string, index: number) => (
                          <li key={index} className="flex items-start p-4 bg-white/[0.03] rounded-lg border border-white/10">
                            <svg className="w-5 h-5 text-cyan-300 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-muted-foreground">{decision}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </Card>
          ) : (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">
                {meeting.status === 'processing'
                  ? 'Summary is being generated...'
                  : 'No summary available yet.'}
              </p>
            </Card>
          )}
        </div>
      )}

      {/* Transcript Tab */}
      {activeTab === 'transcript' && (
        <div className="space-y-4">
          {transcript && transcript.segments && transcript.segments.length > 0 ? (
            <Card className="p-6">
              <div className="space-y-4">
                {transcript.segments.map((segment, index) => (
                  <div key={index} className="flex gap-4">
                    <span className="text-sm text-muted-foreground font-mono min-w-[80px]">
                      {new Date(segment.startTime * 1000).toISOString().substr(11, 8)}
                    </span>
                    <div className="flex-1">
                      {segment.speaker && (
                        <span className="font-semibold text-primary mr-2">
                          {segment.speaker}:
                        </span>
                      )}
                      <span className="text-muted-foreground">{segment.text}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ) : transcript?.fullText ? (
            <Card className="p-6">
              <pre className="whitespace-pre-wrap text-sm text-muted-foreground font-sans leading-relaxed">
                {transcript.fullText}
              </pre>
            </Card>
          ) : (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">
                {meeting.status === 'processing'
                  ? 'Transcript is being generated...'
                  : 'No transcript available yet.'}
              </p>
            </Card>
          )}
        </div>
      )}

      {/* Minutes Tab */}
      {activeTab === 'minutes' && (
        <div className="space-y-6">
          {summary?.minutesContent ? (
            <Card className="p-6">
              <div className="prose prose-invert max-w-none text-muted-foreground leading-relaxed">
                {summary.minutesContent.split('\n').map((line: string, i: number) => {
                  if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold mt-6 mb-3 text-foreground">{line.slice(2)}</h1>;
                  if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold mt-5 mb-2 text-foreground">{line.slice(3)}</h2>;
                  if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-semibold mt-4 mb-2 text-foreground">{line.slice(4)}</h3>;
                  if (line.startsWith('- ')) return <li key={i} className="ml-4 list-disc">{line.slice(2)}</li>;
                  if (line.match(/^\d+\. /)) return <li key={i} className="ml-4 list-decimal">{line.replace(/^\d+\. /, '')}</li>;
                  if (line.trim() === '') return <div key={i} className="h-2" />;
                  return <p key={i} className="mb-1">{line}</p>;
                })}
              </div>
            </Card>
          ) : (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground mb-4">No minutes generated yet.</p>
              <Button onClick={() => processMeeting('minutes')} disabled={processing}>
                {processing ? 'Generating...' : 'Generate Minutes'}
              </Button>
            </Card>
          )}
        </div>
      )}

      {/* Tasks Tab */}
      {activeTab === 'actions' && (
        <div className="space-y-4">
          {/* Inline Edit Form */}
          {editingItem && (
            <Card className="p-6 border-2 border-primary/30">
              <h3 className="text-lg font-bold mb-4">Edit Task</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <Input
                    value={editForm.title}
                    onChange={(e) => handleEditFormChange('title', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    className="w-full px-3 py-2 border border-white/10 rounded-md bg-white/[0.04] text-white resize-none"
                    rows={2}
                    value={editForm.description}
                    onChange={(e) => handleEditFormChange('description', e.target.value)}
                  />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium mb-1">Assignee</label>
                    <Input
                      value={editForm.assignee}
                      onChange={(e) => handleEditFormChange('assignee', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Due Date</label>
                    <Input
                      type="date"
                      value={editForm.dueDate}
                      onChange={(e) => handleEditFormChange('dueDate', e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium mb-1">Priority</label>
                    <select
                      className="w-full px-3 py-2 border border-white/10 rounded-md bg-white/[0.04] text-white"
                      value={editForm.priority}
                      onChange={(e) => handleEditFormChange('priority', e.target.value)}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select
                      className="w-full px-3 py-2 border border-white/10 rounded-md bg-white/[0.04] text-white"
                      value={editForm.status}
                      onChange={(e) => handleEditFormChange('status', e.target.value)}
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setEditingItem(null)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSaveEdit} disabled={savingEdit}>
                    {savingEdit ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {tasks.length > 0 ? (
            tasks.map((item) => (
              <Card key={item.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{item.title}</h3>
                      {item.priority && (
                        <Badge variant={getPriorityColor(item.priority)}>
                          {item.priority}
                        </Badge>
                      )}
                      <Badge variant={item.status === 'completed' ? 'default' : 'secondary'}>
                        {item.status}
                      </Badge>
                    </div>
                    {item.description && (
                      <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                    )}
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      {item.assignee && (
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {item.assignee}
                        </div>
                      )}
                      {item.dueDate && (
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {formatDate(item.dueDate)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditTask(item)}
                    >
                      Edit
                    </Button>
                    {item.status !== 'completed' && (
                      <Button
                        size="sm"
                        onClick={() => handleCompleteTask(item.id)}
                        disabled={completingId === item.id}
                      >
                        {completingId === item.id ? 'Completing...' : 'Mark Complete'}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground mb-4">
                {meeting.status === 'processing'
                  ? 'Tasks are being extracted...'
                  : 'No tasks found in this meeting.'}
              </p>
              {meeting.status !== 'processing' && (
                <Button onClick={() => processMeeting('tasks')} disabled={processing}>
                  {processing ? 'Extracting...' : 'Extract Tasks'}
                </Button>
              )}
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default MeetingDetail;
