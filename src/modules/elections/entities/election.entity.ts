/**
 * File: C:\Projects\PeopleFirstPolitician\backend\src\modules\elections\entities\election.entity.ts
 *
 * Purpose:
 * Defines the Election entity and its database representation.
 *
 * Security:
 * - Uses UUID primary keys.
 * - Restricts election status to defined enum values.
 * - Supports soft deletion through deleted_at.
 * - Database constraints are enforced through TypeORM migrations.
 */

import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ElectionStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('elections')
@Index('IDX_elections_status', ['status'])
@Index('IDX_elections_election_date', ['electionDate'])
export class Election {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 180 })
  name!: string;

  @Column({ name: 'election_type', type: 'varchar', length: 60 })
  electionType!: string;

  @Column({ name: 'election_date', type: 'date' })
  electionDate!: string;

  @Column({
    type: 'enum',
    enum: ElectionStatus,
    default: ElectionStatus.DRAFT,
  })
  status!: ElectionStatus;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt!: Date | null;
}