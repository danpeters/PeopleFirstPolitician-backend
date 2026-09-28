/**
 * File:
 * C:\Projects\PeopleFirstPolitician\backend\src\modules\campaign-memberships\dto\campaign-membership.dto.spec.ts
 *
 * Purpose:
 * Unit tests for Campaign Membership DTO validation.
 *
 * Security coverage:
 * - UUID validation
 * - Campaign Membership role validation
 * - Manager Membership UUID validation
 * - Joined date validation
 * - Campaign Membership status validation
 *
 * Note:
 * These tests validate DTO decorators directly and do not connect
 * to the database.
 */

import { validate } from 'class-validator';

import { CreateCampaignMembershipDto } from './create-campaign-membership.dto';
import { UpdateCampaignMembershipDto } from './update-campaign-membership.dto';
import { UpdateCampaignMembershipStatusDto } from './update-campaign-membership-status.dto';

import {
  CampaignMembershipRole,
  CampaignMembershipStatus,
} from '../entities/campaign-membership.entity';

describe('Campaign Membership DTOs', () => {
  describe('CreateCampaignMembershipDto', () => {
    it('should accept valid Campaign Membership data', async () => {
      const dto = new CreateCampaignMembershipDto();

      dto.campaignId = '550e8400-e29b-41d4-a716-446655440000';
      dto.userId = '550e8400-e29b-41d4-a716-446655440001';
      dto.role = CampaignMembershipRole.MEMBER;
      dto.managerMembershipId =
        '550e8400-e29b-41d4-a716-446655440002';
      dto.joinedAt = '2026-09-27T16:00:00.000Z';

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should reject an invalid campaignId', async () => {
      const dto = new CreateCampaignMembershipDto();

      dto.campaignId = 'not-a-uuid';
      dto.userId = '550e8400-e29b-41d4-a716-446655440001';

      const errors = await validate(dto);

      expect(errors.some((error) => error.property === 'campaignId')).toBe(
        true,
      );
    });

    it('should reject an invalid userId', async () => {
      const dto = new CreateCampaignMembershipDto();

      dto.campaignId = '550e8400-e29b-41d4-a716-446655440000';
      dto.userId = 'not-a-uuid';

      const errors = await validate(dto);

      expect(errors.some((error) => error.property === 'userId')).toBe(
        true,
      );
    });

    it('should reject an invalid Campaign Membership role', async () => {
      const dto = new CreateCampaignMembershipDto();

      dto.campaignId = '550e8400-e29b-41d4-a716-446655440000';
      dto.userId = '550e8400-e29b-41d4-a716-446655440001';
      dto.role = 'invalid-role' as CampaignMembershipRole;

      const errors = await validate(dto);

      expect(errors.some((error) => error.property === 'role')).toBe(
        true,
      );
    });

    it('should reject an invalid managerMembershipId', async () => {
      const dto = new CreateCampaignMembershipDto();

      dto.campaignId = '550e8400-e29b-41d4-a716-446655440000';
      dto.userId = '550e8400-e29b-41d4-a716-446655440001';
      dto.managerMembershipId = 'invalid-manager-id';

      const errors = await validate(dto);

      expect(
        errors.some(
          (error) => error.property === 'managerMembershipId',
        ),
      ).toBe(true);
    });

    it('should reject an invalid joinedAt value', async () => {
      const dto = new CreateCampaignMembershipDto();

      dto.campaignId = '550e8400-e29b-41d4-a716-446655440000';
      dto.userId = '550e8400-e29b-41d4-a716-446655440001';
      dto.joinedAt = 'not-a-date';

      const errors = await validate(dto);

      expect(errors.some((error) => error.property === 'joinedAt')).toBe(
        true,
      );
    });
  });

  describe('UpdateCampaignMembershipDto', () => {
    it('should accept a valid role update', async () => {
      const dto = new UpdateCampaignMembershipDto();

      dto.role = CampaignMembershipRole.DATA_OFFICER;

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should reject an invalid role update', async () => {
      const dto = new UpdateCampaignMembershipDto();

      dto.role = 'invalid-role' as CampaignMembershipRole;

      const errors = await validate(dto);

      expect(errors.some((error) => error.property === 'role')).toBe(
        true,
      );
    });

    it('should reject an invalid managerMembershipId', async () => {
      const dto = new UpdateCampaignMembershipDto();

      dto.managerMembershipId = 'invalid-manager-id';

      const errors = await validate(dto);

      expect(
        errors.some(
          (error) => error.property === 'managerMembershipId',
        ),
      ).toBe(true);
    });
  });

  describe('UpdateCampaignMembershipStatusDto', () => {
    it('should accept a valid Campaign Membership status', async () => {
      const dto = new UpdateCampaignMembershipStatusDto();

      dto.status = CampaignMembershipStatus.SUSPENDED;

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should reject an invalid Campaign Membership status', async () => {
      const dto = new UpdateCampaignMembershipStatusDto();

      dto.status = 'invalid-status' as CampaignMembershipStatus;

      const errors = await validate(dto);

      expect(errors.some((error) => error.property === 'status')).toBe(
        true,
      );
    });
  });
});