import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/services';
import { LoginCredentials, RegisterData, AuthResponse, User } from '@/types';
import { useAppDispatch } from '@/store/hooks';
import { loginSuccess, logout as logoutAction } from '@/store/slices/authSlice';
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
