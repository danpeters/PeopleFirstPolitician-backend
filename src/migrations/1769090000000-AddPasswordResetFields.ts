/**
 * ============================================================
 * File:
 * C:\Projects\PeopleFirstPolitician\backend\src\migrations\1769090000000-AddPasswordResetFields.ts
 *
 * Purpose:
 * Adds password-reset token storage fields to the users table.
 * ============================================================
 */

import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
} from 'typeorm';

export class AddPasswordResetFields1769090000000
  implements MigrationInterface
{
  public async up(
    queryRunner: QueryRunner,
  ): Promise<void> {
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'password_reset_token_hash',
        type: 'text',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'password_reset_expires_at',
        type: 'timestamp',
        isNullable: true,
      }),
    );
  }

  public async down(
    queryRunner: QueryRunner,
  ): Promise<void> {
    await queryRunner.dropColumn(
      'users',
      'password_reset_expires_at',
    );

    await queryRunner.dropColumn(
      'users',
      'password_reset_token_hash',
    );
  }
}