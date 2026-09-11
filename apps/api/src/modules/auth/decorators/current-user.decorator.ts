import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import type { AuthPrincipal } from '../auth.types';

/**
 * Reads the principal JwtStrategy.validate() put on the request.
 *
 * Only meaningful on a guarded route: on a @Public() one there is nothing to
 * read and this is undefined, which is why the return type is nullable.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthPrincipal | undefined => {
    const request = context.switchToHttp().getRequest<{ user?: AuthPrincipal }>();
    return request.user;
  },
);
