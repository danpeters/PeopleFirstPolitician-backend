/**
 * File:
 * C:\Projects\PeopleFirstPolitician\backend\src\modules\campaign-memberships\campaign-memberships.controller.ts
 *
 * Purpose:
 * Handles HTTP requests for Campaign Membership management.
 *
 * Security model:
 * - JwtAuthGuard requires an authenticated user.
 * - The requester identity comes from request.user.
 * - The requester cannot supply their identity through the request body.
 * - Campaign-level authorisation is enforced by
 *   CampaignMembershipsService.
 *
 * Endpoints:
 * - POST /api/v1/campaign-memberships
 * - GET  /api/v1/campaign-memberships/:id
 * - GET  /api/v1/campaign-memberships/campaign/:campaignId
 *
 * Security rules:
 * - Creation requires Campaign administration authority.
 * - Reading a membership requires access to its Campaign.
 * - Listing Campaign memberships requires access to that Campaign.
 * - super_admin is handled by the service authorisation layer.
 */

import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CampaignMembershipsService } from './campaign-memberships.service';
import { CreateCampaignMembershipDto } from './dto/create-campaign-membership.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { buildSuccessResponse } from '../../common/utils/api-response.util';

interface AuthenticatedRequest {
  user?: {
    userId?: string;
    email?: string;
    role?: string;
  };
}

@ApiTags('Campaign Memberships')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('campaign-memberships')
export class CampaignMembershipsController {
  constructor(
    private readonly campaignMembershipsService: CampaignMembershipsService,
  ) {}

  /**
   * POST /api/v1/campaign-memberships
   *
   * Adds a user to a Campaign.
   *
   * Security:
   * - Authentication is provided by JwtAuthGuard.
   * - Requester identity comes exclusively from the JWT.
   * - Campaign-level authorisation is performed before creation.
   */
  @ApiOperation({
    summary: 'Add a user to a Campaign',
    description:
      'Creates a Campaign Membership. Only a super_admin or an active campaign_manager of the specified Campaign can perform this operation.',
  })
  @ApiResponse({
    status: 201,
    description: 'Campaign Membership created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized (No valid JWT)',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden (Insufficient Campaign authority)',
  })
  @ApiResponse({
    status: 404,
    description: 'Campaign or User not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Membership conflict',
  })
  @Post()
  async create(
    @Body() createCampaignMembershipDto: CreateCampaignMembershipDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const requester = req.user;

    if (!requester?.userId) {
      /**
       * JwtAuthGuard normally prevents this situation.
       *
       * This explicit check keeps the controller defensive if
       * request.user is unexpectedly incomplete.
       */
      throw new Error('Authenticated user information is missing.');
    }

    await this.campaignMembershipsService.assertCanManageCampaign(
      createCampaignMembershipDto.campaignId,
      requester.userId,
      requester.role,
    );

    const membership = await this.campaignMembershipsService.create({
      campaignId: createCampaignMembershipDto.campaignId,
      userId: createCampaignMembershipDto.userId,
      role: createCampaignMembershipDto.role,
      managerMembershipId:
        createCampaignMembershipDto.managerMembershipId,
      joinedAt: createCampaignMembershipDto.joinedAt
        ? new Date(createCampaignMembershipDto.joinedAt)
        : undefined,
    });

    return buildSuccessResponse(
      'Campaign Membership created successfully',
      membership,
    );
  }

  /**
   * GET /api/v1/campaign-memberships/campaign/:campaignId
   *
   * Returns all active/non-deleted Campaign Membership records
   * belonging to a specific Campaign.
   *
   * Security:
   * - The requester must have access to the Campaign.
   * - Authorisation is performed before membership data is returned.
   *
   * IMPORTANT:
   * This route is deliberately declared before GET /:id.
   * Otherwise "campaign" could potentially be interpreted as an ID.
   */
  @ApiOperation({
    summary: 'List Campaign Memberships',
    description:
      'Returns Campaign Memberships for a specific Campaign after Campaign-level access has been verified.',
  })
  @ApiResponse({
    status: 200,
    description: 'Campaign Memberships retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized (No valid JWT)',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden (No Campaign access)',
  })
  @ApiResponse({
    status: 404,
    description: 'Campaign not found',
  })
  @Get('campaign/:campaignId')
  async findByCampaign(
    @Param('campaignId') campaignId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    const requester = req.user;

    if (!requester?.userId) {
      throw new Error('Authenticated user information is missing.');
    }

    await this.campaignMembershipsService.assertCanAccessCampaign(
      campaignId,
      requester.userId,
      requester.role,
    );

    const memberships =
      await this.campaignMembershipsService.findByCampaignId(campaignId);

    return buildSuccessResponse(
      'Campaign Memberships retrieved successfully',
      memberships,
    );
  }

  /**
   * GET /api/v1/campaign-memberships/:id
   *
   * Returns one Campaign Membership.
   *
   * Security:
   * 1. Locate the membership.
   * 2. Obtain its Campaign ID.
   * 3. Verify that the authenticated requester can access
   *    that Campaign.
   * 4. Only then return the membership.
   *
   * This prevents a user from retrieving a membership belonging
   * to another Campaign simply by knowing its UUID.
   */
  @ApiOperation({
    summary: 'Get a Campaign Membership',
    description:
      'Returns a Campaign Membership after Campaign-level access has been verified.',
  })
  @ApiResponse({
    status: 200,
    description: 'Campaign Membership retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized (No valid JWT)',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden (No Campaign access)',
  })
  @ApiResponse({
    status: 404,
    description: 'Campaign Membership not found',
  })
  @Get(':id')
  async findById(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    const requester = req.user;

    if (!requester?.userId) {
      throw new Error('Authenticated user information is missing.');
    }

    const membership =
      await this.campaignMembershipsService.findById(id);

    await this.campaignMembershipsService.assertCanAccessCampaign(
      membership.campaignId,
      requester.userId,
      requester.role,
    );

    return buildSuccessResponse(
      'Campaign Membership retrieved successfully',
      membership,
    );
  }
}