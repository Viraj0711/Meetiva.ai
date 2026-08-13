import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, LogOut, ChevronDown, Building2, User, Settings, Zap } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/store/slices/authSlice';
import { notificationService, type Notification } from '@/services/notification.service';

const GRAD = '#5B3FD6';
const GRAD2 = '#8B5CF6';

const TopBar: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const workspaceRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (workspaceRef.current && !workspaceRef.current.contains(e.target as Node)) {
        setWorkspaceOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await notificationService.getNotifications(1, 5);
        setNotifications(res.data);
        setUnreadCount(res.pagination.total);
      } catch {
        // silently ignore
      }
    };
    fetchNotifications();
  }, []);

  const isCorporate = user?.accountType === 'corporate' && user?.organizationId;

  const workspaceInfo = isCorporate
    ? { name: user?.name || 'Organization', subtitle: `${user?.orgRole || 'member'} · Organization`, icon: <Building2 size={14} /> }
    : { name: user?.name || 'Personal Account', subtitle: 'Free Plan', icon: <User size={14} /> };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      // silently ignore
    }
  };

  return (
    <div className="h-14 flex-shrink-0 border-b border-[#E4E0F5] px-4 md:px-6 flex items-center justify-between relative z-40"
      style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)', boxShadow: '0 1px 0 rgba(91,63,214,0.04)' }}>
      
      {/* Left: Workspace Selector + Upgrade Button */}
      <div className="flex items-center gap-3">
        <div className="relative" ref={workspaceRef}>
          <button
            onClick={() => setWorkspaceOpen(!workspaceOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-[rgba(91,63,214,0.04)] transition-colors cursor-pointer"
          >
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${GRAD}, ${GRAD2})` }}>
              {workspaceInfo.icon}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold text-[#1D1B22] truncate max-w-[120px]">{workspaceInfo.name}</div>
              <div className="text-[10px] text-[#64607A] truncate">{workspaceInfo.subtitle}</div>
            </div>
            <ChevronDown size={12} className={`hidden sm:block transition-transform ${workspaceOpen ? 'rotate-180' : ''}`} style={{ color: '#64607A' }} />
          </button>

          {workspaceOpen && (
            <div className="absolute left-0 mt-1 w-56 bg-white rounded-xl border border-[#E4E0F5] shadow-lg overflow-hidden z-[60]">
              <div className="p-2">
                <div className="px-3 py-2 text-[10px] font-bold text-[#64607A] uppercase tracking-wider">Workspace</div>
                <button
                  onClick={() => setWorkspaceOpen(false)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-[#F5F3FF] rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${GRAD}, ${GRAD2})` }}>
                    {workspaceInfo.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-[#1D1B22] truncate">{workspaceInfo.name}</div>
                    <div className="text-[10px] text-[#64607A] truncate">{workspaceInfo.subtitle}</div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Upgrade Subscription Button */}
        <button
          onClick={() => navigate('/dashboard/upgrade')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer hidden sm:flex"
          style={{
            background: `linear-gradient(135deg, ${GRAD}, ${GRAD2})`,
            color: 'white',
            boxShadow: '0 2px 8px rgba(91, 63, 214, 0.3)',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(91, 63, 214, 0.4)';
            (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(91, 63, 214, 0.3)';
            (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
          }}
        >
          <Zap size={14} />
          Upgrade
        </button>
      </div>

      {/* Right: Notifications, Settings, Profile, Logout */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl hover:bg-[rgba(91,63,214,0.08)] transition-colors cursor-pointer"
          >
            <Bell size={18} style={{ color: '#64607A' }} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#F472B6] text-white text-[9px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-1 w-80 bg-white rounded-xl border border-[#E4E0F5] shadow-lg overflow-hidden z-[60]">
              <div className="px-4 py-3 border-b border-[#E4E0F5] flex items-center justify-between">
                <span className="text-sm font-bold text-[#1D1B22]">Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-semibold text-[#F472B6]">{unreadCount} unread</span>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-sm text-[#64607A]">No notifications yet</div>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => handleMarkAsRead(n.id)}
                      className={`w-full text-left px-4 py-3 border-b border-[#E4E0F5] last:border-0 hover:bg-[#F8F7FF] transition-colors ${!n.isRead ? 'bg-[rgba(91,63,214,0.02)]' : ''}`}
                    >
                      <div className="flex items-start gap-2">
                        {!n.isRead && <div className="w-2 h-2 rounded-full bg-[#F472B6] mt-1.5 flex-shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-[#1D1B22] truncate">{n.title}</p>
                          <p className="text-[11px] text-[#64607A] truncate mt-0.5">{n.message}</p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
              <div className="px-4 py-2 border-t border-[#E4E0F5]">
                <button
                  onClick={() => { navigate('/dashboard/settings'); setShowNotifications(false); }}
                  className="w-full text-center text-xs font-semibold text-[#5B3FD6] hover:text-[#8B5CF6] transition-colors"
                >
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Settings */}
        <button
          onClick={() => navigate('/dashboard/settings')}
          className="p-2 rounded-xl hover:bg-[rgba(91,63,214,0.08)] transition-colors cursor-pointer hidden sm:block"
        >
          <Settings size={18} style={{ color: '#64607A' }} />
        </button>

        {/* Logout Button - directly visible */}
        <button
          onClick={() => dispatch(logout())}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-red-50 transition-colors cursor-pointer text-xs font-medium text-[#64607A] hover:text-red-500"
          title="Logout"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default TopBar;
