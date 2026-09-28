/**
 * File: C:\Projects\PeopleFirstPolitician\backend\src\modules\elections\entities\election-race.entity.ts
 *
 * Purpose:
 * Defines an individual electoral race/contest within an election.
 *
 * An Election represents the overall electoral event, while an
 * ElectionRace represents a specific position being contested within
 * a defined ElectoralScope.
 *
 * Examples:
 * - President — National
 * - Governor — Adamawa State
 * - Senator — Adamawa North Senatorial District
 * - House of Representatives — Federal Constituency
 * - State House of Assembly — State Constituency
 * - LGA Chairman — Local Government
 * - Councillor — Ward
 *
 * Security:
 * - Uses UUID primary keys.
 * - Requires a valid Election, ElectionPosition and ElectoralScope.
 * - Uses RESTRICT deletion behaviour for referenced election,
 *   position and electoral scope records.
 * - Prevents duplicate races within the same election, position and scope.
 * - Uses a unique race code.
 * - Supports controlled race status values.
 * - Supports soft deletion for historical protection.
 * - Database constraints are enforced through TypeORM migrations.
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

import { Election } from './election.entity';
import { ElectionPosition } from './election-position.entity';
import { ElectoralScope } from './electoral-scope.entity';

export enum ElectionRaceStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('election_races')
@Index('UQ_election_races_code', ['code'], { unique: true })
@Index(
  'UQ_election_races_election_position_scope',
  ['electionId', 'electionPositionId', 'electoralScopeId'],
  { unique: true },
)
@Index('IDX_election_races_election', ['electionId'])
@Index('IDX_election_races_position', ['electionPositionId'])
@Index('IDX_election_races_scope', ['electoralScopeId'])
@Index('IDX_election_races_status', ['status'])
export class ElectionRace {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'election_id', type: 'uuid' })
  electionId!: string;

  @ManyToOne(() => Election, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'election_id' })
  election!: Election;

  @Column({ name: 'election_position_id', type: 'uuid' })
  electionPositionId!: string;

  @ManyToOne(() => ElectionPosition, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'election_position_id' })
  electionPosition!: ElectionPosition;

  @Column({ name: 'electoral_scope_id', type: 'uuid' })
  electoralScopeId!: string;

  @ManyToOne(() => ElectoralScope, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'electoral_scope_id' })
  electoralScope!: ElectoralScope;

  @Column({ type: 'varchar', length: 180 })
  name!: string;

  @Column({ type: 'varchar', length: 80 })
  code!: string;

  @Column({
    type: 'enum',
    enum: ElectionRaceStatus,
    default: ElectionRaceStatus.DRAFT,
  })
  status!: ElectionRaceStatus;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt!: Date | null;
}