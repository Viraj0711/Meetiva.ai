import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useAppSelector } from '@/store/hooks';
import { authService, integrationService } from '@/services';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store';
import { loginSuccess } from '@/store/slices/authSlice';
import { updateProfileSchema, zodResolver, type SchemaOutput } from '@/lib/validation';
import {
  User,
  Mail,
  Briefcase,
  Building,
  Lock,
  Bell,
  Globe,
  Zap,
  Shield,
  AlertCircle,
} from 'lucide-react';
import { IntegrationType } from '@/types/integration.types';

interface LocalIntegration {
  id: string;
  name: string;
  description: string;
  icon: string;
  connected: boolean;
  category: 'calendar';
}

const Profile: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const user = useAppSelector((state) => state.auth.user);
  const [activeTab, setActiveTab] = useState<'account' | 'integrations' | 'notifications'>('account');
  const [integrations, setIntegrations] = useState<LocalIntegration[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    jobTitle: '',
  });

  type ProfileFormData = SchemaOutput<typeof updateProfileSchema>;

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors, isSubmitting: isSavingProfile },
    reset: resetProfileForm,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { name: '', email: '' },
  });

  useEffect(() => {
    const name = user?.name || '';
    const email = user?.email || '';
    resetProfileForm({ name, email });
  }, [user?.name, user?.email, resetProfileForm]);

  useEffect(() => {
    if (activeTab === 'integrations') {
      loadIntegrations();
    }
  }, [activeTab]);

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      setError(null);
      // Check Google Calendar status directly via the calendar endpoint
      const status = await integrationService.getGoogleCalendarStatus();
      const allIntegrations: LocalIntegration[] = [{
        id: IntegrationType.CALENDAR,
        name: 'Google Calendar',
        description: 'Schedule meetings and set reminders',
        icon: '',
        category: 'calendar',
        connected: status.isConnected,
      }];
      setIntegrations(allIntegrations);
    } catch (err) {
      console.error('Failed to load integrations:', err);
      setError('Failed to load integrations. Please try again later.');
      setIntegrations([]);
    } finally {
      setLoading(false);
    }
  };

  const [notifications, setNotifications] = useState({
    emailSummaries: true,
    actionItemReminders: true,
    overdueAlerts: true,
    weeklyReports: false,
    meetingProcessed: true,
  });

  const handleToggleIntegration = async (id: string) => {
    const integration = integrations.find(i => i.id === id);
    if (!integration) return;

    try {
      if (integration.connected) {
        // Disconnect
        await integrationService.disconnectGoogleCalendar();
        setIntegrations(integrations.map(i =>
          i.id === id ? { ...i, connected: false } : i
        ));
      } else {
        // Connect — redirect to Google OAuth
        const { authUrl } = await integrationService.getGoogleAuthUrl('');
        window.location.href = authUrl;
      }
    } catch (err) {
      console.error('Failed to toggle integration:', err);
      setError('Failed to update integration. Please try again.');
      // Reload status on failure to revert UI state
      loadIntegrations();
    }
  };

  const handleNotificationToggle = (key: keyof typeof notifications) => {
    setNotifications({ ...notifications, [key]: !notifications[key] });
  };

  const getIntegrationsByCategory = (category: string) => {
    return integrations.filter(i => i.category === category);
  };

  const connectedCount = integrations.filter(i => i.connected).length;

  const handleProfileChange = (field: keyof typeof profileForm, value: string) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleProfileCancel = () => {
    const name = user?.name || '';
    const email = user?.email || '';
    resetProfileForm({ name, email });
    setProfileMessage(null);
  };

  const onProfileSave = async (data: ProfileFormData) => {
    try {
      setProfileMessage(null);

      const response = await authService.updateProfile({
        name: data.name || user?.name || '',
        email: data.email || user?.email || '',
      });

      // response.token is automatically stored in-memory by authService.updateProfile
      dispatch(loginSuccess({ user: response.user, token: response.token }));
      setProfileMessage('Profile updated successfully.');
    } catch (err: any) {
      setProfileMessage(err?.response?.data?.message || 'Failed to save profile changes.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Profile Settings</h1>
          <p className="mt-2 text-muted-foreground">
            Manage your account and integration preferences
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center text-white text-2xl font-bold shadow-lg">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 text-cyan-300 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-cyan-300" />
            </div>
            <div>
              <p className="text-2xl font-bold">{connectedCount}</p>
              <p className="text-sm text-muted-foreground">Connected Apps</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/[0.06] rounded-lg flex items-center justify-center">
              <Bell className="w-6 h-6 text-cyan-300" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {Object.values(notifications).filter(Boolean).length}
              </p>
              <p className="text-sm text-muted-foreground">Active Alerts</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/[0.06] rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-violet-300" />
            </div>
            <div>
              <p className="text-2xl font-bold">Secure</p>
              <p className="text-sm text-muted-foreground">Account Status</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-6">
          <button
            className={`pb-3 px-1 font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'account'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('account')}
          >
            <User className="w-4 h-4" />
            Account
          </button>
          <button
            className={`pb-3 px-1 font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'integrations'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('integrations')}
          >
            <Zap className="w-4 h-4" />
            Integrations
          </button>
          <button
            className={`pb-3 px-1 font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'notifications'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('notifications')}
          >
            <Bell className="w-4 h-4" />
            Notifications
          </button>
        </div>
      </div>

      {/* Account Tab */}
      {activeTab === 'account' && (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <User className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold">Personal Information</h2>
            </div>
            <form onSubmit={handleProfileSubmit(onProfileSave)} className="space-y-4">
              {profileMessage && (
                <div className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  {profileMessage}
                </div>
              )}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  Full Name
                </label>
                <Input
                  type="text"
                  id="profile-name"
                  error={profileErrors.name?.message}
                  placeholder="John Smith"
                  {...registerProfile('name')}
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  Email Address
                </label>
                <Input
                  type="email"
                  id="profile-email"
                  error={profileErrors.email?.message}
                  placeholder="john@example.com"
                  {...registerProfile('email')}
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Building className="w-4 h-4 text-muted-foreground" />
                  Company
                </label>
                <Input
                  type="text"
                  placeholder="Acme Inc."
                  value={profileForm.company}
                  onChange={(e) => handleProfileChange('company', e.target.value)}
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Briefcase className="w-4 h-4 text-muted-foreground" />
                  Job Title
                </label>
                <Input
                  type="text"
                  placeholder="Product Manager"
                  value={profileForm.jobTitle}
                  onChange={(e) => handleProfileChange('jobTitle', e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button type="button" variant="outline" onClick={handleProfileCancel}>Cancel</Button>
                <Button type="submit" disabled={isSavingProfile}>
                  {isSavingProfile ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Lock className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold">Security</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Current Password</label>
                <Input type="password" placeholder="" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">New Password</label>
                <Input type="password" placeholder="" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                <Input type="password" placeholder="" />
              </div>
              <div className="text-cyan-300 border border-white/10 bg-white/[0.03] rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-cyan-300 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-cyan-300">
                  <p className="font-medium mb-1">Password Requirements:</p>
                  <ul className="list-disc list-inside space-y-1 text-cyan-300">
                    <li>At least 8 characters long</li>
                    <li>Include uppercase and lowercase letters</li>
                    <li>Include at least one number</li>
                    <li>Include at least one special character</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <Button>Update Password</Button>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Globe className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold">Preferences</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Language</label>
                <select className="w-full px-3 py-2 border rounded-md">
                  <option>English</option>
                  <option>Spanish</option>
                  <option>French</option>
                  <option>German</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Time Zone</label>
                <select className="w-full px-3 py-2 border rounded-md">
                  <option>UTC-8 (Pacific Time)</option>
                  <option>UTC-5 (Eastern Time)</option>
                  <option>UTC+0 (London)</option>
                  <option>UTC+1 (Paris)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Date Format</label>
                <select className="w-full px-3 py-2 border rounded-md">
                  <option>MM/DD/YYYY</option>
                  <option>DD/MM/YYYY</option>
                  <option>YYYY-MM-DD</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <Button>Save Preferences</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Integrations Tab */}
      {activeTab === 'integrations' && (
        <div className="space-y-6">
          <Card className="p-6 bg-gradient-to-br from-purple-900/20 to-violet-900/20 border border-white/10">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-primary/20">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1 text-white">Connect Your Favorite Tools</h3>
                <p className="text-sm text-white/60">
                  Connect Meetiva to Google Calendar to schedule meetings and stay synced with your timeline.
                </p>
              </div>
            </div>
          </Card>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {/* Error State */}
          {error && (
            <Card className="p-6 bg-red-50 border-red-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-red-900 mb-1">Error Loading Integrations</p>
                  <p className="text-sm text-red-800">{error}</p>
                  <Button 
                    onClick={loadIntegrations} 
                    variant="outline" 
                    className="mt-3"
                    size="sm"
                  >
                    Retry
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Calendar */}
          {!loading && !error && (
          <>
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-lg font-bold">Calendar</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {getIntegrationsByCategory('calendar').map((integration) => (
                <Card key={integration.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="text-4xl">{integration.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate">{integration.name}</h3>
                          {integration.connected && (
                            <Badge variant="default" className="flex-shrink-0">Connected</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground leading-snug">{integration.description}</p>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant={integration.connected ? 'outline' : 'default'}
                    size="sm"
                    onClick={() => handleToggleIntegration(integration.id)}
                    className="w-full"
                  >
                    {integration.connected ? 'Disconnect' : 'Connect'}
                  </Button>
                </Card>
              ))}
            </div>
          </div>
          </>
          )}
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Mail className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold">Email Notifications</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-4 border-b">
                <div className="flex-1">
                  <p className="font-medium">Meeting Summaries</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Receive email summaries after meetings are processed
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                  <input
                    type="checkbox"
                    checked={notifications.emailSummaries}
                    onChange={() => handleNotificationToggle('emailSummaries')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-4 border-b">
                <div className="flex-1">
                  <p className="font-medium">Action Item Reminders</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Get reminded about upcoming action item deadlines
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                  <input
                    type="checkbox"
                    checked={notifications.actionItemReminders}
                    onChange={() => handleNotificationToggle('actionItemReminders')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-4 border-b">
                <div className="flex-1">
                  <p className="font-medium">Overdue Alerts</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Notifications when action items become overdue
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                  <input
                    type="checkbox"
                    checked={notifications.overdueAlerts}
                    onChange={() => handleNotificationToggle('overdueAlerts')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-4 border-b">
                <div className="flex-1">
                  <p className="font-medium">Weekly Reports</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Receive a weekly summary of your meetings and tasks
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                  <input
                    type="checkbox"
                    checked={notifications.weeklyReports}
                    onChange={() => handleNotificationToggle('weeklyReports')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-4">
                <div className="flex-1">
                  <p className="font-medium">Processing Complete</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Notify when meeting processing is finished
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                  <input
                    type="checkbox"
                    checked={notifications.meetingProcessed}
                    onChange={() => handleNotificationToggle('meetingProcessed')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-amber-50 border-amber-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-900 mb-1">Notification Preferences</p>
                <p className="text-sm text-amber-800">
                  You can customize notification settings for each integration after connecting them. 
                  Some notifications may be delayed based on your email provider settings.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Profile;

