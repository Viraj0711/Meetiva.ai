import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Lock, Mail, ShieldCheck, Sparkles, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAppDispatch } from '@/store/hooks';
import { registerAsync } from '@/store/slices/authSlice';

const RegisterEnhanced: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) return setError('All fields are required.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirmPassword) return setError('Passwords do not match.');

    try {
      setLoading(true);
      await dispatch(registerAsync({ name: name.trim(), email: email.trim(), password })).unwrap();
      navigate('/dashboard');
    } catch (err) {
      setError((err as string) || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(124,92,255,0.2),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(48,213,246,0.16),transparent_26%)]" />
      <div className="absolute inset-0 fine-grid opacity-40" />

      <Link to="/" className="absolute left-6 top-6 z-20 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/70 backdrop-blur-xl transition hover:bg-white/[0.08] hover:text-white">
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      <div className="relative z-10 grid min-h-screen lg:grid-cols-[0.95fr_1.05fr]">
        <div className="hidden flex-col justify-between p-10 lg:flex">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300/80 backdrop-blur-xl">
              <Sparkles className="h-3.5 w-3.5" />
              Premium onboarding
            </div>
            <div className="max-w-xl space-y-5">
              <h1 className="font-display text-6xl font-bold leading-[0.92] tracking-tight text-white xl:text-7xl">Create the workspace that makes meetings move.</h1>
              <p className="max-w-lg text-lg leading-8 text-white/60">
                Start with a cinematic workspace, then invite your team into an AI system that extracts tasks and decisions in real time.
              </p>
            </div>
          </div>

          <div className="grid max-w-xl gap-4 md:grid-cols-3">
            {[
              ['Fast setup', 'Go live in minutes'],
              ['AI summaries', 'After every meeting'],
              ['Calendar sync', 'Momentum continues'],
            ].map(([title, description]) => (
              <div key={title} className="glass-panel rounded-[1.5rem] p-5">
                <p className="text-sm font-semibold text-white">{title}</p>
                <p className="mt-2 text-sm text-white/55">{description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center px-6 py-20 lg:justify-start lg:px-10">
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
              <h2 className="text-3xl font-bold tracking-tight text-white">Create your account</h2>
              <p className="text-sm text-white/55">Start the premium meeting workspace.</p>
            </div>

            {error && <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/75">Full name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                  <Input value={name} onChange={(e) => setName(e.target.value)} className="pl-11" placeholder="Your name" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/75">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-11" placeholder="you@company.com" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/75">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-11" placeholder="Minimum 8 characters" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/75">Confirm password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                  <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="pl-11" placeholder="Repeat password" />
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full" isLoading={loading}>
                {loading ? 'Creating workspace' : 'Create workspace'}
                {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </form>

            <div className="mt-8 border-t border-white/10 pt-6 text-center text-sm text-white/55">
              Already have an account? <Link to="/login" className="font-medium text-cyan-300 transition hover:text-white">Sign in</Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default RegisterEnhanced;
