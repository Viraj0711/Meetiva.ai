import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Home, Users, FileText, ScrollText, Target, BarChart2,
  Upload, Layout, Settings, LogOut, ChevronDown, User, Building2, Check,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/store/slices/authSlice';
import { setActiveTeam, setIndividual } from '@/store/slices/workspaceSlice';
import { useTeams } from '@/hooks/useTeams';
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
  const queryClient = useQueryClient();
  const user = useAppSelector((state) => state.auth.user);
  const { activeTeamId, activeTeamName } = useAppSelector((state) => state.workspace);
  const { data: teams = [] } = useTeams();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => location.pathname === path;

  const navTo = (path: string) => navigate(path);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const invalidateWorkspaceQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['meetings'] });
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
  };

  const handleSelectIndividual = () => {
    dispatch(setIndividual());
    setDropdownOpen(false);
    invalidateWorkspaceQueries();
  };

  const handleSelectTeam = (teamId: string, teamName: string) => {
    dispatch(setActiveTeam({ teamId, teamName }));
    setDropdownOpen(false);
    invalidateWorkspaceQueries();
  };

  const getInitial = (name: string) => name?.charAt(0)?.toUpperCase() || 'M';

  return (
    <div className="w-[232px] flex-shrink-0 h-screen flex flex-col relative overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #FCFBFF 0%, #F3EFFE 100%)',
        borderRight: '1px solid #E4E0F5',
        boxShadow: '1px 0 0 rgba(91,63,214,0.04)',
      }}>
      {/* Subtle dot-grid on sidebar */}
      <div className="absolute inset-0 pointer-events-none" style={{ ...DOT_GRID, opacity: 0.25 }} />
      {/* Very soft purple glow top */}
      <div className="absolute -top-16 -left-16 w-[220px] h-[220px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(91,63,214,0.06) 0%, transparent 70%)' }} />

      {/* Logo mark */}
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

      {/* Workspace selector */}
      <div className="relative px-4 pb-4" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-[#E4E0F5] bg-white/60 hover:bg-white transition-all duration-150 cursor-pointer"
        >
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${GRAD}, ${GRAD2})` }}>
            {activeTeamId ? getInitial(activeTeamName) : user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="text-sm font-semibold text-[#1D1B22] truncate">{activeTeamName}</div>
            <div className="text-[10px] text-[#64607A] truncate">
              {activeTeamId ? 'Team workspace' : 'Personal workspace'}
            </div>
          </div>
          <ChevronDown size={14} className={`flex-shrink-0 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} style={{ color: '#64607A' }} />
        </button>

        {/* Dropdown menu */}
        {dropdownOpen && (
          <div className="absolute left-4 right-4 top-full mt-1 bg-white rounded-xl border border-[#E4E0F5] shadow-lg overflow-hidden z-50"
            style={{ boxShadow: '0 8px 32px rgba(91,63,214,0.12)' }}>
            {/* Individual option */}
            <button
              onClick={handleSelectIndividual}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-[#F3EFFE]"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[#EDE9FF]">
                <User size={14} style={{ color: GRAD }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-[#1D1B22]">Individual</div>
                <div className="text-[10px] text-[#64607A]">Your personal workspace</div>
              </div>
              {!activeTeamId && <Check size={14} style={{ color: GRAD }} />}
            </button>

            {/* Teams */}
            {teams.length > 0 && (
              <>
                <div className="px-3 py-1.5 border-t border-[#E4E0F5]">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#9B97B0]">Teams</span>
                </div>
                {teams.map((team) => (
                  <button
                    key={team.id}
                    onClick={() => handleSelectTeam(team.id, team.name)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-[#F3EFFE]"
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[#EDE9FF]">
                      <Building2 size={14} style={{ color: GRAD }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-[#1D1B22] truncate">{team.name}</div>
                      <div className="text-[10px] text-[#64607A]">{team.role || 'Member'}</div>
                    </div>
                    {activeTeamId === team.id && <Check size={14} style={{ color: GRAD }} />}
                  </button>
                ))}
              </>
            )}
          </div>
        )}
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
