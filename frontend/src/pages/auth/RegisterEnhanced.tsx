import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ArrowRight, Check } from 'lucide-react';
import { useRegister } from '@/hooks/useAuth';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';

const GRAD = '#4B2E83';
const GRAD2 = '#8B5CF6';

const DOT_GRID: React.CSSProperties = {
  backgroundImage: 'radial-gradient(circle, rgba(91,63,214,0.08) 1.5px, transparent 1.5px)',
  backgroundSize: '26px 26px',
};

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const registerMutation = useRegister();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');

  const handleSubmit = async () => {
    if (pw !== pw2) {
      toast.error('Passwords do not match.');
      return;
    }
    try {
      await registerMutation.mutateAsync({ name, email, password: pw });
      navigate('/dashboard');
    } catch (err) {
      const e = err as { message?: string };
      toast.error(e?.message || 'Registration failed.');
    }
  };

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
        <h1 className="text-[26px] font-bold text-[#1D1B22] tracking-tight mb-1">Create your account</h1>
        <p className="text-sm text-[#64607A] mb-7">Join thousands of teams that never miss a moment.</p>

        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-[#1D1B22] uppercase tracking-widest mb-2">Full name</label>
            <Input placeholder="Jane Smith" value={name} onChange={setName} />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#1D1B22] uppercase tracking-widest mb-2">Email</label>
            <Input placeholder="you@company.com" type="email" value={email} onChange={setEmail} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[#1D1B22] uppercase tracking-widest mb-2">Password</label>
              <Input placeholder="Create" type="password" value={pw} onChange={setPw} />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#1D1B22] uppercase tracking-widest mb-2">Confirm</label>
              <Input placeholder="Repeat" type="password" value={pw2} onChange={setPw2} />
            </div>
          </div>

          <button onClick={handleSubmit} disabled={registerMutation.isPending}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: `linear-gradient(135deg, ${GRAD}, ${GRAD2})`, boxShadow: `0 8px 28px rgba(91,63,214,0.38)` }}>
            {registerMutation.isPending ? 'Creating...' : 'Create free workspace'} <ArrowRight size={15} />
          </button>

          <div className="flex items-center justify-center gap-1.5">
            <Check size={12} style={{ color: GRAD }} />
            <span className="text-[11px] text-[#64607A]">Free forever · No credit card · Cancel anytime</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[#E4E0F5]" />
            <span className="text-[11px] text-[#64607A]">or</span>
            <div className="flex-1 h-px bg-[#E4E0F5]" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { name: 'Google', color: '#4285F4', letter: 'G' },
              { name: 'GitHub', color: '#24292F', letter: 'GH' },
            ].map(p => (
              <button key={p.name}
                onClick={() => toast.info(`${p.name} sign-up coming soon.`)}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all bg-white text-[#1D1B22]"
                style={{ borderColor: 'rgba(91,63,214,0.14)' }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(91,63,214,0.28)'; el.style.background = '#EDE9FF'; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(91,63,214,0.14)'; el.style.background = 'white'; }}>
                <span className="rounded-full flex items-center justify-center text-[8px] font-black text-white flex-shrink-0" style={{ background: p.color, width: 18, height: 18 }}>{p.letter}</span>
                {p.name}
              </button>
            ))}
          </div>
        </div>

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
