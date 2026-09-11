import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Opts a route out of the global JwtAuthGuard.
 *
 * Authentication is deny-by-default: the guard is registered globally in
 * AuthModule, so a new controller is protected the moment it is written and
 * only becomes reachable by explicitly saying so here. That direction matters -
 * forgetting this decorator locks an endpoint down, while forgetting an
 * `@UseGuards` would have left it wide open.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
