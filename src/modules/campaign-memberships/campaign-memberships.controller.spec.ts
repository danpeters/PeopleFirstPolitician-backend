/**
 * File:
 * C:\Projects\PeopleFirstPolitician\backend\src\modules\campaign-memberships\campaign-memberships.service.spec.ts
 *
 * Purpose:
 * Unit tests for CampaignMembershipsService.
 *
 * Security coverage:
 * - Campaign existence validation
 * - User existence validation
 * - Active Organisation Membership requirement
 * - Duplicate Campaign Membership prevention
 * - Campaign-specific manager validation
 * - Active manager validation
 * - Successful Campaign Membership creation
 * - Campaign-level authorisation
 * - Super administrator access
 * - Campaign manager access
 * - Cross-Campaign access prevention
 * - Suspended/inactive membership prevention
 * - Campaign Membership lookup
 * - Management-operation authorisation
 * - Campaign Membership role updates
 * - Campaign Membership manager assignment
 * - Campaign Membership status updates
 * - Campaign Membership soft deletion
 * - Campaign Membership restoration
 *
 * Important:
 * Management mutations now receive the authenticated requester identity
 * directly at the service layer. This provides defence-in-depth security
 * even if another controller or service later calls these methods.
 *
 * Note:
 * These are unit tests. They use mocked repositories and do not
 * connect to the production database.
 */

import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import { CampaignMembershipsService } from './campaign-memberships.service';

import {
  CampaignMembershipRole,
  CampaignMembershipStatus,
} from './entities/campaign-membership.entity';

import {
  OrganisationMembershipStatus,
} from '../organisations/entities/organisation-membership.entity';

describe('CampaignMembershipsService', () => {
  let campaignMembershipsService: CampaignMembershipsService;

  const campaignMembershipRepositoryMock = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    softRemove: jest.fn(),
  };

  const campaignRepositoryMock = {
    findOne: jest.fn(),
  };

  const organisationMembershipRepositoryMock = {
    findOne: jest.fn(),
  };

  const userRepositoryMock = {
    findOne: jest.fn(),
  };

  const campaign = {
    id: 'campaign-id',
    organisationId: 'organisation-id',
  };

  const superAdminUserId = 'super-admin-user-id';
  const managerUserId = 'manager-user-id';

  beforeEach(() => {
    jest.resetAllMocks();

    campaignMembershipsService = new CampaignMembershipsService(
      campaignMembershipRepositoryMock as any,
      campaignRepositoryMock as any,
      organisationMembershipRepositoryMock as any,
      userRepositoryMock as any,
    );
  });

  describe('create()', () => {
    const user = {
      id: 'user-id',
      fullName: 'Test User',
    };

    const organisationMembership = {
      id: 'organisation-membership-id',
      organisationId: 'organisation-id',
      userId: 'user-id',
      status: OrganisationMembershipStatus.ACTIVE,
    };

    const createdMembership = {
      id: 'campaign-membership-id',
      campaignId: 'campaign-id',
      userId: 'user-id',
      role: CampaignMembershipRole.MEMBER,
      status: CampaignMembershipStatus.ACTIVE,
      managerMembershipId: null,
    };

    it('should reject when the Campaign does not exist', async () => {
      campaignRepositoryMock.findOne.mockResolvedValue(null);

      await expect(
        campaignMembershipsService.create({
          campaignId: 'missing-campaign-id',
          userId: 'user-id',
        }),
      ).rejects.toThrow(NotFoundException);

      expect(userRepositoryMock.findOne).not.toHaveBeenCalled();
      expect(
        organisationMembershipRepositoryMock.findOne,
      ).not.toHaveBeenCalled();
      expect(campaignMembershipRepositoryMock.create).not.toHaveBeenCalled();
      expect(campaignMembershipRepositoryMock.save).not.toHaveBeenCalled();
    });

    it('should reject when the User does not exist', async () => {
      campaignRepositoryMock.findOne.mockResolvedValue(campaign);
      userRepositoryMock.findOne.mockResolvedValue(null);

      await expect(
        campaignMembershipsService.create({
          campaignId: campaign.id,
          userId: 'missing-user-id',
        }),
      ).rejects.toThrow(NotFoundException);

      expect(
        organisationMembershipRepositoryMock.findOne,
      ).not.toHaveBeenCalled();

      expect(campaignMembershipRepositoryMock.create).not.toHaveBeenCalled();
      expect(campaignMembershipRepositoryMock.save).not.toHaveBeenCalled();
    });

    it('should reject when the User has no active Organisation Membership', async () => {
      campaignRepositoryMock.findOne.mockResolvedValue(campaign);
      userRepositoryMock.findOne.mockResolvedValue(user);
      organisationMembershipRepositoryMock.findOne.mockResolvedValue(null);

      await expect(
        campaignMembershipsService.create({
          campaignId: campaign.id,
          userId: user.id,
        }),
      ).rejects.toThrow(ConflictException);

      expect(
        organisationMembershipRepositoryMock.findOne,
      ).toHaveBeenCalledWith({
        where: {
          organisationId: campaign.organisationId,
          userId: user.id,
          status: OrganisationMembershipStatus.ACTIVE,
        },
      });

      expect(campaignMembershipRepositoryMock.create).not.toHaveBeenCalled();
      expect(campaignMembershipRepositoryMock.save).not.toHaveBeenCalled();
    });

    it('should reject when the User is already a member of the Campaign', async () => {
      campaignRepositoryMock.findOne.mockResolvedValue(campaign);
      userRepositoryMock.findOne.mockResolvedValue(user);

      organisationMembershipRepositoryMock.findOne.mockResolvedValue(
        organisationMembership,
      );

      campaignMembershipRepositoryMock.findOne.mockResolvedValue(
        createdMembership,
      );

      await expect(
        campaignMembershipsService.create({
          campaignId: campaign.id,
          userId: user.id,
        }),
      ).rejects.toThrow(ConflictException);

      expect(campaignMembershipRepositoryMock.create).not.toHaveBeenCalled();
      expect(campaignMembershipRepositoryMock.save).not.toHaveBeenCalled();
    });

    it('should create a Campaign Membership when all security requirements pass', async () => {
      campaignRepositoryMock.findOne.mockResolvedValue(campaign);
      userRepositoryMock.findOne.mockResolvedValue(user);

      organisationMembershipRepositoryMock.findOne.mockResolvedValue(
        organisationMembership,
      );

      campaignMembershipRepositoryMock.findOne.mockResolvedValue(null);

      campaignMembershipRepositoryMock.create.mockReturnValue(
        createdMembership,
      );

      campaignMembershipRepositoryMock.save.mockResolvedValue(
        createdMembership,
      );

      const result = await campaignMembershipsService.create({
        campaignId: campaign.id,
        userId: user.id,
        role: CampaignMembershipRole.MEMBER,
      });

      expect(campaignMembershipRepositoryMock.create).toHaveBeenCalledWith({
        campaignId: campaign.id,
        userId: user.id,
        role: CampaignMembershipRole.MEMBER,
        status: CampaignMembershipStatus.ACTIVE,
        managerMembershipId: null,
        joinedAt: expect.any(Date),
      });

      expect(campaignMembershipRepositoryMock.save).toHaveBeenCalledWith(
        createdMembership,
      );

      expect(result).toEqual(createdMembership);
    });

    it('should reject a manager who is not an active member of the same Campaign', async () => {
      campaignRepositoryMock.findOne.mockResolvedValue(campaign);
      userRepositoryMock.findOne.mockResolvedValue(user);

      organisationMembershipRepositoryMock.findOne.mockResolvedValue(
        organisationMembership,
      );

      campaignMembershipRepositoryMock.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      await expect(
        campaignMembershipsService.create({
          campaignId: campaign.id,
          userId: user.id,
          managerMembershipId: 'manager-from-another-campaign',
        }),
      ).rejects.toThrow(ConflictException);

      expect(campaignMembershipRepositoryMock.create).not.toHaveBeenCalled();
      expect(campaignMembershipRepositoryMock.save).not.toHaveBeenCalled();

      expect(
        campaignMembershipRepositoryMock.findOne,
      ).toHaveBeenLastCalledWith({
        where: {
          id: 'manager-from-another-campaign',
          campaignId: campaign.id,
          role: CampaignMembershipRole.CAMPAIGN_MANAGER,
          status: CampaignMembershipStatus.ACTIVE,
        },
      });
    });

    it('should create a Campaign Membership under a valid active manager', async () => {
      const managerMembership = {
        id: 'manager-membership-id',
        campaignId: campaign.id,
        userId: managerUserId,
        role: CampaignMembershipRole.CAMPAIGN_MANAGER,
        status: CampaignMembershipStatus.ACTIVE,
      };

      const managedMembership = {
        ...createdMembership,
        managerMembershipId: managerMembership.id,
      };

      campaignRepositoryMock.findOne.mockResolvedValue(campaign);
      userRepositoryMock.findOne.mockResolvedValue(user);

      organisationMembershipRepositoryMock.findOne.mockResolvedValue(
        organisationMembership,
      );

      campaignMembershipRepositoryMock.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(managerMembership);

      campaignMembershipRepositoryMock.create.mockReturnValue(
        managedMembership,
      );

      campaignMembershipRepositoryMock.save.mockResolvedValue(
        managedMembership,
      );

      const result = await campaignMembershipsService.create({
        campaignId: campaign.id,
        userId: user.id,
        role: CampaignMembershipRole.MEMBER,
        managerMembershipId: managerMembership.id,
      });

      expect(campaignMembershipRepositoryMock.create).toHaveBeenCalledWith({
        campaignId: campaign.id,
        userId: user.id,
        role: CampaignMembershipRole.MEMBER,
        status: CampaignMembershipStatus.ACTIVE,
        managerMembershipId: managerMembership.id,
        joinedAt: expect.any(Date),
      });

      expect(result).toEqual(managedMembership);
    });
  });

  describe('assertCanManageCampaign()', () => {
    it('should allow a super_admin to manage an existing Campaign', async () => {
      campaignRepositoryMock.findOne.mockResolvedValue(campaign);

      await expect(
        campaignMembershipsService.assertCanManageCampaign(
          campaign.id,
          superAdminUserId,
          'super_admin',
        ),
      ).resolves.toBeUndefined();

      expect(campaignRepositoryMock.findOne).toHaveBeenCalledWith({
        where: {
          id: campaign.id,
        },
      });

      expect(
        campaignMembershipRepositoryMock.findOne,
      ).not.toHaveBeenCalled();
    });

    it('should reject access when the Campaign does not exist', async () => {
      campaignRepositoryMock.findOne.mockResolvedValue(null);

      await expect(
        campaignMembershipsService.assertCanManageCampaign(
          'missing-campaign-id',
          superAdminUserId,
          'super_admin',
        ),
      ).rejects.toThrow(NotFoundException);

      expect(
        campaignMembershipRepositoryMock.findOne,
      ).not.toHaveBeenCalled();
    });

    it('should allow an active campaign_manager of the same Campaign', async () => {
      campaignRepositoryMock.findOne.mockResolvedValue(campaign);

      organisationMembershipRepositoryMock.findOne.mockResolvedValue({
        id: 'organisation-membership-id',
        organisationId: campaign.organisationId,
        userId: managerUserId,
        status: OrganisationMembershipStatus.ACTIVE,
      });

      campaignMembershipRepositoryMock.findOne.mockResolvedValue({
        id: 'manager-membership-id',
        campaignId: campaign.id,
        userId: managerUserId,
        role: CampaignMembershipRole.CAMPAIGN_MANAGER,
        status: CampaignMembershipStatus.ACTIVE,
      });

      await expect(
        campaignMembershipsService.assertCanManageCampaign(
          campaign.id,
          managerUserId,
          'user',
        ),
      ).resolves.toBeUndefined();

      expect(
        campaignMembershipRepositoryMock.findOne,
      ).toHaveBeenCalledWith({
        where: {
          campaignId: campaign.id,
          userId: managerUserId,
          role: CampaignMembershipRole.CAMPAIGN_MANAGER,
          status: CampaignMembershipStatus.ACTIVE,
        },
      });
    });

    it('should reject a user who is only an ordinary Campaign Member', async () => {
      campaignRepositoryMock.findOne.mockResolvedValue(campaign);

      organisationMembershipRepositoryMock.findOne.mockResolvedValue({
        id: 'organisation-membership-id',
        organisationId: campaign.organisationId,
        userId: 'member-user-id',
        status: OrganisationMembershipStatus.ACTIVE,
      });

      campaignMembershipRepositoryMock.findOne.mockResolvedValue(null);

      await expect(
        campaignMembershipsService.assertCanManageCampaign(
          campaign.id,
          'member-user-id',
          'user',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject a campaign_manager from another Campaign', async () => {
      campaignRepositoryMock.findOne.mockResolvedValue(campaign);

      organisationMembershipRepositoryMock.findOne.mockResolvedValue({
        id: 'organisation-membership-id',
        organisationId: campaign.organisationId,
        userId: 'manager-from-another-campaign',
        status: OrganisationMembershipStatus.ACTIVE,
      });

      campaignMembershipRepositoryMock.findOne.mockResolvedValue(null);

      await expect(
        campaignMembershipsService.assertCanManageCampaign(
          campaign.id,
          'manager-from-another-campaign',
          'user',
        ),
      ).rejects.toThrow(ForbiddenException);

      expect(
        campaignMembershipRepositoryMock.findOne,
      ).toHaveBeenCalledWith({
        where: {
          campaignId: campaign.id,
          userId: 'manager-from-another-campaign',
          role: CampaignMembershipRole.CAMPAIGN_MANAGER,
          status: CampaignMembershipStatus.ACTIVE,
        },
      });
    });

    it('should reject a requester whose Organisation Membership is not active', async () => {
      campaignRepositoryMock.findOne.mockResolvedValue(campaign);

      organisationMembershipRepositoryMock.findOne.mockResolvedValue(null);

      await expect(
        campaignMembershipsService.assertCanManageCampaign(
          campaign.id,
          managerUserId,
          'user',
        ),
      ).rejects.toThrow(ForbiddenException);

      expect(
        campaignMembershipRepositoryMock.findOne,
      ).not.toHaveBeenCalled();
    });

    it('should reject a suspended Campaign Membership', async () => {
      campaignRepositoryMock.findOne.mockResolvedValue(campaign);

      organisationMembershipRepositoryMock.findOne.mockResolvedValue({
        id: 'organisation-membership-id',
        organisationId: campaign.organisationId,
        userId: 'suspended-manager-id',
        status: OrganisationMembershipStatus.ACTIVE,
      });

      campaignMembershipRepositoryMock.findOne.mockResolvedValue(null);

      await expect(
        campaignMembershipsService.assertCanManageCampaign(
          campaign.id,
          'suspended-manager-id',
          'user',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject a campaign_manager when the requester has another platform role', async () => {
      campaignRepositoryMock.findOne.mockResolvedValue(campaign);

      organisationMembershipRepositoryMock.findOne.mockResolvedValue({
        id: 'organisation-membership-id',
        organisationId: campaign.organisationId,
        userId: managerUserId,
        status: OrganisationMembershipStatus.ACTIVE,
      });

      campaignMembershipRepositoryMock.findOne.mockResolvedValue(null);

      await expect(
        campaignMembershipsService.assertCanManageCampaign(
          campaign.id,
          managerUserId,
          'analyst',
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update()', () => {
    const membership = {
      id: 'membership-id',
      campaignId: 'campaign-id',
      userId: 'user-id',
      role: CampaignMembershipRole.MEMBER,
      status: CampaignMembershipStatus.ACTIVE,
      managerMembershipId: null,
      deletedAt: null,
    };

    const authorisedRequester = {
      userId: superAdminUserId,
      platformRole: 'super_admin',
    };

    beforeEach(() => {
      campaignRepositoryMock.findOne.mockResolvedValue(campaign);
    });

    it('should update a Campaign Membership role', async () => {
      campaignMembershipRepositoryMock.findOne.mockResolvedValue(membership);
      campaignRepositoryMock.findOne.mockResolvedValue({
        id: membership.campaignId,
        organisationId: 'organisation-id',
      });

      campaignMembershipRepositoryMock.save.mockImplementation(
        async (value) => value,
      );

      const result = await campaignMembershipsService.update(
        membership.id,
        {
          role: CampaignMembershipRole.DATA_OFFICER,
        },
        authorisedRequester.userId,
        authorisedRequester.platformRole,
      );

      expect(campaignMembershipRepositoryMock.findOne).toHaveBeenCalledWith({
        where: {
          id: membership.id,
        },
      });

      expect(campaignRepositoryMock.findOne).toHaveBeenCalledWith({
        where: {
          id: membership.campaignId,
        },
      });

      expect(campaignMembershipRepositoryMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: membership.id,
          role: CampaignMembershipRole.DATA_OFFICER,
        }),
      );

      expect(result.role).toBe(CampaignMembershipRole.DATA_OFFICER);
    });

    it('should assign a valid active campaign_manager as the member manager', async () => {
      const managerMembership = {
        id: 'manager-membership-id',
        campaignId: membership.campaignId,
        userId: managerUserId,
        role: CampaignMembershipRole.CAMPAIGN_MANAGER,
        status: CampaignMembershipStatus.ACTIVE,
      };

      campaignRepositoryMock.findOne.mockResolvedValue({
        id: membership.campaignId,
        organisationId: 'organisation-id',
      });

      campaignMembershipRepositoryMock.findOne
        .mockResolvedValueOnce(membership)
        .mockResolvedValueOnce(managerMembership);

      campaignMembershipRepositoryMock.save.mockImplementation(
        async (value) => value,
      );

      const result = await campaignMembershipsService.update(
        membership.id,
        {
          managerMembershipId: managerMembership.id,
        },
        authorisedRequester.userId,
        authorisedRequester.platformRole,
      );

      expect(
        campaignMembershipRepositoryMock.findOne,
      ).toHaveBeenNthCalledWith(2, {
        where: {
          id: managerMembership.id,
          campaignId: membership.campaignId,
          role: CampaignMembershipRole.CAMPAIGN_MANAGER,
          status: CampaignMembershipStatus.ACTIVE,
        },
      });

      expect(result.managerMembershipId).toBe(managerMembership.id);
    });

    it('should reject assigning the membership itself as its manager', async () => {
      campaignMembershipRepositoryMock.findOne.mockResolvedValue(membership);

      await expect(
        campaignMembershipsService.update(
          membership.id,
          {
            managerMembershipId: membership.id,
          },
          authorisedRequester.userId,
          authorisedRequester.platformRole,
        ),
      ).rejects.toThrow(ConflictException);

      expect(campaignMembershipRepositoryMock.save).not.toHaveBeenCalled();
    });

    it('should reject a manager who is not an active campaign_manager of the same Campaign', async () => {
      campaignMembershipRepositoryMock.findOne
        .mockResolvedValueOnce(membership)
        .mockResolvedValueOnce(null);
      
      campaignRepositoryMock.findOne.mockResolvedValue({
        id: membership.campaignId,
        organisationId: 'organisation-id',
      });

      await expect(
        campaignMembershipsService.update(
          membership.id,
          {
            managerMembershipId: 'ordinary-member-id',
          },
          authorisedRequester.userId,
          authorisedRequester.platformRole,
        ),
      ).rejects.toThrow(ConflictException);

      expect(campaignMembershipRepositoryMock.save).not.toHaveBeenCalled();

      expect(
        campaignMembershipRepositoryMock.findOne,
      ).toHaveBeenLastCalledWith({
        where: {
          id: 'ordinary-member-id',
          campaignId: membership.campaignId,
          role: CampaignMembershipRole.CAMPAIGN_MANAGER,
          status: CampaignMembershipStatus.ACTIVE,
        },
      });
    });

    it('should clear the current manager when managerMembershipId is null', async () => {
      const managedMembership = {
        ...membership,
        managerMembershipId: 'old-manager-id',
      };

      campaignMembershipRepositoryMock.findOne.mockResolvedValue(
        managedMembership,
      );
      campaignRepositoryMock.findOne.mockResolvedValue({
        id: managedMembership.campaignId,
        organisationId: 'organisation-id',
      });

      campaignMembershipRepositoryMock.save.mockImplementation(
        async (value) => value,
      );

      const result = await campaignMembershipsService.update(
        managedMembership.id,
        {
          managerMembershipId: null,
        },
        authorisedRequester.userId,
        authorisedRequester.platformRole,
      );

      expect(result.managerMembershipId).toBeNull();
    });

    it('should reject updating a missing Campaign Membership', async () => {
      campaignMembershipRepositoryMock.findOne.mockResolvedValue(null);

      await expect(
        campaignMembershipsService.update(
          'missing-membership-id',
          {
            role: CampaignMembershipRole.DATA_OFFICER,
          },
          authorisedRequester.userId,
          authorisedRequester.platformRole,
        ),
      ).rejects.toThrow(NotFoundException);

      expect(campaignRepositoryMock.findOne).not.toHaveBeenCalled();
      expect(campaignMembershipRepositoryMock.save).not.toHaveBeenCalled();
    });

    it('should reject an unauthorised Campaign Member from updating a membership', async () => {
      campaignMembershipRepositoryMock.findOne.mockResolvedValue(membership);

      campaignRepositoryMock.findOne.mockResolvedValue(campaign);

      organisationMembershipRepositoryMock.findOne.mockResolvedValue({
        id: 'organisation-membership-id',
        organisationId: campaign.organisationId,
        userId: 'ordinary-member-id',
        status: OrganisationMembershipStatus.ACTIVE,
      });

      campaignMembershipRepositoryMock.findOne
        .mockResolvedValueOnce(membership)
        .mockResolvedValueOnce(null);

      await expect(
        campaignMembershipsService.update(
          membership.id,
          {
            role: CampaignMembershipRole.DATA_OFFICER,
          },
          'ordinary-member-id',
          'user',
        ),
      ).rejects.toThrow(ForbiddenException);

      expect(campaignMembershipRepositoryMock.save).not.toHaveBeenCalled();
    });
  });

  describe('updateStatus()', () => {
    const membership = {
      id: 'membership-id',
      campaignId: 'campaign-id',
      userId: 'user-id',
      role: CampaignMembershipRole.MEMBER,
      status: CampaignMembershipStatus.ACTIVE,
      managerMembershipId: null,
      deletedAt: null,
    };

    it.each([
      CampaignMembershipStatus.ACTIVE,
      CampaignMembershipStatus.SUSPENDED,
      CampaignMembershipStatus.INACTIVE,
    ])(
      'should update a Campaign Membership status to %s',
      async (status) => {
        campaignMembershipRepositoryMock.findOne.mockResolvedValue({
          ...membership,
        });

        campaignRepositoryMock.findOne.mockResolvedValue(campaign);

        campaignMembershipRepositoryMock.save.mockImplementation(
          async (value) => value,
        );

        const result =
          await campaignMembershipsService.updateStatus(
            membership.id,
            status,
            superAdminUserId,
            'super_admin',
          );

        expect(result.status).toBe(status);

        expect(
          campaignMembershipRepositoryMock.save,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            id: membership.id,
            status,
          }),
        );
      },
    );

    it('should reject updating the status of a missing Campaign Membership', async () => {
      campaignMembershipRepositoryMock.findOne.mockResolvedValue(null);

      await expect(
        campaignMembershipsService.updateStatus(
          'missing-membership-id',
          CampaignMembershipStatus.SUSPENDED,
          superAdminUserId,
          'super_admin',
        ),
      ).rejects.toThrow(NotFoundException);

      expect(campaignRepositoryMock.findOne).not.toHaveBeenCalled();
      expect(campaignMembershipRepositoryMock.save).not.toHaveBeenCalled();
    });

    it('should reject an unauthorised user from changing membership status', async () => {
      campaignMembershipRepositoryMock.findOne
        .mockResolvedValueOnce(membership)
        .mockResolvedValueOnce(null);

      campaignRepositoryMock.findOne.mockResolvedValue(campaign);

      organisationMembershipRepositoryMock.findOne.mockResolvedValue({
        id: 'organisation-membership-id',
        organisationId: campaign.organisationId,
        userId: 'ordinary-member-id',
        status: OrganisationMembershipStatus.ACTIVE,
      });

      await expect(
        campaignMembershipsService.updateStatus(
          membership.id,
          CampaignMembershipStatus.SUSPENDED,
          'ordinary-member-id',
          'user',
        ),
      ).rejects.toThrow(ForbiddenException);

      expect(campaignMembershipRepositoryMock.save).not.toHaveBeenCalled();
    });
  });

  describe('remove()', () => {
    const membership = {
      id: 'membership-id',
      campaignId: 'campaign-id',
      userId: 'user-id',
      role: CampaignMembershipRole.MEMBER,
      status: CampaignMembershipStatus.ACTIVE,
      managerMembershipId: null,
      deletedAt: null,
    };

    it('should soft-delete an existing Campaign Membership', async () => {
      campaignMembershipRepositoryMock.findOne.mockResolvedValue(membership);

      campaignRepositoryMock.findOne.mockResolvedValue(campaign);

      campaignMembershipRepositoryMock.softRemove.mockResolvedValue({
        ...membership,
        deletedAt: new Date(),
      });

      await expect(
        campaignMembershipsService.remove(
          membership.id,
          superAdminUserId,
          'super_admin',
        ),
      ).resolves.toBeUndefined();

      expect(campaignMembershipRepositoryMock.findOne).toHaveBeenCalledWith({
        where: {
          id: membership.id,
        },
      });

      expect(
        campaignMembershipRepositoryMock.softRemove,
      ).toHaveBeenCalledWith(membership);
    });

    it('should reject removing a missing Campaign Membership', async () => {
      campaignMembershipRepositoryMock.findOne.mockResolvedValue(null);

      await expect(
        campaignMembershipsService.remove(
          'missing-membership-id',
          superAdminUserId,
          'super_admin',
        ),
      ).rejects.toThrow(NotFoundException);

      expect(
        campaignMembershipRepositoryMock.softRemove,
      ).not.toHaveBeenCalled();
    });

    it('should reject an unauthorised user from removing a Campaign Membership', async () => {
      campaignMembershipRepositoryMock.findOne
        .mockResolvedValueOnce(membership)
        .mockResolvedValueOnce(null);

      campaignRepositoryMock.findOne.mockResolvedValue(campaign);

      organisationMembershipRepositoryMock.findOne.mockResolvedValue({
        id: 'organisation-membership-id',
        organisationId: campaign.organisationId,
        userId: 'ordinary-member-id',
        status: OrganisationMembershipStatus.ACTIVE,
      });

      await expect(
        campaignMembershipsService.remove(
          membership.id,
          'ordinary-member-id',
          'user',
        ),
      ).rejects.toThrow(ForbiddenException);

      expect(
        campaignMembershipRepositoryMock.softRemove,
      ).not.toHaveBeenCalled();
    });
  });

  describe('restore()', () => {
    const createDeletedMembership = () => ({
      id: 'membership-id',
      campaignId: 'campaign-id',
      userId: 'user-id',
      role: CampaignMembershipRole.MEMBER,
      status: CampaignMembershipStatus.SUSPENDED,
      managerMembershipId: null,
      deletedAt: new Date('2026-09-27T10:00:00.000Z'),
    });

    it('should restore a deleted Campaign Membership when Organisation Membership is active', async () => {
      const deletedMembership = createDeletedMembership();

      campaignMembershipRepositoryMock.findOne
        .mockResolvedValueOnce(deletedMembership)
        .mockResolvedValueOnce(null);

      campaignRepositoryMock.findOne.mockResolvedValue(campaign);

      organisationMembershipRepositoryMock.findOne.mockResolvedValue({
        id: 'organisation-membership-id',
        organisationId: campaign.organisationId,
        userId: deletedMembership.userId,
        status: OrganisationMembershipStatus.ACTIVE,
      });

      campaignMembershipRepositoryMock.save.mockImplementation(
        async (value) => value,
      );

      const result =
        await campaignMembershipsService.restore(
          deletedMembership.id,
          superAdminUserId,
          'super_admin',
        );

      expect(
        campaignMembershipRepositoryMock.findOne,
      ).toHaveBeenNthCalledWith(1, {
        where: {
          id: deletedMembership.id,
        },
        withDeleted: true,
      });

      expect(campaignRepositoryMock.findOne).toHaveBeenNthCalledWith(1, {
        where: {
          id: campaign.id,
        },
      });

      expect(campaignRepositoryMock.findOne).toHaveBeenNthCalledWith(2, {
        where: {
          id: campaign.id,
        },
      });

      expect(
        organisationMembershipRepositoryMock.findOne,
      ).toHaveBeenCalledWith({
        where: {
          organisationId: campaign.organisationId,
          userId: deletedMembership.userId,
          status: OrganisationMembershipStatus.ACTIVE,
        },
      });

      expect(campaignMembershipRepositoryMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: deletedMembership.id,
          status: CampaignMembershipStatus.ACTIVE,
          deletedAt: null,
        }),
      );

      expect(result.status).toBe(CampaignMembershipStatus.ACTIVE);
      expect(result.deletedAt).toBeNull();
    });

    it('should reject restoring a missing Campaign Membership', async () => {
      campaignMembershipRepositoryMock.findOne.mockResolvedValue(null);

      await expect(
        campaignMembershipsService.restore(
          'missing-membership-id',
          superAdminUserId,
          'super_admin',
        ),
      ).rejects.toThrow(NotFoundException);

      expect(campaignRepositoryMock.findOne).not.toHaveBeenCalled();
      expect(campaignMembershipRepositoryMock.save).not.toHaveBeenCalled();
    });

    it('should reject restoring a Campaign Membership that is not deleted', async () => {
      const deletedMembership = createDeletedMembership();

      const activeMembership = {
        ...deletedMembership,
        deletedAt: null,
      };

      campaignMembershipRepositoryMock.findOne.mockResolvedValue(
        activeMembership,
      );

      campaignRepositoryMock.findOne.mockResolvedValue(campaign);

      await expect(
        campaignMembershipsService.restore(
          activeMembership.id,
          superAdminUserId,
          'super_admin',
        ),
      ).rejects.toThrow(ConflictException);

      expect(
        organisationMembershipRepositoryMock.findOne,
      ).not.toHaveBeenCalled();

      expect(campaignMembershipRepositoryMock.save).not.toHaveBeenCalled();
    });

    it('should reject restoration when the Campaign no longer exists', async () => {
      const deletedMembership = createDeletedMembership();

      campaignMembershipRepositoryMock.findOne.mockResolvedValue(
        deletedMembership,
      );

      campaignRepositoryMock.findOne.mockResolvedValue(null);

      await expect(
        campaignMembershipsService.restore(
          deletedMembership.id,
          superAdminUserId,
          'super_admin',
        ),
      ).rejects.toThrow(NotFoundException);

      expect(
        organisationMembershipRepositoryMock.findOne,
      ).not.toHaveBeenCalled();

      expect(campaignMembershipRepositoryMock.save).not.toHaveBeenCalled();
    });

    it('should reject restoration when the User has no active Organisation Membership', async () => {
      const deletedMembership = createDeletedMembership();

      campaignMembershipRepositoryMock.findOne.mockResolvedValue(
        deletedMembership,
      );

      campaignRepositoryMock.findOne.mockResolvedValue(campaign);

      organisationMembershipRepositoryMock.findOne.mockResolvedValue(null);

      await expect(
        campaignMembershipsService.restore(
          deletedMembership.id,
          superAdminUserId,
          'super_admin',
        ),
      ).rejects.toThrow(ConflictException);

      expect(campaignMembershipRepositoryMock.save).not.toHaveBeenCalled();
    });

    it('should reject restoration when an active duplicate membership exists', async () => {
      const deletedMembership = createDeletedMembership();

      const activeDuplicate = {
        id: 'active-membership-id',
        campaignId: deletedMembership.campaignId,
        userId: deletedMembership.userId,
        role: CampaignMembershipRole.MEMBER,
        status: CampaignMembershipStatus.ACTIVE,
        deletedAt: null,
      };

      campaignMembershipRepositoryMock.findOne
        .mockResolvedValueOnce(deletedMembership)
        .mockResolvedValueOnce(activeDuplicate);

      campaignRepositoryMock.findOne.mockResolvedValue(campaign);

      organisationMembershipRepositoryMock.findOne.mockResolvedValue({
        id: 'organisation-membership-id',
        organisationId: campaign.organisationId,
        userId: deletedMembership.userId,
        status: OrganisationMembershipStatus.ACTIVE,
      });

      await expect(
        campaignMembershipsService.restore(
          deletedMembership.id,
          superAdminUserId,
          'super_admin',
        ),
      ).rejects.toThrow(ConflictException);

      expect(campaignMembershipRepositoryMock.save).not.toHaveBeenCalled();
    });

    it('should reject an unauthorised user from restoring a Campaign Membership', async () => {
      const deletedMembership = createDeletedMembership();

      campaignMembershipRepositoryMock.findOne.mockResolvedValue(
        deletedMembership,
      );

      campaignRepositoryMock.findOne.mockResolvedValue(campaign);

      organisationMembershipRepositoryMock.findOne.mockResolvedValue({
        id: 'organisation-membership-id',
        organisationId: campaign.organisationId,
        userId: 'ordinary-member-id',
        status: OrganisationMembershipStatus.ACTIVE,
      });

      campaignMembershipRepositoryMock.findOne.mockResolvedValueOnce(
        deletedMembership,
      );

      campaignMembershipRepositoryMock.findOne.mockResolvedValueOnce(null);

      await expect(
        campaignMembershipsService.restore(
          deletedMembership.id,
          'ordinary-member-id',
          'user',
        ),
      ).rejects.toThrow(ForbiddenException);

      expect(campaignMembershipRepositoryMock.save).not.toHaveBeenCalled();
    });
  });

  describe('findById()', () => {
    it('should return an existing Campaign Membership', async () => {
      const membership = {
        id: 'campaign-membership-id',
        campaignId: 'campaign-id',
        userId: 'user-id',
        role: CampaignMembershipRole.MEMBER,
        status: CampaignMembershipStatus.ACTIVE,
      };

      campaignMembershipRepositoryMock.findOne.mockResolvedValue(
        membership,
      );

      const result = await campaignMembershipsService.findById(
        membership.id,
      );

      expect(campaignMembershipRepositoryMock.findOne).toHaveBeenCalledWith({
        where: {
          id: membership.id,
        },
      });

      expect(result).toEqual(membership);
    });

    it('should reject when the Campaign Membership does not exist', async () => {
      campaignMembershipRepositoryMock.findOne.mockResolvedValue(null);

      await expect(
        campaignMembershipsService.findById(
          'missing-membership-id',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });
});