import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Home, Users, FileText, ScrollText, Target, BarChart2,
  Upload, Layout,
} from 'lucide-react';

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

  const isActive = (path: string) => location.pathname === path;
  const navTo = (path: string) => navigate(path);

  return (
    <div className="w-[232px] flex-shrink-0 h-screen flex flex-col relative overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #FCFBFF 0%, #F3EFFE 100%)',
        borderRight: '1px solid #E4E0F5',
        boxShadow: '1px 0 0 rgba(91,63,214,0.04)',
      }}>
      <div className="absolute inset-0 pointer-events-none" style={{ ...DOT_GRID, opacity: 0.25 }} />
      <div className="absolute -top-16 -left-16 w-[220px] h-[220px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(91,63,214,0.06) 0%, transparent 70%)' }} />

      <div className="relative px-5 pt-5 pb-4">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${GRAD}, ${GRAD2})` }}>
            M
          </div>
          <span className="font-bold text-[#1D1B22] text-xl tracking-tight">Meetiva</span>
          <span className="text-[10px] text-[#64607A] font-medium">AI</span>
        </div>
      </div>

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
      </nav>

    </div>
  );
};

export default Sidebar;
