import { useState } from "react";
import { toast } from "sonner";
import {
  Settings as SettingsIcon,
  Shield,
  Brain,
  HardDrive,
  Upload,
  CreditCard,
  Wrench,
  Globe,
  Key,
  Mail,
  Database,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Lock,
  Timer,
  Zap,
  Layers,
  DollarSign,
  FileText,
  Server,
  Eye,
  EyeOff,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

type Tab = "General" | "Authentication" | "AI" | "Storage" | "Uploads" | "Maintenance" | "Billing";

// ── Toggle Component ───────────────────────────────────────────────────────

function Toggle({
  enabled,
  onToggle,
  label,
  description,
}: {
  enabled: boolean;
  onToggle: () => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[#F1F9FB] last:border-0">
      <div className="flex-1 min-w-0">
        <span className="text-sm text-[#111827] font-medium block">{label}</span>
        {description && (
          <p className="text-xs text-[#94A3B8] mt-0.5">{description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={onToggle}
        className={`w-10 h-5 rounded-full transition-colors cursor-pointer flex items-center px-0.5 ml-4 flex-shrink-0 ${
          enabled ? "bg-[#06B6D4]" : "bg-[#E5F4F7]"
        }`}
      >
        <div
          className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
            enabled ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

// ── Section Card ───────────────────────────────────────────────────────────

function SectionCard({
  title,
  subtitle,
  children,
  className = "",
  borderColor,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  borderColor?: string;
}) {
  return (
    <div
      className={`bg-white rounded-2xl border shadow-sm ${className}`}
      style={{ borderColor: borderColor || "#E5F4F7" }}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-base font-semibold text-[#111827]">{title}</h3>
            {subtitle && (
              <p className="text-xs text-[#94A3B8] mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Settings Page ──────────────────────────────────────────────────────────

export function Settings() {
  const [activeTab, setActiveTab] = useState<Tab>("General");
  const tabs: Tab[] = ["General", "Authentication", "AI", "Storage", "Uploads", "Maintenance", "Billing"];

  // ── General state ──
  const [general, setGeneral] = useState({
    platformName: "",
    description: "",
    contactEmail: "",
    websiteUrl: "",
    timezone: "UTC",
    language: "English (US)",
  });

  // ── Auth state ──
  const [auth, setAuth] = useState({
    emailPassword: false,
    googleSSO: false,
    microsoftSSO: false,
    saml: false,
    twoFA: false,
    passwordMinLength: "",
    passwordRequireSpecial: false,
    passwordRequireNumbers: false,
    passwordRequireUppercase: false,
    sessionTimeout: "",
    maxLoginAttempts: "",
  });

  // ── AI state ──
  const [ai, setAi] = useState({
    primaryModel: "",
    fallbackModel1: "",
    fallbackModel2: "",
    monthlyTokenBudget: "",
    perOrgTokenLimit: "",
    rateLimitPerMin: "",
    dailyCostCap: "",
    enableCostAlerts: false,
  });

  // ── Storage state ──
  const [storage, setStorage] = useState({
    provider: "",
    storageLimitPerUser: "",
    allowedFileTypes: "",
    maxUploadSize: "",
    retentionDays: "",
    warningThreshold: "",
    totalPlatformLimit: "",
  });

  // ── Uploads state ──
  const [uploads, setUploads] = useState({
    defaultVideoQuality: "",
    autoTranscription: false,
    recordingRetention: "",
    maxRecordingDuration: "",
    enableBackgroundProcessing: false,
    transcriptionModel: "",
  });

  // ── Maintenance state ──
  const [maintenance, setMaintenance] = useState({
    maintenanceMode: false,
  });

  // ── Billing state ──
  const [billing, setBilling] = useState({
    currentPlan: "",
    stripeKey: "",
    stripeSecret: "",
    webhookSecret: "",
    monthlyBudget: "",
    usageAlertThreshold: "",
    enableAutoRenewal: false,
  });

  // ── Password visibility ──
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  const toggleSecret = (key: string) =>
    setShowSecrets((s) => ({ ...s, [key]: !s[key] }));

  // ── Tab icon mapping ──
  const tabIcons: Record<Tab, React.ElementType> = {
    General: Globe,
    Authentication: Shield,
    AI: Brain,
    Storage: HardDrive,
    Uploads: Upload,
    Maintenance: Wrench,
    Billing: CreditCard,
  };

  const handleSave = (section: string) => {
    toast.success(`${section} settings saved successfully`);
  };

  return (
    <div className="min-h-full" style={{ background: "#F5FEFF" }}>
      <div className="max-w-[1200px] mx-auto px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-[#06B6D4]/10 flex items-center justify-center">
              <SettingsIcon size={20} className="text-[#06B6D4]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">Settings</h1>
              <p className="text-sm text-[#94A3B8]">
                Configure platform-wide settings and preferences
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 mb-8 border-b border-[#E5F4F7]">
          {tabs.map((t) => {
            const Icon = tabIcons[t];
            return (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all cursor-pointer ${
                  activeTab === t
                    ? "border-[#06B6D4] text-[#06B6D4]"
                    : "border-transparent text-[#94A3B8] hover:text-[#4B5563]"
                }`}
              >
                <Icon size={15} />
                {t}
              </button>
            );
          })}
        </div>

        {/* ── General Tab ── */}
        {activeTab === "General" && (
          <div className="max-w-2xl space-y-6">
            <SectionCard title="Platform Identity" subtitle="Configure workspace name and public-facing info">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#4B5563] mb-1.5">Platform Name</label>
                  <input
                    value={general.platformName}
                    onChange={(e) => setGeneral({ ...general, platformName: e.target.value })}
                    placeholder="Enter platform name"
                    className="w-full px-3 py-2.5 text-sm bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/10 transition-all text-[#111827]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#4B5563] mb-1.5">Description</label>
                  <textarea
                    value={general.description}
                    onChange={(e) => setGeneral({ ...general, description: e.target.value })}
                    placeholder="Enter platform description"
                    rows={3}
                    className="w-full px-3 py-2.5 text-sm bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/10 transition-all text-[#111827] resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#4B5563] mb-1.5">Contact Email</label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                      <input
                        type="email"
                        value={general.contactEmail}
                        onChange={(e) => setGeneral({ ...general, contactEmail: e.target.value })}
                        placeholder="admin@example.com"
                        className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/10 transition-all text-[#111827]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#4B5563] mb-1.5">Website URL</label>
                    <div className="relative">
                      <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                      <input
                        type="url"
                        value={general.websiteUrl}
                        onChange={(e) => setGeneral({ ...general, websiteUrl: e.target.value })}
                        placeholder="https://example.com"
                        className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/10 transition-all text-[#111827]"
                      />
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleSave("General")}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-[#06B6D4] hover:bg-[#0891B2] text-white rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  <CheckCircle size={14} />
                  Save Changes
                </button>
              </div>
            </SectionCard>

            <SectionCard title="Localization" subtitle="Default timezone and locale settings">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#4B5563] mb-1.5">Default Timezone</label>
                    <select
                      value={general.timezone}
                      onChange={(e) => setGeneral({ ...general, timezone: e.target.value })}
                      className="w-full px-3 py-2.5 text-sm bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] transition-all text-[#111827]"
                    >
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">America/New_York</option>
                      <option value="America/Chicago">America/Chicago</option>
                      <option value="America/Los_Angeles">America/Los_Angeles</option>
                      <option value="Europe/London">Europe/London</option>
                      <option value="Europe/Berlin">Europe/Berlin</option>
                      <option value="Asia/Tokyo">Asia/Tokyo</option>
                      <option value="Asia/Shanghai">Asia/Shanghai</option>
                      <option value="Australia/Sydney">Australia/Sydney</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#4B5563] mb-1.5">Default Language</label>
                    <select
                      value={general.language}
                      onChange={(e) => setGeneral({ ...general, language: e.target.value })}
                      className="w-full px-3 py-2.5 text-sm bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] transition-all text-[#111827]"
                    >
                      <option value="English (US)">English (US)</option>
                      <option value="English (UK)">English (UK)</option>
                      <option value="Spanish">Spanish</option>
                      <option value="French">French</option>
                      <option value="German">German</option>
                      <option value="Japanese">Japanese</option>
                      <option value="Chinese (Simplified)">Chinese (Simplified)</option>
                      <option value="Portuguese (BR)">Portuguese (BR)</option>
                      <option value="Arabic">Arabic</option>
                    </select>
                  </div>
                </div>
                <button
                  onClick={() => handleSave("Localization")}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-[#06B6D4] hover:bg-[#0891B2] text-white rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  <CheckCircle size={14} />
                  Save Changes
                </button>
              </div>
            </SectionCard>
          </div>
        )}

        {/* ── Authentication Tab ── */}
        {activeTab === "Authentication" && (
          <div className="max-w-2xl space-y-6">
            <SectionCard title="Authentication Methods" subtitle="Configure allowed sign-in providers">
              <div className="space-y-0">
                <Toggle
                  enabled={auth.emailPassword}
                  onToggle={() => setAuth({ ...auth, emailPassword: !auth.emailPassword })}
                  label="Email & Password"
                  description="Allow users to sign in with email and password"
                />
                <Toggle
                  enabled={auth.googleSSO}
                  onToggle={() => setAuth({ ...auth, googleSSO: !auth.googleSSO })}
                  label="Google SSO"
                  description="Enable Google single sign-on for all users"
                />
                <Toggle
                  enabled={auth.microsoftSSO}
                  onToggle={() => setAuth({ ...auth, microsoftSSO: !auth.microsoftSSO })}
                  label="Microsoft SSO"
                  description="Enable Microsoft Entra ID single sign-on"
                />
                <Toggle
                  enabled={auth.saml}
                  onToggle={() => setAuth({ ...auth, saml: !auth.saml })}
                  label="SAML 2.0"
                  description="Enterprise SAML integration with custom identity provider"
                />
              </div>
            </SectionCard>

            <SectionCard title="Security Policy" subtitle="Enforce security requirements for user accounts">
              <div className="space-y-4">
                <Toggle
                  enabled={auth.twoFA}
                  onToggle={() => setAuth({ ...auth, twoFA: !auth.twoFA })}
                  label="Enforce Two-Factor Authentication"
                  description="Require all users to enable 2FA for their accounts"
                />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#4B5563] mb-1.5">Min Password Length</label>
                    <div className="relative">
                      <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                      <input
                        type="number"
                        value={auth.passwordMinLength}
                        onChange={(e) => setAuth({ ...auth, passwordMinLength: e.target.value })}
                        placeholder="8"
                        className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/10 transition-all text-[#111827] font-mono tracking-tight"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#4B5563] mb-1.5">Session Timeout (min)</label>
                    <div className="relative">
                      <Timer size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                      <input
                        type="number"
                        value={auth.sessionTimeout}
                        onChange={(e) => setAuth({ ...auth, sessionTimeout: e.target.value })}
                        placeholder="30"
                        className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/10 transition-all text-[#111827] font-mono tracking-tight"
                      />
                    </div>
                  </div>
                </div>
                <Toggle
                  enabled={auth.passwordRequireSpecial}
                  onToggle={() => setAuth({ ...auth, passwordRequireSpecial: !auth.passwordRequireSpecial })}
                  label="Require Special Characters"
                  description="Passwords must contain at least one special character"
                />
                <Toggle
                  enabled={auth.passwordRequireNumbers}
                  onToggle={() => setAuth({ ...auth, passwordRequireNumbers: !auth.passwordRequireNumbers })}
                  label="Require Numbers"
                  description="Passwords must contain at least one numeric digit"
                />
                <Toggle
                  enabled={auth.passwordRequireUppercase}
                  onToggle={() => setAuth({ ...auth, passwordRequireUppercase: !auth.passwordRequireUppercase })}
                  label="Require Uppercase Letters"
                  description="Passwords must contain at least one uppercase letter"
                />
                <div>
                  <label className="block text-xs font-medium text-[#4B5563] mb-1.5">Max Login Attempts (before lockout)</label>
                  <div className="relative">
                    <Shield size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                    <input
                      type="number"
                      value={auth.maxLoginAttempts}
                      onChange={(e) => setAuth({ ...auth, maxLoginAttempts: e.target.value })}
                      placeholder="5"
                      className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/10 transition-all text-[#111827] font-mono tracking-tight"
                    />
                  </div>
                </div>
                <button
                  onClick={() => handleSave("Authentication")}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-[#06B6D4] hover:bg-[#0891B2] text-white rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  <CheckCircle size={14} />
                  Save Authentication Settings
                </button>
              </div>
            </SectionCard>
          </div>
        )}

        {/* ── AI Tab ── */}
        {activeTab === "AI" && (
          <div className="max-w-2xl space-y-6">
            <SectionCard title="AI Model Configuration" subtitle="Set default model and fallback chain">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#4B5563] mb-1.5">Primary Model</label>
                  <select
                    value={ai.primaryModel}
                    onChange={(e) => setAi({ ...ai, primaryModel: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] transition-all text-[#111827]"
                  >
                    <option value="">Select a model</option>
                    <option value="GPT-4o (OpenAI)">GPT-4o (OpenAI)</option>
                    <option value="Claude 3.5 Sonnet (Anthropic)">Claude 3.5 Sonnet (Anthropic)</option>
                    <option value="Gemini Pro (Google)">Gemini Pro (Google)</option>
                    <option value="Llama 3.1 (Meta)">Llama 3.1 (Meta)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#4B5563] mb-1.5">Fallback Model (1st)</label>
                  <select
                    value={ai.fallbackModel1}
                    onChange={(e) => setAi({ ...ai, fallbackModel1: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] transition-all text-[#111827]"
                  >
                    <option value="">Select a model</option>
                    <option value="Claude 3.5 Sonnet (Anthropic)">Claude 3.5 Sonnet (Anthropic)</option>
                    <option value="GPT-4o (OpenAI)">GPT-4o (OpenAI)</option>
                    <option value="Gemini Pro (Google)">Gemini Pro (Google)</option>
                    <option value="Llama 3.1 (Meta)">Llama 3.1 (Meta)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#4B5563] mb-1.5">Fallback Model (2nd)</label>
                  <select
                    value={ai.fallbackModel2}
                    onChange={(e) => setAi({ ...ai, fallbackModel2: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] transition-all text-[#111827]"
                  >
                    <option value="">Select a model</option>
                    <option value="Gemini Pro (Google)">Gemini Pro (Google)</option>
                    <option value="GPT-4o (OpenAI)">GPT-4o (OpenAI)</option>
                    <option value="Claude 3.5 Sonnet (Anthropic)">Claude 3.5 Sonnet (Anthropic)</option>
                    <option value="Llama 3.1 (Meta)">Llama 3.1 (Meta)</option>
                  </select>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Token Limits & Rate Limiting" subtitle="Control AI usage and costs">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#4B5563] mb-1.5">Monthly Token Budget</label>
                    <div className="relative">
                      <Layers size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                      <input
                        type="number"
                        value={ai.monthlyTokenBudget}
                        onChange={(e) => setAi({ ...ai, monthlyTokenBudget: e.target.value })}
                        placeholder="0"
                        className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/10 transition-all text-[#111827] font-mono tracking-tight"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#4B5563] mb-1.5">Per-org Token Limit</label>
                    <div className="relative">
                      <Layers size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                      <input
                        type="number"
                        value={ai.perOrgTokenLimit}
                        onChange={(e) => setAi({ ...ai, perOrgTokenLimit: e.target.value })}
                        placeholder="0"
                        className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/10 transition-all text-[#111827] font-mono tracking-tight"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#4B5563] mb-1.5">Rate Limit (req/min)</label>
                    <div className="relative">
                      <Zap size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                      <input
                        type="number"
                        value={ai.rateLimitPerMin}
                        onChange={(e) => setAi({ ...ai, rateLimitPerMin: e.target.value })}
                        placeholder="0"
                        className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/10 transition-all text-[#111827] font-mono tracking-tight"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#4B5563] mb-1.5">Daily Cost Cap ($)</label>
                    <div className="relative">
                      <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                      <input
                        type="number"
                        value={ai.dailyCostCap}
                        onChange={(e) => setAi({ ...ai, dailyCostCap: e.target.value })}
                        placeholder="0"
                        className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/10 transition-all text-[#111827] font-mono tracking-tight"
                      />
                    </div>
                  </div>
                </div>
                <Toggle
                  enabled={ai.enableCostAlerts}
                  onToggle={() => setAi({ ...ai, enableCostAlerts: !ai.enableCostAlerts })}
                  label="Cost Alerts"
                  description="Send admin notifications when cost thresholds are reached"
                />
                <button
                  onClick={() => handleSave("AI")}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-[#06B6D4] hover:bg-[#0891B2] text-white rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  <CheckCircle size={14} />
                  Save AI Settings
                </button>
              </div>
            </SectionCard>
          </div>
        )}

        {/* ── Storage Tab ── */}
        {activeTab === "Storage" && (
          <div className="max-w-2xl space-y-6">
            <SectionCard title="Storage Configuration" subtitle="Global storage limits and provider">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#4B5563] mb-1.5">Storage Provider</label>
                  <select
                    value={storage.provider}
                    onChange={(e) => setStorage({ ...storage, provider: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] transition-all text-[#111827]"
                  >
                    <option value="">Select a provider</option>
                    <option value="Amazon S3">Amazon S3</option>
                    <option value="Google Cloud Storage">Google Cloud Storage</option>
                    <option value="Azure Blob Storage">Azure Blob Storage</option>
                    <option value="MinIO (Self-hosted)">MinIO (Self-hosted)</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#4B5563] mb-1.5">Platform Total Limit (TB)</label>
                    <div className="relative">
                      <HardDrive size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                      <input
                        type="number"
                        value={storage.totalPlatformLimit}
                        onChange={(e) => setStorage({ ...storage, totalPlatformLimit: e.target.value })}
                        placeholder="0"
                        className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/10 transition-all text-[#111827] font-mono tracking-tight"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#4B5563] mb-1.5">Per-user Limit (GB)</label>
                    <div className="relative">
                      <HardDrive size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                      <input
                        type="number"
                        value={storage.storageLimitPerUser}
                        onChange={(e) => setStorage({ ...storage, storageLimitPerUser: e.target.value })}
                        placeholder="0"
                        className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/10 transition-all text-[#111827] font-mono tracking-tight"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#4B5563] mb-1.5">Warning Threshold (%)</label>
                    <div className="relative">
                      <AlertTriangle size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                      <input
                        type="number"
                        value={storage.warningThreshold}
                        onChange={(e) => setStorage({ ...storage, warningThreshold: e.target.value })}
                        placeholder="0"
                        className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/10 transition-all text-[#111827] font-mono tracking-tight"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#4B5563] mb-1.5">Retention Policy (days)</label>
                    <div className="relative">
                      <Timer size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                      <input
                        type="number"
                        value={storage.retentionDays}
                        onChange={(e) => setStorage({ ...storage, retentionDays: e.target.value })}
                        placeholder="0"
                        className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/10 transition-all text-[#111827] font-mono tracking-tight"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#4B5563] mb-1.5">Allowed File Types (MIME)</label>
                  <textarea
                    value={storage.allowedFileTypes}
                    onChange={(e) => setStorage({ ...storage, allowedFileTypes: e.target.value })}
                    placeholder="video/mp4, audio/mpeg, application/pdf"
                    rows={2}
                    className="w-full px-3 py-2.5 text-sm bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] transition-all text-[#111827] font-mono tracking-tight resize-none"
                  />
                </div>
                <button
                  onClick={() => handleSave("Storage")}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-[#06B6D4] hover:bg-[#0891B2] text-white rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  <CheckCircle size={14} />
                  Save Storage Settings
                </button>
              </div>
            </SectionCard>
          </div>
        )}

        {/* ── Uploads Tab ── */}
        {activeTab === "Uploads" && (
          <div className="max-w-2xl space-y-6">
            <SectionCard title="Upload Configuration" subtitle="File restrictions and video processing settings">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#4B5563] mb-1.5">Max Upload Size (MB)</label>
                    <div className="relative">
                      <Upload size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                      <input
                        type="number"
                        value={storage.maxUploadSize}
                        onChange={(e) => setStorage({ ...storage, maxUploadSize: e.target.value })}
                        placeholder="0"
                        className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/10 transition-all text-[#111827] font-mono tracking-tight"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#4B5563] mb-1.5">Default Video Quality</label>
                    <select
                      value={uploads.defaultVideoQuality}
                      onChange={(e) => setUploads({ ...uploads, defaultVideoQuality: e.target.value })}
                      className="w-full px-3 py-2.5 text-sm bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] transition-all text-[#111827]"
                    >
                      <option value="">Select quality</option>
                      <option value="720p">720p</option>
                      <option value="1080p">1080p</option>
                      <option value="1440p">1440p</option>
                      <option value="4K">4K</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#4B5563] mb-1.5">Max Recording Duration (min)</label>
                    <div className="relative">
                      <Timer size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                      <input
                        type="number"
                        value={uploads.maxRecordingDuration}
                        onChange={(e) => setUploads({ ...uploads, maxRecordingDuration: e.target.value })}
                        placeholder="0"
                        className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/10 transition-all text-[#111827] font-mono tracking-tight"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#4B5563] mb-1.5">Recording Retention (days)</label>
                    <div className="relative">
                      <HardDrive size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                      <input
                        type="number"
                        value={uploads.recordingRetention}
                        onChange={(e) => setUploads({ ...uploads, recordingRetention: e.target.value })}
                        placeholder="0"
                        className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/10 transition-all text-[#111827] font-mono tracking-tight"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#4B5563] mb-1.5">Transcription Model</label>
                  <select
                    value={uploads.transcriptionModel}
                    onChange={(e) => setUploads({ ...uploads, transcriptionModel: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] transition-all text-[#111827]"
                  >
                    <option value="">Select a model</option>
                    <option value="Whisper v3">Whisper v3</option>
                    <option value="Whisper v2">Whisper v2</option>
                    <option value="AssemblyAI">AssemblyAI</option>
                    <option value="Deepgram">Deepgram</option>
                  </select>
                </div>
                <Toggle
                  enabled={uploads.autoTranscription}
                  onToggle={() => setUploads({ ...uploads, autoTranscription: !uploads.autoTranscription })}
                  label="Auto-Transcription"
                  description="Automatically generate transcripts for all uploaded recordings"
                />
                <Toggle
                  enabled={uploads.enableBackgroundProcessing}
                  onToggle={() => setUploads({ ...uploads, enableBackgroundProcessing: !uploads.enableBackgroundProcessing })}
                  label="Background Processing"
                  description="Process uploads in the background to improve perceived performance"
                />
                <button
                  onClick={() => handleSave("Uploads")}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-[#06B6D4] hover:bg-[#0891B2] text-white rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  <CheckCircle size={14} />
                  Save Upload Settings
                </button>
              </div>
            </SectionCard>
          </div>
        )}

        {/* ── Maintenance Tab ── */}
        {activeTab === "Maintenance" && (
          <div className="max-w-2xl space-y-6">
            <SectionCard
              title="Maintenance Mode"
              subtitle="Enable to prevent user logins during maintenance windows"
              className="border-amber-200 bg-amber-50/50"
              borderColor="#FCD34D"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-[#4B5563] font-medium block">Maintenance Mode</span>
                  <p className="text-xs text-[#94A3B8] mt-0.5">All users will see a maintenance notice</p>
                </div>
                <button
                  type="button"
                  onClick={() => setMaintenance({ ...maintenance, maintenanceMode: !maintenance.maintenanceMode })}
                  className={`w-10 h-5 rounded-full transition-colors cursor-pointer flex items-center px-0.5 ${
                    maintenance.maintenanceMode ? "bg-amber-500" : "bg-[#E5F4F7]"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                      maintenance.maintenanceMode ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </SectionCard>

            <SectionCard
              title="Danger Zone"
              subtitle="Irreversible platform-wide actions"
              className="border-red-200"
              borderColor="#FECACA"
            >
              <div className="space-y-3">
                <button
                  onClick={() => toast.success("Rebuilding search indexes...")}
                  className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <Wrench size={14} />
                  Rebuild Search Indexes
                </button>
                <button
                  onClick={() => toast.success("Cache flushed successfully")}
                  className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <Database size={14} />
                  Flush Cache
                </button>
                <button
                  onClick={() => toast.success("Storage sync initiated")}
                  className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <RefreshCw size={14} />
                  Force Sync Storage
                </button>
              </div>
            </SectionCard>
          </div>
        )}

        {/* ── Billing Tab ── */}
        {activeTab === "Billing" && (
          <div className="max-w-2xl space-y-6">
            <SectionCard title="Payment Provider" subtitle="Stripe integration configuration">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#4B5563] mb-1.5">Current Plan</label>
                  <input
                    value={billing.currentPlan}
                    onChange={(e) => setBilling({ ...billing, currentPlan: e.target.value })}
                    placeholder="Enter plan name"
                    className="w-full px-3 py-2.5 text-sm bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] transition-all text-[#111827]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#4B5563] mb-1.5">Stripe Publishable Key</label>
                  <input
                    value={billing.stripeKey}
                    onChange={(e) => setBilling({ ...billing, stripeKey: e.target.value })}
                    type="text"
                    placeholder="pk_..."
                    className="w-full px-3 py-2.5 text-sm bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] transition-all text-[#111827] font-mono tracking-tight"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#4B5563] mb-1.5">Stripe Secret Key</label>
                  <div className="relative">
                    <input
                      value={billing.stripeSecret}
                      onChange={(e) => setBilling({ ...billing, stripeSecret: e.target.value })}
                      type={showSecrets.stripeSecret ? "text" : "password"}
                      placeholder="sk_..."
                      className="w-full px-3 py-2.5 pr-10 text-sm bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] transition-all text-[#111827] font-mono tracking-tight"
                    />
                    <button
                      type="button"
                      onClick={() => toggleSecret("stripeSecret")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B] cursor-pointer"
                    >
                      {showSecrets.stripeSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#4B5563] mb-1.5">Webhook Signing Secret</label>
                  <div className="relative">
                    <input
                      value={billing.webhookSecret}
                      onChange={(e) => setBilling({ ...billing, webhookSecret: e.target.value })}
                      type={showSecrets.webhookSecret ? "text" : "password"}
                      placeholder="whsec_..."
                      className="w-full px-3 py-2.5 pr-10 text-sm bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] transition-all text-[#111827] font-mono tracking-tight"
                    />
                    <button
                      type="button"
                      onClick={() => toggleSecret("webhookSecret")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B] cursor-pointer"
                    >
                      {showSecrets.webhookSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => handleSave("Billing")}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-[#06B6D4] hover:bg-[#0891B2] text-white rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  <CheckCircle size={14} />
                  Save Billing Settings
                </button>
              </div>
            </SectionCard>

            <SectionCard title="Usage & Alerts" subtitle="Budget and notification preferences">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#4B5563] mb-1.5">Monthly Budget ($)</label>
                    <div className="relative">
                      <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                      <input
                        type="number"
                        value={billing.monthlyBudget}
                        onChange={(e) => setBilling({ ...billing, monthlyBudget: e.target.value })}
                        placeholder="0"
                        className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/10 transition-all text-[#111827] font-mono tracking-tight"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#4B5563] mb-1.5">Usage Alert Threshold (%)</label>
                    <div className="relative">
                      <AlertTriangle size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                      <input
                        type="number"
                        value={billing.usageAlertThreshold}
                        onChange={(e) => setBilling({ ...billing, usageAlertThreshold: e.target.value })}
                        placeholder="0"
                        className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#F8FDFE] border border-[#E5F4F7] rounded-xl outline-none focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/10 transition-all text-[#111827] font-mono tracking-tight"
                      />
                    </div>
                  </div>
                </div>
                <Toggle
                  enabled={billing.enableAutoRenewal}
                  onToggle={() => setBilling({ ...billing, enableAutoRenewal: !billing.enableAutoRenewal })}
                  label="Auto-Renewal"
                  description="Automatically renew subscription at the end of each billing cycle"
                />
                <button
                  onClick={() => handleSave("Usage & Alerts")}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-[#06B6D4] hover:bg-[#0891B2] text-white rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  <CheckCircle size={14} />
                  Save Usage Settings
                </button>
              </div>
            </SectionCard>
          </div>
        )}
      </div>
    </div>
  );
}

export default Settings;
