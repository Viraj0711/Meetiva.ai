import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Home, Upload, ListTodo, BarChart3, Settings, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/store/slices/authSlice';
import { Button } from '@/components/ui';

const Layout: React.FC = () => {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Upload', href: '/upload', icon: Upload },
    { name: 'Action Items', href: '/action-items', icon: ListTodo },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Integrations', href: '/integrations', icon: Settings },
  ];

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <div className="flex h-screen bg-[var(--bg-hex)] text-[var(--muted-hex)]">
      {/* Sidebar */}
      <aside className="w-72 border-r border-[rgba(255,255,255,0.04)] bg-[rgba(255,255,255,0.02)]">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-20 items-center border-b border-[rgba(255,255,255,0.04)] px-6">
            <h1 className="text-2xl font-extrabold text-white" style={{ fontFamily: 'Clash Display, system-ui' }}>Meetiva</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2 px-4 py-6">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-[linear-gradient(90deg,var(--accent-hex),var(--accent-2-hex))] text-white shadow-[0_10px_30px_rgba(124,92,255,0.12)]'
                      : 'text-[var(--muted-hex)] hover:bg-[rgba(255,255,255,0.02)] hover:text-white'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="border-t border-[rgba(255,255,255,0.04)] p-4">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(90deg,var(--accent-hex),var(--accent-2-hex))] text-white font-semibold">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium text-white">{user?.name || 'User'}</p>
                <p className="truncate text-xs text-[rgba(184,194,207,0.7)]">{user?.email || ''}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleLogout}
              aria-label="Logout"
            >
              <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
