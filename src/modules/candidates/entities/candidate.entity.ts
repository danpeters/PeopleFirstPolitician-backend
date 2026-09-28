/**
 * File: C:\Projects\PeopleFirstPolitician\backend\src\modules\candidates\entities\candidate.entity.ts
 *
 * Purpose:
 * Defines the Candidate entity representing a person who may participate
 * in one or more electoral candidacies.
 *
 * Important domain distinction:
 * - Candidate represents the person.
 * - Candidacy will represent the person's participation in a specific
 *   ElectionRace under a PoliticalParty and, where applicable, PartySection.
 *
 * Security:
 * - Uses a UUID primary key.
 * - Does not directly bind a candidate to an election, race or party.
 * - Allows an optional link to a platform User account.
 * - User deletion does not delete the candidate record.
 * - Supports controlled candidate status values.
 * - Stores a secure photograph reference rather than image binary data.
 * - Photograph replacement can be audited at the service/application layer.
 * - Supports soft deletion to protect historical electoral records.
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

import { User } from '../../users/entities/user.entity';

export enum CandidateStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

@Entity('candidates')
@Index('IDX_candidates_user', ['userId'])
@Index('IDX_candidates_status', ['status'])
@Index('IDX_candidates_display_name', ['displayName'])
export class Candidate {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * Optional platform account associated with the candidate.
   *
   * A candidate does not need a platform account to exist.
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

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth!: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  gender!: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone!: string | null;

  @Column({ type: 'varchar', length: 180, nullable: true })
  email!: string | null;

  @Column({ type: 'text', nullable: true })
  address!: string | null;

  @Column({ type: 'text', nullable: true })
  biography!: string | null;

  /**
   * Secure object/file reference for the candidate's facial photograph.
   *
   * The actual image should be stored in secure object/file storage,
   * not directly in this relational table.
   */
  @Column({ name: 'photo_url', type: 'text', nullable: true })
  photoUrl!: string | null;

  /**
   * Timestamp recording when the currently referenced photograph
   * was captured or uploaded.
   */
  @Column({ name: 'photo_captured_at', type: 'timestamp', nullable: true })
  photoCapturedAt!: Date | null;

  /**
   * Incremented when the candidate photograph is replaced.
   *
   * Previous photograph references should be retained through
   * a dedicated audit/history mechanism rather than overwritten
   * without trace.
   */
  @Column({ name: 'photo_version', type: 'integer', default: 1 })
  photoVersion!: number;

  @Column({
    type: 'enum',
    enum: CandidateStatus,
    default: CandidateStatus.ACTIVE,
  })
  status!: CandidateStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt!: Date | null;
}
