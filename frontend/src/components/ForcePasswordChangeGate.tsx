import React, { useState } from 'react';

import { PasswordInput } from '@/components/ui/PasswordInput';
import { Button } from '@/components/ui/Button';
import { useChangePassword, useLogout } from '@/hooks/useAuth';
import { useAppSelector } from '@/store/hooks';

const GRAD = '#5B3FD6';
const GRAD2 = '#8B5CF6';

export const ForcePasswordChangeGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = useAppSelector((state) => state.auth.user);
  const changePasswordMutation = useChangePassword();
  const logoutMutation = useLogout();

  // Google-created accounts have no password yet — they set (not change) one.
  const hasPassword = user?.hasPassword !== false;
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  if (!user?.forcePasswordChange) {
    return <>{children}</>;
  }

  const handleSubmit = async () => {
    setError('');
    if ((hasPassword && !currentPassword) || !newPassword || !confirmPassword) {
      setError('All fields are required.');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    try {
      await changePasswordMutation.mutateAsync(
        hasPassword ? { currentPassword, newPassword } : { newPassword }
      );
      setTimeout(() => logoutMutation.mutate(), 1500);
    } catch {
      setError(
        hasPassword
          ? 'Failed to change password. Please check your current password.'
          : 'Failed to set password. Please try again.'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: 'radial-gradient(ellipse 70% 50% at 15% 5%, rgba(91,63,214,0.07) 0%, transparent 55%), #FCFBFF' }}>
      <div className="w-full max-w-[440px] bg-white rounded-[24px] px-8 py-8 mx-4"
        style={{ border: '1px solid rgba(91,63,214,0.12)', boxShadow: '0 4px 6px rgba(0,0,0,0.03), 0 16px 48px rgba(91,63,214,0.10)' }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg mb-5"
          style={{ background: `linear-gradient(135deg, ${GRAD}, ${GRAD2})` }}>
          M
        </div>
        <h1 className="text-2xl font-bold text-[#1D1B22] mb-2">Password Change Required</h1>
        <p className="text-sm text-[#64607A] mb-6">
          For security, you must change your password before continuing. This is required for all newly provisioned accounts.
        </p>

        <div className="space-y-4">
          {hasPassword && (
            <div>
              <label className="block text-[11px] font-bold text-[#1D1B22] uppercase tracking-widest mb-2">Current Password</label>
              <PasswordInput value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" />
            </div>
          )}
          <div>
            <label className="block text-[11px] font-bold text-[#1D1B22] uppercase tracking-widest mb-2">New Password</label>
            <PasswordInput value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-[#1D1B22] uppercase tracking-widest mb-2">Confirm New Password</label>
            <PasswordInput value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" />
          </div>
        </div>

        {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
        {changePasswordMutation.isSuccess && (
          <p className="text-sm text-green-600 mt-3">Password updated! You will be redirected to login...</p>
        )}

        <div className="flex gap-3 mt-6">
          <Button variant="outline" className="flex-1 rounded-full" onClick={() => logoutMutation.mutate()}>
            Logout
          </Button>
          <Button className="flex-1 rounded-full bg-gradient-to-r from-[#5B3FD6] to-[#8B5CF6] text-white" onClick={handleSubmit} disabled={changePasswordMutation.isPending}>
            {changePasswordMutation.isPending
              ? 'Updating...'
              : hasPassword
                ? 'Update Password'
                : 'Set Password'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ForcePasswordChangeGate;
