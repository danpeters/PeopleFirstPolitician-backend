/**
 * File:
 * C:\Projects\PeopleFirstPolitician\backend\src\modules\campaign-memberships\dto\create-campaign-membership.dto.ts
 *
 * Purpose:
 * Defines validated input for creating a Campaign Membership.
 *
 * Security:
 * Client-controlled fields are deliberately limited to:
 * - campaignId
 * - userId
 * - role
 * - managerMembershipId
 * - joinedAt
 *
 * The following fields are NOT accepted from the client:
 * - status
 * - deletedAt
 * - createdAt
 * - updatedAt
 *
 * Membership status is controlled by the service.
 */

import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsUUID,
} from 'class-validator';

import {
  CampaignMembershipRole,
} from '../entities/campaign-membership.entity';

export class CreateCampaignMembershipDto {
  /**
   * Campaign to which the user will be added.
   */
  @IsUUID()
  campaignId!: string;

  /**
   * User who will become a Campaign Member.
   */
  @IsUUID()
  userId!: string;

  /**
   * Campaign-level role.
   *
   * Defaults to MEMBER in the service when omitted.
   */
  @IsOptional()
  @IsEnum(CampaignMembershipRole)
  role?: CampaignMembershipRole;

  /**
   * Optional active Campaign Membership that will act
   * as the manager of the new membership.
   */
  @IsOptional()
  @IsUUID()
  managerMembershipId?: string | null;

  /**
   * Optional joining date.
   *
   * When omitted, the service uses the current date/time.
   */
  @IsOptional()
  @IsDateString()
  joinedAt?: string | null;
}