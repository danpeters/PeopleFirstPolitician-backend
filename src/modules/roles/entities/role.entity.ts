/**
 * File: C:\Projects\PeopleFirstPolitician\backend\src\modules\roles\entities\role.entity.ts
 *
 * Purpose:
 * - Defines platform-level application roles.
 * - Associates users with their platform role.
 * - Associates roles with fine-grained permissions.
 *
 * Security:
 * - Roles are assigned only by trusted backend logic.
 * - Public registration must never accept a role from the client.
 */

import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from '../../users/entities/user.entity';
import { RolePermission } from './role-permission.entity';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @OneToMany(() => User, (user) => user.role)
  users!: User[];

  @OneToMany(
    () => RolePermission,
    (rolePermission) => rolePermission.role,
  )
  rolePermissions!: RolePermission[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}