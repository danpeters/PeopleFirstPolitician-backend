/**
 * File: C:\Projects\PeopleFirstPolitician\backend\src\modules\roles\entities\role-permission.entity.ts
 *
 * Purpose:
 * - Associates application Roles with specific Permissions.
 * - Provides the foundation for fine-grained authorisation.
 *
 * Security:
 * - A role does not automatically receive every permission.
 * - Permissions are assigned through trusted backend seed/administrative logic.
 * - Public users must never be allowed to create or modify RolePermission
 *   records.
 *
 * Design:
 * - Role = broad platform-level security identity.
 * - Permission = specific action the role may perform.
 * - RolePermission = many-to-many association between them.
 */

import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

import { Permission } from './permission.entity';
import { Role } from './role.entity';

@Entity('role_permissions')
@Unique(
  'UQ_role_permissions_role_permission',
  ['roleId', 'permissionId'],
)
@Index('IDX_role_permissions_role', ['roleId'])
@Index('IDX_role_permissions_permission', ['permissionId'])
export class RolePermission {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'role_id', type: 'uuid' })
  roleId!: string;

  @ManyToOne(() => Role, (role) => role.rolePermissions, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'role_id' })
  role!: Role;

  @Column({ name: 'permission_id', type: 'uuid' })
  permissionId!: string;

  @ManyToOne(
    () => Permission,
    (permission) => permission.rolePermissions,
    {
      nullable: false,
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'permission_id' })
  permission!: Permission;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}