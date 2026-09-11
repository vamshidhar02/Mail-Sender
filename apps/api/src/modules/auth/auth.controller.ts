import { Controller, Get, Req, Res, UseFilters, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiExcludeEndpoint, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import type { AuthSession, AuthUser } from '@mailer/shared';

import { AuthService } from './auth.service';
import type { AuthPrincipal } from './auth.types';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { AuthRedirectExceptionFilter } from './filters/auth-redirect-exception.filter';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /**
   * Entry point for the dashboard's "Continue with Google" button. The guard
   * redirects to Google's consent screen, so this handler body never runs.
   */
  @Public()
  @UseGuards(GoogleAuthGuard)
  @UseFilters(AuthRedirectExceptionFilter)
  @Get('google')
  @ApiExcludeEndpoint()
  signIn(): void {
    // Intentionally empty - GoogleAuthGuard owns the redirect.
  }

  /**
   * Where Google sends the browser back. By the time this runs the guard has
   * exchanged the code and GoogleStrategy has produced the principal, so all
   * that is left is to mint a token and hand the browser back to the dashboard.
   */
  @Public()
  @UseGuards(GoogleAuthGuard)
  @UseFilters(AuthRedirectExceptionFilter)
  @Get('google/callback')
  @ApiExcludeEndpoint()
  callback(@Req() request: Request & { user?: AuthUser }, @Res() response: Response): void {
    const user = request.user;

    if (!user) {
      response.redirect(this.auth.buildRedirectUrl({ error: 'Sign-in failed. Please try again.' }));
      return;
    }

    response.redirect(this.auth.buildRedirectUrl({ token: this.auth.issueToken(user) }));
  }

  /**
   * Verifies the bearer token and echoes back who it belongs to. The dashboard
   * calls this on load to decide between the app and the sign-in page - a 401
   * here is the signal that a stored token has expired or was signed with a
   * rotated secret.
   */
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'The signed-in user, from the bearer token' })
  @ApiOkResponse({ description: 'Token is valid' })
  me(@CurrentUser() principal: AuthPrincipal): AuthSession {
    return {
      user: {
        googleId: principal.googleId,
        email: principal.email,
        name: principal.name,
        avatarUrl: principal.avatarUrl,
      },
      expiresAt: principal.expiresAt,
    };
  }
}
