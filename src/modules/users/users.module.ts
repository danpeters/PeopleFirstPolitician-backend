/**
 * File: C:\Projects\PeopleFirstPolitician\backend\src\modules\users\users.module.ts
 *
 * Purpose:
 * - Groups together the User entity, DTOs, service, and controller.
 *
 * Why this file exists:
 * - NestJS modules keep feature logic organized and reusable.
 *
 * Security notes:
 * - RolesModule is imported so role resolution can be done centrally.
 * - Exporting UsersService allows later reuse by the Auth module.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role]), AuditModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}