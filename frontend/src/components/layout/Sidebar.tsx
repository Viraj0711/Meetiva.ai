import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Upload, ListTodo, BarChart3, Settings, LogOut, Calendar } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/store/slices/authSlice';
import { cn } from '@/lib/utils';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const [isExpanded, setIsExpanded] = useState(false);

  const navigation = [
    { name: 'Home', href: '/dashboard', icon: Home },
    { name: 'Meetings', href: '/dashboard/meetings', icon: Calendar },
    { name: 'Upload', href: '/dashboard/upload', icon: Upload },
    { name: 'Action Items', href: '/dashboard/action-items', icon: ListTodo },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

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
              <span className="text-white font-bold text-sm">P</span>
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
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
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
    </aside>
  );
};

export default Sidebar;
