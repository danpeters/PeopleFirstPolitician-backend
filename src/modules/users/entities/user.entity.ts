/**
 * File: C:\Projects\PeopleFirstPolitician\backend\src\modules\users\entities\user.entity.ts
 *
 * Purpose:
 * - Defines the User entity for internal platform users.
 * - Users are linked to roles for backend access control.
 *
 * Security notes:
 * - Passwords must never be stored in plaintext.
 * - Only password hashes should be stored.
 * - Email should be unique.
 * - Suspended users should later be blocked from login.
 */

import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from '../../roles/entities/role.entity';
import { UserStatusEnum } from '../../../common/enums/user-status.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'full_name', type: 'varchar', length: 180 })
  fullName!: string;

  @Column({ type: 'varchar', length: 180, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 30, unique: true, nullable: true })
  phone!: string | null;

  @Column({ name: 'password_hash', type: 'text' })
  passwordHash!: string;

  @Column({ name: 'role_id', type: 'uuid' })
  roleId!: string;

  @ManyToOne(() => Role, (role) => role.users, { eager: true })
  @JoinColumn({ name: 'role_id' })
  role!: Role;


  /**
   * Stores hashed refresh token for session management.
   * This is NOT the raw token.
   */
  @Column({ type: 'text', nullable: true })
  refreshTokenHash!: string | null;

    /**
   * Stores only the SHA-256 hash of a password-reset token.
   *
   * Security:
   * - The raw reset token is never stored.
   * - A reset token is temporary.
   * - The token becomes unusable after its expiry time.
   */
  @Column({
    name: 'password_reset_token_hash',
    type: 'text',
    nullable: true,
  })
  passwordResetTokenHash!: string | null;

  /**
   * Expiry time for the password-reset token.
   *
   * A reset token must not be accepted after this timestamp.
   */
  @Column({
    name: 'password_reset_expires_at',
    type: 'timestamp',
    nullable: true,
  })
  passwordResetExpiresAt!: Date | null;

  @Column({
    type: 'varchar',
    length: 30,
    default: UserStatusEnum.ACTIVE,
  })
  status!: UserStatusEnum;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt!: Date | null;
}