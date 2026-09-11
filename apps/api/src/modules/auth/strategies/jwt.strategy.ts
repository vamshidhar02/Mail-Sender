import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { AuthTokenClaims } from '@mailer/shared';

import type { AuthPrincipal } from '../auth.types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // Expired tokens are rejected here rather than anywhere downstream, which
      // is what turns JWT_EXPIRES_IN into a real session length.
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('auth.jwt.secret'),
    });
  }


  validate(claims: AuthTokenClaims): AuthPrincipal {
    return {
      googleId: claims.sub,
      email: claims.email,
      name: claims.name,
      avatarUrl: claims.picture,
      expiresAt: new Date(claims.exp * 1000).toISOString(),
    };
  }
}
