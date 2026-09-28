/**
 * File: C:\Projects\PeopleFirstPolitician\backend\src\modules\roles\guards\permissions.guard.ts
 *
 * Purpose:
 * - Enforces fine-grained application permissions.
 * - Works alongside the existing RolesGuard.
 *
 * Security model:
 * - Authentication is handled by JwtAuthGuard.
 * - Platform role is obtained from request.user.role.
 * - The role must have every permission declared by @Permissions().
 * - Missing permissions result in HTTP 403.
 * - No permission is granted implicitly.
 *
 * Important:
 * - This guard does NOT replace RolesGuard.
 * - Existing @Roles() protection continues to work.
 */

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { Permission } from '../entities/permission.entity';
import { RolePermission } from '../entities/role-permission.entity';
import { Role } from '../entities/role.entity';

interface AuthenticatedUser {
  userId?: string;
  email?: string;
  role?: string;
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,

    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,

    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,

    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions =
      this.reflector.getAllAndOverride<string[]>(
        PERMISSIONS_KEY,
        [context.getHandler(), context.getClass()],
      );

    /**
     * No @Permissions metadata means that this guard has
     * nothing to enforce.
     */
    if (
      !requiredPermissions ||
      requiredPermissions.length === 0
    ) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser | undefined;

    if (!user?.role) {
      throw new ForbiddenException(
        'Access denied: no platform role found',
      );
    }

    /**
     * Resolve the platform role.
     */
    const role = await this.roleRepository.findOne({
      where: {
        name: user.role,
      },
    });

    if (!role) {
      throw new ForbiddenException(
        'Access denied: platform role not found',
      );
    }

    /**
     * Every declared permission must exist.
     *
     * This prevents a typo in @Permissions() from accidentally
     * creating an authorisation hole.
     */
    for (const permissionCode of requiredPermissions) {
      const permission =
        await this.permissionRepository.findOne({
          where: {
            code: permissionCode,
          },
        });

      if (!permission) {
        throw new ForbiddenException(
          `Access denied: permission "${permissionCode}" is not defined`,
        );
      }

      /**
       * Check whether this role has the permission.
       */
      const rolePermission =
        await this.rolePermissionRepository.findOne({
          where: {
            roleId: role.id,
            permissionId: permission.id,
          },
        });

      if (!rolePermission) {
        throw new ForbiddenException(
          `Access denied: missing permission "${permissionCode}"`,
        );
      }
    }

    return true;
  }
}