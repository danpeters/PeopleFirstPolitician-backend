/**
 * File:
 * C:\Projects\PeopleFirstPolitician\backend\src\modules\results\entities\polling-unit-result-vote.entity.ts
 *
 * Purpose:
 * - Stores the vote count received by a Candidacy at a Polling Unit.
 *
 * Domain distinction:
 * - Candidate = the person.
 * - Candidacy = that Candidate's participation in an ElectionRace.
 * - PollingUnitResult = the result record.
 * - PollingUnitResultVote = the votes received by one Candidacy
 *   within that result.
 *
 * Security:
 * - Votes must belong to a valid Candidacy.
 * - The Candidacy must belong to the same ElectionRace as the
 *   PollingUnitResult.
 * - Cross-race vote records must be rejected by the service layer.
 * - Votes must be non-negative integers.
 */

import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Candidacy } from '../../candidacies/entities/candidacy.entity';
import { PollingUnitResult } from './polling-unit-result.entity';

@Entity('polling_unit_result_votes')
@Index(
  'UQ_polling_unit_result_votes_result_candidacy',
  ['pollingUnitResultId', 'candidacyId'],
  { unique: true },
)
@Index('IDX_polling_unit_result_votes_result', ['pollingUnitResultId'])
@Index('IDX_polling_unit_result_votes_candidacy', ['candidacyId'])
@Check(
  'CHK_polling_unit_result_votes_non_negative',
  '"votes" >= 0',
)
export class PollingUnitResultVote {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'polling_unit_result_id', type: 'uuid' })
  pollingUnitResultId!: string;

  @ManyToOne(() => PollingUnitResult, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'polling_unit_result_id' })
  pollingUnitResult!: PollingUnitResult;

  @Column({ name: 'candidacy_id', type: 'uuid' })
  candidacyId!: string;

  @ManyToOne(() => Candidacy, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'candidacy_id' })
  candidacy!: Candidacy;

  /**
   * Number of votes received.
   *
   * PostgreSQL integer is appropriate for normal polling-unit
   * vote counts and the CHECK constraint prevents negative values.
   */
  @Column({ type: 'integer' })
  votes!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}