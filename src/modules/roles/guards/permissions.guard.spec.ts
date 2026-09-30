/**
 * File: C:\Projects\PeopleFirstPolitician\backend\src\modules\roles\guards\permissions.guard.spec.ts
 *
 * Purpose:
 * - Verifies fine-grained permission enforcement.
 * - Verifies both platform-role and organisation-membership
 *   permission resolution.
 *
 * Security scenarios:
 * - No permission metadata allows the route.
 * - Missing authenticated role is rejected.
 * - Unknown role is rejected.
 * - Unknown permission is rejected.
 * - Role without permission is rejected.
 * - Role with required permission is allowed.
 * - Multiple permissions require all permissions.
 * - Organisation-scoped permissions use the active membership role.
 * - Missing organisation membership is rejected.
 * - A role from another organisation cannot be used.
 * - Super admin retains platform-level permission handling.
 */

import {
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { PermissionsGuard } from './permissions.guard';
import { Permission } from '../entities/permission.entity';
import { RolePermission } from '../entities/role-permission.entity';
import { Role } from '../entities/role.entity';

import {
  OrganisationMembership,
  OrganisationMembershipStatus,
} from '../../organisations/entities/organisation-membership.entity';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;

  const reflectorMock = {
    getAllAndOverride: jest.fn(),
    get: jest.fn(),
    getAll: jest.fn(),
    getAllAndMerge: jest.fn(),
  };

  const roleRepositoryMock = {
    findOne: jest.fn(),
  };

  const permissionRepositoryMock = {
    findOne: jest.fn(),
  };

  const rolePermissionRepositoryMock = {
    findOne: jest.fn(),
  };

  const organisationMembershipRepositoryMock = {
    findOne: jest.fn(),
  };

  const executionContextMock = {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: jest.fn(),
  };

  const createContext = (
    user?: {
      userId?: string;
      email?: string;
      role?: string;
    },
    params: Record<string, string> = {},
  ) => {
    executionContextMock.switchToHttp.mockReturnValue({
      getRequest: () => ({
        user,
        params,
      }),
    });

    return executionContextMock as unknown as ExecutionContext;
  };

  beforeEach(() => {
    jest.resetAllMocks();

    guard = new PermissionsGuard(
      reflectorMock as unknown as Reflector,
      roleRepositoryMock as any,
      permissionRepositoryMock as any,
      rolePermissionRepositoryMock as any,
      organisationMembershipRepositoryMock as any,
    );
  });

  it('should allow access when no permissions are declared', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue([]);

    await expect(
      guard.canActivate(createContext()),
    ).resolves.toBe(true);

    expect(
      roleRepositoryMock.findOne,
    ).not.toHaveBeenCalled();

    expect(
      organisationMembershipRepositoryMock.findOne,
    ).not.toHaveBeenCalled();
  });

  it('should reject a request with no authenticated platform role', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue([
      'result.submit',
    ]);

    await expect(
      guard.canActivate(
        createContext({
          userId: 'user-1',
        }),
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should reject when the platform role does not exist', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue([
      'result.submit',
    ]);

    roleRepositoryMock.findOne.mockResolvedValue(null);

    await expect(
      guard.canActivate(
        createContext({
          userId: 'user-1',
          role: 'super_admin',
        }),
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should reject when the permission is not defined', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue([
      'result.submit',
    ]);

    const role = {
      id: 'role-1',
      name: 'super_admin',
    } as Role;

    roleRepositoryMock.findOne.mockResolvedValue(role);

    permissionRepositoryMock.findOne.mockResolvedValue(null);

    await expect(
      guard.canActivate(
        createContext({
          userId: 'user-1',
          role: 'super_admin',
        }),
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should reject when the platform role does not have the permission', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue([
      'result.submit',
    ]);

    const role = {
      id: 'role-1',
      name: 'campaign_manager',
    } as Role;

    const permission = {
      id: 'permission-1',
      code: 'result.submit',
    } as Permission;

    roleRepositoryMock.findOne.mockResolvedValue(role);

    permissionRepositoryMock.findOne.mockResolvedValue(permission);

    rolePermissionRepositoryMock.findOne.mockResolvedValue(null);

    await expect(
      guard.canActivate(
        createContext({
          userId: 'user-1',
          role: 'campaign_manager',
        }),
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should allow access when the platform role has the required permission', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue([
      'result.submit',
    ]);

    const role = {
      id: 'role-1',
      name: 'campaign_manager',
    } as Role;

    const permission = {
      id: 'permission-1',
      code: 'result.submit',
    } as Permission;

    const rolePermission = {
      id: 'role-permission-1',
      roleId: role.id,
      permissionId: permission.id,
    } as RolePermission;

    roleRepositoryMock.findOne.mockResolvedValue(role);

    permissionRepositoryMock.findOne.mockResolvedValue(permission);

    rolePermissionRepositoryMock.findOne.mockResolvedValue(
      rolePermission,
    );

    await expect(
      guard.canActivate(
        createContext({
          userId: 'user-1',
          role: 'campaign_manager',
        }),
      ),
    ).resolves.toBe(true);
  });

  it('should require every declared permission', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue([
      'result.view',
      'result.submit',
    ]);

    const role = {
      id: 'role-1',
      name: 'campaign_manager',
    } as Role;

    roleRepositoryMock.findOne.mockResolvedValue(role);

    permissionRepositoryMock.findOne
      .mockResolvedValueOnce({
        id: 'permission-view',
        code: 'result.view',
      })
      .mockResolvedValueOnce({
        id: 'permission-submit',
        code: 'result.submit',
      });

    rolePermissionRepositoryMock.findOne
      .mockResolvedValueOnce({
        id: 'rp-view',
        roleId: role.id,
        permissionId: 'permission-view',
      })
      .mockResolvedValueOnce(null);

    await expect(
      guard.canActivate(
        createContext({
          userId: 'user-1',
          role: 'campaign_manager',
        }),
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should allow multiple permissions when the role has all of them', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue([
      'result.view',
      'result.submit',
    ]);

    const role = {
      id: 'role-1',
      name: 'campaign_manager',
    } as Role;

    roleRepositoryMock.findOne.mockResolvedValue(role);

    permissionRepositoryMock.findOne
      .mockResolvedValueOnce({
        id: 'permission-view',
        code: 'result.view',
      })
      .mockResolvedValueOnce({
        id: 'permission-submit',
        code: 'result.submit',
      });

    rolePermissionRepositoryMock.findOne
      .mockResolvedValueOnce({
        id: 'rp-view',
        roleId: role.id,
        permissionId: 'permission-view',
      })
      .mockResolvedValueOnce({
        id: 'rp-submit',
        roleId: role.id,
        permissionId: 'permission-submit',
      });

    await expect(
      guard.canActivate(
        createContext({
          userId: 'user-1',
          role: 'campaign_manager',
        }),
      ),
    ).resolves.toBe(true);
  });

  it('should resolve permissions from the active organisation membership role', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue([
      'agent_assignment.create',
    ]);

    const role = {
      id: 'campaign-manager-role',
      name: 'campaign_manager',
    } as Role;

    const membership = {
      id: 'membership-1',
      userId: 'user-1',
      organisationId: 'organisation-1',
      roleId: role.id,
      status: OrganisationMembershipStatus.ACTIVE,
    } as OrganisationMembership;

    const permission = {
      id: 'permission-1',
      code: 'agent_assignment.create',
    } as Permission;

    const rolePermission = {
      id: 'role-permission-1',
      roleId: role.id,
      permissionId: permission.id,
    } as RolePermission;

    organisationMembershipRepositoryMock.findOne.mockResolvedValue(
      membership,
    );

    roleRepositoryMock.findOne.mockResolvedValue(role);

    permissionRepositoryMock.findOne.mockResolvedValue(permission);

    rolePermissionRepositoryMock.findOne.mockResolvedValue(
      rolePermission,
    );

    await expect(
      guard.canActivate(
        createContext(
          {
            userId: 'user-1',
            role: 'user',
          },
          {
            organisationId: 'organisation-1',
          },
        ),
      ),
    ).resolves.toBe(true);

    expect(
      organisationMembershipRepositoryMock.findOne,
    ).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        organisationId: 'organisation-1',
        status: OrganisationMembershipStatus.ACTIVE,
      },
    });

    expect(
      roleRepositoryMock.findOne,
    ).toHaveBeenCalledWith({
      where: {
        id: role.id,
      },
    });
  });

  it('should reject an organisation-scoped request without an active membership', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue([
      'agent_assignment.create',
    ]);

    organisationMembershipRepositoryMock.findOne.mockResolvedValue(
      null,
    );

    await expect(
      guard.canActivate(
        createContext(
          {
            userId: 'user-1',
            role: 'user',
          },
          {
            organisationId: 'organisation-1',
          },
        ),
      ),
    ).rejects.toThrow(ForbiddenException);

    expect(
      roleRepositoryMock.findOne,
    ).not.toHaveBeenCalled();
  });

  it('should not use a role from a different organisation', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue([
      'agent_assignment.create',
    ]);

    organisationMembershipRepositoryMock.findOne.mockResolvedValue(
      null,
    );

    await expect(
      guard.canActivate(
        createContext(
          {
            userId: 'user-1',
            role: 'user',
          },
          {
            organisationId: 'organisation-2',
          },
        ),
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should allow super_admin to use the platform role on an organisation-scoped request', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue([
      'agent_assignment.create',
    ]);

    const role = {
      id: 'super-admin-role',
      name: 'super_admin',
    } as Role;

    const permission = {
      id: 'permission-1',
      code: 'agent_assignment.create',
    } as Permission;

    const rolePermission = {
      id: 'role-permission-1',
      roleId: role.id,
      permissionId: permission.id,
    } as RolePermission;

    roleRepositoryMock.findOne.mockResolvedValue(role);

    permissionRepositoryMock.findOne.mockResolvedValue(permission);

    rolePermissionRepositoryMock.findOne.mockResolvedValue(
      rolePermission,
    );

    await expect(
      guard.canActivate(
        createContext(
          {
            userId: 'user-1',
            role: 'super_admin',
          },
          {
            organisationId: 'organisation-1',
          },
        ),
      ),
    ).resolves.toBe(true);

    expect(
      organisationMembershipRepositoryMock.findOne,
    ).not.toHaveBeenCalled();
  });
});