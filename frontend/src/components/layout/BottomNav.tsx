import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Home, Users, FileText, Target, Upload,
} from 'lucide-react';

const GRAD = '#5B3FD6';

const NAV_ITEMS = [
  { id: 'home',      label: 'Home',      icon: Home,     path: '/dashboard' },
  { id: 'teams',     label: 'Teams',     icon: Users,    path: '/dashboard/teams' },
  { id: 'meetings',  label: 'Meetings',  icon: FileText, path: '/dashboard/meetings' },
  { id: 'tasks',     label: 'Tasks',     icon: Target,   path: '/dashboard/tasks' },
  { id: 'upload',    label: 'Upload',    icon: Upload,   path: '/dashboard/upload' },
];

const BottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    // Exact match for home, prefix match for others
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid #E4E0F5',
        boxShadow: '0 -2px 8px rgba(91, 63, 214, 0.06)',
      }}
    >
      <div className="flex items-center justify-around px-2 py-1 safe-area-bottom">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all duration-150 min-w-[56px]"
              style={{
                color: active ? GRAD : '#64607A',
                background: active ? 'rgba(91, 63, 214, 0.08)' : 'transparent',
              }}
            >
              <item.icon
                size={20}
                strokeWidth={active ? 2.5 : 2}
                style={{ color: active ? GRAD : '#64607A' }}
              />
              <span
                className="text-[10px] mt-1 font-medium"
                style={{
                  color: active ? GRAD : '#64607A',
                  fontWeight: active ? 600 : 500,
                }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
