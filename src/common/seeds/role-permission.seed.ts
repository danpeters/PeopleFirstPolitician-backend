/**
 * File:
 * C:\Projects\PeopleFirstPolitician\backend\src\common\seeds\role-permission.seed.ts
 *
 * Purpose:
 * - Creates explicit platform-role to permission associations.
 * - Uses the authoritative permission catalogue as the single source
 *   of truth for permission codes.
 * - Provides deterministic, idempotent role-permission seeding.
 * - Validates role-permission configuration before database writes.
 *
 * Platform roles:
 * - super_admin
 * - campaign_manager
 * - analyst
 * - user
 *
 * Security principles:
 * - SUPER_ADMIN does NOT receive a hidden application-code bypass.
 * - Every permission must exist explicitly in role_permissions.
 * - Permission codes come from permission-catalogue.ts.
 * - Organisation membership, campaign membership, campaign role,
 *   resource ownership and agent assignment remain additional
 *   contextual security layers.
 *
 * Important:
 * - This seed creates missing associations only.
 * - Existing associations are not silently removed.
 * - Permission removal or role privilege reduction requires an
 *   explicit security review and controlled change.
 */

import { DataSource } from 'typeorm';

import { Permission } from '../../modules/roles/entities/permission.entity';
import { RolePermission } from '../../modules/roles/entities/role-permission.entity';
import { Role } from '../../modules/roles/entities/role.entity';
import { PERMISSION_CATALOGUE } from '../../modules/roles/permissions/permission-catalogue';

import { RoleEnum } from '../enums/role.enum';

/**
 * Role-to-permission configuration.
 *
 * Permission codes are represented as strings here because the
 * authoritative catalogue is responsible for defining the valid
 * permission vocabulary.
 */
type RolePermissionMap = Record<RoleEnum, readonly string[]>;

/**
 * SUPER_ADMIN receives every permission explicitly listed in the
 * authoritative permission catalogue.
 *
 * This is intentional: SUPER_ADMIN has no hidden application-code
 * permission bypass.
 */
const ALL_PERMISSIONS = PERMISSION_CATALOGUE.map(
  (permission) => permission.code,
);

/**
 * Permissions granted to CAMPAIGN_MANAGER.
 *
 * These permissions provide the platform capability required for
 * campaign operations. They do not remove contextual checks such as:
 * - organisation membership;
 * - campaign membership;
 * - campaign role;
 * - resource ownership;
 * - agent assignment;
 * - result workflow state.
 */
const CAMPAIGN_MANAGER_PERMISSIONS = [
  'organisation.view',

  'user.view',
  'user.create',
  'user.update',

  'geography.view',
  'geography.import',

  'party.view',

  'election.view',
  'election.create',
  'election.update',
  'election.manage_positions',
  'election.manage_scopes',
  'election.manage_races',

  'candidate.view',
  'candidate.create',
  'candidate.update',

  'candidacy.view',
  'candidacy.create',
  'candidacy.update',
  'candidacy.withdraw',

  'campaign.view',
  'campaign.create',
  'campaign.update',
  'campaign.activate',
  'campaign.suspend',
  'campaign.complete',

  'campaign_membership.view',
  'campaign_membership.create',
  'campaign_membership.update',
  'campaign_membership.change_status',
  'campaign_membership.remove',
  'campaign_membership.restore',
  'campaign_membership.assign_manager',

  'agent.view',
  'agent.create',
  'agent.update',
  'agent.suspend',
  'agent.remove',

  'agent_assignment.view',
  'agent_assignment.create',
  'agent_assignment.update',
  'agent_assignment.remove',

  'result.view',
  'result.create',
  'result.update_draft',
  'result.submit',
  'result.synchronize',
  'result.verify',
  'result.flag',
  'result.amend',
  'result.export',

  'report.view',
  'report.create',
  'report.export',

  'audit.view',
] as const;

/**
 * Permissions granted to ANALYST.
 *
 * ANALYST is intended for information access and reporting rather than
 * operational result mutation.
 */
const ANALYST_PERMISSIONS = [
  'organisation.view',

  'user.view',

  'geography.view',

  'party.view',

  'election.view',

  'candidate.view',

  'candidacy.view',

  'campaign.view',

  'campaign_membership.view',

  'agent.view',

  'agent_assignment.view',

  'result.view',

  'report.view',
  'report.create',
  'report.export',

  'audit.view',
] as const;

/**
 * Permissions granted to the basic USER role.
 *
 * USER has limited read access and does not receive operational
 * campaign-management, result-management or membership-management
 * permissions.
 */
const USER_PERMISSIONS = [
  'organisation.view',
  'geography.view',
  'party.view',
  'election.view',
  'candidate.view',
  'candidacy.view',
  'campaign.view',
] as const;

/**
 * Authoritative platform-role to permission configuration.
 */
const ROLE_PERMISSION_MAP: RolePermissionMap = {
  [RoleEnum.SUPER_ADMIN]: ALL_PERMISSIONS,

  [RoleEnum.CAMPAIGN_MANAGER]: CAMPAIGN_MANAGER_PERMISSIONS,

  [RoleEnum.ANALYST]: ANALYST_PERMISSIONS,

  [RoleEnum.USER]: USER_PERMISSIONS,
};

/**
 * Validate the role-permission configuration against the authoritative
 * permission catalogue before any database writes are performed.
 *
 * This prevents:
 * - misspelled permission codes;
 * - permissions that were removed from the catalogue;
 * - accidental permission drift between the catalogue and role
 *   configuration.
 */
export function validateRolePermissionConfiguration(): void {
  const catalogueCodes = new Set<string>(
    PERMISSION_CATALOGUE.map((permission) => permission.code),
  );

  for (const [roleName, configuredPermissions] of Object.entries(
    ROLE_PERMISSION_MAP,
  )) {
    for (const permissionCode of configuredPermissions) {
      if (!catalogueCodes.has(permissionCode)) {
        throw new Error(
          `Unknown permission "${permissionCode}" configured for role "${roleName}". ` +
            `Add it to PERMISSION_CATALOGUE before assigning it to a role.`,
        );
      }
    }
  }
}

/**
 * Creates missing role-permission associations.
 *
 * Existing associations are deliberately preserved.
 */
export async function seedRolePermissions(
  dataSource: DataSource,
): Promise<void> {
  validateRolePermissionConfiguration();

  const roleRepository = dataSource.getRepository(Role);
  const permissionRepository = dataSource.getRepository(Permission);
  const rolePermissionRepository =
    dataSource.getRepository(RolePermission);

  let created = 0;

  for (const [roleName, permissionCodes] of Object.entries(
    ROLE_PERMISSION_MAP,
  )) {
    const role = await roleRepository.findOne({
      where: {
        name: roleName,
      },
    });

    if (!role) {
      throw new Error(
        `Cannot seed role permissions: role "${roleName}" does not exist.`,
      );
    }

    for (const permissionCode of permissionCodes) {
      const permission = await permissionRepository.findOne({
        where: {
          code: permissionCode,
        },
      });

      if (!permission) {
        throw new Error(
          `Cannot seed role permissions: permission "${permissionCode}" does not exist.`,
        );
      }

      const existing = await rolePermissionRepository.findOne({
        where: {
          roleId: role.id,
          permissionId: permission.id,
        },
      });

      if (existing) {
        continue;
      }

      const rolePermission = rolePermissionRepository.create({
        roleId: role.id,
        permissionId: permission.id,
      });

      await rolePermissionRepository.save(rolePermission);
      created += 1;
    }
  }

  console.log(
    `Role-permission seed completed. Created ${created} missing associations.`,
  );
}

/**
 * Exported configuration used by focused unit tests.
 *
 * The application should normally use seedRolePermissions().
 * This export allows tests to verify the configured permissions
 * without duplicating the role-permission map.
 */
export const ROLE_PERMISSION_CONFIGURATION = ROLE_PERMISSION_MAP;