import { SetMetadata } from '@nestjs/common';

/**
 * Roles Decorator
 * Used to assign required roles to route handlers
 */

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);