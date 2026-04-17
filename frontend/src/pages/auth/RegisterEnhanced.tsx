import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, UserPlus, Mail, Lock, User, AlertCircle } from 'lucide-react';
import AnimatedBackground from '@/components/AnimatedBackground';
import GradientOrbs from '@/components/GradientOrbs';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAppDispatch } from '@/store/hooks';
import { registerAsync } from '@/store/slices/authSlice';
import { useNavigate } from 'react-router-dom';

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
    setError('');

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('All fields are required.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      await dispatch(registerAsync({ name: name.trim(), email: email.trim(), password })).unwrap();
      navigate('/dashboard');
    } catch (err) {
      const message = (err as string) || 'Registration failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#edf2e8] overflow-hidden flex items-center justify-center">
      <AnimatedBackground />
      <GradientOrbs />

      <Link
        to="/"
        className="absolute top-6 left-6 z-10 flex items-center space-x-1 text-emerald-900 hover:text-emerald-950 px-3 py-2 rounded-lg transition-all duration-200"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="font-medium">Back</span>
      </Link>

      <div className="relative z-10 w-full max-w-lg px-6">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/50 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-900 to-lime-800 text-white">
            <ShieldCheck className="h-7 w-7" />
          </div>

          <h1 className="mt-5 text-3xl font-bold text-gray-900">Team Leader Sign Up</h1>
          <p className="mt-3 text-gray-600">
            Member signup is disabled. Team leaders can create their own account and then onboard members.
          </p>

          <div className="mt-6 rounded-xl bg-emerald-50 p-4 text-left">
            <div className="flex items-start gap-3">
              <UserPlus className="mt-0.5 h-5 w-5 text-emerald-800" />
              <div>
                <p className="text-sm font-semibold text-emerald-950">Need access?</p>
                <p className="mt-1 text-sm text-emerald-900">
                  Members should ask a team leader to create credentials from the Teams workspace.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-3 text-left">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input className="pl-9" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input type="email" className="pl-9" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input type="password" className="pl-9" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type="password"
                  className="pl-9"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating Leader Account...' : 'Create Leader Account'}
            </Button>
          </form>

          <div className="mt-7 flex items-center justify-center gap-3">
            <Link to="/login">
              <Button>Go To Login</Button>
            </Link>
            <Link to="/">
              <Button variant="outline">Back To Landing</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterEnhanced;
