import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { AuthUser } from '@mailer/shared';
import { AUTH_ERROR_FRAGMENT_KEY, AUTH_TOKEN_FRAGMENT_KEY } from '@mailer/shared';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Gate on AUTH_ALLOWED_EMAILS. A blank allowlist - the default - accepts any
   * Google account, which is the configured behaviour for this deployment.
   *
   * Called from GoogleStrategy rather than the controller so a rejected account
   * never gets as far as having a token signed for it.
   */
  assertAllowedToSignIn(email: string): void {
    const allowed = this.config.get<string[]>('auth.allowedEmails', []);
    if (allowed.length === 0) return;

    if (!allowed.includes(email.toLowerCase())) {
      this.logger.warn('Refused sign-in for ' + email + ': not in AUTH_ALLOWED_EMAILS');
      throw new ForbiddenException('This Google account is not allowed to sign in');
    }
  }

  /** Signs the session token the dashboard sends back as a bearer credential. */
  issueToken(user: AuthUser): string {
    return this.jwt.sign({
      sub: user.googleId,
      email: user.email,
      name: user.name,
      picture: user.avatarUrl,
    });
  }

  /**
   * Where to send the browser once sign-in resolves.
   *
   * The token rides in the URL fragment rather than the query string: a
   * fragment is never sent to a server, so it stays out of access logs, Referer
   * headers and the API's own request logging. The dashboard reads it, stores
   * it, and strips it from the address bar.
   */
  buildRedirectUrl(result: { token: string } | { error: string }): string {
    const base = this.config.getOrThrow<string>('auth.webAppUrl') + '/auth/callback';
    const [key, value] =
      'token' in result
        ? [AUTH_TOKEN_FRAGMENT_KEY, result.token]
        : [AUTH_ERROR_FRAGMENT_KEY, result.error];

    return base + '#' + key + '=' + encodeURIComponent(value);
  }
}
