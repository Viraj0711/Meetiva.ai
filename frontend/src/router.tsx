import React, { Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import SubscriptionGate from '@/components/SubscriptionGate';
import MeetingLimitGate from '@/components/MeetingLimitGate';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAppSelector } from '@/store/hooks';

const Landing = React.lazy(() => import('@/pages/LandingNew'));
const Home = React.lazy(() => import('@/pages/dashboard/Home'));
const Login = React.lazy(() => import('@/pages/auth/LoginEnhanced'));
const Register = React.lazy(() => import('@/pages/auth/RegisterEnhanced'));
const ResetPassword = React.lazy(() => import('@/pages/auth/ResetPassword'));
const VerifyEmail = React.lazy(() => import('@/pages/auth/VerifyEmail'));
const Meetings = React.lazy(() => import('@/pages/Meetings'));
const MeetingDetail = React.lazy(() => import('@/pages/MeetingDetail'));
const Upload = React.lazy(() => import('@/pages/Upload'));
const Processing = React.lazy(() => import('@/pages/Processing'));
const Tasks = React.lazy(() => import('@/pages/Tasks'));
const Analytics = React.lazy(() => import('@/pages/Analytics'));
const TeamReport = React.lazy(() => import('@/pages/TeamReport'));
const TeamsAdmin = React.lazy(() => import('@/pages/TeamsAdmin'));
const Workspace = React.lazy(() => import('@/pages/Workspace'));
const Profile = React.lazy(() => import('@/pages/Profile'));
const Settings = React.lazy(() => import('@/pages/Settings'));
const SubscriptionUpgrade = React.lazy(() => import('@/pages/SubscriptionUpgrade'));
const DashboardMinutes = React.lazy(() => import('@/pages/dashboard/Minutes'));
const Pricing = React.lazy(() => import('@/pages/Pricing'));
const Contact = React.lazy(() => import('@/pages/Contact'));
const Terms = React.lazy(() => import('@/pages/Terms'));
const Privacy = React.lazy(() => import('@/pages/Privacy'));
const NotFound = React.lazy(() => import('@/pages/NotFound'));

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const user = useAppSelector((state) => state.auth.user);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user && !user.isVerified) {
    return <Navigate to={`/verify-email?email=${encodeURIComponent(user.email)}`} replace />;
  }

  // Google users without a password must set one in Profile before accessing the app
  if (user && user.hasPassword === false) {
    // Allow access to Profile page, block everything else
    const currentPath = window.location.pathname;
    if (currentPath !== '/dashboard/profile') {
      return <Navigate to="/dashboard/profile" replace />;
    }
  }
  
  return <>{children}</>;
};

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <Landing />
      </Suspense>
    ),
  },
  {
    path: '/login',
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <Login />
      </Suspense>
    ),
  },
  {
    path: '/register',
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <Register />
      </Suspense>
    ),
  },
  {
    path: '/reset-password',
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <ResetPassword />
      </Suspense>
    ),
  },
  {
    path: '/verify-email',
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <VerifyEmail />
      </Suspense>
    ),
  },
  {
    path: '/pricing',
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <Pricing />
      </Suspense>
    ),
  },
  {
    path: '/contact',
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <Contact />
      </Suspense>
    ),
  },
  {
    path: '/terms',
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <Terms />
      </Suspense>
    ),
  },
  {
    path: '/privacy',
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <Privacy />
      </Suspense>
    ),
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <>
          <Layout />
          {/* Auto-redirects to the upgrade page when any API call hits the
              free-tier meeting limit (MEETING_LIMIT_REACHED). */}
          <MeetingLimitGate />
        </>
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <Home />
          </Suspense>
        ),
      },
      {
        path: 'meetings',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <Meetings />
          </Suspense>
        ),
      },
      {
        path: 'meetings/:id',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <MeetingDetail />
          </Suspense>
        ),
      },
      {
        path: 'upload',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <Upload />
          </Suspense>
        ),
      },
      {
        path: 'processing/:id',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <Processing />
          </Suspense>
        ),
      },
      {
        path: 'tasks',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <Tasks />
          </Suspense>
        ),
      },
      {
        path: 'analytics',
        element: (
          <SubscriptionGate>
            <Suspense fallback={<LoadingSpinner />}>
              <Analytics />
            </Suspense>
          </SubscriptionGate>
        ),
      },
      {
        path: 'team-report',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <TeamReport />
          </Suspense>
        ),
      },
      {
        path: 'teams',
        element: (
          <SubscriptionGate>
            <Suspense fallback={<LoadingSpinner />}>
              <TeamsAdmin />
            </Suspense>
          </SubscriptionGate>
        ),
      },
      {
        path: 'workspace',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <Workspace />
          </Suspense>
        ),
      },
      {
        path: 'profile',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <Profile />
          </Suspense>
        ),
      },
      {
        path: 'settings',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <Settings />
          </Suspense>
        ),
      },
      {
        path: 'minutes',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <DashboardMinutes />
          </Suspense>
        ),
      },

      {
        path: 'upgrade',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <SubscriptionUpgrade />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: '*',
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <NotFound />
      </Suspense>
    ),
  },
]);

export const AppRouter: React.FC = () => {
  return <RouterProvider router={router} />;
};
