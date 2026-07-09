import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Upload, ListTodo, BarChart3, Settings, LogOut, Calendar, Users, Grid2X2, ArrowUpRight, Crown } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useSubscription } from '@/hooks/useAuth';
import { logout } from '@/store/slices/authSlice';
import { selectIsManagerOrLead } from '@/store/selectors/authSelectors';
import { cn } from '@/lib/utils';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const isManagerOrLead = useAppSelector(selectIsManagerOrLead);
  const { data: subscription } = useSubscription();
  const [isExpanded, setIsExpanded] = useState(false);

  const memberNavigation = [
    { name: 'My Progress', href: '/dashboard', icon: Home },
    { name: 'Teams', href: '/dashboard/teams', icon: Users },
    { name: 'My Meetings', href: '/dashboard/meetings', icon: Calendar },
    { name: 'My Action Items', href: '/dashboard/action-items', icon: ListTodo },
    { name: 'Upload', href: '/dashboard/upload', icon: Upload },
    { name: 'Workspace', href: '/dashboard/workspace', icon: Grid2X2 },
    { name: 'Upgrade', href: '/dashboard/upgrade', icon: Crown },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  const leaderNavigation = [
    { name: 'Leader Home', href: '/dashboard', icon: Home },
    { name: 'Workspace', href: '/dashboard/workspace', icon: Grid2X2 },
    { name: 'Meetings', href: '/dashboard/meetings', icon: Calendar },
    { name: 'Upload', href: '/dashboard/upload', icon: Upload },
    { name: 'Action Items', href: '/dashboard/action-items', icon: ListTodo },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    { name: 'Teams', href: '/dashboard/teams', icon: Users },
    { name: 'Team Report', href: '/dashboard/team-report', icon: Users },
    { name: 'Upgrade', href: '/dashboard/upgrade', icon: Crown },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  const navigation = isManagerOrLead ? leaderNavigation : memberNavigation;

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <aside
      className={cn('hidden lg:block transition-all duration-300 ease-in-out', isExpanded ? 'w-72' : 'w-24')}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className="flex h-full flex-col border-r border-white/10 bg-[linear-gradient(180deg,rgba(8,12,24,0.96),rgba(7,10,18,0.99))] backdrop-blur-2xl shadow-[0_40px_120px_rgba(0,0,0,0.35)]">
        <div className="border-b border-white/10 px-5 py-5">
          <Link to="/dashboard" className="flex items-center overflow-hidden">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-primary shadow-[0_18px_40px_rgba(124,92,255,0.35)]">
                <span className="text-sm font-bold text-white">M</span>
                {/* Tier dot — visible in both collapsed and expanded modes */}
                {subscription && (
                  <span
                    className={`absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-[rgba(7,10,18,0.99)] ${
                      subscription.isSubscribed ? 'bg-cyan-400' : 'bg-amber-400'
                    }`}
                    title={subscription.isSubscribed ? 'PRO' : 'FREE'}
                  />
                )}
              </div>
              {isExpanded && (
                <div className="whitespace-nowrap">
                  <h1 className="text-xl font-semibold tracking-tight text-white">Meetiva</h1>
                  <p className="text-xs uppercase tracking-[0.28em] text-cyan-300/70">AI workspace</p>
                </div>
              )}
            </div>
          </Link>

          {isExpanded && (
            <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center gap-3">
                <div className={`grid h-10 w-10 place-items-center rounded-2xl ${
                  subscription?.isSubscribed
                    ? 'bg-gradient-to-br from-cyan-500/30 to-purple-500/20 text-cyan-300'
                    : 'bg-white/[0.06] text-amber-300'
                }`}>
                  <Crown className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs uppercase tracking-[0.26em] text-white/45">Plan</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                      subscription?.isSubscribed
                        ? 'bg-cyan-400/15 text-cyan-300'
                        : 'bg-amber-400/15 text-amber-300'
                    }`}>
                      {subscription ? subscription.tier : '…'}
                    </span>
                  </div>
                  <p className="truncate text-sm font-medium text-white">
                    {!subscription
                      ? 'Loading…'
                      : subscription.isSubscribed
                        ? 'Unlimited meetings'
                        : `${subscription.meetingsRemaining} meeting${subscription.meetingsRemaining === 1 ? '' : 's'} left`}
                  </p>
                </div>
              </div>
              {subscription && !subscription.isSubscribed && (
                <div className="mt-3">
                  <div className="flex h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="rounded-full bg-gradient-to-r from-amber-400 to-cyan-300 transition-all duration-500"
                      style={{
                        width: `${Math.max(0, Math.min(100, (subscription.meetingCountThisMonth / subscription.monthlyLimit) * 100))}%`,
                      }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-white/40">
                    <span>{subscription.meetingCountThisMonth} / {subscription.monthlyLimit} used</span>
                    <Link
                      to="/dashboard/upgrade"
                      className="text-cyan-300 transition hover:text-white"
                    >
                      Upgrade
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <nav className={cn('flex-1 space-y-1 py-5', isExpanded ? 'px-3' : 'flex flex-col items-center px-0')}>
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'group relative flex items-center rounded-2xl text-sm font-medium transition-all duration-300',
                  isExpanded ? 'gap-3 px-4 py-3' : 'h-11 w-11 justify-center p-0',
                  isActive ? 'bg-white/10 text-white ring-1 ring-white/10 shadow-[0_12px_30px_rgba(0,0,0,0.25)]' : 'text-white/55 hover:bg-white/[0.06] hover:text-white'
                )}
                title={!isExpanded ? item.name : undefined}
              >
                <Icon className={cn('h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110', isActive && 'text-cyan-300')} />
                {isExpanded && <span className="whitespace-nowrap">{item.name}</span>}
                {isActive && <span className="absolute inset-y-2 right-2 w-1 rounded-full bg-gradient-primary" />}
                {isExpanded && !isActive && <ArrowUpRight className="ml-auto h-4 w-4 text-white/25 opacity-0 transition group-hover:opacity-100" />}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-4">
          <Link
            to="/dashboard/profile"
            className={cn('mb-3 flex items-center gap-3 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-3 transition hover:bg-white/[0.07]', !isExpanded && 'justify-center')}
            title={!isExpanded ? 'Profile' : undefined}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-primary font-semibold text-white flex-shrink-0 shadow-[0_16px_35px_rgba(124,92,255,0.35)]">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            {isExpanded && (
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium text-white">{user?.name || 'User'}</p>
                <p className="truncate text-xs text-white/55">{user?.email || ''}</p>
              </div>
            )}
          </Link>
          <button
            onClick={handleLogout}
            className={cn('flex w-full items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm font-medium text-white/70 transition hover:bg-white/[0.06] hover:text-white', !isExpanded && 'justify-center')}
            title={!isExpanded ? 'Logout' : undefined}
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {isExpanded && <span>Logout</span>}
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
