/**
 * File: C:\Projects\PeopleFirstPolitician\backend\src\common\seeds\role.seed.ts
 *
 * Purpose:
 * - Ensures that all required application roles exist.
 * - Provides a single source of truth for initial role creation.
 * - Makes application startup initialisation idempotent.
 *
 * Security:
 * - Roles are created only by trusted backend startup logic.
 * - Public users cannot create or modify roles.
 * - Privileged roles are never exposed through public registration.
 */

import { DataSource } from 'typeorm';

import { Role } from '../../modules/roles/entities/role.entity';
import { RoleEnum } from '../enums/role.enum';

/**
 * Definitions of the roles required by the application.
 */
const REQUIRED_ROLES: Array<{
  name: RoleEnum;
  description: string;
}> = [
  {
    name: RoleEnum.SUPER_ADMIN,
    description:
      'Full system administration and platform management privileges.',
  },
  {
    name: RoleEnum.CAMPAIGN_MANAGER,
    description:
      'Manages campaign-related activities and campaign operations.',
  },
  {
    name: RoleEnum.ANALYST,
    description:
      'Provides access to analytical and reporting functions.',
  },
  {
    name: RoleEnum.USER,
    description:
      'Ordinary registered People First Politician platform user.',
  },
];

/**
 * Ensure that all required roles exist.
 *
 * This function is safe to execute repeatedly.
 * Existing roles are left unchanged.
 */
export async function seedRoles(
  dataSource: DataSource,
): Promise<void> {
  const roleRepository =
    dataSource.getRepository(Role);

  for (const roleDefinition of REQUIRED_ROLES) {
    const existingRole =
      await roleRepository.findOne({
        where: {
          name: roleDefinition.name,
        },
      });

    /**
     * Do not recreate an existing role.
     */
    if (existingRole) {
      continue;
    }

    /**
     * Create the missing role.
     */
    const role =
      roleRepository.create({
        name: roleDefinition.name,
        description: roleDefinition.description,
      });

    await roleRepository.save(role);

    console.log(
      `Role created: ${roleDefinition.name}`,
    );
  }

  console.log(
    'Role initialisation completed successfully.',
  );
}