/**
 * File:
 * C:\Projects\PeopleFirstPolitician\backend\src\modules\campaign-memberships\entities\campaign-membership.entity.ts
 *
 * Purpose:
 * Defines the CampaignMembership entity.
 *
 * Domain distinction:
 *
 * User
 *   = a person with a PFP platform account.
 *
 * OrganisationMembership
 *   = the user's membership of an Organisation.
 *
 * CampaignMembership
 *   = the user's explicit membership of one specific Campaign.
 *
 * Security principle:
 *   Organisation membership does NOT automatically grant access
 *   to every Campaign belonging to that Organisation.
 *
 * Important:
 * - A Campaign Membership belongs to exactly one Campaign.
 * - A Campaign Membership belongs to exactly one User.
 * - A User cannot have duplicate membership in the same Campaign.
 * - Service-layer validation must ensure that the User is an active
 *   member of the Campaign's Organisation before membership is created.
 * - Manager relationships are restricted to Campaign Membership records.
 * - Historical membership records are protected through RESTRICT
 *   foreign keys and soft deletion.
 *
 * Future security:
 * - Campaign permissions will be enforced at service/guard level.
 * - Campaign Membership must not grant access outside its Campaign.
 * - Polling Unit Agent access will later be restricted by Campaign,
 *   ElectionRace, ElectoralScope and Polling Unit assignment.
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
import { User } from '../../users/entities/user.entity';

export enum CampaignMembershipRole {
  CAMPAIGN_MANAGER = 'campaign_manager',
  CAMPAIGN_COORDINATOR = 'campaign_coordinator',
  FIELD_COORDINATOR = 'field_coordinator',
  DATA_OFFICER = 'data_officer',
  MEMBER = 'member',
}

export enum CampaignMembershipStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  INACTIVE = 'inactive',
}

@Entity('campaign_memberships')
@Index(
  'UQ_campaign_memberships_campaign_user',
  ['campaignId', 'userId'],
  { unique: true },
)
@Index('IDX_campaign_memberships_campaign', ['campaignId'])
@Index('IDX_campaign_memberships_user', ['userId'])
@Index('IDX_campaign_memberships_role', ['role'])
@Index('IDX_campaign_memberships_status', ['status'])
@Index('IDX_campaign_memberships_manager', ['managerMembershipId'])
export class CampaignMembership {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * Campaign to which this membership belongs.
   */
  @Column({ name: 'campaign_id', type: 'uuid' })
  campaignId!: string;

  @ManyToOne(() => Campaign, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'campaign_id' })
  campaign!: Campaign;

  /**
   * User who belongs to the Campaign.
   */
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  /**
   * Role of the User within this specific Campaign.
   */
  @Column({
    type: 'enum',
    enum: CampaignMembershipRole,
    default: CampaignMembershipRole.MEMBER,
  })
  role!: CampaignMembershipRole;

  /**
   * Lifecycle status of the Campaign Membership.
   */
  @Column({
    type: 'enum',
    enum: CampaignMembershipStatus,
    default: CampaignMembershipStatus.ACTIVE,
  })
  status!: CampaignMembershipStatus;

  /**
   * Optional Campaign Membership responsible for managing this member.
   *
   * This supports a controlled campaign reporting hierarchy without
   * creating a separate manager table.
   */
  @Column({
    name: 'manager_membership_id',
    type: 'uuid',
    nullable: true,
  })
  managerMembershipId!: string | null;

  @ManyToOne(() => CampaignMembership, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'manager_membership_id' })
  managerMembership!: CampaignMembership | null;

  /**
   * Date on which the User joined the Campaign.
   */
  @Column({
    name: 'joined_at',
    type: 'timestamp',
    nullable: true,
  })
  joinedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt!: Date | null;
}