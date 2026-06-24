import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useAppSelector } from '@/store/hooks';
import { authService, integrationService } from '@/services';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store';
import { setUser } from '@/store/slices/authSlice';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  connected: boolean;
  status?: 'active' | 'error';
}

/** Load notification preferences from localStorage */
const loadNotificationPrefs = () => {
  try {
    const saved = localStorage.getItem('meetiva_notification_prefs');
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return {
    emailSummaries: true,
    actionItemReminders: true,
    overdueAlerts: true,
    weeklyReports: false,
    meetingProcessed: true,
  };
};

/** Load general preferences from localStorage */
const loadGeneralPrefs = () => {
  try {
    const saved = localStorage.getItem('meetiva_general_prefs');
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return {
    language: 'English',
    timezone: 'UTC-8 (Pacific Time)',
    dateFormat: 'MM/DD/YYYY',
    defaultPriority: 'Medium',
    summaryLength: 'Standard (3-4 paragraphs)',
    actionItemSensitivity: 'Balanced',
  };
};

const Settings: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const user = useAppSelector((state) => state.auth.user);

  const [activeTab, setActiveTab] = useState<'profile' | 'integrations' | 'notifications' | 'preferences'>('profile');

  // ── Profile state ──────────────────────────────────────────────────────
  const [profileForm, setProfileForm] = useState({ firstName: '', lastName: '', email: '', company: '', jobTitle: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const firstName = user?.name?.split(' ')[0] || '';
    const lastName = user?.name?.split(' ').slice(1).join(' ') || '';
    setProfileForm((prev) => ({ ...prev, firstName, lastName, email: user?.email || '' }));
  }, [user?.name, user?.email]);

  // ── Integration state ──────────────────────────────────────────────────
  const [integrations, setIntegrations] = useState<Integration[]>([
    { id: 'google-calendar', name: 'Google Calendar', description: 'Schedule meetings and set reminders', icon: '', connected: false, status: undefined },
  ]);
  const [checkingCalendar, setCheckingCalendar] = useState(false);

  // Check actual Google Calendar connection status on mount
  useEffect(() => {
    const checkStatus = async () => {
      try {
        setCheckingCalendar(true);
        const status = await integrationService.getGoogleCalendarStatus();
        setIntegrations((prev) =>
          prev.map((int) =>
            int.id === 'google-calendar'
              ? { ...int, connected: status.isConnected, status: status.isConnected ? 'active' : undefined }
              : int
          )
        );
      } catch {
        // leave as disconnected
      } finally {
        setCheckingCalendar(false);
      }
    };
    checkStatus();
  }, []);

  // ── Notifications state ────────────────────────────────────────────────
  const [notifications, setNotifications] = useState(loadNotificationPrefs);

  // ── General preferences state ──────────────────────────────────────────
  const [generalPrefs, setGeneralPrefs] = useState(loadGeneralPrefs);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefsMessage, setPrefsMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleProfileChange = (field: keyof typeof profileForm, value: string) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleProfileCancel = () => {
    const firstName = user?.name?.split(' ')[0] || '';
    const lastName = user?.name?.split(' ').slice(1).join(' ') || '';
    setProfileForm((prev) => ({ ...prev, firstName, lastName, email: user?.email || '' }));
    setProfileMessage(null);
  };

  const handleProfileSave = async () => {
    try {
      setSavingProfile(true);
      setProfileMessage(null);

      const fullName = `${profileForm.firstName} ${profileForm.lastName}`.trim();
      const response = await authService.updateProfile({
        name: fullName,
        email: profileForm.email.trim().toLowerCase(),
      });

      if (response?.token) {
        localStorage.setItem('token', response.token);
      }
      dispatch(setUser(response.user));
      setProfileMessage({ type: 'success', text: 'Profile updated successfully.' });
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to save profile changes.';
      setProfileMessage({ type: 'error', text: msg });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleToggleIntegration = async (id: string) => {
    if (id === 'google-calendar') {
      const integration = integrations.find((i) => i.id === id);
      if (integration?.connected) {
        // Disconnect
        try {
          await integrationService.disconnectGoogleCalendar();
          setIntegrations((prev) =>
            prev.map((int) => (int.id === id ? { ...int, connected: false, status: undefined } : int))
          );
        } catch {
          setProfileMessage({ type: 'error', text: 'Failed to disconnect Google Calendar.' });
        }
      } else {
        // Connect — redirect to OAuth flow
        try {
          const { authUrl } = await integrationService.getGoogleAuthUrl('');
          window.location.href = authUrl;
        } catch {
          setProfileMessage({ type: 'error', text: 'Failed to get Google Calendar authorization URL.' });
        }
      }
    }
  };

  const handleNotificationToggle = (key: keyof typeof notifications) => {
    const updated = { ...notifications, [key]: !notifications[key] };
    setNotifications(updated);
    localStorage.setItem('meetiva_notification_prefs', JSON.stringify(updated));
  };

  const handlePrefsChange = (field: keyof typeof generalPrefs, value: string) => {
    setGeneralPrefs((prev: typeof generalPrefs) => ({ ...prev, [field]: value }));
  };

  const handleSavePreferences = () => {
    setSavingPrefs(true);
    setPrefsMessage(null);
    try {
      localStorage.setItem('meetiva_general_prefs', JSON.stringify(generalPrefs));
      setPrefsMessage({ type: 'success', text: 'Preferences saved successfully.' });
    } catch {
      setPrefsMessage({ type: 'error', text: 'Failed to save preferences.' });
    } finally {
      setSavingPrefs(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your account, integrations, and preferences
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-6">
          {(['profile', 'integrations', 'notifications', 'preferences'] as const).map((tab) => (
            <button
              key={tab}
              className={`pb-3 px-1 font-medium border-b-2 transition-colors capitalize ${
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-6">Personal Information</h2>
            {profileMessage && (
              <div
                className={`rounded-lg border px-4 py-3 mb-4 text-sm ${
                  profileMessage.type === 'success'
                    ? 'border-green-500/30 bg-green-500/10 text-green-300'
                    : 'border-red-500/30 bg-red-500/10 text-red-300'
                }`}
              >
                {profileMessage.text}
              </div>
            )}
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-2">First Name</label>
                  <Input
                    type="text"
                    placeholder="John"
                    value={profileForm.firstName}
                    onChange={(e) => handleProfileChange('firstName', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Last Name</label>
                  <Input
                    type="text"
                    placeholder="Smith"
                    value={profileForm.lastName}
                    onChange={(e) => handleProfileChange('lastName', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <Input
                  type="email"
                  placeholder="john@example.com"
                  value={profileForm.email}
                  onChange={(e) => handleProfileChange('email', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Company</label>
                <Input
                  type="text"
                  placeholder="Acme Inc."
                  value={profileForm.company}
                  onChange={(e) => handleProfileChange('company', e.target.value)}
                  disabled
                />
                <p className="text-xs text-muted-foreground mt-1">Company info persistence coming soon</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Job Title</label>
                <Input
                  type="text"
                  placeholder="Product Manager"
                  value={profileForm.jobTitle}
                  onChange={(e) => handleProfileChange('jobTitle', e.target.value)}
                  disabled
                />
                <p className="text-xs text-muted-foreground mt-1">Job title persistence coming soon</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={handleProfileCancel}>Cancel</Button>
              <Button onClick={handleProfileSave} disabled={savingProfile}>
                {savingProfile ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-bold mb-6">Change Password</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Current Password</label>
                <Input type="password" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">New Password</label>
                <Input type="password" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                <Input type="password" />
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <Button disabled title="Password change API endpoint coming soon">Update Password</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Integrations Tab */}
      {activeTab === 'integrations' && (
        <div className="space-y-6">
          <Card className="p-6 border border-white/10 bg-white/[0.03]">
            <div className="flex items-start">
              <svg className="w-6 h-6 text-cyan-300 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="font-semibold mb-1 text-white">Connect your tools</h3>
                <p className="text-sm text-white/60">
                  Integrate Meetiva with Google Calendar to streamline your scheduling workflow.
                </p>
              </div>
            </div>
          </Card>

          <div>
            <h2 className="text-lg font-bold mb-4">Calendar</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {integrations
                .filter((i) => ['google-calendar'].includes(i.id))
                .map((integration) => (
                  <Card key={integration.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start flex-1">
                        <div className="text-4xl mr-4">{integration.icon}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{integration.name}</h3>
                            {checkingCalendar && <span className="text-xs text-muted-foreground">Checking...</span>}
                            {!checkingCalendar && integration.connected && (
                              <Badge variant="default">Connected</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{integration.description}</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Button
                        variant={integration.connected ? 'outline' : 'default'}
                        size="sm"
                        onClick={() => handleToggleIntegration(integration.id)}
                        className="w-full"
                        disabled={checkingCalendar}
                      >
                        {checkingCalendar
                          ? 'Checking...'
                          : integration.connected
                            ? 'Disconnect'
                            : 'Connect'}
                      </Button>
                    </div>
                  </Card>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-6">Email Notifications</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Preferences are saved automatically to your browser.
            </p>
            <div className="space-y-4">
              {([
                { key: 'emailSummaries' as const, label: 'Meeting Summaries', desc: 'Receive email summaries after meetings are processed' },
                { key: 'actionItemReminders' as const, label: 'Action Item Reminders', desc: 'Get reminded about upcoming action item deadlines' },
                { key: 'overdueAlerts' as const, label: 'Overdue Alerts', desc: 'Notifications when action items become overdue' },
                { key: 'weeklyReports' as const, label: 'Weekly Reports', desc: 'Receive a weekly summary of your meetings and tasks' },
                { key: 'meetingProcessed' as const, label: 'Processing Complete', desc: 'Notify when meeting processing is finished' },
              ]).map(({ key, label, desc }, idx) => (
                <div
                  key={key}
                  className={`flex items-center justify-between py-3 ${idx < 4 ? 'border-b' : ''}`}
                >
                  <div>
                    <p className="font-medium">{label}</p>
                    <p className="text-sm text-muted-foreground">{desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications[key]}
                      onChange={() => handleNotificationToggle(key)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                  </label>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <div className="space-y-6">
          {prefsMessage && (
            <div
              className={`rounded-lg border px-4 py-3 text-sm ${
                prefsMessage.type === 'success'
                  ? 'border-green-500/30 bg-green-500/10 text-green-300'
                  : 'border-red-500/30 bg-red-500/10 text-red-300'
              }`}
            >
              {prefsMessage.text}
            </div>
          )}

          <Card className="p-6">
            <h2 className="text-xl font-bold mb-6">General Preferences</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Default Meeting Language</label>
                <select
                  className="w-full px-3 py-2 border border-white/10 rounded-md bg-white/[0.04] text-white"
                  value={generalPrefs.language}
                  onChange={(e) => handlePrefsChange('language', e.target.value)}
                >
                  {['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese'].map((lang) => (
                    <option key={lang}>{lang}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Time Zone</label>
                <select
                  className="w-full px-3 py-2 border border-white/10 rounded-md bg-white/[0.04] text-white"
                  value={generalPrefs.timezone}
                  onChange={(e) => handlePrefsChange('timezone', e.target.value)}
                >
                  {['UTC-8 (Pacific Time)', 'UTC-5 (Eastern Time)', 'UTC+0 (London)', 'UTC+1 (Paris)', 'UTC+8 (Singapore)'].map((tz) => (
                    <option key={tz}>{tz}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Date Format</label>
                <select
                  className="w-full px-3 py-2 border border-white/10 rounded-md bg-white/[0.04] text-white"
                  value={generalPrefs.dateFormat}
                  onChange={(e) => handlePrefsChange('dateFormat', e.target.value)}
                >
                  {['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'].map((fmt) => (
                    <option key={fmt}>{fmt}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <Button onClick={handleSavePreferences} disabled={savingPrefs}>
                {savingPrefs ? 'Saving...' : 'Save Preferences'}
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-bold mb-6">AI Processing</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Summary Length</label>
                <select
                  className="w-full px-3 py-2 border border-white/10 rounded-md bg-white/[0.04] text-white"
                  value={generalPrefs.summaryLength}
                  onChange={(e) => handlePrefsChange('summaryLength', e.target.value)}
                >
                  {['Brief (1-2 paragraphs)', 'Standard (3-4 paragraphs)', 'Detailed (5+ paragraphs)'].map((opt) => (
                    <option key={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Action Item Sensitivity</label>
                <select
                  className="w-full px-3 py-2 border border-white/10 rounded-md bg-white/[0.04] text-white"
                  value={generalPrefs.actionItemSensitivity}
                  onChange={(e) => handlePrefsChange('actionItemSensitivity', e.target.value)}
                >
                  {['Conservative (fewer items)', 'Balanced', 'Aggressive (more items)'].map((opt) => (
                    <option key={opt}>{opt}</option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  Controls how many potential action items are extracted from meetings
                </p>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <Button onClick={handleSavePreferences} disabled={savingPrefs}>
                {savingPrefs ? 'Saving...' : 'Save Preferences'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Settings;
