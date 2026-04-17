import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { actionItemService, meetingService } from '@/services';
import { ActionItem } from '@/types';
import { CalendarCheck2, ListChecks, Timer, AlertTriangle, ArrowRight, Target } from 'lucide-react';

const isOpenStatus = (status: ActionItem['status']) => status === 'pending' || status === 'in_progress';

const MemberHome: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [meetingCount, setMeetingCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [actions, meetings] = await Promise.all([
          actionItemService.getActionItems({ limit: 200 }),
          meetingService.getMeetings({ limit: 200 }),
        ]);
        setActionItems(actions.data || []);
        setMeetingCount(meetings.total || meetings.data?.length || 0);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const today = new Date();
  const stats = useMemo(() => {
    const total = actionItems.length;
    const completed = actionItems.filter((item) => item.status === 'completed').length;
    const openItems = actionItems.filter((item) => isOpenStatus(item.status));
    const overdue = openItems.filter((item) => item.dueDate && new Date(item.dueDate) < today).length;
    const urgent = openItems.filter((item) => item.priority === 'high' || item.priority === 'urgent').length;

    return {
      total,
      completed,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      openItems: openItems.length,
      overdue,
      urgent,
    };
  }, [actionItems, today]);

  const upcoming = useMemo(() => {
    return actionItems
      .filter((item) => isOpenStatus(item.status) && item.dueDate)
      .sort((a, b) => new Date(a.dueDate || '').getTime() - new Date(b.dueDate || '').getTime())
      .slice(0, 6);
  }, [actionItems]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border text-emerald-800 bg-gradient-to-r text-emerald-800 via-white text-emerald-800 p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-800">Member Workspace</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">My Progress Overview</h1>
        <p className="mt-2 text-slate-600">This view is personal to you. Track your completion, urgency, and near-term deadlines.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Completed</p>
            <ListChecks className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">{stats.completed}</p>
          <p className="mt-1 text-sm text-slate-500">{stats.completionRate}% completion</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Open Items</p>
            <Target className="h-5 w-5 text-emerald-800" />
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">{stats.openItems}</p>
          <p className="mt-1 text-sm text-slate-500">in progress + pending</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Urgent Items</p>
            <Timer className="h-5 w-5 text-orange-600" />
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">{stats.urgent}</p>
          <p className="mt-1 text-sm text-slate-500">high + urgent priority</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Overdue</p>
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">{stats.overdue}</p>
          <p className="mt-1 text-sm text-slate-500">needs immediate follow-up</p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">My Upcoming Deadlines</h2>
            <Link to="/dashboard/action-items">
              <Button size="sm" variant="outline">Open Tasks</Button>
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {upcoming.length === 0 && <p className="text-sm text-slate-500">No upcoming deadlines.</p>}
            {upcoming.map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-200 p-3">
                <p className="font-medium text-slate-900">{item.title}</p>
                <p className="mt-1 text-sm text-slate-500">
                  Due {new Date(item.dueDate || '').toLocaleDateString()} • {item.priority}
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">My Workstream</h2>
            <CalendarCheck2 className="h-5 w-5 text-emerald-800" />
          </div>
          <div className="mt-4 space-y-3">
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-sm text-slate-500">Total meetings visible to you</p>
              <p className="text-2xl font-bold text-slate-900">{meetingCount}</p>
            </div>
            <Link to="/dashboard/meetings" className="inline-flex items-center text-sm font-medium text-emerald-800 text-emerald-800">
              View my meetings <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default MemberHome;


