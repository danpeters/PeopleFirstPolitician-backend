/**
 * File:
 * C:\Projects\PeopleFirstPolitician\backend\src\common\seeds\database.seed.ts
 *
 * Purpose:
 * - Performs application-level database initialisation.
 * - Ensures required platform roles exist.
 * - Ensures the authoritative permission catalogue exists.
 * - Ensures platform-role permission associations exist.
 * - Ensures the development administrator can be created safely.
 *
 * Important:
 * - This is an application startup seed.
 * - It is intended for the current development architecture.
 * - Production database schema changes must continue to use
 *   explicit TypeORM migrations.
 *
 * Security:
 * - Roles must exist before role-permission associations are created.
 * - Permissions must exist before role-permission associations are created.
 * - Permission assignments are explicit and database-backed.
 * - Seeds do not silently remove existing security configuration.
 */

import { DataSource } from 'typeorm';

import { seedAdmin } from './admin.seed';
import { seedPermissions } from './permission.seed';
import { seedRolePermissions } from './role-permission.seed';
import { seedRoles } from './role.seed';

/**
 * Initialise required application data.
 *
 * Execution order:
 *
 *   Database connection
 *        ↓
 *   Required platform roles
 *        ↓
 *   Authoritative permissions
 *        ↓
 *   Role → permission associations
 *        ↓
 *   Development administrator
 */
export async function seedDatabase(
  dataSource: DataSource,
): Promise<void> {
  /**
   * Roles must exist before role-permission associations
   * and the administrator seed can run.
   */
  await seedRoles(dataSource);

  /**
   * Permission records must exist before role-permission
   * associations can be created.
   */
  await seedPermissions(dataSource);

  /**
   * Establish explicit database-backed platform-role
   * permissions.
   */
  await seedRolePermissions(dataSource);

  /**
   * Create the development administrator if necessary.
   */
  await seedAdmin(dataSource);

  console.log(
    'Database initialisation completed successfully.',
  );
}