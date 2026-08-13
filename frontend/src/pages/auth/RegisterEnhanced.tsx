import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ArrowRight, Check, Building2, User, ArrowLeft } from 'lucide-react';
import { useRegister } from '@/hooks/useAuth';
import { authService } from '@/services';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { toast } from 'sonner';
import { apiClient } from '@/services/api.client';

const GRAD = '#5B3FD6';
const GRAD2 = '#8B5CF6';

const DOT_GRID: React.CSSProperties = {
  backgroundImage: 'radial-gradient(circle, rgba(91,63,214,0.08) 1.5px, transparent 1.5px)',
  backgroundSize: '26px 26px',
};

type Step = 'type' | 'individual' | 'organization' | 'pending';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const registerMutation = useRegister();
  const [step, setStep] = useState<Step>('type');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [orgName, setOrgName] = useState('');
  const [orgEmail, setOrgEmail] = useState('');

  const handleIndividualSubmit = async () => {
    if (pw !== pw2) {
      toast.error('Passwords do not match.');
      return;
    }
    try {
      await registerMutation.mutateAsync({ name, email, password: pw });
      navigate(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch (err) {
      const e = err as { message?: string };
      toast.error(e?.message || 'Registration failed.');
    }
  };

  const handleOrganizationSubmit = async () => {
    if (!orgName.trim() || !orgEmail.trim()) {
      toast.error('Please fill in all fields.');
      return;
    }
    try {
      await apiClient.post('/organizations/request', { name: orgName, contactEmail: orgEmail });
      setStep('pending');
    } catch (err) {
      const e = err as { message?: string };
      toast.error(e?.message || 'Failed to submit request');
    }
  };

  if (step === 'pending') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4 py-12"
        style={{ background: '#FCFBFF' }}>
        <div className="absolute inset-0 pointer-events-none" style={DOT_GRID} />
        <div className="relative w-full max-w-[440px] bg-white rounded-[24px] px-8 py-10 text-center"
          style={{ border: '1px solid rgba(91,63,214,0.12)', boxShadow: '0 4px 6px rgba(0,0,0,0.03), 0 16px 48px rgba(91,63,214,0.10)' }}>
          <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${GRAD}, ${GRAD2})` }}>
            <Check className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#1D1B22] mb-3">Request Submitted</h1>
          <p className="text-sm text-[#64607A] mb-2">
            Thank you for your interest in Meetiva Enterprise, <strong>{orgName}</strong>.
          </p>
          <p className="text-sm text-[#64607A] mb-6">
            Our team will review your request and contact you at <strong>{orgEmail}</strong> with your Admin credentials.
          </p>
          <button onClick={() => navigate('/login')}
            className="w-full py-3 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90"
            style={{ background: `linear-gradient(135deg, ${GRAD}, ${GRAD2})` }}>
            Back to Login
          </button>
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

      <div className="relative w-full max-w-[440px] mb-8">
        <button onClick={() => navigate('/')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold mb-5 transition-colors"
          style={{ color: '#64607A' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = GRAD; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#64607A'; }}>
          <ChevronRight size={13} className="rotate-180" /> Back to home
        </button>
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg" style={{ background: `linear-gradient(135deg, ${GRAD}, ${GRAD2})` }}>M</div>
          <span className="font-bold text-[#1D1B22] text-xl tracking-tight">Meetiva</span>
        </div>
      </div>

      <div className="relative w-full max-w-[440px] bg-white rounded-[24px] px-8 py-8"
        style={{ border: '1px solid rgba(91,63,214,0.12)', boxShadow: '0 4px 6px rgba(0,0,0,0.03), 0 16px 48px rgba(91,63,214,0.10), inset 0 1px 0 rgba(255,255,255,1)' }}>

        {step === 'type' && (
          <>
            <h1 className="text-[26px] font-bold text-[#1D1B22] tracking-tight mb-1">Create your account</h1>
            <p className="text-sm text-[#64607A] mb-7">Join thousands of teams that never miss a moment.</p>

            <div className="space-y-3">
              <button onClick={() => setStep('individual')}
                className="w-full flex items-center gap-4 p-5 rounded-2xl border text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
                style={{ borderColor: 'rgba(91,63,214,0.14)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = GRAD; (e.currentTarget as HTMLElement).style.background = '#F5F3FF'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(91,63,214,0.14)'; (e.currentTarget as HTMLElement).style.background = 'white'; }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${GRAD}15, ${GRAD2}15)` }}>
                  <User size={22} style={{ color: GRAD }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-[#1D1B22]">Individual</p>
                  <p className="text-xs text-[#64607A] mt-0.5">Personal workspace for you and your team</p>
                </div>
                <ArrowRight size={16} className="text-[#94A3B8]" />
              </button>

              <button onClick={() => setStep('organization')}
                className="w-full flex items-center gap-4 p-5 rounded-2xl border text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
                style={{ borderColor: 'rgba(91,63,214,0.14)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = GRAD; (e.currentTarget as HTMLElement).style.background = '#F5F3FF'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(91,63,214,0.14)'; (e.currentTarget as HTMLElement).style.background = 'white'; }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${GRAD}15, ${GRAD2}15)` }}>
                  <Building2 size={22} style={{ color: GRAD }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-[#1D1B22]">Organization</p>
                  <p className="text-xs text-[#64607A] mt-0.5">Enterprise plan with role-based access control</p>
                </div>
                <ArrowRight size={16} className="text-[#94A3B8]" />
              </button>
            </div>
          </>
        )}

        {step === 'individual' && (
          <>
            <div className="flex items-center gap-2 mb-5">
              <button onClick={() => setStep('type')} className="p-1 rounded-lg hover:bg-[#F5F3FF] transition-colors">
                <ArrowLeft size={16} style={{ color: GRAD }} />
              </button>
              <h1 className="text-[26px] font-bold text-[#1D1B22] tracking-tight">Create your account</h1>
            </div>
            <p className="text-sm text-[#64607A] mb-7">Join thousands of teams that never miss a moment.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[#1D1B22] uppercase tracking-widest mb-2">Full name</label>
                <Input placeholder="Jane Smith" value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#1D1B22] uppercase tracking-widest mb-2">Email</label>
                <Input placeholder="you@company.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#1D1B22] uppercase tracking-widest mb-2">Password</label>
                  <PasswordInput placeholder="Create" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#1D1B22] uppercase tracking-widest mb-2">Confirm</label>
                  <PasswordInput placeholder="Repeat" value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" />
                </div>
              </div>

              <button onClick={handleIndividualSubmit} disabled={registerMutation.isPending}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: `linear-gradient(135deg, ${GRAD}, ${GRAD2})`, boxShadow: `0 8px 28px rgba(91,63,214,0.38)` }}>
                {registerMutation.isPending ? 'Creating...' : 'Create free workspace'} <ArrowRight size={15} />
              </button>

            
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-[#E4E0F5]" />
                <span className="text-[11px] text-[#64607A]">or</span>
                <div className="flex-1 h-px bg-[#E4E0F5]" />
              </div>

              <button
                onClick={authService.googleLoginRedirect}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all bg-white text-[#1D1B22]"
                style={{ borderColor: 'rgba(91,63,214,0.14)' }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(91,63,214,0.28)'; el.style.background = '#EDE9FF'; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(91,63,214,0.14)'; el.style.background = 'white'; }}>
                <span className="rounded-full flex items-center justify-center text-[8px] font-black text-white flex-shrink-0" style={{ background: '#4285F4', width: 18, height: 18 }}>G</span>
                Google
              </button>
            </div>
          </>
        )}

        {step === 'organization' && (
          <>
            <div className="flex items-center gap-2 mb-5">
              <button onClick={() => setStep('type')} className="p-1 rounded-lg hover:bg-[#F5F3FF] transition-colors">
                <ArrowLeft size={16} style={{ color: GRAD }} />
              </button>
              <h1 className="text-[26px] font-bold text-[#1D1B22] tracking-tight">Enterprise Request</h1>
            </div>
            <p className="text-sm text-[#64607A] mb-7">Tell us about your organization. We'll set up your Enterprise workspace.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[#1D1B22] uppercase tracking-widest mb-2">Organization Name</label>
                <Input placeholder="Acme Corp" value={orgName} onChange={(e) => setOrgName(e.target.value)} />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#1D1B22] uppercase tracking-widest mb-2">Contact Email</label>
                <Input placeholder="admin@acme.com" type="email" value={orgEmail} onChange={(e) => setOrgEmail(e.target.value)} />
              </div>

              <button onClick={handleOrganizationSubmit}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90 hover:scale-[1.01] active:scale-[0.98]"
                style={{ background: `linear-gradient(135deg, ${GRAD}, ${GRAD2})`, boxShadow: `0 8px 28px rgba(91,63,214,0.38)` }}>
                Submit Request <ArrowRight size={15} />
              </button>

              <p className="text-center text-xs text-[#94A3B8]">
                Our team will review your request and contact you with Admin credentials.
              </p>
            </div>
          </>
        )}

        <p className="mt-7 text-center text-sm text-[#64607A]">
          Already have an account?{' '}
          <button onClick={() => navigate('/login')} className="font-bold hover:underline" style={{ color: GRAD }}>
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
