import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider, useDispatch } from 'react-redux';
import { store } from '@/store';
import { AppRouter } from '@/router';
import ErrorBoundary from '@/components/ErrorBoundary';
import ThemeProvider from '@/components/ThemeProvider';
import ToastContainer from '@/components/ui/ToastContainer';
import { authService } from '@/services';
import { loginSuccess } from '@/store/slices/authSlice';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30 * 1000,
    },
  },
});

/**
 * On mount, tries to restore the user's session by calling POST /auth/refresh.
 * The browser automatically sends the httpOnly refresh_token cookie.
 * If the cookie is valid, the server returns a new access token + user data.
 * If not, the user stays unauthenticated (protected routes redirect to /login).
 */
const AuthInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useDispatch();
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const init = async () => {
      // ── Cleanup stale localStorage keys from previous auth architecture ──
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Check for the session_exists flag cookie set by the server on login.
      // If absent, skip the refresh call entirely — no session to restore,
      // and the 401 would just be console noise.
      const hasSession = document.cookie
        .split('; ')
        .some((c) => c.startsWith('session_exists='));

      if (hasSession) {
        try {
          const data = await authService.refreshToken();
          if (data.token && data.user) {
            dispatch(loginSuccess({ user: data.user, token: data.token }));
          }
        } catch {
          // Refresh failed — cookie may be stale. Fall through to unauthenticated.
        }
      }

      setInitializing(false);
    };
    init();
  }, [dispatch]);

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-white/55">Restoring session...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AuthInitializer>
              <AppRouter />
              <ToastContainer />
            </AuthInitializer>
          </ThemeProvider>
        </QueryClientProvider>
      </Provider>
    </ErrorBoundary>
  );
};

export default App;
