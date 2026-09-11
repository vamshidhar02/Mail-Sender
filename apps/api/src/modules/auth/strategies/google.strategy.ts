import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import type { AuthUser } from '@mailer/shared';

import { AuthService } from '../auth.service';

/**
 * No session store is configured anywhere, and none is needed: Nest's AuthGuard
 * authenticates with `session: false` by default, so passport never tries to
 * serialise a user and the API stays stateless across Render restarts.
 */
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    config: ConfigService,
    private readonly auth: AuthService,
  ) {
    super({
      clientID: config.getOrThrow<string>('auth.google.clientId'),
      clientSecret: config.getOrThrow<string>('auth.google.clientSecret'),
      callbackURL: config.getOrThrow<string>('auth.google.callbackUrl'),
      scope: ['email', 'profile'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    // The shape of `emails` differs between the userinfo and people payloads,
    // so read it defensively rather than trusting the ambient typing.
    const primary = profile.emails?.[0] as
      | { value?: string; verified?: boolean | string }
      | undefined;
    const email = primary?.value;

    if (!email) {
      done(new UnauthorizedException('That Google account has no email address'));
      return;
    }

    // Only an explicit negative is refused. The address is what
    // AUTH_ALLOWED_EMAILS matches on, so an address Google actively says it has
    // not verified must not be treated as an identity.
    if (primary?.verified === false || primary?.verified === 'false') {
      done(new UnauthorizedException('That Google account has an unverified email address'));
      return;
    }

    const user: AuthUser = {
      googleId: profile.id,
      email: email.toLowerCase(),
      name: profile.displayName || null,
      avatarUrl: profile.photos?.[0]?.value ?? null,
    };

    try {
      this.auth.assertAllowedToSignIn(user.email);
    } catch (error) {
      done(error as Error);
      return;
    }

    done(null, user);
  }
}
