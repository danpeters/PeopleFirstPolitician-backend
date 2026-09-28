/**
 * File:
 * C:\Projects\PeopleFirstPolitician\backend\src\modules\campaign-memberships\campaign-memberships.module.ts
 *
 * Purpose:
 * Defines the Campaign Membership module.
 *
 * Responsibilities:
 * - Registers CampaignMembership with TypeORM.
 * - Provides CampaignMembershipsService.
 * - Provides the repositories required for Campaign Membership
 *   security validation.
 *
 * Security:
 * Campaign Membership creation depends on validating:
 *
 * Campaign
 *     ↓
 * Organisation
 *     ↓
 * OrganisationMembership
 *     ↓
 * User
 *
 * The module therefore provides repositories for all four entities.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CampaignMembership } from './entities/campaign-membership.entity';
import { CampaignMembershipsService } from './campaign-memberships.service';

import { Campaign } from '../campaigns/entities/campaign.entity';
import { OrganisationMembership } from '../organisations/entities/organisation-membership.entity';
import { User } from '../users/entities/user.entity';
import { CampaignMembershipsController } from './campaign-memberships.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CampaignMembership,
      Campaign,
      OrganisationMembership,
      User,
    ]),
  ],
  controllers: [CampaignMembershipsController],
  providers: [CampaignMembershipsService],
  exports: [CampaignMembershipsService],
})
export class CampaignMembershipsModule {}