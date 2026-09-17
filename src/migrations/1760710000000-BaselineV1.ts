/**
 * File: src/migrations/1760710000000-BaselineV1.ts
 *
 * Purpose:
 * Establishes the TypeORM migration baseline for the existing
 * People First Politician v1.0 database schema.
 *
 * Important:
 * - The v1.0 schema already exists in the database.
 * - This baseline migration intentionally makes no schema changes.
 * - Existing application and geography data are not modified.
 */

import { MigrationInterface, QueryRunner } from 'typeorm';

export class BaselineV1_1760710000000 implements MigrationInterface {
  name = 'BaselineV1_1760710000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Baseline only.
    // The v1.0 database schema already exists.
    // No CREATE, ALTER, UPDATE, or DELETE statements are required.
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // The baseline must not attempt to remove the existing v1.0 schema.
    // Future migrations will manage changes made after this baseline.
  }
}