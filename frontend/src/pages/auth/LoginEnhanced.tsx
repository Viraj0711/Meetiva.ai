import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAppDispatch } from '@/store/hooks';
import { loginAsync } from '@/store/slices/authSlice';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setServerError('');

    try {
      await dispatch(loginAsync(formData)).unwrap();
      navigate('/dashboard');
    } catch (error: unknown) {
      const err = error as { message?: string };
      setServerError(err?.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
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

      <div className="relative z-10 grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
        <div className="hidden flex-col justify-between p-10 lg:flex">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300/80 backdrop-blur-xl">
              <Sparkles className="h-3.5 w-3.5" />
              Secure access
            </div>
            <div className="max-w-xl space-y-5">
              <h1 className="font-display text-6xl font-bold leading-[0.92] tracking-tight text-white xl:text-7xl">Welcome back to the meeting engine.</h1>
              <p className="max-w-lg text-lg leading-8 text-white/60">
                Sign in to continue the flow of summaries, tasks, and calendar sync without breaking the visual rhythm.
              </p>
            </div>
          </div>

          <div className="grid max-w-xl gap-4 md:grid-cols-3">
            {[
              ['Live summaries', 'Delivered in seconds'],
              ['Task tracking', 'Owners and deadlines'],
              ['Calendar sync', 'Follow-ups keep moving'],
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
              <h2 className="text-3xl font-bold tracking-tight text-white">Sign in</h2>
              <p className="text-sm text-white/55">Access your AI meeting workspace.</p>
            </div>

            {serverError && <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{serverError}</div>}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/75">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    className="pl-11"
                    placeholder="you@company.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/75">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                    className="pl-11 pr-11"
                    placeholder="Enter your password"
                  />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/35 transition hover:text-white">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-white/55">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded border-white/20 bg-white/5 text-cyan-400 focus:ring-cyan-400" />
                  Remember me
                </label>
                <Link to="/" className="text-cyan-300 transition hover:text-white">Forgot password?</Link>
              </div>

              <Button type="submit" size="lg" className="w-full" isLoading={isLoading}>
                {isLoading ? 'Signing in' : 'Enter workspace'}
                {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </form>

            <div className="my-8 border-t border-white/10" />

            <div className="grid gap-3 sm:grid-cols-2">
              <Button variant="outline" className="w-full">Google</Button>
              <Button variant="outline" className="w-full">GitHub</Button>
            </div>

            <p className="mt-6 text-center text-sm text-white/55">
              New here? <Link to="/register" className="font-medium text-cyan-300 transition hover:text-white">Create an account</Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;


