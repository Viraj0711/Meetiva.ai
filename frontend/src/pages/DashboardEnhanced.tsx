import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AreaChart, Area, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, CartesianGrid, XAxis, YAxis, Legend } from 'recharts';
import { ArrowRight, Calendar, Clock, Sparkles, Users, CheckCircle2, Activity, Plus, FileText, Zap } from 'lucide-react';
import { meetingService, actionItemService } from '@/services';
import { useSubscription } from '@/hooks/useAuth';
import { useAppDispatch } from '@/store/hooks';
import { addToast } from '@/store/slices/uiSlice';
import { Meeting, ActionItem } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

type StatCard = {
  label: string;
  value: string | number;
  icon: React.ElementType;
  note: string;
};

const statCards: StatCard[] = [
  { label: 'Total meetings', value: 0, icon: Calendar, note: 'tracked across your workspace' },
  { label: 'Completed tasks', value: 0, icon: CheckCircle2, note: 'resolved and synced' },
  { label: 'Avg. duration', value: '0m', icon: Clock, note: 'keeps meetings focused' },
  { label: 'Upcoming', value: 0, icon: Users, note: 'visible over the next 7 days' },
];

const DashboardEnhanced: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const { data: subscription } = useSubscription();
  const dispatch = useAppDispatch();
  const lastNudgedCount = useRef<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ── Upgrade nudge: show a toast when the user hits 1 remaining meeting ──
  // Resets on month boundary (when meetingCountThisMonth === 0) so users see
  // the nudge again each month they approach the limit.
  useEffect(() => {
    if (!subscription || subscription.isSubscribed) return;

    // Month reset — clear the ref so the nudge can fire again
    if (subscription.meetingCountThisMonth === 0) {
      lastNudgedCount.current = null;
      return;
    }

    if (subscription.meetingsRemaining === 1 && lastNudgedCount.current !== 1) {
      lastNudgedCount.current = 1;
      dispatch(
        addToast({
          type: 'warning',
          message: 'You have 1 meeting remaining this month. Upgrade to PRO for unlimited meetings.',
          duration: 8000,
        })
      );
    }
  }, [subscription, dispatch]);
  const [stats, setStats] = useState({ totalMeetings: 0, completedActions: 0, averageDuration: 0, upcomingMeetings: 0 });
  const [weeklyData, setWeeklyData] = useState<{ name: string; meetings: number; actions: number }[]>([]);
  const [actionItemsByStatus, setActionItemsByStatus] = useState<{ name: string; value: number; color: string }[]>([]);
  const [recentMeetings, setRecentMeetings] = useState<Meeting[]>([]);
  const [upcomingActions, setUpcomingActions] = useState<ActionItem[]>([]);
  const actionCount = upcomingActions.length;

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [meetingStats, meetings, actionItems] = await Promise.all([
          meetingService.getMeetingStats(),
          meetingService.getMeetings({ limit: 8 }),
          actionItemService.getActionItems({ limit: 120 }),
        ]);

        const items: ActionItem[] = actionItems.data || [];
        setStats({
          totalMeetings: meetingStats.total || 0,
          completedActions: items.filter((item: ActionItem) => item.status === 'completed').length,
          averageDuration: meetingStats.avgDuration || 0,
          upcomingMeetings: meetingStats.processingMeetings || 0,
        });

        setWeeklyData(meetingStats.trends?.map((t) => ({
          name: t.month,
          meetings: t.count,
          actions: 0,
        })) || []);

        const completed = items.filter((item: ActionItem) => item.status === 'completed').length;
        const inProgress = items.filter((item: ActionItem) => item.status === 'in_progress').length;
        const pending = items.filter((item: ActionItem) => item.status === 'pending').length;
        const overdue = items.filter((item: ActionItem) => item.dueDate && new Date(item.dueDate) < new Date() && item.status !== 'completed').length;

        setActionItemsByStatus([
          { name: 'Completed', value: completed, color: '#30d5f6' },
          { name: 'In progress', value: inProgress, color: '#7c5cff' },
          { name: 'Pending', value: pending, color: '#d4af37' },
          { name: 'Overdue', value: overdue, color: '#fb7185' },
        ]);

        setRecentMeetings((meetings.data || []).slice().sort((a: Meeting, b: Meeting) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 4));
        setUpcomingActions(items.filter((item: ActionItem) => item.status !== 'completed').sort((a: ActionItem, b: ActionItem) => {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }).slice(0, 4));
      } catch (err) {
        console.error(err);
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return <div className="flex min-h-[70vh] items-center justify-center"><div className="space-y-4 text-center"><div className="mx-auto h-16 w-16 animate-pulse rounded-[1.5rem] bg-gradient-primary shadow-[0_18px_40px_rgba(124,92,255,0.35)]" /><p className="text-sm uppercase tracking-[0.3em] text-white/45">Loading workspace</p></div></div>;
  }

  if (error) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Card className="max-w-md p-8 text-center"><p className="text-lg font-semibold text-white">Unable to load dashboard</p><p className="mt-2 text-sm text-white/60">{error}</p><Button className="mt-6">Retry</Button></Card></div>;
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="relative overflow-hidden rounded-[2.25rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(124,92,255,0.22),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(48,213,246,0.14),transparent_26%),rgba(255,255,255,0.03)] p-8 backdrop-blur-2xl lg:p-10">
          <div className="absolute right-[-6rem] top-[-5rem] h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="absolute bottom-[-5rem] left-[-4rem] h-52 w-52 rounded-full bg-purple-500/15 blur-3xl" />
          <div className="relative max-w-3xl space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300/80">
              <Sparkles className="h-3.5 w-3.5" /> Intelligent command center
            </div>
            <h1 className="font-display text-5xl font-bold tracking-tight text-white md:text-6xl">Your meeting intelligence is alive.</h1>
            <p className="max-w-2xl text-lg leading-8 text-white/60">Track summaries, action items, and calendar sync in a cinematic workspace designed to feel edited, not assembled.</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-white/40">
                  <Zap className="-mt-0.5 mr-1 inline h-3 w-3 text-cyan-300" />
                  Meetings left
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {!subscription ? (
                    <span className="text-white/30">—</span>
                  ) : subscription.isSubscribed ? (
                    <span className="text-cyan-300">Unlimited</span>
                  ) : (
                    <span className="text-cyan-300">{subscription.meetingsRemaining}</span>
                  )}
                </p>
                <p className="mt-1 text-xs text-white/40">
                  {!subscription ? 'Loading…' : subscription.isSubscribed ? `on ${subscription.tier}` : 'this month'}
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-white/40">Completion</p>
                <p className="mt-2 text-2xl font-semibold text-white">{stats.completedActions}</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-white/40">Open queue</p>
                <p className="mt-2 text-2xl font-semibold text-white">{actionCount}</p>
              </div>
            </div>
          </div>
          <div className="relative mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/dashboard/upload"><Button size="lg"><Plus className="mr-2 h-4 w-4" /> Upload meeting</Button></Link>
            <Link to="/dashboard/meetings"><Button size="lg" variant="outline">Open meetings</Button></Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <Card className="overflow-hidden p-6 lg:p-7">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-cyan-300/70">Live summary</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">What the workspace is doing</h2>
              </div>
              <Activity className="h-5 w-5 text-cyan-300" />
            </div>
            <div className="mt-5 space-y-3">
              {[
                ['AI summaries', 'auto-generated from new calls'],
                ['Action queue', 'priorities sorted by urgency'],
                ['Calendar sync', 'follow-ups pushed live'],
              ].map(([title, description]) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-sm font-medium text-white">{title}</p>
                  <p className="mt-1 text-sm text-white/50">{description}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="overflow-hidden p-6 lg:p-7">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-cyan-300/70">Top focus</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Current workstream</h2>
              </div>
              <FileText className="h-5 w-5 text-cyan-300" />
            </div>
            <div className="mt-5 space-y-3">
              {upcomingActions.slice(0, 3).map((action, index) => (
                <div key={action.id} className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-primary text-xs font-bold text-white">{index + 1}</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-white">{action.title}</p>
                    <p className="mt-1 text-sm text-white/50">{action.dueDate ? `Due ${new Date(action.dueDate).toLocaleDateString()}` : 'No due date set'}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map(({ label, icon: Icon, note }, index) => {
          const cardValue = [stats.totalMeetings, stats.completedActions, `${stats.averageDuration}m`, stats.upcomingMeetings][index];
          return (
            <motion.div key={label} whileHover={{ y: -6 }}>
              <Card className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-white/55">{label}</p>
                    <p className="mt-3 text-4xl font-bold tracking-tight text-white">{cardValue}</p>
                    <p className="mt-2 text-sm text-white/45">{note}</p>
                  </div>
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/[0.06] text-cyan-300"><Icon className="h-5 w-5" /></div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="p-6 lg:p-7">
          <div className="mb-5 flex items-center justify-between">
            <div><p className="text-xs uppercase tracking-[0.28em] text-cyan-300/70">Activity</p><h2 className="mt-2 text-2xl font-semibold text-white">Weekly meeting activity</h2></div>
            <Activity className="h-5 w-5 text-cyan-300" />
          </div>
          <div className="h-[340px]"><ResponsiveContainer width="100%" height="100%"><AreaChart data={weeklyData}><defs><linearGradient id="meetingsGlow" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7c5cff" stopOpacity={0.75} /><stop offset="100%" stopColor="#7c5cff" stopOpacity={0} /></linearGradient><linearGradient id="actionsGlow" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#30d5f6" stopOpacity={0.75} /><stop offset="100%" stopColor="#30d5f6" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" /><XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" /><YAxis stroke="rgba(255,255,255,0.5)" /><Tooltip contentStyle={{ backgroundColor: '#0b1020', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '16px', color: '#fff' }} /><Area type="monotone" dataKey="meetings" stroke="#7c5cff" fill="url(#meetingsGlow)" strokeWidth={3} /><Area type="monotone" dataKey="actions" stroke="#30d5f6" fill="url(#actionsGlow)" strokeWidth={3} /></AreaChart></ResponsiveContainer></div>
        </Card>
        <Card className="p-6 lg:p-7">
          <div className="mb-5"><p className="text-xs uppercase tracking-[0.28em] text-cyan-300/70">Status</p><h2 className="mt-2 text-2xl font-semibold text-white">Action item distribution</h2></div>
          <div className="h-[240px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={actionItemsByStatus} dataKey="value" cx="50%" cy="50%" innerRadius={60} outerRadius={96} paddingAngle={4}>{actionItemsByStatus.map((entry) => (<Cell key={entry.name} fill={entry.color} />))}</Pie><Tooltip contentStyle={{ backgroundColor: '#0b1020', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '16px', color: '#fff' }} /><Legend /></PieChart></ResponsiveContainer></div>
          <div className="mt-4 space-y-3">{actionItemsByStatus.map((item) => (<div key={item.name} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"><span className="text-sm text-white/70">{item.name}</span><span className="text-sm font-semibold text-white">{item.value}</span></div>))}</div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
        <Card className="p-6 lg:p-7">
          <div className="mb-5 flex items-center justify-between"><div><p className="text-xs uppercase tracking-[0.28em] text-cyan-300/70">Recent</p><h2 className="mt-2 text-2xl font-semibold text-white">Latest meetings</h2></div><Link to="/dashboard/meetings" className="text-sm text-cyan-300 transition hover:text-white">View all</Link></div>
          <div className="space-y-3">{recentMeetings.length === 0 ? <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-white/55">No meetings yet.</div> : recentMeetings.map((meeting, index) => (<div key={meeting.id} className={cn('flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4', index === 0 && 'bg-[linear-gradient(135deg,rgba(124,92,255,0.13),rgba(48,213,246,0.08))]')}><div><p className="font-medium text-white">{meeting.title}</p><p className="mt-1 text-sm text-white/45">{new Date(meeting.createdAt).toLocaleDateString()}</p></div><Link to={`/dashboard/meetings/${meeting.id}`} className="grid h-10 w-10 place-items-center rounded-full bg-white/[0.05] text-white/70 transition hover:bg-white/[0.1] hover:text-white"><ArrowRight className="h-4 w-4" /></Link></div>))}</div>
        </Card>
        <Card className="p-6 lg:p-7">
          <div className="mb-5 flex items-center justify-between"><div><p className="text-xs uppercase tracking-[0.28em] text-cyan-300/70">Queue</p><h2 className="mt-2 text-2xl font-semibold text-white">Upcoming tasks</h2></div><FileText className="h-5 w-5 text-cyan-300" /></div>
          <div className="space-y-3">{upcomingActions.length === 0 ? <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-white/55">No open tasks.</div> : upcomingActions.map((action) => (<div key={action.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><div className="flex items-start justify-between gap-4"><div><p className="font-medium text-white">{action.title}</p><p className="mt-1 text-sm text-white/45">{action.dueDate ? `Due ${new Date(action.dueDate).toLocaleDateString()}` : 'No due date'}</p></div><span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-200">{action.priority}</span></div></div>))}</div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardEnhanced;
