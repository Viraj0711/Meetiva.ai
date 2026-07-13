import React, { useEffect, useRef, useState } from 'react';
import { Bell, Search, CheckCheck, Clock, Sparkles, Zap, CircleDot } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'info' | 'success' | 'warning';
  link?: string;
}

const Navbar: React.FC = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications] = useState<Notification[]>([]);
  const notificationRef = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter((item) => !item.read).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  const markAsRead = (_id: string) => {
    return;
  };

  const markAllAsRead = () => {
    return;
  };

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/70 backdrop-blur-2xl">
      <div className="flex h-20 items-center justify-between gap-4 px-4 md:px-6 lg:px-8">
        <div className="flex flex-1 items-center gap-4">
          <div className="hidden items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-white/60 lg:flex">
            <span className="flex h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(48,213,246,0.75)]" />
            Live workspace pulse
          </div>
          <div className="relative hidden w-full max-w-2xl lg:block">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search meetings, summaries, or tasks"
              className="h-12 w-full rounded-full border border-white/10 bg-white/5 pl-11 pr-4 text-sm text-white placeholder:text-white/35 outline-none transition-all focus:border-white/20 focus:bg-white/[0.08]"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-white/60 lg:hidden">
            <Sparkles className="h-4 w-4 text-cyan-300" />
            Meeting intelligence
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-white/60 xl:flex xl:items-center xl:gap-2">
            <Zap className="h-3.5 w-3.5 text-cyan-300" />
            {notifications.length > 0 ? `${notifications.length} alerts` : 'No active alerts'}
          </div>
          <div className="relative" ref={notificationRef}>
            <button
              className="relative grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/5 text-white/80 transition hover:border-white/20 hover:bg-white/10"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-primary px-1 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-14 w-96 overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-950/95 shadow-[0_40px_120px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
                <div className="flex items-center justify-between border-b border-white/10 p-4">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Notifications</h3>
                    <p className="text-xs text-white/50">{unreadCount} unread</p>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="inline-flex items-center gap-1 text-xs font-medium text-cyan-300 transition hover:text-white"
                    >
                      <CheckCheck className="h-3 w-3" />
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-white/60">
                      <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-white/5">
                        <CircleDot className="h-6 w-6" />
                      </div>
                      <p className="font-medium text-white">No notifications</p>
                      <p className="text-sm text-white/50">You’re all caught up.</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={cn('group relative border-b border-white/5 p-4 transition hover:bg-white/[0.03]', !notification.read && 'bg-white/[0.04]')}
                      >
                        {notification.link ? (
                          <Link
                            to={notification.link}
                            onClick={() => {
                              markAsRead(notification.id);
                              setShowNotifications(false);
                            }}
                          >
                            <NotificationContent notification={notification} />
                          </Link>
                        ) : (
                          <div onClick={() => markAsRead(notification.id)}>
                            <NotificationContent notification={notification} />
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {notifications.length > 0 && (
                  <div className="border-t border-white/10 p-3 text-center">
                    <Link
                      to="/dashboard/notifications"
                      onClick={() => setShowNotifications(false)}
                      className="text-sm font-medium text-white/70 transition hover:text-white"
                    >
                      View all notifications
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

const NotificationContent: React.FC<{ notification: Notification }> = ({ notification }) => {
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      default:
        return '🔔';
    }
  };

  return (
    <div className="flex gap-3 pr-6">
      <div className="text-2xl flex-shrink-0">{getNotificationIcon(notification.type)}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-semibold text-white">{notification.title}</h4>
          {!notification.read && <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-cyan-300" />}
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-white/60">{notification.message}</p>
        <div className="mt-2 flex items-center gap-1 text-xs text-white/40">
          <Clock className="h-3 w-3" />
          <span>{notification.time}</span>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
