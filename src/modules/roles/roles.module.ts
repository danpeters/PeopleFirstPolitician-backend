/**
 * File: C:\Projects\PeopleFirstPolitician\backend\src\modules\roles\roles.module.ts
 *
 * Purpose:
 * - Groups Role and Permission functionality.
 * - Provides role/permission lookup services.
 * - Provides fine-grained permission enforcement.
 *
 * Security:
 * - Role and permission administration remains protected.
 * - PermissionsGuard is exported so protected modules can use it.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';

import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { PermissionsGuard } from './guards/permissions.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Role,
      Permission,
      RolePermission,
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