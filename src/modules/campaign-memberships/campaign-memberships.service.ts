/**
 * File:
 * C:\Projects\PeopleFirstPolitician\backend\src\modules\campaign-memberships\campaign-memberships.service.ts
 *
 * Purpose:
 * Provides business, access-control and security rules for
 * Campaign Membership.
 *
 * Security model:
 *
 * User
 *   ↓
 * OrganisationMembership
 *   ↓
 * Organisation
 *   ↓
 * Campaign
 *   ↓
 * CampaignMembership
 *
 * A user's membership of an Organisation does not automatically grant
 * access to every Campaign belonging to that Organisation.
 *
 * Campaign-level administration is restricted to:
 * - super_admin platform users; or
 * - active campaign_manager members of the specific Campaign who also
 *   have an active Organisation Membership in the Campaign's Organisation.
 *
 * Campaign-level read access is restricted to:
 * - super_admin platform users; or
 * - active members of the specific Campaign who also have an active
 *   Organisation Membership in the Campaign's Organisation.
 *
 * Management operations:
 * - create()
 * - update()
 * - updateStatus()
 * - remove()
 * - restore()
 *
 * Important:
 * - Database constraints remain the final integrity boundary.
 * - Service validation provides clearer business-level errors.
 * - Access remains restricted to the specific Campaign.
 * - Organisation membership status is re-checked whenever Campaign
 *   access is authorised.
 * - Soft deletion is used for membership removal.
 * - Because campaign_id + user_id is unique, deleted memberships
 *   should be restored rather than recreated.
 * - Management operations enforce authorisation at the service layer
 *   as a defence-in-depth security boundary.
 */

import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  CampaignMembership,
  CampaignMembershipRole,
  CampaignMembershipStatus,
} from './entities/campaign-membership.entity';

import { Campaign } from '../campaigns/entities/campaign.entity';

import {
  OrganisationMembership,
  OrganisationMembershipStatus,
} from '../organisations/entities/organisation-membership.entity';

import { User } from '../users/entities/user.entity';

@Injectable()
export class CampaignMembershipsService {
  constructor(
    @InjectRepository(CampaignMembership)
    private readonly campaignMembershipRepository: Repository<CampaignMembership>,

    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,

    @InjectRepository(OrganisationMembership)
    private readonly organisationMembershipRepository: Repository<OrganisationMembership>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Creates a Campaign Membership.
   *
   * Security requirements:
   * - Campaign must exist.
   * - User must exist.
   * - User must have an active Organisation Membership
   *   in the Campaign's Organisation.
   * - User must not already belong to the Campaign.
   * - Supplied manager must be an active campaign_manager
   *   of the same Campaign.
   *
   * The controller currently performs the campaign-management
   * authorisation check before calling create().
   */
  async create(params: {
    campaignId: string;
    userId: string;
    role?: CampaignMembershipRole;
    managerMembershipId?: string | null;
    joinedAt?: Date | null;
  }): Promise<CampaignMembership> {
    const {
      campaignId,
      userId,
      role = CampaignMembershipRole.MEMBER,
      managerMembershipId = null,
      joinedAt = new Date(),
    } = params;

    const campaign = await this.campaignRepository.findOne({
      where: { id: campaignId },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found.');
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const organisationMembership =
      await this.organisationMembershipRepository.findOne({
        where: {
          organisationId: campaign.organisationId,
          userId,
          status: OrganisationMembershipStatus.ACTIVE,
        },
      });

    if (!organisationMembership) {
      throw new ConflictException(
        'User must have an active Organisation Membership before joining this Campaign.',
      );
    }

    const existingMembership =
      await this.campaignMembershipRepository.findOne({
        where: {
          campaignId,
          userId,
        },
      });

    if (existingMembership) {
      throw new ConflictException(
        'User is already a member of this Campaign.',
      );
    }

    let managerMembership: CampaignMembership | null = null;

    if (managerMembershipId) {
      managerMembership = await this.findValidManagerMembership(
        campaignId,
        managerMembershipId,
      );
    }

    const membership = this.campaignMembershipRepository.create({
      campaignId,
      userId,
      role,
      status: CampaignMembershipStatus.ACTIVE,
      managerMembershipId: managerMembership?.id ?? null,
      joinedAt,
    });

    return this.campaignMembershipRepository.save(membership);
  }

  /**
   * Updates the role and/or manager of an existing Campaign Membership.
   *
   * Security:
   * - The requester must be authorised to manage the Campaign.
   * - The membership must exist.
   * - If a manager is supplied, that manager must be an active
   *   campaign_manager in the same Campaign.
   * - A member cannot be their own manager.
   *
   * Note:
   * Membership status is deliberately managed separately through
   * updateStatus().
   */
  async update(
    id: string,
    params: {
      role?: CampaignMembershipRole;
      managerMembershipId?: string | null;
    },
    requesterUserId: string,
    requesterPlatformRole?: string,
  ): Promise<CampaignMembership> {
    const membership = await this.findById(id);

    await this.assertCanManageCampaign(
      membership.campaignId,
      requesterUserId,
      requesterPlatformRole,
    );

    if (params.role !== undefined) {
      membership.role = params.role;
    }

    if (params.managerMembershipId !== undefined) {
      if (params.managerMembershipId === null) {
        membership.managerMembershipId = null;
      } else {
        if (params.managerMembershipId === membership.id) {
          throw new ConflictException(
            'A Campaign Member cannot be their own manager.',
          );
        }

        const managerMembership = await this.findValidManagerMembership(
          membership.campaignId,
          params.managerMembershipId,
        );

        membership.managerMembershipId = managerMembership.id;
      }
    }

    return this.campaignMembershipRepository.save(membership);
  }

  /**
   * Changes the operational status of a Campaign Membership.
   *
   * Security:
   * - The requester must be authorised to manage the Campaign.
   *
   * Allowed statuses:
   * - active
   * - suspended
   * - inactive
   */
  async updateStatus(
    id: string,
    status: CampaignMembershipStatus,
    requesterUserId: string,
    requesterPlatformRole?: string,
  ): Promise<CampaignMembership> {
    const membership = await this.findById(id);

    await this.assertCanManageCampaign(
      membership.campaignId,
      requesterUserId,
      requesterPlatformRole,
    );

    membership.status = status;

    return this.campaignMembershipRepository.save(membership);
  }

  /**
   * Soft-deletes a Campaign Membership.
   *
   * Security:
   * - The requester must be authorised to manage the Campaign.
   *
   * The record remains in the database for audit/recovery purposes.
   *
   * Because campaign_id + user_id is protected by a unique constraint,
   * the membership should be restored rather than recreated.
   */
  async remove(
    id: string,
    requesterUserId: string,
    requesterPlatformRole?: string,
  ): Promise<void> {
    const membership = await this.findById(id);

    await this.assertCanManageCampaign(
      membership.campaignId,
      requesterUserId,
      requesterPlatformRole,
    );

    await this.campaignMembershipRepository.softRemove(membership);
  }

  /**
   * Restores a previously soft-deleted Campaign Membership.
   *
   * Security:
   * - The deleted membership is loaded withDeleted.
   * - The requester must be authorised to manage the associated Campaign.
   *
   * The underlying record must still exist.
   *
   * The associated User must still have an active Organisation
   * Membership in the Campaign's Organisation before restoration.
   */
  async restore(
    id: string,
    requesterUserId: string,
    requesterPlatformRole?: string,
  ): Promise<CampaignMembership> {
    const membership = await this.campaignMembershipRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!membership) {
      throw new NotFoundException('Campaign Membership not found.');
    }

    await this.assertCanManageCampaign(
      membership.campaignId,
      requesterUserId,
      requesterPlatformRole,
    );

    if (!membership.deletedAt) {
      throw new ConflictException(
        'Campaign Membership is not deleted.',
      );
    }

    const campaign = await this.campaignRepository.findOne({
      where: { id: membership.campaignId },
    });

    if (!campaign) {
      throw new NotFoundException(
        'The Campaign associated with this membership no longer exists.',
      );
    }

    const organisationMembership =
      await this.organisationMembershipRepository.findOne({
        where: {
          organisationId: campaign.organisationId,
          userId: membership.userId,
          status: OrganisationMembershipStatus.ACTIVE,
        },
      });

    if (!organisationMembership) {
      throw new ConflictException(
        'The User must have an active Organisation Membership before the Campaign Membership can be restored.',
      );
    }

    const activeDuplicate =
      await this.campaignMembershipRepository.findOne({
        where: {
          campaignId: membership.campaignId,
          userId: membership.userId,
        },
      });

    if (activeDuplicate) {
      throw new ConflictException(
        'An active Campaign Membership already exists for this User.',
      );
    }

    membership.deletedAt = null;
    membership.status = CampaignMembershipStatus.ACTIVE;

    return this.campaignMembershipRepository.save(membership);
  }

  /**
   * Determines whether an authenticated user can administer
   * Campaign Memberships for a specific Campaign.
   *
   * Authorised users:
   * - super_admin platform role; or
   * - active campaign_manager membership in that Campaign AND
   *   active Organisation Membership in the Campaign's Organisation.
   *
   * Campaign Membership roles such as member, data_officer,
   * field_coordinator and campaign_coordinator do not receive
   * Campaign Membership administration authority through this method.
   */
  async assertCanManageCampaign(
    campaignId: string,
    requesterUserId: string,
    requesterPlatformRole?: string,
  ): Promise<void> {
    const campaign = await this.campaignRepository.findOne({
      where: { id: campaignId },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found.');
    }

    /**
     * Platform super administrators can administer any existing
     * Campaign.
     */
    if (requesterPlatformRole === 'super_admin') {
      return;
    }

    /**
     * Confirm that the requester still has an active
     * Organisation Membership in the Campaign's Organisation.
     */
    const organisationMembership =
      await this.organisationMembershipRepository.findOne({
        where: {
          organisationId: campaign.organisationId,
          userId: requesterUserId,
          status: OrganisationMembershipStatus.ACTIVE,
        },
      });

    if (!organisationMembership) {
      throw new ForbiddenException(
        'Access denied: your Organisation Membership is not active for this Campaign.',
      );
    }

    /**
     * All other users must have an active Campaign Membership
     * with the campaign_manager role in this specific Campaign.
     */
    const requesterMembership =
      await this.campaignMembershipRepository.findOne({
        where: {
          campaignId,
          userId: requesterUserId,
          role: CampaignMembershipRole.CAMPAIGN_MANAGER,
          status: CampaignMembershipStatus.ACTIVE,
        },
      });

    if (!requesterMembership) {
      throw new ForbiddenException(
        'Access denied: you are not authorised to manage this Campaign.',
      );
    }
  }

  /**
   * Determines whether an authenticated user can access
   * Campaign information.
   *
   * Authorised users:
   * - super_admin platform role; or
   * - active Campaign member with an active Organisation Membership
   *   in the Campaign's Organisation.
   */
  async assertCanAccessCampaign(
    campaignId: string,
    requesterUserId: string,
    requesterPlatformRole?: string,
  ): Promise<void> {
    const campaign = await this.campaignRepository.findOne({
      where: { id: campaignId },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found.');
    }

    /**
     * Platform super administrators can access any existing Campaign.
     */
    if (requesterPlatformRole === 'super_admin') {
      return;
    }

    /**
     * Organisation Membership must still be active.
     */
    const organisationMembership =
      await this.organisationMembershipRepository.findOne({
        where: {
          organisationId: campaign.organisationId,
          userId: requesterUserId,
          status: OrganisationMembershipStatus.ACTIVE,
        },
      });

    if (!organisationMembership) {
      throw new ForbiddenException(
        'Access denied: your Organisation Membership is not active for this Campaign.',
      );
    }

    /**
     * The requester must also be an active member of this
     * specific Campaign.
     */
    const requesterMembership =
      await this.campaignMembershipRepository.findOne({
        where: {
          campaignId,
          userId: requesterUserId,
          status: CampaignMembershipStatus.ACTIVE,
        },
      });

    if (!requesterMembership) {
      throw new ForbiddenException(
        'Access denied: you are not a member of this Campaign.',
      );
    }
  }

  /**
   * Finds a Campaign Membership by ID.
   *
   * Normal repository queries exclude soft-deleted records.
   */
  async findById(id: string): Promise<CampaignMembership> {
    const membership = await this.campaignMembershipRepository.findOne({
      where: { id },
    });

    if (!membership) {
      throw new NotFoundException('Campaign Membership not found.');
    }

    return membership;
  }

  /**
   * Lists Campaign Memberships for a specific Campaign.
   *
   * Soft-deleted memberships are excluded automatically by
   * TypeORM's normal repository queries.
   */
  async findByCampaignId(
    campaignId: string,
  ): Promise<CampaignMembership[]> {
    const campaign = await this.campaignRepository.findOne({
      where: { id: campaignId },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found.');
    }

    return this.campaignMembershipRepository.find({
      where: {
        campaignId,
      },
      order: {
        createdAt: 'ASC',
      },
    });
  }

  /**
   * Validates a manager membership.
   *
   * A valid manager must:
   * - belong to the specified Campaign;
   * - be active;
   * - have the campaign_manager role.
   */
  private async findValidManagerMembership(
    campaignId: string,
    managerMembershipId: string,
  ): Promise<CampaignMembership> {
    const managerMembership =
      await this.campaignMembershipRepository.findOne({
        where: {
          id: managerMembershipId,
          campaignId,
          role: CampaignMembershipRole.CAMPAIGN_MANAGER,
          status: CampaignMembershipStatus.ACTIVE,
        },
      });

    if (!managerMembership) {
      throw new ConflictException(
        'The selected manager must be an active campaign_manager of the same Campaign.',
      );
    }

    return managerMembership;
  }
}