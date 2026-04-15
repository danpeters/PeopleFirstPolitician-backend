/**
 * File: C:\Projects\PeopleFirstPolitician\backend\src\modules\roles\roles.module.ts
 *
 * Purpose:
 * - Groups together Role-related entities, service, and controller.
 *
 * Security notes:
 * - RolesService is exported so it can be reused by other modules safely.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Role, Permission])],
  providers: [RolesService],
  controllers: [RolesController],
  exports: [RolesService, TypeOrmModule],
})
export class RolesModule {}