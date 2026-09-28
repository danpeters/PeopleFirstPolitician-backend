/**
 * File: C:\Projects\PeopleFirstPolitician\backend\src\modules\roles\guards\permissions.guard.spec.ts
 *
 * Purpose:
 * - Verifies fine-grained permission enforcement.
 *
 * Security scenarios:
 * - No permission metadata allows the route.
 * - Missing authenticated role is rejected.
 * - Unknown role is rejected.
 * - Unknown permission is rejected.
 * - Role without permission is rejected.
 * - Role with required permission is allowed.
 * - Multiple permissions require all permissions.
 *
 * Testing note:
 * - The Reflector is mocked with Jest functions.
 * - The mock is cast to Reflector only when injected into PermissionsGuard.
 * - This prevents TypeScript from treating getAllAndOverride()
 *   as the real Reflector method and allows mockReturnValue().
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

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;

  /**
   * Jest mock for NestJS Reflector.
   *
   * Important:
   * Do NOT type this object directly as Reflector.
   * Doing so causes TypeScript to treat getAllAndOverride()
   * as the real NestJS method and prevents use of
   * Jest methods such as mockReturnValue().
   */
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

  const executionContextMock = {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: jest.fn(),
  };

  /**
   * Creates a mocked NestJS execution context.
   */
  const createContext = (user?: {
    userId?: string;
    email?: string;
    role?: string;
  }) => {
    executionContextMock.switchToHttp.mockReturnValue({
      getRequest: () => ({
        user,
      }),
    });

    return executionContextMock as unknown as ExecutionContext;
  };

  beforeEach(() => {
    jest.resetAllMocks();

    /**
     * Cast the complete mock object to Reflector only here,
     * when it is supplied to the production guard.
     */
    guard = new PermissionsGuard(
      reflectorMock as unknown as Reflector,
      roleRepositoryMock as any,
      permissionRepositoryMock as any,
      rolePermissionRepositoryMock as any,
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

  it('should reject when the role does not have the permission', async () => {
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

  it('should allow access when the role has the required permission', async () => {
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
});