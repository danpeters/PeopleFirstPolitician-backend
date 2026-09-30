/**
 * File:
 * C:\Projects\PeopleFirstPolitician\backend\src\modules\agents\entities\agent-assignment.entity.ts
 *
 * Purpose:
 * - Assigns an Agent to a Polling Unit within a Campaign.
 *
 * Domain distinction:
 * - Agent = the person.
 * - Campaign = the operational campaign.
 * - PollingUnit = shared electoral geography.
 * - AgentAssignment = the contextual relationship between them.
 *
 * Security:
 * - An Agent must only operate within an explicitly authorised
 *   Campaign assignment.
 * - Organisation isolation must be enforced at service level.
 * - Campaign membership and platform permissions remain separate
 *   security controls.
 * - Assignment history is retained through soft deletion.
 *
 * Important:
 * - The Polling Unit is not permanently attached to an Agent.
 * - The same Agent may have different assignments across campaigns.
 * - ElectionRace/ElectoralScope compatibility must be validated
 *   by the service layer.
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

import { Campaign } from '../../campaigns/entities/campaign.entity';
import { PollingUnit } from '../../geography/entities/polling-unit.entity';
import { User } from '../../users/entities/user.entity';
import { Agent } from './agent.entity';

export enum AgentAssignmentStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  ENDED = 'ended',
}

@Entity('agent_assignments')
@Index(
  'UQ_agent_assignments_agent_campaign_polling_unit',
  ['agentId', 'campaignId', 'pollingUnitId'],
  {
    unique: true,
    where: '"deleted_at" IS NULL',
  },
)
@Index('IDX_agent_assignments_agent', ['agentId'])
@Index('IDX_agent_assignments_campaign', ['campaignId'])
@Index('IDX_agent_assignments_polling_unit', ['pollingUnitId'])
@Index('IDX_agent_assignments_status', ['status'])
@Index('IDX_agent_assignments_assigned_by', ['assignedByUserId'])
export class AgentAssignment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'agent_id', type: 'uuid' })
  agentId!: string;

  @ManyToOne(() => Agent, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'agent_id' })
  agent!: Agent;

  @Column({ name: 'campaign_id', type: 'uuid' })
  campaignId!: string;

  @ManyToOne(() => Campaign, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'campaign_id' })
  campaign!: Campaign;

  @Column({ name: 'polling_unit_id', type: 'uuid' })
  pollingUnitId!: string;

  @ManyToOne(() => PollingUnit, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'polling_unit_id' })
  pollingUnit!: PollingUnit;

  @Column({
    type: 'enum',
    enum: AgentAssignmentStatus,
    default: AgentAssignmentStatus.ACTIVE,
  })
  status!: AgentAssignmentStatus;

  @Column({ name: 'assigned_at', type: 'timestamp', nullable: true })
  assignedAt!: Date | null;

  @Column({ name: 'unassigned_at', type: 'timestamp', nullable: true })
  unassignedAt!: Date | null;

  /**
   * Platform User who created the assignment.
   */
  @Column({ name: 'assigned_by_user_id', type: 'uuid' })
  assignedByUserId!: string;

  @ManyToOne(() => User, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'assigned_by_user_id' })
  assignedByUser!: User;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt!: Date | null;
}