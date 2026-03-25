import React, { Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useAppSelector } from '@/store/hooks';

const Landing = React.lazy(() => import('@/pages/LandingNew'));
const Home = React.lazy(() => import('@/pages/Home'));
const Login = React.lazy(() => import('@/pages/auth/LoginEnhanced'));
const Register = React.lazy(() => import('@/pages/auth/RegisterEnhanced'));
const Meetings = React.lazy(() => import('@/pages/Meetings'));
const MeetingDetail = React.lazy(() => import('@/pages/MeetingDetail'));
const Upload = React.lazy(() => import('@/pages/Upload'));
const Processing = React.lazy(() => import('@/pages/Processing'));
const ActionItems = React.lazy(() => import('@/pages/ActionItems'));
const Analytics = React.lazy(() => import('@/pages/Analytics'));
const TeamReport = React.lazy(() => import('@/pages/TeamReport'));
const TeamsAdmin = React.lazy(() => import('@/pages/TeamsAdmin'));
const Profile = React.lazy(() => import('@/pages/Profile'));
const Settings = React.lazy(() => import('@/pages/Settings'));
const Pricing = React.lazy(() => import('@/pages/Pricing'));
const Contact = React.lazy(() => import('@/pages/Contact'));
const Terms = React.lazy(() => import('@/pages/Terms'));
const Privacy = React.lazy(() => import('@/pages/Privacy'));
const NotFound = React.lazy(() => import('@/pages/NotFound'));

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
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
        <Layout />
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
        path: 'action-items',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <ActionItems />
          </Suspense>
        ),
      },
      {
        path: 'analytics',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <Analytics />
          </Suspense>
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
          <Suspense fallback={<LoadingSpinner />}>
            <TeamsAdmin />
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
