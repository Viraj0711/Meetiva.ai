import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Upload, ListTodo, BarChart3, Settings, LogOut, Calendar, Users } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/store/slices/authSlice';
import { Avatar } from '@/components/ui/Avatar';

const GRAD = '#5B3FD6';
const GRAD2 = '#8B5CF6';

const DOT_GRID: React.CSSProperties = {
  backgroundImage: 'radial-gradient(circle, rgba(91,63,214,0.08) 1.5px, transparent 1.5px)',
  backgroundSize: '26px 26px',
};

const NAV = [
  { id: 'home',       label: 'My Progress',   icon: Home,        path: '/dashboard' },
  { id: 'teams',      label: 'Teams',          icon: Users,       path: '/dashboard/teams' },
  { id: 'meetings',   label: 'My Meetings',    icon: FileText,    path: '/dashboard/meetings' },
  { id: 'minutes',    label: 'Minutes',        icon: ScrollText,  path: '/dashboard/minutes' },
  { id: 'actions',    label: 'Tasks',          icon: Target,      path: '/dashboard/tasks' },
  { id: 'analytics', label: 'Analytics',       icon: BarChart2,   path: '/dashboard/analytics' },
  { id: 'upload',     label: 'Upload',         icon: Upload,      path: '/dashboard/upload' },
  { id: 'workspaces', label: 'Workspaces',     icon: Layout,      path: '/dashboard/workspace' },
];

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const isManagerOrLead = useAppSelector(selectIsManagerOrLead);
  const [isExpanded, setIsExpanded] = useState(false);

  const baseNavigation = [
    { name: 'Home', href: '/dashboard', icon: Home },
    { name: 'Meetings', href: '/dashboard/meetings', icon: Calendar },
    { name: 'Upload', href: '/dashboard/upload', icon: Upload },
    { name: 'Action Items', href: '/dashboard/action-items', icon: ListTodo },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    { name: 'Teams', href: '/dashboard/teams', icon: Users },
  ];

  const managerNavigation = isManagerOrLead
    ? [...baseNavigation, { name: 'Team Report', href: '/dashboard/team-report', icon: Users }]
    : baseNavigation;

  const navigation = [...managerNavigation, { name: 'Settings', href: '/dashboard/settings', icon: Settings }];

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <aside
      className={cn(
        "hidden border-r border-border bg-card lg:block transition-all duration-300 ease-in-out",
        isExpanded ? "w-64" : "w-20"
      )}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className="flex h-full flex-col">
        <Link to="/dashboard" className="flex h-16 items-center border-b border-border px-6 overflow-hidden">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            {isExpanded && (
              <h1 className="bg-gradient-primary bg-clip-text text-xl font-bold text-transparent whitespace-nowrap animate-fade-in">
                Meetiva
              </h1>
            )}
          </div>
        </Link>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors relative group',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-[#F2F7FD] hover:text-[#2F80ED]'
                )}
                title={!isExpanded ? item.name : undefined}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {isExpanded && (
                  <span className="whitespace-nowrap animate-fade-in">{item.name}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-4">
          <Link 
            to="/dashboard/profile" 
            className={cn(
              "mb-3 flex items-center gap-3 overflow-hidden rounded-lg p-2 transition-colors",
              !isExpanded && "justify-center"
            )}
            title={!isExpanded ? "Profile" : undefined}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-primary font-semibold text-white flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            {isExpanded && (
              <div className="flex-1 overflow-hidden animate-fade-in">
                <p className="truncate text-sm font-medium">{user?.name || 'User'}</p>
                <p className="truncate text-xs text-muted-foreground">{user?.email || ''}</p>
              </div>
            )}
          </Link>
          <button
            onClick={handleLogout}
            className={cn(
              "flex w-full items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-accent",
              !isExpanded && "justify-center"
            )}
            title={!isExpanded ? "Logout" : undefined}
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {isExpanded && <span className="animate-fade-in">Logout</span>}
          </button>
        </div>
      </div>

      {/* Nav */}
      <nav className="relative flex-1 overflow-y-auto px-3 pb-3 space-y-0.5">
        {NAV.map((item) => (
          <button
            key={item.id}
            onClick={() => navTo(item.path)}
            className="relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer overflow-hidden"
            style={isActive(item.path)
              ? { background: 'rgba(91,63,214,0.08)', color: '#1D1B22', boxShadow: '0 1px 4px rgba(91,63,214,0.1), inset 0 1px 0 rgba(255,255,255,0.8)' }
              : { color: '#64607A' }}
            onMouseEnter={(e) => {
              if (!isActive(item.path)) (e.currentTarget as HTMLElement).style.background = 'rgba(91,63,214,0.04)';
            }}
            onMouseLeave={(e) => {
              if (!isActive(item.path)) (e.currentTarget as HTMLElement).style.background = 'transparent';
            }}
          >
            {isActive(item.path) && (
              <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full" style={{ background: GRAD }} />
            )}
            <item.icon size={15} style={{ color: isActive(item.path) ? GRAD : '#64607A' }} />
            <span style={{ color: isActive(item.path) ? '#1D1B22' : undefined, fontWeight: isActive(item.path) ? 600 : 500 }}>{item.label}</span>
          </button>
        ))}

        <div className="pt-3 mt-2 border-t border-[#E4E0F5]">
          <button
            onClick={() => navTo('/dashboard/settings')}
            className="relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer overflow-hidden"
            style={isActive('/dashboard/settings')
              ? { background: 'rgba(91,63,214,0.08)', color: '#1D1B22', boxShadow: '0 1px 4px rgba(91,63,214,0.1), inset 0 1px 0 rgba(255,255,255,0.8)' }
              : { color: '#64607A' }}
            onMouseEnter={(e) => {
              if (!isActive('/dashboard/settings')) (e.currentTarget as HTMLElement).style.background = 'rgba(91,63,214,0.04)';
            }}
            onMouseLeave={(e) => {
              if (!isActive('/dashboard/settings')) (e.currentTarget as HTMLElement).style.background = 'transparent';
            }}
          >
            {isActive('/dashboard/settings') && <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full" style={{ background: GRAD }} />}
            <Settings size={15} style={{ color: isActive('/dashboard/settings') ? GRAD : '#64607A' }} />
            <span style={{ color: isActive('/dashboard/settings') ? '#1D1B22' : undefined }}>Settings</span>
          </button>
        </div>
      </nav>

      {/* User footer */}
      <div className="relative p-4 border-t border-[#E4E0F5]">
        <div className="flex items-center gap-2.5 mb-3">
          <Avatar name={user?.name || 'User'} size="sm" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-[#1D1B22] truncate">{user?.name || 'User'}</div>
            <div className="text-[10px] text-[#64607A] truncate">{user?.email || ''}</div>
          </div>
        </div>
        <button
          onClick={() => dispatch(logout())}
          className="flex items-center gap-2 text-xs transition-colors"
          style={{ color: '#64607A' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = GRAD; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#64607A'; }}
        >
          <LogOut size={12} /> Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
