/**
 * The authenticated principal. Derived from the Google profile at sign-in and
 * carried in the JWT - nothing about a user is persisted, so this is the only
 * record of who is making a request.
 */
export interface AuthUser {
  /** Google's stable subject id (`sub`). Unique per account, never reused. */
  googleId: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
}

/**
 * Claims in the JWT the API signs. `sub` is the Google id rather than a local
 * user id, because there is no users table to point at.
 */
export interface AuthTokenClaims {
  sub: string;
  email: string;
  name: string | null;
  picture: string | null;
  /** Seconds since the epoch, set by @nestjs/jwt. */
  iat: number;
  exp: number;
}

/** Returned by `GET /auth/me`. */
export interface AuthSession {
  user: AuthUser;
  /** When the current token stops being accepted, as an ISO timestamp. */
  expiresAt: string;
}

/**
 * The fragment key the API redirects back with after a successful sign-in:
 * `<web>/auth/callback#token=<jwt>`. A fragment, not a query parameter, so the
 * token never reaches a server access log or a Referer header.
 */
export const AUTH_TOKEN_FRAGMENT_KEY = 'token';

/** Fragment key used instead when sign-in fails, e.g. `#error=access_denied`. */
export const AUTH_ERROR_FRAGMENT_KEY = 'error';
