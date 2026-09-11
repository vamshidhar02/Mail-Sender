import { useEffect, useRef } from 'react';
import { Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import { AUTH_ERROR_FRAGMENT_KEY, AUTH_TOKEN_FRAGMENT_KEY } from '@mailer/shared';

import { useAppDispatch } from '@/app/hooks';
import { ROUTES } from '@/app/routes';
import { signedIn, signInFailed } from './authSlice';

/**
 * Landing spot for the API's redirect after Google.
 *
 * The token arrives in the URL fragment rather than the query string, so it is
 * never sent to a server, never reaches an access log and never leaks through a
 * Referer header. It is read once and then scrubbed from the address bar so it
 * does not sit in browser history either.
 */
export default function AuthCallbackPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  /**
   * Reading the fragment destroys it, so this must happen exactly once.
   *
   * StrictMode invokes effects twice in development: without this guard the
   * second pass finds the fragment it already wiped, concludes the sign-in
   * failed, and clears the token the first pass just stored - turning every
   * successful login into "Sign-in failed. Please try again." The bug is
   * invisible in production builds, which makes the guard easy to drop and
   * expensive to lose.
   */
  const consumed = useRef(false);

  useEffect(() => {
    if (consumed.current) return;
    consumed.current = true;

    const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const token = fragment.get(AUTH_TOKEN_FRAGMENT_KEY);
    const error = fragment.get(AUTH_ERROR_FRAGMENT_KEY);

    // Drop the fragment before navigating, so neither the token nor a stale
    // error survives in history.
    window.history.replaceState(null, '', window.location.pathname);

    if (token) {
      dispatch(signedIn(token));
      navigate(ROUTES.dashboard, { replace: true });
      return;
    }

    // Deliberately worded differently from the API's own generic failure, so a
    // report of this message identifies which side produced it.
    dispatch(signInFailed(error ?? 'Sign-in did not complete. Please try again.'));
    navigate(ROUTES.login, { replace: true });
  }, [dispatch, navigate]);

  return (
    <div className="flex h-full items-center justify-center">
      <Spin size="large" tip="Signing you in...">
        <div className="h-16 w-16" />
      </Spin>
    </div>
  );
}
