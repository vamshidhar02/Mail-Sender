import type { AuthUser } from '@mailer/shared';

/**
 * What JwtStrategy.validate() attaches to the request, and therefore what
 * @CurrentUser() hands a controller.
 *
 * It is AuthUser plus the token's own expiry, which the dashboard uses to know
 * when to send the user back through Google rather than waiting for the first
 * 401. Nothing here is read from a database - the JWT is the whole record.
 */
export interface AuthPrincipal extends AuthUser {
  /** The `exp` claim, as an ISO timestamp. */
  expiresAt: string;
}
