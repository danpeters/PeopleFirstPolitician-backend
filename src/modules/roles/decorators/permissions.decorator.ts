/**
 * File: C:\Projects\PeopleFirstPolitician\backend\src\modules\roles\decorators\permissions.decorator.ts
 *
 * Purpose:
 * - Declares the permissions required by a controller or route.
 *
 * Security:
 * - This decorator only attaches metadata.
 * - It does not grant permission by itself.
 * - PermissionsGuard must enforce the declared permissions.
 */

import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Declare the permissions required by a route.
 *
 * Multiple permissions are treated as an AND requirement:
 * the authenticated user's role must possess every declared permission.
 */
export const Permissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
