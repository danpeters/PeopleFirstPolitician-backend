/**
 * File:
 * C:\Projects\PeopleFirstPolitician\backend\src\modules\campaign-memberships\dto\update-campaign-membership-status.dto.ts
 *
 * Purpose:
 * Defines validated input for changing the status of a
 * Campaign Membership.
 *
 * Security:
 * Status changes must pass Campaign-level authorisation
 * before the service performs the update.
 */

import { IsEnum } from 'class-validator';

import {
  CampaignMembershipStatus,
} from '../entities/campaign-membership.entity';

export class UpdateCampaignMembershipStatusDto {
  @IsEnum(CampaignMembershipStatus)
  status!: CampaignMembershipStatus;
}