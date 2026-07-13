import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, CheckCircle, Lock, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useRequestPasswordReset, useResetPassword } from '@/hooks/useAuth';
import {
  passwordResetSchema,
  passwordResetConfirmSchema,
  zodResolver,
  type SchemaOutput,
} from '@/lib/validation';

type RequestFormData = SchemaOutput<typeof passwordResetSchema>;

const resetFormSchema = passwordResetConfirmSchema.extend({
  confirmPassword: passwordResetConfirmSchema.shape.password,
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type ResetFormData = SchemaOutput<typeof resetFormSchema>;

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [step, setStep] = useState<'request' | 'reset' | 'done'>(
    token ? 'reset' : 'request'
  );
  const [serverError, setServerError] = useState('');
  const requestPasswordReset = useRequestPasswordReset();
  const resetPassword = useResetPassword();

  // ── Email request form (step 1) ──────────────────────────────────────────
  const requestForm = useForm<RequestFormData>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: { email: '' },
  });

  const handleRequestSubmit = async (data: RequestFormData) => {
    setServerError('');
    try {
      await requestPasswordReset.mutateAsync(data.email);
      setStep('done');
    } catch (error: unknown) {
      const err = error as { message?: string };
      setServerError(err?.message || 'Something went wrong. Please try again.');
    }
  };

  // ── Password reset form (step 2) ─────────────────────────────────────────
  const resetForm = useForm<ResetFormData>({
    resolver: zodResolver(resetFormSchema),
    defaultValues: { token: token || '', password: '', confirmPassword: '' },
  });

  const handleResetSubmit = async (data: ResetFormData) => {
    setServerError('');
    try {
      await resetPassword.mutateAsync({ token: data.token, password: data.password });
      setStep('done');
    } catch (error: unknown) {
      const err = error as { message?: string };
      setServerError(err?.message || 'Failed to reset password. The link may have expired.');
    }
  };

  // ── Done state (shared) ──────────────────────────────────────────────────
  if (step === 'done') {
    return (
      <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(124,92,255,0.2),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(48,213,246,0.16),transparent_26%)]" />
        <div className="absolute inset-0 fine-grid opacity-40" />

        <Link to="/" className="absolute left-6 top-6 z-20 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/70 backdrop-blur-xl transition hover:bg-white/[0.08] hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <div className="relative z-10 flex min-h-screen items-center justify-center px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md rounded-[2rem] border border-white/10 bg-slate-950/75 p-10 shadow-[0_40px_120px_rgba(0,0,0,0.45)] backdrop-blur-2xl text-center"
          >
            <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-emerald-500/20 shadow-[0_0_40px_rgba(52,211,153,0.2)]">
              <CheckCircle className="h-8 w-8 text-emerald-400" />
            </div>
            <h2 className="mb-3 text-2xl font-bold tracking-tight text-white">
              {token ? 'Password updated' : 'Check your inbox'}
            </h2>
            <p className="mb-8 text-sm leading-6 text-white/55">
              {token
                ? 'Your password has been updated successfully. You can now sign in with your new password.'
                : 'If an account with that email exists, we\'ve sent a password reset link. Please check your inbox and spam folder.'}
            </p>
            <Button size="lg" className="w-full" onClick={() => navigate('/login')}>
              Back to sign in
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── Request form (no token) ──────────────────────────────────────────────
  if (step === 'request') {
    return (
      <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(124,92,255,0.2),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(48,213,246,0.16),transparent_26%)]" />
        <div className="absolute inset-0 fine-grid opacity-40" />

        <Link to="/login" className="absolute left-6 top-6 z-20 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/70 backdrop-blur-xl transition hover:bg-white/[0.08] hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>

        <div className="relative z-10 grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
          <div className="hidden flex-col justify-between p-10 lg:flex">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300/80 backdrop-blur-xl">
                <Sparkles className="h-3.5 w-3.5" />
                Password reset
              </div>
              <div className="max-w-xl space-y-5">
                <h1 className="font-display text-6xl font-bold leading-[0.92] tracking-tight text-white xl:text-7xl">Never lose access to your flow.</h1>
                <p className="max-w-lg text-lg leading-8 text-white/60">
                  Enter your registered email and we'll send you a secure link to reset your password. The link expires in one hour.
                </p>
              </div>
            </div>

            <div className="grid max-w-xl gap-4 md:grid-cols-3">
              {[
                ['Secure tokens', '256-bit encrypted'],
                ['One-hour expiry', 'Auto-invalidates'],
                ['Instant recovery', 'Back in minutes'],
              ].map(([title, description]) => (
                <div key={title} className="glass-panel rounded-[1.5rem] p-5">
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="mt-2 text-sm text-white/55">{description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center px-6 py-20 lg:justify-end lg:px-10">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-slate-950/75 p-8 shadow-[0_40px_120px_rgba(0,0,0,0.45)] backdrop-blur-2xl"
            >
              <div className="mb-8 space-y-3 text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-primary shadow-[0_18px_40px_rgba(124,92,255,0.35)]">
                  <Lock className="h-7 w-7 text-white" />
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-white">Reset password</h2>
                <p className="text-sm text-white/55">Enter the email you used to sign up.</p>
              </div>

              {serverError && (
                <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{serverError}</div>
              )}

              <form onSubmit={requestForm.handleSubmit(handleRequestSubmit)} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/75">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                    <Input
                      type="email"
                      id="reset-email"
                      error={requestForm.formState.errors.email?.message}
                      className="pl-11"
                      placeholder="you@company.com"
                      {...requestForm.register('email')}
                    />
                  </div>
                </div>

                <Button type="submit" size="lg" className="w-full" isLoading={requestForm.formState.isSubmitting}>
                  {requestForm.formState.isSubmitting ? 'Sending reset link' : 'Send reset link'}
                  {!requestForm.formState.isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </form>

              <div className="mt-8 border-t border-white/10 pt-6 text-center text-sm text-white/55">
                Remember your password?{' '}
                <Link to="/login" className="font-medium text-cyan-300 transition hover:text-white">Sign in</Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  // ── Reset form (token present) ───────────────────────────────────────────
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(124,92,255,0.2),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(48,213,246,0.16),transparent_26%)]" />
      <div className="absolute inset-0 fine-grid opacity-40" />

      <Link to="/login" className="absolute left-6 top-6 z-20 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/70 backdrop-blur-xl transition hover:bg-white/[0.08] hover:text-white">
        <ArrowLeft className="h-4 w-4" />
        Back to sign in
      </Link>

      <div className="relative z-10 grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
        <div className="hidden flex-col justify-between p-10 lg:flex">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300/80 backdrop-blur-xl">
              <Sparkles className="h-3.5 w-3.5" />
              New password
            </div>
            <div className="max-w-xl space-y-5">
              <h1 className="font-display text-6xl font-bold leading-[0.92] tracking-tight text-white xl:text-7xl">Set a strong new password.</h1>
              <p className="max-w-lg text-lg leading-8 text-white/60">
                Create a new password for your account. Make it at least eight characters — a mix of letters, numbers, and symbols is best.
              </p>
            </div>
          </div>

          <div className="grid max-w-xl gap-4 md:grid-cols-3">
            {[
              ['8+ characters', 'Minimum length'],
              ['Strong security', 'Bcrypt hashed'],
              ['Instant effect', 'Old one revoked'],
            ].map(([title, description]) => (
              <div key={title} className="glass-panel rounded-[1.5rem] p-5">
                <p className="text-sm font-semibold text-white">{title}</p>
                <p className="mt-2 text-sm text-white/55">{description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center px-6 py-20 lg:justify-end lg:px-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-slate-950/75 p-8 shadow-[0_40px_120px_rgba(0,0,0,0.45)] backdrop-blur-2xl"
          >
            <div className="mb-8 space-y-3 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-primary shadow-[0_18px_40px_rgba(124,92,255,0.35)]">
                <ShieldCheck className="h-7 w-7 text-white" />
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-white">Choose new password</h2>
              <p className="text-sm text-white/55">Must be at least 8 characters.</p>
            </div>

            {serverError && (
              <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{serverError}</div>
            )}

            <form onSubmit={resetForm.handleSubmit(handleResetSubmit)} className="space-y-5">
              <input type="hidden" {...resetForm.register('token')} />

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/75">New password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                  <Input
                    type="password"
                    id="new-password"
                    error={resetForm.formState.errors.password?.message}
                    className="pl-11"
                    placeholder="Minimum 8 characters"
                    {...resetForm.register('password')}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/75">Confirm new password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                  <Input
                    type="password"
                    id="confirm-password"
                    error={resetForm.formState.errors.confirmPassword?.message}
                    className="pl-11"
                    placeholder="Repeat your password"
                    {...resetForm.register('confirmPassword')}
                  />
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full" isLoading={resetForm.formState.isSubmitting}>
                {resetForm.formState.isSubmitting ? 'Updating password' : 'Update password'}
                {!resetForm.formState.isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </form>

            <div className="mt-8 border-t border-white/10 pt-6 text-center text-sm text-white/55">
              Changed your mind?{' '}
              <Link to="/login" className="font-medium text-cyan-300 transition hover:text-white">Sign in</Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
