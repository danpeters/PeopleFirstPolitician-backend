/**
 * File:
 * C:\Projects\PeopleFirstPolitician\backend\src\common\seeds\permission.seed.ts
 *
 * Purpose:
 * - Seeds the authoritative permission catalogue.
 * - Idempotently creates missing permissions.
 * - Does not delete or modify existing permissions.
 *
 * Security principle:
 * - Permission records are treated as controlled security configuration.
 * - Existing descriptions are intentionally left unchanged.
 * - Removal or renaming of permissions must be handled through an
 *   explicit migration/security review rather than an automatic seed.
 */

import { DataSource } from 'typeorm';

import { Permission } from '../../modules/roles/entities/permission.entity';
import { PERMISSION_CATALOGUE } from '../../modules/roles/permissions/permission-catalogue';

export async function seedPermissions(
  dataSource: DataSource,
): Promise<void> {
  const repository = dataSource.getRepository(Permission);

  for (const definition of PERMISSION_CATALOGUE) {
    const existing = await repository.findOne({
      where: {
        code: definition.code,
      },
    });

    if (existing) {
      continue;
    }

    const permission = repository.create({
      code: definition.code,
      description: definition.description,
    });

    await repository.save(permission);
  }

  console.log(
    `Permission seed completed. Catalogue contains ${PERMISSION_CATALOGUE.length} permissions.`,
  );
}
