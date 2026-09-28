/**
 * File:
 * C:\Projects\PeopleFirstPolitician\backend\src\modules\campaigns\entities\campaign.entity.ts
 *
 * Purpose:
 * Defines the Campaign entity representing the operational campaign
 * associated with a specific Candidacy.
 *
 * Domain distinction:
 *
 * Candidate
 *   = the person.
 *
 * Candidacy
 *   = the Candidate's participation in a specific ElectionRace under
 *     a PoliticalParty and, where applicable, PartySection.
 *
 * Campaign
 *   = the operational campaign structure supporting that specific
 *     Candidacy.
 *
 * Organisation
 *   = the organisation responsible for managing the Campaign.
 *
 * Important:
 * - A Campaign belongs to exactly one Candidacy.
 * - A Candidacy may have only one Campaign record at this foundation
 *   level.
 * - Geographic scope is not duplicated here. It is inherited through
 *   the Candidacy -> ElectionRace -> ElectoralScope relationship.
 *
 * Security:
 * - Uses UUID primary keys.
 * - Requires a valid Candidacy.
 * - Requires a valid Organisation.
 * - Uses RESTRICT deletion behaviour for historical protection.
 * - Prevents multiple Campaign records for the same Candidacy.
 * - Uses a unique internal Campaign code.
 * - Supports controlled Campaign lifecycle states.
 * - Supports soft deletion.
 * - Database constraints are enforced through TypeORM migrations.
 *
 * Important service-layer rules to be implemented later:
 * - The Organisation must be authorised to manage the Candidacy.
 * - Campaign membership must be explicitly assigned.
 * - Campaign members must not automatically inherit access to other
 *   Campaigns belonging to the same Organisation.
 * - Agent access will later be restricted by Campaign, Race,
 *   ElectoralScope and Polling Unit assignment.
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

import { Candidacy } from '../../candidacies/entities/candidacy.entity';
import { Organisation } from '../../organisations/entities/organisation.entity';

export enum CampaignStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('campaigns')
@Index('UQ_campaigns_candidacy', ['candidacyId'], { unique: true })
@Index('UQ_campaigns_code', ['code'], { unique: true })
@Index('IDX_campaigns_organisation', ['organisationId'])
@Index('IDX_campaigns_status', ['status'])
@Index('IDX_campaigns_candidacy', ['candidacyId'])
export class Campaign {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * The specific candidacy supported by this Campaign.
   */
  @Column({ name: 'candidacy_id', type: 'uuid' })
  candidacyId!: string;

  @ManyToOne(() => Candidacy, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'candidacy_id' })
  candidacy!: Candidacy;

  /**
   * Organisation responsible for managing this Campaign.
   *
   * The Organisation is intentionally separate from PoliticalParty.
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
   * Human-readable Campaign name.
   */
  @Column({ type: 'varchar', length: 180 })
  name!: string;

  /**
   * Unique internal identifier for the Campaign.
   */
  @Column({ type: 'varchar', length: 80 })
  code!: string;

  /**
   * Controlled Campaign lifecycle status.
   */
  @Column({
    type: 'enum',
    enum: CampaignStatus,
    default: CampaignStatus.DRAFT,
  })
  status!: CampaignStatus;

  /**
   * Optional Campaign description.
   */
  @Column({ type: 'text', nullable: true })
  description!: string | null;

  /**
   * Campaign start date.
   */
  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate!: string | null;

  /**
   * Campaign end date.
   */
  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt!: Date | null;
}