/**
 * File:
 * C:\Projects\PeopleFirstPolitician\backend\src\common\seeds\role-permission.seed.spec.ts
 *
 * Purpose:
 * - Unit tests for the platform role-permission configuration.
 * - Verifies that all four platform roles are explicitly configured.
 * - Verifies that SUPER_ADMIN receives every permission in the
 *   authoritative permission catalogue.
 * - Verifies that CAMPAIGN_MANAGER has the intended operational
 *   permissions.
 * - Verifies that ANALYST cannot manage election results.
 * - Verifies that USER cannot manage election results.
 * - Verifies that USER cannot manage campaign memberships.
 *
 * Security principles:
 * - No hidden SUPER_ADMIN bypass is assumed by these tests.
 * - The permission catalogue remains the authoritative source.
 * - Least privilege is explicitly tested for lower-privileged roles.
 * - Role permissions are separate from contextual authorisation.
 *
 * Important:
 * - These are configuration tests only.
 * - They do not replace organisation membership, campaign membership,
 *   resource ownership, agent assignment, workflow-state or audit checks.
 */

import { ROLE_PERMISSION_CONFIGURATION } from './role-permission.seed';

import { PERMISSION_CATALOGUE } from '../../modules/roles/permissions/permission-catalogue';

import { RoleEnum } from '../enums/role.enum';

/**
 * Return whether a platform role contains a particular permission.
 */
function roleHasPermission(
  role: RoleEnum,
  permissionCode: string,
): boolean {
  return ROLE_PERMISSION_CONFIGURATION[role].includes(permissionCode);
}

/**
 * Return the complete permission-code list from the authoritative
 * permission catalogue.
 */
function getCatalogueCodes(): string[] {
  return PERMISSION_CATALOGUE.map(
    (permission) => permission.code,
  );
}

describe('Role-permission configuration', () => {
  /**
   * Test 1:
   * All four platform roles must have an explicit configuration.
   */
  it('should explicitly configure all four platform roles', () => {
    expect(
      Object.keys(ROLE_PERMISSION_CONFIGURATION).sort(),
    ).toEqual(
      [
        RoleEnum.SUPER_ADMIN,
        RoleEnum.CAMPAIGN_MANAGER,
        RoleEnum.ANALYST,
        RoleEnum.USER,
      ].sort(),
    );
  });

  /**
   * Test 2:
   * SUPER_ADMIN must receive every permission explicitly.
   *
   * This prevents the application from depending on an implicit
   * application-code bypass for SUPER_ADMIN.
   */
  it('should grant SUPER_ADMIN every permission in the catalogue', () => {
    const catalogueCodes = getCatalogueCodes();

    const superAdminPermissions =
      ROLE_PERMISSION_CONFIGURATION[RoleEnum.SUPER_ADMIN];

    expect(superAdminPermissions).toHaveLength(
      catalogueCodes.length,
    );

    expect(
      new Set(superAdminPermissions),
    ).toEqual(new Set(catalogueCodes));
  });

  /**
   * Test 3:
   * CAMPAIGN_MANAGER must have the operational permissions required
   * for campaign administration.
   */
  it('should grant CAMPAIGN_MANAGER the intended operational permissions', () => {
    const requiredPermissions = [
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
    ];

    const campaignManagerPermissions =
      ROLE_PERMISSION_CONFIGURATION[RoleEnum.CAMPAIGN_MANAGER];

    expect(campaignManagerPermissions).toEqual(
      expect.arrayContaining(requiredPermissions),
    );

    expect(campaignManagerPermissions).toHaveLength(
      requiredPermissions.length,
    );
  });

  /**
   * Test 4:
   * ANALYST is intended primarily for analysis/reporting and must not
   * receive result mutation or verification permissions.
   */
  it('should prevent ANALYST from receiving result-management permissions', () => {
    const forbiddenPermissions = [
      'result.create',
      'result.update_draft',
      'result.submit',
      'result.synchronize',
      'result.verify',
      'result.flag',
      'result.amend',
      'result.export',
    ];

    for (const permission of forbiddenPermissions) {
      expect(
        roleHasPermission(
          RoleEnum.ANALYST,
          permission,
        ),
      ).toBe(false);
    }
  });

  /**
   * Test 5:
   * USER must not receive result-management permissions.
   */
  it('should prevent USER from receiving result-management permissions', () => {
    const forbiddenPermissions = [
      'result.create',
      'result.update_draft',
      'result.submit',
      'result.synchronize',
      'result.verify',
      'result.flag',
      'result.amend',
      'result.export',
    ];

    for (const permission of forbiddenPermissions) {
      expect(
        roleHasPermission(
          RoleEnum.USER,
          permission,
        ),
      ).toBe(false);
    }
  });

  /**
   * Test 6:
   * USER must not receive campaign-membership management permissions.
   */
  it('should prevent USER from receiving campaign-membership management permissions', () => {
    const forbiddenPermissions = [
      'campaign_membership.create',
      'campaign_membership.update',
      'campaign_membership.change_status',
      'campaign_membership.remove',
      'campaign_membership.restore',
      'campaign_membership.assign_manager',
    ];

    for (const permission of forbiddenPermissions) {
      expect(
        roleHasPermission(
          RoleEnum.USER,
          permission,
        ),
      ).toBe(false);
    }
  });
});