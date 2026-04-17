import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { actionItemService } from '@/services';
import { getTeamMembers, getTeams } from '@/services/teams.service';
import { ActionItem } from '@/types';
import { AlertTriangle, CalendarClock, Gauge, ShieldCheck, Users, ArrowRight } from 'lucide-react';

interface MemberRollup {
  userId: string;
  name: string;
  total: number;
  completed: number;
  open: number;
  overdue: number;
  urgent: number;
  nextDeadline: string | null;
}

const isOpenStatus = (status: ActionItem['status']) => status === 'pending' || status === 'in_progress';

const urgencyLabel = (item: MemberRollup) => {
  if (item.overdue > 0 || item.urgent >= 3) return 'High';
  if (item.urgent > 0 || item.open >= 5) return 'Medium';
  return 'Low';
};

const LeaderHome: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [memberNameByUserId, setMemberNameByUserId] = useState<Record<string, string>>({});

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        const [actions, teamsResponse] = await Promise.all([
          actionItemService.getActionItems({ limit: 500 }),
          getTeams(),
        ]);

        const teams = teamsResponse.teams || [];
        const memberResponses = await Promise.all(teams.map((team) => getTeamMembers(team.id)));
        const map: Record<string, string> = {};

        memberResponses.forEach((result) => {
          (result.members || []).forEach((member) => {
            if (!map[member.userId]) {
              map[member.userId] = member.name || member.email;
            }
          });
        });

        setMemberNameByUserId(map);
        setActionItems(actions.data || []);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const today = new Date();

  const summary = useMemo(() => {
    const openItems = actionItems.filter((item) => isOpenStatus(item.status));
    const overdue = openItems.filter((item) => item.dueDate && new Date(item.dueDate) < today).length;
    const urgent = openItems.filter((item) => item.priority === 'high' || item.priority === 'urgent').length;

    return {
      totalMembers: Object.keys(memberNameByUserId).length,
      openItems: openItems.length,
      overdue,
      urgent,
    };
  }, [actionItems, memberNameByUserId, today]);

  const rollups = useMemo<MemberRollup[]>(() => {
    const byUser = new Map<string, MemberRollup>();

    actionItems.forEach((item) => {
      const userId = item.userId || item.assignee || 'unassigned';
      const name = memberNameByUserId[userId] || (item.assignee ? `Assignee: ${item.assignee}` : 'Unassigned');

      if (!byUser.has(userId)) {
        byUser.set(userId, {
          userId,
          name,
          total: 0,
          completed: 0,
          open: 0,
          overdue: 0,
          urgent: 0,
          nextDeadline: null,
        });
      }

      const rollup = byUser.get(userId)!;
      rollup.total += 1;

      if (item.status === 'completed') {
        rollup.completed += 1;
      }

      if (isOpenStatus(item.status)) {
        rollup.open += 1;
      }

      if (isOpenStatus(item.status) && item.dueDate && new Date(item.dueDate) < today) {
        rollup.overdue += 1;
      }

      if (isOpenStatus(item.status) && (item.priority === 'high' || item.priority === 'urgent')) {
        rollup.urgent += 1;
      }

      if (isOpenStatus(item.status) && item.dueDate) {
        if (!rollup.nextDeadline || new Date(item.dueDate) < new Date(rollup.nextDeadline)) {
          rollup.nextDeadline = item.dueDate;
        }
      }
    });

    return Array.from(byUser.values()).sort((a, b) => {
      if (b.overdue !== a.overdue) return b.overdue - a.overdue;
      if (b.urgent !== a.urgent) return b.urgent - a.urgent;
      return b.open - a.open;
    });
  }, [actionItems, memberNameByUserId, today]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-amber-100 bg-gradient-to-r from-amber-50 via-white to-rose-50 p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-amber-700">Leader Command Center</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Team Progress, Deadlines, and Urgency</h1>
        <p className="mt-2 text-slate-600">This leadership view combines member-level progress with deadline and urgency risk signals.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Visible Members</p>
            <Users className="h-5 w-5 text-indigo-600" />
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">{summary.totalMembers}</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Open Team Items</p>
            <Gauge className="h-5 w-5 text-emerald-800" />
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">{summary.openItems}</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Overdue Items</p>
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">{summary.overdue}</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Urgent Priority</p>
            <CalendarClock className="h-5 w-5 text-orange-600" />
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">{summary.urgent}</p>
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Member Progress Matrix</h2>
          <Link to="/dashboard/team-report">
            <Button variant="outline" size="sm">Detailed Report</Button>
          </Link>
        </div>
        <div className="mt-4 overflow-auto">
          <table className="w-full min-w-[760px] border-collapse">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="py-3 pr-4">Member</th>
                <th className="py-3 pr-4">Progress</th>
                <th className="py-3 pr-4">Open</th>
                <th className="py-3 pr-4">Overdue</th>
                <th className="py-3 pr-4">Urgent</th>
                <th className="py-3 pr-4">Next Deadline</th>
                <th className="py-3">Urgency</th>
              </tr>
            </thead>
            <tbody>
              {rollups.map((member) => {
                const pct = member.total > 0 ? Math.round((member.completed / member.total) * 100) : 0;
                return (
                  <tr key={member.userId} className="border-b text-sm">
                    <td className="py-3 pr-4 font-medium text-slate-900">{member.name}</td>
                    <td className="py-3 pr-4 text-slate-700">{member.completed}/{member.total} ({pct}%)</td>
                    <td className="py-3 pr-4 text-slate-700">{member.open}</td>
                    <td className="py-3 pr-4 text-slate-700">{member.overdue}</td>
                    <td className="py-3 pr-4 text-slate-700">{member.urgent}</td>
                    <td className="py-3 pr-4 text-slate-700">{member.nextDeadline ? new Date(member.nextDeadline).toLocaleDateString() : '-'}</td>
                    <td className="py-3">
                      <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {urgencyLabel(member)}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {rollups.length === 0 && (
                <tr>
                  <td className="py-6 text-sm text-slate-500" colSpan={7}>No member progress data found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="flex items-center gap-2 text-sm text-slate-600">
        <ShieldCheck className="h-4 w-4 text-emerald-600" />
        Members continue to see only their own progress view.
        <Link to="/dashboard/action-items" className="inline-flex items-center font-medium text-amber-700 hover:text-amber-800">
          Review team tasks <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </div>
    </div>
  );
};

export default LeaderHome;


