/**
 * File: C:\Projects\PeopleFirstPolitician\backend\src\common\seeds\database.seed.ts
 *
 * Purpose:
 * - Performs application-level database initialisation.
 * - Ensures required roles exist before users are created.
 * - Ensures the development administrator can be created safely.
 *
 * Important:
 * - This is an application startup seed.
 * - It is intended for the current development architecture.
 * - Production database schema changes should continue to use
 *   TypeORM migrations.
 */

import { DataSource } from 'typeorm';

import { seedRoles } from './role.seed';
import { seedAdmin } from './admin.seed';

/**
 * Initialise required application data.
 *
 * Execution order:
 *
 *   Database connection
 *        ↓
 *   Required roles
 *        ↓
 *   Development administrator
 */
export async function seedDatabase(
  dataSource: DataSource,
): Promise<void> {
  /**
   * Roles must exist before the admin seed runs because
   * the admin account requires the super_admin role.
   */
  await seedRoles(dataSource);

  /**
   * Create the development administrator if necessary.
   */
  await seedAdmin(dataSource);

  console.log(
    'Database initialisation completed successfully.',
  );
}