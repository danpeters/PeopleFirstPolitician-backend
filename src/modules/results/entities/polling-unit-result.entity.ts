/**
 * File:
 * C:\Projects\PeopleFirstPolitician\backend\src\modules\results\entities\polling-unit-result.entity.ts
 *
 * Purpose:
 * - Stores the result submitted for a Polling Unit in an Election Race.
 *
 * Domain distinction:
 * - ElectionRace = the electoral contest.
 * - PollingUnit = the geographical voting location.
 * - AgentAssignment = authorisation context for field submission.
 * - PollingUnitResult = the submitted electoral result.
 *
 * Lifecycle:
 * - draft
 * - submitted
 * - synchronized
 * - flagged
 * - verified
 *
 * Security:
 * - Result submission requires contextual AgentAssignment validation.
 * - Platform permission alone is insufficient.
 * - A result submitter must not normally verify the same result.
 * - ElectionRace, PollingUnit and AgentAssignment relationships must
 *   be validated by the service layer.
 * - Historical records must be preserved.
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

import { AgentAssignment } from '../../agents/entities/agent-assignment.entity';
import { Election } from '../../elections/entities/election.entity';
import { ElectionRace } from '../../elections/entities/election-race.entity';
import { PollingUnit } from '../../geography/entities/polling-unit.entity';
import { User } from '../../users/entities/user.entity';

export enum PollingUnitResultStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  SYNCHRONIZED = 'synchronized',
  FLAGGED = 'flagged',
  VERIFIED = 'verified',
}

@Entity('polling_unit_results')
@Index(
  'UQ_polling_unit_results_race_polling_unit',
  ['electionRaceId', 'pollingUnitId'],
  {
    unique: true,
    where: '"deleted_at" IS NULL',
  },
)
@Index('UQ_polling_unit_results_client_reference', ['clientReference'], {
  unique: true,
})
@Index('IDX_polling_unit_results_election', ['electionId'])
@Index('IDX_polling_unit_results_race', ['electionRaceId'])
@Index('IDX_polling_unit_results_polling_unit', ['pollingUnitId'])
@Index('IDX_polling_unit_results_assignment', ['agentAssignmentId'])
@Index('IDX_polling_unit_results_submitter', ['submittedByUserId'])
@Index('IDX_polling_unit_results_status', ['status'])
@Index('IDX_polling_unit_results_verified_by', ['verifiedByUserId'])
export class PollingUnitResult {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * Client-generated idempotency reference.
   *
   * This allows an offline device to retry synchronization without
   * accidentally creating another result.
   */
  @Column({
    name: 'client_reference',
    type: 'varchar',
    length: 120,
  })
  clientReference!: string;

  @Column({ name: 'election_id', type: 'uuid' })
  electionId!: string;

  @ManyToOne(() => Election, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'election_id' })
  election!: Election;

  @Column({ name: 'election_race_id', type: 'uuid' })
  electionRaceId!: string;

  @ManyToOne(() => ElectionRace, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'election_race_id' })
  electionRace!: ElectionRace;

  @Column({ name: 'polling_unit_id', type: 'uuid' })
  pollingUnitId!: string;

  @ManyToOne(() => PollingUnit, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'polling_unit_id' })
  pollingUnit!: PollingUnit;

  @Column({ name: 'agent_assignment_id', type: 'uuid' })
  agentAssignmentId!: string;

  @ManyToOne(() => AgentAssignment, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'agent_assignment_id' })
  agentAssignment!: AgentAssignment;

  /**
   * User who created/submitted the result through the platform.
   */
  @Column({ name: 'submitted_by_user_id', type: 'uuid' })
  submittedByUserId!: string;

  @ManyToOne(() => User, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'submitted_by_user_id' })
  submittedByUser!: User;

  @Column({
    type: 'enum',
    enum: PollingUnitResultStatus,
    default: PollingUnitResultStatus.DRAFT,
  })
  status!: PollingUnitResultStatus;

  @Column({ name: 'submitted_at', type: 'timestamp', nullable: true })
  submittedAt!: Date | null;

  @Column({ name: 'synchronized_at', type: 'timestamp', nullable: true })
  synchronizedAt!: Date | null;

  @Column({ name: 'verified_at', type: 'timestamp', nullable: true })
  verifiedAt!: Date | null;

  @Column({ name: 'verified_by_user_id', type: 'uuid', nullable: true })
  verifiedByUserId!: string | null;

  @ManyToOne(() => User, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'verified_by_user_id' })
  verifiedByUser!: User | null;

  @Column({ name: 'flagged_at', type: 'timestamp', nullable: true })
  flaggedAt!: Date | null;

  @Column({ name: 'flagged_by_user_id', type: 'uuid', nullable: true })
  flaggedByUserId!: string | null;

  @ManyToOne(() => User, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'flagged_by_user_id' })
  flaggedByUser!: User | null;

  @Column({ name: 'flag_reason', type: 'text', nullable: true })
  flagReason!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt!: Date | null;
}