import { Spin } from 'antd';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAppSelector } from '@/app/hooks';
import { ROUTES } from '@/app/routes';
import { useGetSessionQuery } from '@/services/api/authApi';
import { selectIsAuthenticated } from './authSlice';

/**
 * Gate in front of every application route.
 *
 * Having a stored token is not the same as having a valid one, so the token is
 * verified against /auth/me before the app renders. That call is also what
 * turns a token invalidated server-side (expired, or JWT_SECRET rotated) into a
 * redirect here rather than a wall of failed requests inside the dashboard -
 * baseApi clears the token on any 401, which lands us in the branch below.
 */
export function RequireAuth() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const location = useLocation();

  // `skip` keeps this from firing a request that is certain to 401.
  const { isLoading } = useGetSessionQuery(undefined, { skip: !isAuthenticated });

  if (!isAuthenticated) {
    // `state` lets the login page send the user back where they were headed,
    // which matters when a session expires mid-navigation.
    return <Navigate to={ROUTES.login} replace state={{ from: location.pathname }} />;
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return <Outlet />;
}
