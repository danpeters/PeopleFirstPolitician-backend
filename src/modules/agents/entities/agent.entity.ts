/**
 * File:
 * C:\Projects\PeopleFirstPolitician\backend\src\modules\agents\entities\agent.entity.ts
 *
 * Purpose:
 * - Defines a polling-unit Agent.
 * - Represents a person who may be assigned to monitor a polling unit
 *   for a specific Campaign.
 *
 * Domain distinction:
 * - User = a person with a PFP platform account.
 * - Agent = a person designated to perform polling-unit field duties.
 * - Agent does not require a platform User account.
 * - AgentAssignment connects an Agent to a Campaign and Polling Unit.
 *
 * Security:
 * - Agent belongs to exactly one Organisation.
 * - User linkage is optional.
 * - Organisation isolation must be enforced at service level.
 * - Photograph is stored as a secure file/object reference, not binary data.
 * - Agent records use soft deletion for historical protection.
 * - Identification information must be protected by appropriate
 *   application-level access controls.
 *
 * Important:
 * - Agent assignment is NOT stored here.
 * - Polling Unit is NOT permanently attached to an Agent.
 * - An Agent may participate in different Campaigns and assignments
 *   over time.
 */

import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Organisation } from '../../organisations/entities/organisation.entity';
import { User } from '../../users/entities/user.entity';

export enum AgentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

@Entity('agents')
@Index('IDX_agents_organisation', ['organisationId'])
@Index('IDX_agents_user', ['userId'])
@Index('IDX_agents_status', ['status'])
@Index('IDX_agents_display_name', ['displayName'])
@Index('UQ_agents_organisation_reference', ['organisationId', 'agentReference'], {
  unique: true,
  where: '"agent_reference" IS NOT NULL',
})
export class Agent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * Organisation responsible for this Agent.
   *
   * Agents are tenant-owned records and must not be accessible
   * across Organisation boundaries without an explicitly authorised
   * platform-level operation.
   */
  @Column({ name: 'organisation_id', type: 'uuid' })
  organisationId!: string;

  @ManyToOne(() => Organisation, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'organisation_id' })
  organisation!: Organisation;

  /**
   * Optional PFP platform User account.
   *
   * An Agent can exist without a User account.
   */
  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId!: string | null;

  @ManyToOne(() => User, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'user_id' })
  user!: User | null;

  @Column({ name: 'first_name', type: 'varchar', length: 100 })
  firstName!: string;

  @Column({ name: 'middle_name', type: 'varchar', length: 100, nullable: true })
  middleName!: string | null;

  @Column({ name: 'last_name', type: 'varchar', length: 100 })
  lastName!: string;

  @Column({ name: 'display_name', type: 'varchar', length: 220 })
  displayName!: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone!: string | null;

  @Column({ type: 'varchar', length: 180, nullable: true })
  email!: string | null;

  /**
   * Secure reference to the Agent photograph.
   *
   * The actual image must be stored in secure file/object storage.
   */
  @Column({ name: 'photo_url', type: 'text', nullable: true })
  photoUrl!: string | null;

  @Column({ name: 'photo_captured_at', type: 'timestamp', nullable: true })
  photoCapturedAt!: Date | null;

  /**
   * Incremented when the current photograph is replaced.
   */
  @Column({ name: 'photo_version', type: 'integer', default: 1 })
  photoVersion!: number;

  /**
   * Internal or campaign-issued Agent reference.
   *
   * It is unique within an Organisation, not globally.
   */
  @Column({
    name: 'agent_reference',
    type: 'varchar',
    length: 120,
    nullable: true,
  })
  agentReference!: string | null;

  @Column({
    name: 'identification_type',
    type: 'varchar',
    length: 60,
    nullable: true,
  })
  identificationType!: string | null;

  /**
   * Identification number/reference.
   *
   * This is sensitive operational information and must be protected
   * by application-level access controls.
   */
  @Column({
    name: 'identification_reference',
    type: 'varchar',
    length: 180,
    nullable: true,
  })
  identificationReference!: string | null;

  @Column({
    type: 'enum',
    enum: AgentStatus,
    default: AgentStatus.ACTIVE,
  })
  status!: AgentStatus;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt!: Date | null;
}