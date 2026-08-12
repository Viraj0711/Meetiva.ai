import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { ChevronRight, ArrowRight, Check, Lock, Mail } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
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

const GRAD = '#5B3FD6';
const GRAD2 = '#8B5CF6';

const DOT_GRID: React.CSSProperties = {
  backgroundImage: 'radial-gradient(circle, rgba(91,63,214,0.08) 1.5px, transparent 1.5px)',
  backgroundSize: '26px 26px',
};

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

  if (step === 'done') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4 py-12"
        style={{ background: '#FCFBFF' }}>
        <div className="absolute inset-0 pointer-events-none" style={DOT_GRID} />
        <div className="relative w-full max-w-[420px] bg-white rounded-[24px] px-8 py-10 text-center"
          style={{ border: '1px solid rgba(91,63,214,0.12)', boxShadow: '0 4px 6px rgba(0,0,0,0.03), 0 16px 48px rgba(91,63,214,0.10)' }}>
          <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #10B981, #34D399)' }}>
            <Check className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#1D1B22] mb-3">
            {token ? 'Password updated' : 'Check your inbox'}
          </h1>
          <p className="text-sm text-[#64607A] mb-6">
            {token
              ? 'Your password has been updated successfully. You can now sign in with your new password.'
              : "If an account with that email exists, we've sent a password reset link. Please check your inbox and spam folder."}
          </p>
          <button onClick={() => navigate('/login')}
            className="w-full py-3 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90"
            style={{ background: `linear-gradient(135deg, ${GRAD}, ${GRAD2})` }}>
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  if (step === 'request') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4 py-12"
        style={{ background: '#FCFBFF' }}>
        <div className="absolute inset-0 pointer-events-none" style={DOT_GRID} />
        <div className="absolute -top-32 left-1/4 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{ background: `radial-gradient(circle, ${GRAD}0C 0%, transparent 60%)`, filter: 'blur(60px)' }} />
        <div className="absolute -bottom-32 right-1/4 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(244,114,182,0.07) 0%, transparent 60%)', filter: 'blur(60px)' }} />

        <div className="relative w-full max-w-[420px] mb-8">
          <button onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold mb-5 transition-colors"
            style={{ color: '#64607A' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = GRAD; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#64607A'; }}>
            <ChevronRight size={13} className="rotate-180" /> Back to home
          </button>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg"
              style={{ background: `linear-gradient(135deg, ${GRAD}, ${GRAD2})` }}>M</div>
            <span className="font-bold text-[#1D1B22] text-xl tracking-tight">Meetiva</span>
          </div>
        </div>

        <div className="relative w-full max-w-[420px] bg-white rounded-[24px] px-8 py-8"
          style={{ border: '1px solid rgba(91,63,214,0.12)', boxShadow: '0 4px 6px rgba(0,0,0,0.03), 0 16px 48px rgba(91,63,214,0.10), inset 0 1px 0 rgba(255,255,255,1)' }}>
          <h1 className="text-[26px] font-bold text-[#1D1B22] tracking-tight mb-1">Reset password</h1>
          <p className="text-sm text-[#64607A] mb-7">Enter the email you used to sign up.</p>

          {serverError && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {serverError}
            </div>
          )}

          <form onSubmit={requestForm.handleSubmit(handleRequestSubmit)} className="space-y-5">
            <div>
              <label className="block text-[11px] font-bold text-[#1D1B22] uppercase tracking-widest mb-2">Email address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64607A]" />
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

            <button type="submit"
              disabled={requestForm.formState.isSubmitting}
              className="w-full py-3 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: `linear-gradient(135deg, ${GRAD}, ${GRAD2})` }}>
              {requestForm.formState.isSubmitting ? 'Sending reset link' : 'Send reset link'}
              {!requestForm.formState.isSubmitting && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          <div className="mt-6 border-t border-[#E4E0F5] pt-5 text-center text-sm text-[#64607A]">
            Remember your password?{' '}
            <Link to="/login" className="font-semibold hover:underline" style={{ color: GRAD }}>Sign in</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4 py-12"
      style={{ background: '#FCFBFF' }}>
      <div className="absolute inset-0 pointer-events-none" style={DOT_GRID} />
      <div className="absolute -top-32 right-1/4 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${GRAD2}0C 0%, transparent 60%)`, filter: 'blur(60px)' }} />
      <div className="absolute -bottom-32 left-1/4 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(244,114,182,0.07) 0%, transparent 60%)', filter: 'blur(60px)' }} />

      <div className="relative w-full max-w-[420px] mb-8">
        <button onClick={() => navigate('/')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold mb-5 transition-colors"
          style={{ color: '#64607A' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = GRAD; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#64607A'; }}>
          <ChevronRight size={13} className="rotate-180" /> Back to home
        </button>
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg"
            style={{ background: `linear-gradient(135deg, ${GRAD}, ${GRAD2})` }}>M</div>
          <span className="font-bold text-[#1D1B22] text-xl tracking-tight">Meetiva</span>
        </div>
      </div>

      <div className="relative w-full max-w-[420px] bg-white rounded-[24px] px-8 py-8"
        style={{ border: '1px solid rgba(91,63,214,0.12)', boxShadow: '0 4px 6px rgba(0,0,0,0.03), 0 16px 48px rgba(91,63,214,0.10), inset 0 1px 0 rgba(255,255,255,1)' }}>
        <h1 className="text-[26px] font-bold text-[#1D1B22] tracking-tight mb-1">Choose new password</h1>
        <p className="text-sm text-[#64607A] mb-7">Must be at least 8 characters.</p>

        {serverError && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {serverError}
          </div>
        )}

        <form onSubmit={resetForm.handleSubmit(handleResetSubmit)} className="space-y-5">
          <input type="hidden" {...resetForm.register('token')} />

          <div>
            <label className="block text-[11px] font-bold text-[#1D1B22] uppercase tracking-widest mb-2">New password</label>
            <PasswordInput
              icon={Lock}
              id="new-password"
              error={resetForm.formState.errors.password?.message}
              placeholder="Minimum 8 characters"
              autoComplete="new-password"
              {...resetForm.register('password')}
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#1D1B22] uppercase tracking-widest mb-2">Confirm new password</label>
            <PasswordInput
              icon={Lock}
              id="confirm-password"
              error={resetForm.formState.errors.confirmPassword?.message}
              placeholder="Repeat your password"
              autoComplete="new-password"
              {...resetForm.register('confirmPassword')}
            />
          </div>

          <button type="submit"
            disabled={resetForm.formState.isSubmitting}
            className="w-full py-3 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: `linear-gradient(135deg, ${GRAD}, ${GRAD2})` }}>
            {resetForm.formState.isSubmitting ? 'Updating password' : 'Update password'}
            {!resetForm.formState.isSubmitting && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>

        <div className="mt-6 border-t border-[#E4E0F5] pt-5 text-center text-sm text-[#64607A]">
          Changed your mind?{' '}
          <Link to="/login" className="font-semibold hover:underline" style={{ color: GRAD }}>Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
