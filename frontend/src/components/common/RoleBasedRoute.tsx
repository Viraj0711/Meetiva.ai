import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import { selectIsManagerOrLead, selectIsManager, selectIsLead } from '@/store/selectors/authSelectors';

export type RequiredRole = 'manager' | 'lead' | 'managerOrLead';

interface RoleBasedRouteProps {
  children: React.ReactNode;
  requiredRole?: RequiredRole;
  fallbackPath?: string;
}

/**
 * A wrapper component that restricts access to routes based on user role.
 * If user doesn't have the required role, they're redirected to fallbackPath.
 *
 * @param children - Component to render if user has required role
 * @param requiredRole - Role requirement: 'manager' | 'lead' | 'managerOrLead'
 * @param fallbackPath - Path to redirect to if access denied (default: '/dashboard')
 */
export const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({
  children,
  requiredRole = 'managerOrLead',
  fallbackPath = '/dashboard',
}) => {
  const isManager = useAppSelector(selectIsManager);
  const isLead = useAppSelector(selectIsLead);
  const isManagerOrLead = useAppSelector(selectIsManagerOrLead);

  let hasAccess = false;

  switch (requiredRole) {
    case 'manager':
      hasAccess = isManager;
      break;
    case 'lead':
      hasAccess = isLead;
      break;
    case 'managerOrLead':
      hasAccess = isManagerOrLead;
      break;
  }

  if (!hasAccess) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};

export default RoleBasedRoute;
