/**
 * File:
 * C:\Projects\PeopleFirstPolitician\backend\src\migrations\1790611944975-1790609745078-AddPermissionsAndRolePermissions.ts
 *
 * Purpose:
 * - Creates the authoritative permissions table.
 * - Creates the role-to-permission association table.
 * - Establishes the database constraints required for explicit
 *   platform-role authorisation.
 *
 * Security:
 * - Permission codes are unique.
 * - A role cannot receive the same permission more than once.
 * - Deleting a role or permission removes its role-permission
 *   associations through CASCADE.
 *
 * Migration safety:
 * - permissions is created before role_permissions because
 *   role_permissions.permission_id references permissions.id.
 * - The down migration removes dependent objects before the
 *   referenced permissions table.
 */

import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPermissionsAndRolePermissions1790611944975
  implements MigrationInterface
{
  name = 'AddPermissionsAndRolePermissions1790611944975';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "permissions" (` +
        `"id" uuid NOT NULL DEFAULT uuid_generate_v4(), ` +
        `"code" character varying(120) NOT NULL, ` +
        `"description" text, ` +
        `"created_at" TIMESTAMP NOT NULL DEFAULT now(), ` +
        `"updated_at" TIMESTAMP NOT NULL DEFAULT now(), ` +
        `CONSTRAINT "UQ_8dad765629e83229da6feda1c1d" UNIQUE ("code"), ` +
        `CONSTRAINT "PK_920331560282b8bd21bb02290df" PRIMARY KEY ("id")` +
      `)`,
    );

    await queryRunner.query(
      `CREATE TABLE "role_permissions" (` +
        `"id" uuid NOT NULL DEFAULT uuid_generate_v4(), ` +
        `"role_id" uuid NOT NULL, ` +
        `"permission_id" uuid NOT NULL, ` +
        `"created_at" TIMESTAMP NOT NULL DEFAULT now(), ` +
        `CONSTRAINT "UQ_role_permissions_role_permission" ` +
        `UNIQUE ("role_id", "permission_id"), ` +
        `CONSTRAINT "PK_84059017c90bfcb701b8fa42297" PRIMARY KEY ("id")` +
      `)`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_role_permissions_permission" ` +
        `ON "role_permissions" ("permission_id")`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_role_permissions_role" ` +
        `ON "role_permissions" ("role_id")`,
    );

    await queryRunner.query(
      `ALTER TABLE "role_permissions" ` +
        `ADD CONSTRAINT "FK_178199805b901ccd220ab7740ec" ` +
        `FOREIGN KEY ("role_id") REFERENCES "roles"("id") ` +
        `ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "role_permissions" ` +
        `ADD CONSTRAINT "FK_17022daf3f885f7d35423e9971e" ` +
        `FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ` +
        `ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "role_permissions" ` +
        `DROP CONSTRAINT "FK_17022daf3f885f7d35423e9971e"`,
    );

    await queryRunner.query(
      `ALTER TABLE "role_permissions" ` +
        `DROP CONSTRAINT "FK_178199805b901ccd220ab7740ec"`,
    );

    await queryRunner.query(
      `DROP INDEX "public"."IDX_role_permissions_role"`,
    );

    await queryRunner.query(
      `DROP INDEX "public"."IDX_role_permissions_permission"`,
    );

    await queryRunner.query(
      `DROP TABLE "role_permissions"`,
    );

    await queryRunner.query(
      `DROP TABLE "permissions"`,
    );
  }
}