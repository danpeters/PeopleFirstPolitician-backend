/**
 * File: src/modules/auth/decorators/roles.decorator.ts
 *
 * Purpose:
 * Declares which roles are allowed to access a route or controller.
 *
 * Example:
 *   @Roles('super_admin')
 *   @Get()
 *   findAll() { ... }
 */

import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key used by RolesGuard.
 */
export const ROLES_KEY = 'roles';

/**
 * Attaches one or more allowed roles to a route or controller.
 *
 * @param roles Allowed role names
 * @returns Metadata decorator
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);