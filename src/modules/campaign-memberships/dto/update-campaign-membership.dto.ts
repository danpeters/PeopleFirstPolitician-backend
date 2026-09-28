/**
 * File:
 * C:\Projects\PeopleFirstPolitician\backend\src\modules\campaign-memberships\dto\update-campaign-membership.dto.ts
 *
 * Purpose:
 * Defines validated input for updating Campaign Membership
 * assignment information.
 *
 * Security:
 * - campaignId cannot be changed through this DTO.
 * - userId cannot be changed through this DTO.
 * - status cannot be changed through this DTO.
 * - deletedAt cannot be changed through this DTO.
 *
 * Role and manager assignment are controlled by the Campaign
 * Membership service after campaign-level authorisation.
 */

import {
  IsEnum,
  IsOptional,
  IsUUID,
} from 'class-validator';

import {
  CampaignMembershipRole,
} from '../entities/campaign-membership.entity';

export class UpdateCampaignMembershipDto {
  /**
   * Change the Campaign-level role.
   */
  @IsOptional()
  @IsEnum(CampaignMembershipRole)
  role?: CampaignMembershipRole;

  /**
   * Change the manager responsible for this membership.
   *
   * null explicitly removes the manager.
   */
  @IsOptional()
  @IsUUID()
  managerMembershipId?: string | null;
}