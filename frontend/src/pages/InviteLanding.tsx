import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { inviteService, type InviteDetails } from '@/services/invite.service';
import { authService } from '@/services';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { loginSuccess } from '@/store/slices/authSlice';
import { Building2, Users, UserCheck, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';

const GRAD = '#5B3FD6';
const GRAD2 = '#8B5CF6';

const InviteLanding: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'details' | 'register' | 'success'>('details');

  // Registration form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid invite link');
      setLoading(false);
      return;
    }

    inviteService.getInviteDetails(token)
      .then((data) => {
        setInvite(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Invalid or expired invite link');
        setLoading(false);
      });
  }, [token]);

  const handleAcceptInvite = async () => {
    if (!token) return;
    setSubmitting(true);
    setFormError(null);

    try {
      await inviteService.acceptInvite(token);
      setStep('success');
    } catch (err: any) {
      setFormError(err.message || 'Failed to accept invite');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterAndAccept = async () => {
    if (!token) return;
    setSubmitting(true);
    setFormError(null);

    if (password !== confirmPassword) {
      setFormError('Passwords do not match');
      setSubmitting(false);
      return;
    }

    if (password.length < 8) {
      setFormError('Password must be at least 8 characters');
      setSubmitting(false);
      return;
    }

    try {
      await inviteService.registerWithInvite(token, {
        name,
        password,
        email: invite?.email || email,
      });

      // Auto-login the new user
      const loginResult = await authService.login({
        email: invite?.email || email,
        password,
      });

      dispatch(loginSuccess(loginResult));
      setStep('success');
    } catch (err: any) {
      setFormError(err.message || 'Failed to create account');
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'manager': return <Users size={24} style={{ color: GRAD }} />;
      case 'team_leader': return <UserCheck size={24} style={{ color: GRAD }} />;
      case 'member': return <UserCheck size={24} style={{ color: GRAD }} />;
      default: return <Building2 size={24} style={{ color: GRAD }} />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'manager': return 'Manager';
      case 'team_leader': return 'Team Leader';
      case 'member': return 'Team Member';
      default: return role;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#FCFBFF' }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#E4E0F5] border-t-[#5B3FD6] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-[#64607A]">Loading invite details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#FCFBFF' }}>
        <div className="max-w-md w-full mx-4 text-center">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center bg-red-50">
            <AlertCircle size={32} className="text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-[#1D1B22] mb-3">Invite Error</h1>
          <p className="text-sm text-[#64607A] mb-6">{error}</p>
          <Button onClick={() => navigate('/')} variant="outline">
            Go to Homepage
          </Button>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#FCFBFF' }}>
        <div className="max-w-md w-full mx-4 text-center">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${GRAD}, ${GRAD2})` }}>
            <CheckCircle size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#1D1B22] mb-3">Welcome to the team!</h1>
          <p className="text-sm text-[#64607A] mb-6">
            You've joined <strong>{invite?.organization?.name}</strong> as a <strong>{getRoleLabel(invite?.role || '')}</strong>.
          </p>
          <Button onClick={() => navigate('/dashboard')} className="w-full">
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#FCFBFF' }}>
      <div className="max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white font-bold text-lg"
            style={{ background: `linear-gradient(135deg, ${GRAD}, ${GRAD2})` }}
          >
            M
          </div>
          <h1 className="text-2xl font-bold text-[#1D1B22]">You're Invited!</h1>
        </div>

        <div className="bg-white rounded-2xl border border-[#E4E0F5] p-6 shadow-sm">
          {/* Invite Details */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center bg-[#F5F3FF]">
              {getRoleIcon(invite?.role || '')}
            </div>
            <h2 className="text-lg font-bold text-[#1D1B22]">{invite?.organization?.name}</h2>
            <p className="text-sm text-[#64607A] mt-1">
              {invite?.inviter?.name || 'Someone'} invited you to join as{' '}
              <strong>{getRoleLabel(invite?.role || '')}</strong>
            </p>
            {invite?.project && (
              <p className="text-xs text-[#64607A] mt-2">
                Project: {invite.project.name}
                {invite.team && ` • Team: ${invite.team.name}`}
              </p>
            )}
          </div>

          {isAuthenticated ? (
            // Already logged in — accept directly
            <div>
              <p className="text-sm text-[#64607A] mb-4 text-center">
                You're logged in. Click below to accept this invite.
              </p>
              {formError && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
                  {formError}
                </div>
              )}
              <Button
                onClick={handleAcceptInvite}
                disabled={submitting}
                className="w-full"
              >
                {submitting ? 'Accepting...' : 'Accept Invite'}
                <ArrowRight size={16} className="ml-2" />
              </Button>
            </div>
          ) : (
            // Not logged in — show registration form
            <div>
              <p className="text-sm text-[#64607A] mb-4 text-center">
                Create an account to accept this invite.
              </p>

              {!invite?.email && (
                <div className="mb-3">
                  <label className="block text-[11px] font-bold text-[#1D1B22] uppercase tracking-widest mb-2">
                    Email
                  </label>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              )}

              <div className="mb-3">
                <label className="block text-[11px] font-bold text-[#1D1B22] uppercase tracking-widest mb-2">
                  Full Name
                </label>
                <Input
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <label className="block text-[11px] font-bold text-[#1D1B22] uppercase tracking-widest mb-2">
                  Password
                </label>
                <PasswordInput
                  placeholder="Create password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>

              <div className="mb-4">
                <label className="block text-[11px] font-bold text-[#1D1B22] uppercase tracking-widest mb-2">
                  Confirm Password
                </label>
                <PasswordInput
                  placeholder="Repeat password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>

              {formError && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
                  {formError}
                </div>
              )}

              <Button
                onClick={handleRegisterAndAccept}
                disabled={submitting}
                className="w-full"
              >
                {submitting ? 'Creating Account...' : 'Create Account & Join'}
                <ArrowRight size={16} className="ml-2" />
              </Button>

              <p className="mt-4 text-center text-sm text-[#64607A]">
                Already have an account?{' '}
                <button
                  onClick={() => navigate('/login')}
                  className="font-bold hover:underline"
                  style={{ color: GRAD }}
                >
                  Sign in
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InviteLanding;
