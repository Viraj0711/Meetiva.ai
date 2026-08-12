import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/services';
import { LoginCredentials, RegisterData, AuthResponse, User } from '@/types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loginSuccess, logout as logoutAction, setUser } from '@/store/slices/authSlice';
import { addToast } from '@/store/slices/uiSlice';

/**
 * Hook to login user
 */
export const useLogin = () => {
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => authService.login(credentials),
    onSuccess: (data: AuthResponse) => {
      dispatch(loginSuccess({ user: data.user, token: data.token }));
      dispatch(addToast({ type: 'success', message: 'Login successful!' }));
    },
    onError: (error: Error) => {
      dispatch(addToast({ type: 'error', message: error.message }));
    },
  });
};

/**
 * Hook to register user
 */
export const useRegister = () => {
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: (data: RegisterData) => authService.register(data),
    onSuccess: (data: AuthResponse) => {
      dispatch(loginSuccess({ user: data.user, token: data.token }));
      dispatch(addToast({ type: 'success', message: 'Registration successful!' }));
    },
    onError: (error: Error) => {
      dispatch(addToast({ type: 'error', message: error.message }));
    },
  });
};

/**
 * Hook to logout user
 */
export const useLogout = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      dispatch(logoutAction());
      queryClient.clear();
      dispatch(addToast({ type: 'success', message: 'Logged out successfully' }));
    },
  });
};

/**
 * Hook to get current user
 */
export const useCurrentUser = () => {
  return useQuery<User, Error>({
    queryKey: ['user', 'me'],
    queryFn: () => authService.getCurrentUser(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });
};

/**
 * Hook to get current user's subscription info and meeting credits.
 */
export const useSubscription = () => {
  return useQuery({
    queryKey: ['user', 'subscription'],
    queryFn: () => authService.getSubscription(),
    staleTime: 30_000,
  });
};

/**
 * Hook to request password reset
 */
export const useRequestPasswordReset = () => {
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: (email: string) => authService.requestPasswordReset(email),
    onSuccess: () => {
      dispatch(
        addToast({ type: 'success', message: 'Password reset email sent. Check your inbox.' })
      );
    },
    onError: (error: Error) => {
      dispatch(addToast({ type: 'error', message: error.message }));
    },
  });
};

/**
 * Hook to reset password with a token
 */
export const useResetPassword = () => {
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) =>
      authService.resetPassword(token, password),
    onSuccess: () => {
      dispatch(
        addToast({ type: 'success', message: 'Password updated successfully.' })
      );
    },
    onError: (error: Error) => {
      dispatch(addToast({ type: 'error', message: error.message }));
    },
  });
};

/**
 * Hook to change password (authenticated user)
 */
export const useChangePassword = () => {
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: ({
      currentPassword,
      newPassword,
    }: {
      currentPassword?: string;
      newPassword: string;
    }) => authService.changePassword(currentPassword, newPassword),
    onSuccess: () => {
      dispatch(
        addToast({ type: 'success', message: 'Password updated successfully. Please log in again.' })
      );
    },
    onError: (error: Error) => {
      dispatch(addToast({ type: 'error', message: error.message }));
    },
  });
};

/**
 * Hook to verify email with OTP
 */
export const useVerifyOtp = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const user = useAppSelector((state) => state.auth.user);

  return useMutation({
    mutationFn: ({ email, otp }: { email: string; otp: string }) =>
      authService.verifyOtp(email, otp),
    onSuccess: () => {
      // Update Redux immediately so the redirect in VerifyEmail fires
      if (user) {
        dispatch(setUser({ ...user, isVerified: true }));
      }
      dispatch(addToast({ type: 'success', message: 'Email verified successfully!' }));
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
    },
    onError: (error: Error) => {
      dispatch(addToast({ type: 'error', message: error.message }));
    },
  });
};

/**
 * Hook to resend verification OTP
 */
export const useResendOtp = () => {
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: (email: string) => authService.resendOtp(email),
    onSuccess: () => {
      dispatch(addToast({ type: 'success', message: 'New verification code sent.' }));
    },
    onError: (error: Error) => {
      dispatch(addToast({ type: 'error', message: error.message }));
    },
  });
};

/**
 * Hook to upgrade the current user's subscription tier.
 * Calls POST /auth/admin/set-tier — server checks ADMIN_EMAIL env var.
 */
export const useUpgradeToPro = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tier: string) => authService.upgradeToPro(tier),
    onSuccess: () => {
      dispatch(addToast({ type: 'success', message: 'Subscription upgraded to Team! 🎉' }));
      queryClient.invalidateQueries({ queryKey: ['user', 'subscription'] });
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
    },
    onError: (error: Error) => {
      dispatch(
        addToast({
          type: 'error',
          message: error.message || 'Upgrade failed. Make sure ADMIN_EMAIL matches your account email.',
          duration: 5000,
        })
      );
    },
  });
};
