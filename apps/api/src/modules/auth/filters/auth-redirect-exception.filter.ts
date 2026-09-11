import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import { AuthService } from '../auth.service';

/** What Google puts in `?error=` when the user does not complete consent. */
const GOOGLE_ERROR_MESSAGES: Record<string, string> = {
  access_denied: 'Sign-in was cancelled.',
  admin_policy_enforced: 'Your Google Workspace administrator blocked this app.',
};

const GENERIC_MESSAGE = 'Sign-in failed. Please try again.';

/**
 * Turns a failed sign-in into a redirect back to the dashboard instead of the
 * JSON body HttpExceptionFilter would produce.
 *
 * Without this, cancelling the Google consent screen or being refused by the
 * allowlist dead-ends the user on a raw error document served from the API's
 * own domain, with no link back to the app. The dashboard reads the `error`
 * fragment and shows it on the sign-in page.
 */
@Catch()
export class AuthRedirectExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AuthRedirectExceptionFilter.name);

  constructor(private readonly auth: AuthService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Anything unexpected is logged in full but reported generically - the
    // message ends up in the address bar, which is no place for internal
    // detail.
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    } else {
      // 4xx is the common case - a cancelled consent, a rejected allowlist, a
      // token exchange Google refused - and it still has to leave a trace.
      // Without this a failed sign-in is invisible server-side and the only
      // evidence is a deliberately vague sentence in the user's address bar.
      this.logger.warn('Sign-in failed (' + status + '): ' + this.diagnose(exception, request));
    }

    response.redirect(this.auth.buildRedirectUrl({ error: this.describe(exception, request) }));
  }

  /**
   * The operator-facing version of the failure: the underlying error plus
   * whatever Google said in the query string. Never shown to the user.
   */
  private diagnose(exception: unknown, request: Request): string {
    const parts: string[] = [];

    if (exception instanceof Error) {
      parts.push(exception.name + ': ' + exception.message);
      // passport-oauth2 hides the provider's real complaint here.
      const cause = (exception as { oauthError?: { data?: string } }).oauthError;
      if (cause?.data) parts.push('oauth response: ' + cause.data);
    } else {
      parts.push(String(exception));
    }

    for (const key of ['error', 'error_description'] as const) {
      const value = request.query?.[key];
      if (typeof value === 'string') parts.push(key + '=' + value);
    }

    // Says whether Google came back with an authorisation code at all, which
    // separates 'the user never consented' from 'the exchange failed'.
    parts.push('code present: ' + (typeof request.query?.code === 'string'));

    return parts.join(' | ');
  }

  /**
   * Passport reports a refused consent as a bare 401 whose message is the word
   * "Unauthorized", which tells the user nothing. Google's own `?error=` code
   * is the more informative signal, so it wins when present; a message we
   * raised ourselves (the allowlist rejection) is next; anything else is
   * generic.
   */
  private describe(exception: unknown, request: Request): string {
    const googleError = request.query?.error;
    if (typeof googleError === 'string') {
      return GOOGLE_ERROR_MESSAGES[googleError] ?? GENERIC_MESSAGE;
    }

    if (exception instanceof HttpException && exception.getStatus() < 500) {
      const message = exception.message;
      const isPlaceholder = message === 'Unauthorized' || message === 'Forbidden' || !message;
      return isPlaceholder ? GENERIC_MESSAGE : message;
    }

    return GENERIC_MESSAGE;
  }
}
