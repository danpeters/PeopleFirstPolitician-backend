/**
 * File: C:\Projects\PeopleFirstPolitician\backend\src\modules\roles\roles.module.ts
 *
 * Purpose:
 * - Groups Role and Permission functionality.
 * - Provides role/permission lookup services.
 * - Provides fine-grained permission enforcement.
 *
 * Security:
 * - Platform-level permissions use the authenticated platform role.
 * - Organisation-scoped permissions use the user's active
 *   organisation membership role.
 * - PermissionsGuard is exported so protected modules can use it.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';

import { OrganisationMembership } from '../organisations/entities/organisation-membership.entity';

import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { PermissionsGuard } from './guards/permissions.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Role,
      Permission,
      RolePermission,
      OrganisationMembership,
    ]),
  ],

  providers: [
    RolesService,
    PermissionsGuard,
  ],

  controllers: [
    RolesController,
  ],

  exports: [
    RolesService,
    PermissionsGuard,
    TypeOrmModule,
  ],
})
export class RolesModule {}
