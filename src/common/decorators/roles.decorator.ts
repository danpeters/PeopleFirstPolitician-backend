import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key used by the roles guard.
 */
export const ROLES_KEY = 'roles';

/**
 * Roles decorator.
 *
 * Purpose:
 * - Attaches required role metadata to route handlers or controllers.
 *
 * Security notes:
 * - This decorator alone does not enforce access.
 * - A backend guard must read and enforce this metadata.
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
