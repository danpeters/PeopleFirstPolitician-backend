/**
 * File: C:\Projects\PeopleFirstPolitician\backend\src\modules\roles\guards\permissions.guard.ts
 *
 * Purpose:
 * - Enforces fine-grained application permissions.
 * - Supports both platform-level and organisation-scoped permissions.
 *
 * Security model:
 * - Authentication is handled by JwtAuthGuard.
 * - Platform-level requests use request.user.role.
 * - Organisation-scoped requests use the authenticated user's
 *   active role within the requested organisation.
 * - Super administrators retain platform-level permission handling.
 * - Missing permissions result in HTTP 403.
 * - No permission is granted implicitly.
 *
 * Organisation-scoped request example:
 *   /organisations/:organisationId/...
 *
 * For such requests:
 *   authenticated user
 *       -> active organisation membership
 *       -> membership role
 *       -> role permissions
 *
 * This prevents a user's role in Organisation A from authorising
 * access to Organisation B.
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

import {
  OrganisationMembership,
  OrganisationMembershipStatus,
} from '../../organisations/entities/organisation-membership.entity';

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

    @InjectRepository(OrganisationMembership)
    private readonly organisationMembershipRepository: Repository<OrganisationMembership>,
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

    const organisationId =
      request.params?.organisationId as string | undefined;

    /**
     * Resolve the role in the correct security context.
     *
     * Platform-level requests:
     *   request.user.role
     *
     * Organisation-scoped requests:
     *   active OrganisationMembership.roleId
     *
     * Super administrators continue to use their platform role.
     */
    let role: Role | null = null;

    if (organisationId && user.role !== 'super_admin') {
      if (!user.userId) {
        throw new ForbiddenException(
          'Access denied: authenticated user ID not found',
        );
      }

      const membership =
        await this.organisationMembershipRepository.findOne({
          where: {
            userId: user.userId,
            organisationId,
            status: OrganisationMembershipStatus.ACTIVE,
          },
        });

      if (!membership) {
        throw new ForbiddenException(
          'Access denied: no active organisation membership found',
        );
      }

      role = await this.roleRepository.findOne({
        where: {
          id: membership.roleId,
        },
      });

      if (!role) {
        throw new ForbiddenException(
          'Access denied: organisation membership role not found',
        );
      }
    } else {
      /**
       * Platform-level permission resolution.
       *
       * This also handles super_admin requests to organisation-scoped
       * endpoints, preserving the existing platform administrator model.
       */
      role = await this.roleRepository.findOne({
        where: {
          name: user.role,
        },
      });

      if (!role) {
        throw new ForbiddenException(
          'Access denied: platform role not found',
        );
      }
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
       * Check whether the resolved role has the permission.
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