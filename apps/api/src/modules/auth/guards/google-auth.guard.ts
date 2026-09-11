import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Drives the Google redirect dance. Separate from JwtAuthGuard because the two
 * sign-in routes must stay reachable without a token - they are what issues one.
 */
@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {}
