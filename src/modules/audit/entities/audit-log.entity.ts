/**
 * File: src/modules/audit/entities/audit-log.entity.ts
 *
 * Purpose:
 * Stores admin and system activity for traceability and monitoring.
 */

import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * Action name, for example:
   * - USER_CREATED
   * - USER_UPDATED
   * - USER_STATUS_UPDATED
   * - USER_DELETED
   * - USER_RESTORED
   */
  @Column({ type: 'varchar', length: 100 })
  action!: string;

  /**
   * Module or domain where the event happened.
   * Example: users, roles, auth
   */
  @Column({ type: 'varchar', length: 100 })
  module!: string;

  /**
   * ID of the acting user, usually the admin performing the action.
   */
  @Column({ type: 'uuid', nullable: true })
  actorId!: string | null;

  /**
   * ID of the affected record.
   */
  @Column({ type: 'uuid', nullable: true })
  targetId!: string | null;

  /**
   * Free-form JSON details for extra context.
   */
  @Column({ type: 'jsonb', nullable: true })
  details!: Record<string, unknown> | null;

  /**
   * Timestamp for when the event occurred.
   */
  @CreateDateColumn()
  createdAt!: Date;
}