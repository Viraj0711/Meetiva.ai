import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle2,
  Crown,
  Sparkles,
  Star,
  X,
  Upload,
  ShieldCheck,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useSubscription, useUpgradeToPro, useCurrentUser } from '@/hooks/useAuth';

const TIERS = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    icon: Star,
    color: 'text-white/50',
    features: [
      { text: '5 meetings/month', included: true },
      { text: 'AI summaries (Grok)', included: true },
      { text: 'Action item extraction', included: true },
      { text: 'Excel export', included: true },
      { text: 'Team collaboration', included: false },
      { text: 'Calendar sync', included: false },
      { text: 'Analytics dashboard', included: false },
    ],
    cta: 'Current plan',
    highlight: false,
  },
  {
    name: 'PRO',
    price: '—',
    period: 'admin setup',
    icon: Crown,
    color: 'text-cyan-300',
    features: [
      { text: 'Unlimited meetings', included: true },
      { text: 'AI summaries (Grok)', included: true },
      { text: 'Action item extraction', included: true },
      { text: 'Excel export', included: true },
      { text: 'Team collaboration', included: true },
      { text: 'Calendar sync', included: true },
      { text: 'Analytics dashboard', included: true },
    ],
    cta: 'Upgrade to PRO',
    highlight: true,
  },
];

const SubscriptionUpgrade: React.FC = () => {
  const navigate = useNavigate();
  const { data: subscription } = useSubscription();
  const { data: currentUser } = useCurrentUser();
  const upgradeMutation = useUpgradeToPro();

  const [showConfirm, setShowConfirm] = useState(false);
  const isAlreadySubscribed = subscription?.isSubscribed;
  const isUpgrading = upgradeMutation.isPending;

  const handleUpgrade = () => {
    setShowConfirm(true);
  };

  const handleConfirmUpgrade = async () => {
    setShowConfirm(false);
    try {
      await upgradeMutation.mutateAsync('PRO');
    } catch {
      // Toast handles the error message
    }
  };

  return (
    <div className="relative mx-auto max-w-6xl space-y-10">
      <ConfirmDialog
        isOpen={showConfirm}
        title="Upgrade to PRO?"
        message="This will upgrade your account to the PRO tier, giving you unlimited meetings, team collaboration, and calendar sync. This action cannot be undone automatically."
        confirmText="Yes, upgrade to PRO"
        cancelText="Cancel"
        variant="info"
        onConfirm={handleConfirmUpgrade}
        onCancel={() => setShowConfirm(false)}
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <button
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/70 backdrop-blur-xl transition hover:bg-white/[0.08] hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-[1.75rem] bg-gradient-to-br from-cyan-500/30 to-purple-500/20 shadow-[0_18px_40px_rgba(124,92,255,0.35)]">
            <Crown className="h-8 w-8 text-cyan-300" />
          </div>
          <h1 className="mt-6 font-display text-4xl font-bold tracking-tight text-white md:text-5xl">
            Upgrade your workspace
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-white/60">
            Unlock unlimited meetings, team collaboration, calendar sync, and analytics —
            request a PRO upgrade from your workspace admin.
          </p>
        </div>
      </motion.div>

      {/* Tier comparison cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:gap-8">
        {TIERS.map((tier, index) => {
          const Icon = tier.icon;
          const isCurrentPlan = !tier.highlight && !isAlreadySubscribed;
          const isTargetPlan = tier.highlight;
          const isCurrentTarget =
            isTargetPlan && isAlreadySubscribed;

          return (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * (index + 1), ease: [0.22, 1, 0.36, 1] }}
            >
              <Card
                className={`relative overflow-hidden p-8 ${
                  tier.highlight
                    ? 'border-cyan-400/30 bg-[radial-gradient(circle_at_top_right,rgba(48,213,246,0.1),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(124,92,255,0.08),transparent_40%),rgba(255,255,255,0.02)]'
                    : ''
                }`}
              >
                {tier.highlight && (
                  <>
                    <div className="absolute right-[-3rem] top-[-3rem] h-32 w-32 rounded-full bg-cyan-400/10 blur-3xl" />
                    <div className="absolute -inset-[1px] rounded-[1.5rem] border border-cyan-400/10 pointer-events-none" />
                  </>
                )}

                <div className="relative">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`grid h-12 w-12 place-items-center rounded-2xl ${
                          tier.highlight
                            ? 'bg-gradient-to-br from-cyan-500/30 to-purple-500/20'
                            : 'bg-white/[0.06]'
                        }`}
                      >
                        <Icon className={`h-6 w-6 ${tier.color}`} />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">{tier.name}</h2>
                        <p className="text-sm text-white/55">
                          {tier.price}
                          <span className="text-white/35">/{tier.period}</span>
                        </p>
                      </div>
                    </div>

                    {isCurrentPlan && (
                      <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-medium text-white/70">
                        Current
                      </span>
                    )}
                    {isCurrentTarget && (
                      <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-300">
                        Active
                      </span>
                    )}
                    {tier.highlight && !isAlreadySubscribed && (
                      <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-300">
                        Recommended
                      </span>
                    )}
                  </div>

                  <div className="mt-8 space-y-3">
                    {tier.features.map((feature) => (
                      <div key={feature.text} className="flex items-center gap-3">
                        {feature.included ? (
                          <CheckCircle2 className="h-5 w-5 shrink-0 text-cyan-300" />
                        ) : (
                          <X className="h-5 w-5 shrink-0 text-white/25" />
                        )}
                        <span
                          className={`text-sm ${
                            feature.included ? 'text-white/80' : 'text-white/35'
                          }`}
                        >
                          {feature.text}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8">
                    {isAlreadySubscribed ? (
                      <Button disabled className="w-full" variant="outline" size="lg">
                        <Crown className="mr-2 h-4 w-4 text-cyan-300" />
                        You're on PRO
                      </Button>
                    ) : (
                      <>
                        {tier.highlight ? (
                          <Button
                            onClick={handleUpgrade}
                            disabled={isUpgrading}
                            className="w-full"
                            size="lg"
                            variant="default"
                          >
                            {isUpgrading ? (
                              'Upgrading…'
                            ) : (
                              <>
                                <Sparkles className="mr-2 h-4 w-4" />
                                Upgrade to PRO
                              </>
                            )}
                          </Button>
                        ) : (
                          <Button
                            disabled
                            className="w-full"
                            size="lg"
                            variant="outline"
                          >
                            Current plan
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Admin contact section — only visible to non-admin users (or when upgrade fails) */}
      {!isAlreadySubscribed && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <Card className="overflow-hidden p-8">
            <div className="relative">
              <div className="flex items-start gap-5">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-amber-500/25 to-orange-500/15">
                  <ShieldCheck className="h-7 w-7 text-amber-300" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-white">
                    How the upgrade works
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-white/60">
                    Since there's no payment gateway connected yet, upgrades are
                    handled through an admin-controlled flow. If your account email
                    matches the <code className="rounded-md bg-white/[0.06] px-2 py-0.5 font-mono text-xs text-cyan-300">ADMIN_EMAIL</code>{' '}
                    environment variable configured on the server, the
                    <strong className="text-white/80"> Upgrade to PRO</strong> button above
                    will upgrade your account immediately.
                  </p>
                  <p className="mt-3 text-sm leading-7 text-white/60">
                    If your email doesn't match, the server will return a 403
                    error. In that case, ask your workspace admin to either:
                  </p>
                  <ul className="mt-3 list-inside space-y-2 text-sm text-white/60">
                    <li className="flex items-start gap-2">
                      <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-cyan-400/15 text-xs text-cyan-300">
                        1
                      </span>
                      Set <code className="rounded-md bg-white/[0.06] px-2 py-0.5 font-mono text-xs">ADMIN_EMAIL</code> in the server's{' '}
                      <code className="rounded-md bg-white/[0.06] px-2 py-0.5 font-mono text-xs">.env</code> to match your account email, or
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-cyan-400/15 text-xs text-cyan-300">
                        2
                      </span>
                      Upgrade you directly via the database
                    </li>
                  </ul>
                  <p className="mt-4 text-xs text-white/45">
                    Your current email on file:{' '}
                    <span className="font-mono text-white/70">
                      {currentUser?.email || '…'}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Quick actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-wrap items-center justify-center gap-4"
      >
        <Button variant="outline" onClick={() => navigate('/dashboard/upload')}>
          <Upload className="mr-2 h-4 w-4" />
          Upload a meeting
        </Button>
        <Button variant="ghost" onClick={() => navigate('/dashboard')}>
          Go to dashboard
        </Button>
      </motion.div>
    </div>
  );
};

export default SubscriptionUpgrade;
