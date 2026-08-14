import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronRight, ArrowRight, ShieldCheck, Mail, CheckCircle } from 'lucide-react';
import { useVerifyOtp, useResendOtp } from '@/hooks/useAuth';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';
import { useAppSelector } from '@/store/hooks';

const GRAD = '#5B3FD6';
const GRAD2 = '#8B5CF6';

const DOT_GRID: React.CSSProperties = {
  backgroundImage: 'radial-gradient(circle, rgba(91,63,214,0.08) 1.5px, transparent 1.5px)',
  backgroundSize: '26px 26px',
};

const VerifyEmail: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';

  const verifyOtp = useVerifyOtp();
  const resendOtp = useResendOtp();

  const [otp, setOtp] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [verified, setVerified] = useState(false);

  const user = useAppSelector((state) => state.auth.user);

  // If already verified, redirect to dashboard
  useEffect(() => {
    if (user?.isVerified) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  // Cooldown timer for resend
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleVerify = async () => {
    if (!email || otp.length !== 6) return;
    try {
      await verifyOtp.mutateAsync({ email, otp });
      setVerified(true);
    } catch (err) {
      const e = err as { message?: string };
      toast.error(e?.message || 'Invalid or expired code.');
    }
  };

  const handleResend = useCallback(async () => {
    if (!email || cooldown > 0) return;
    try {
      await resendOtp.mutateAsync(email);
      setCooldown(60);
      toast.success('New code sent. Check your inbox.');
    } catch (err) {
      const e = err as { message?: string };
      if (e?.message?.includes('wait')) {
        toast.error(e.message);
      } else {
        toast.error(e?.message || 'Failed to resend code.');
      }
    }
  }, [email, cooldown, resendOtp]);

  // No auto-resend on mount — registration/login already sent the initial OTP.

  // ── Verified success state ──────────────────────────────────────────────
  if (verified) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4 py-12"
        style={{ background: '#FCFBFF' }}>
        <div className="absolute inset-0 pointer-events-none" style={DOT_GRID} />
        <div className="absolute -top-32 right-1/4 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{ background: `radial-gradient(circle, ${GRAD2}0C 0%, transparent 60%)`, filter: 'blur(60px)' }} />

        <div className="relative w-full max-w-[440px] bg-white rounded-[24px] px-8 py-10 text-center"
          style={{ border: '1px solid rgba(91,63,214,0.12)', boxShadow: '0 4px 6px rgba(0,0,0,0.03), 0 16px 48px rgba(91,63,214,0.10), inset 0 1px 0 rgba(255,255,255,1)' }}>
          <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl" style={{ background: 'rgba(34,197,94,0.1)' }}>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
          <h1 className="text-[26px] font-bold text-[#1D1B22] tracking-tight mb-2">Email verified!</h1>
          <p className="text-sm text-[#64607A] mb-7">Your account is now active. You can access all features.</p>
          <button onClick={() => navigate('/dashboard')}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90 hover:scale-[1.01] active:scale-[0.98]"
            style={{ background: `linear-gradient(135deg, ${GRAD}, ${GRAD2})`, boxShadow: '0 8px 28px rgba(91,63,214,0.38)' }}>
            Go to dashboard <ArrowRight size={15} />
          </button>
        </div>
      </div>
    );
  }

  // ── OTP input state ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4 py-12"
      style={{ background: '#FCFBFF' }}>
      <div className="absolute inset-0 pointer-events-none" style={DOT_GRID} />
      <div className="absolute -top-32 right-1/4 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${GRAD2}0C 0%, transparent 60%)`, filter: 'blur(60px)' }} />
      <div className="absolute -bottom-32 left-1/4 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(244,114,182,0.07) 0%, transparent 60%)', filter: 'blur(60px)' }} />

      <div className="relative w-full max-w-[440px] mb-8">
        <button onClick={() => navigate('/login')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold mb-5 transition-colors"
          style={{ color: '#64607A' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = GRAD; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#64607A'; }}>
          <ChevronRight size={13} className="rotate-180" /> Back to sign in
        </button>
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg" style={{ background: `linear-gradient(135deg, ${GRAD}, ${GRAD2})` }}>M</div>
          <span className="font-bold text-[#1D1B22] text-xl tracking-tight">Meetiva</span>
        </div>
      </div>

      <div className="relative w-full max-w-[440px] bg-white rounded-[24px] px-8 py-8"
        style={{ border: '1px solid rgba(91,63,214,0.12)', boxShadow: '0 4px 6px rgba(0,0,0,0.03), 0 16px 48px rgba(91,63,214,0.10), inset 0 1px 0 rgba(255,255,255,1)' }}>
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl" style={{ background: `linear-gradient(135deg, ${GRAD}, ${GRAD2})`, boxShadow: '0 8px 24px rgba(91,63,214,0.3)' }}>
            <ShieldCheck className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-[26px] font-bold text-[#1D1B22] tracking-tight mb-1">Verify your email</h1>
          <p className="text-sm text-[#64607A]">
            We sent a 6-digit code to<br />
            <span className="font-semibold text-[#1D1B22]">{email || 'your email'}</span>
          </p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-[11px] font-bold text-[#1D1B22] uppercase tracking-widest mb-2">Verification code</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: '#9CA3AF' }} />
              <Input
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                className="text-center text-lg tracking-[0.3em] font-mono pl-11"
                maxLength={6}
              />
            </div>
          </div>

          <button onClick={handleVerify} disabled={otp.length !== 6 || verifyOtp.isPending}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: `linear-gradient(135deg, ${GRAD}, ${GRAD2})`, boxShadow: '0 8px 28px rgba(91,63,214,0.38)' }}>
            {verifyOtp.isPending ? 'Verifying...' : 'Verify email'} <ArrowRight size={15} />
          </button>

          <div className="text-center">
            <button onClick={handleResend} disabled={cooldown > 0 || resendOtp.isPending}
              className="text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ color: cooldown > 0 ? '#9CA3AF' : GRAD }}>
              {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
            </button>
          </div>
        </div>

        <p className="mt-7 text-center text-sm text-[#64607A]">
          Wrong email?{' '}
          <button onClick={() => navigate('/register')} className="font-bold hover:underline" style={{ color: GRAD }}>
            Create a new account
          </button>
        </p>
      </div>
    </div>
  );
};

export default VerifyEmail;
