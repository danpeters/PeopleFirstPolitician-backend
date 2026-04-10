import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Roles guard.
 *
 * Purpose:
 * - Reads role metadata from the route handler or controller.
 * - Checks whether the authenticated user has one of the required roles.
 *
 * Security notes:
 * - This must be used together with authentication on protected routes.
 * - Never rely on frontend role hiding alone.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are defined, allow access.
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    return !!user?.role && requiredRoles.includes(user.role);
  }
}
