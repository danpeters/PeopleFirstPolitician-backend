import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * CurrentUser decorator.
 *
 * Purpose:
 * - Extracts the authenticated user object from the request.
 *
 * Security notes:
 * - This relies on authentication middleware/guard having already populated request.user.
 * - Do not assume request.user exists unless the route is protected.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
