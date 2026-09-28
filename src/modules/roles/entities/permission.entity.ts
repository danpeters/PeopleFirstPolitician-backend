/**
 * File: C:\Projects\PeopleFirstPolitician\backend\src\modules\roles\entities\permission.entity.ts
 *
 * Purpose:
 * - Defines individual application permissions.
 * - Provides fine-grained authorisation capabilities.
 *
 * Security:
 * - Permission definitions are controlled by trusted backend code.
 * - Public users cannot create or modify permissions.
 */

import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { RolePermission } from './role-permission.entity';

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 120, unique: true })
  code!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @OneToMany(
    () => RolePermission,
    (rolePermission) => rolePermission.permission,
  )
  rolePermissions!: RolePermission[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}