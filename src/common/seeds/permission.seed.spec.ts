/**
 * File:
 * C:\Projects\PeopleFirstPolitician\backend\src\common\seeds\permission.seed.spec.ts
 *
 * Purpose:
 * - Validates the permission catalogue before database migration.
 * - Protects against duplicate or accidentally missing permission codes.
 */

import {
  PERMISSION_CATALOGUE,
  PERMISSION_CATALOGUE_SIZE,
} from '../../modules/roles/permissions/permission-catalogue';

describe('Permission catalogue', () => {
  it('should contain exactly 69 permissions', () => {
    expect(PERMISSION_CATALOGUE).toHaveLength(
      PERMISSION_CATALOGUE_SIZE,
    );

    expect(PERMISSION_CATALOGUE_SIZE).toBe(69);
  });

  it('should contain unique permission codes', () => {
    const codes = PERMISSION_CATALOGUE.map(
      (permission) => permission.code,
    );

    expect(new Set(codes).size).toBe(codes.length);
  });

  it('should have a description for every permission', () => {
    for (const permission of PERMISSION_CATALOGUE) {
      expect(permission.code).toBeTruthy();
      expect(permission.description).toBeTruthy();
    }
  });

  it('should contain the critical result permissions', () => {
    const codes = PERMISSION_CATALOGUE.map(
      (permission) => permission.code,
    );

    expect(codes).toEqual(
      expect.arrayContaining([
        'result.view',
        'result.create',
        'result.update_draft',
        'result.submit',
        'result.synchronize',
        'result.verify',
        'result.flag',
        'result.amend',
        'result.export',
      ]),
    );
  });

  it('should contain the critical agent permissions', () => {
    const codes = PERMISSION_CATALOGUE.map(
      (permission) => permission.code,
    );

    expect(codes).toEqual(
      expect.arrayContaining([
        'agent.view',
        'agent.create',
        'agent.update',
        'agent.suspend',
        'agent.remove',
        'agent_assignment.view',
        'agent_assignment.create',
        'agent_assignment.update',
        'agent_assignment.remove',
      ]),
    );
  });
});