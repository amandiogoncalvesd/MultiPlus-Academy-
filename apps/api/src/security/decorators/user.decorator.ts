import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from '../auth/auth.guard';

/**
 * Custom decorator to inject the authenticated user profile into NestJS controller routes.
 * Usage: someRoute(@User() user: AuthenticatedUser)
 */
export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
