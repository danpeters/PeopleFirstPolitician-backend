/**
 * File:
 * C:\Projects\PeopleFirstPolitician\backend\src\modules\results\results.controller.ts
 *
 * Purpose:
 * Provides secured HTTP endpoints for Polling Unit Result management.
 *
 * Security:
 * - All endpoints require JWT authentication.
 * - Fine-grained result permissions are enforced by PermissionsGuard.
 * - organisationId comes from the route, never from the DTO.
 * - actorId comes exclusively from request.user.userId.
 * - ResultsService performs the deeper organisation, campaign,
 *   AgentAssignment, election, race and polling-unit validation.
 * - Result lifecycle transitions are controlled by the service.
 */

import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { Request } from 'express';

import { ResultsService } from './results.service';

import { CreatePollingUnitResultDto } from './dto/create-polling-unit-result.dto';
import { UpdatePollingUnitResultDto } from './dto/update-polling-unit-result.dto';
import { FlagPollingUnitResultDto } from './dto/flag-polling-unit-result.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { PermissionsGuard } from '../roles/guards/permissions.guard';
import { Permissions } from '../roles/decorators/permissions.decorator';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

@ApiTags('Results')
@ApiBearerAuth()
@Controller('results')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ResultsController {
  constructor(
    private readonly resultsService: ResultsService,
  ) {}

  /**
   * Create a draft Polling Unit Result.
   */
  @Post('organisations/:organisationId')
  @Permissions('result.create')
  @ApiOperation({
    summary: 'Create a Polling Unit Result draft',
    description:
      'Creates a draft polling unit result after validating the Agent Assignment, Campaign, Election Race and Polling Unit context.',
  })
  @ApiParam({
    name: 'organisationId',
    description: 'Organisation UUID',
  })
  @ApiResponse({
    status: 201,
    description: 'Polling Unit Result draft created successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid result data or validation context.',
  })
  @ApiResponse({
    status: 403,
    description:
      'Authenticated user lacks the required permission or active organisation membership.',
  })
  @ApiResponse({
    status: 409,
    description:
      'A result already exists for the Election Race and Polling Unit, or the client reference already exists.',
  })
  async createDraft(
    @Param(
      'organisationId',
      new ParseUUIDPipe(),
    )
    organisationId: string,

    @Body()
    dto: CreatePollingUnitResultDto,

    @Req()
    request: AuthenticatedRequest,
  ) {
    return this.resultsService.createDraft(
      organisationId,
      dto,
      request.user.userId,
    );
  }

  /**
   * Submit a draft result.
   */
  @Post('organisations/:organisationId/:id/submit')
  @Permissions('result.submit')
  @ApiOperation({
    summary: 'Submit a Polling Unit Result',
    description:
      'Submits a draft result after all required contextual validation has passed.',
  })
  @ApiParam({
    name: 'organisationId',
    description: 'Organisation UUID',
  })
  @ApiParam({
    name: 'id',
    description: 'Polling Unit Result UUID',
  })
  @ApiResponse({
    status: 200,
    description: 'Polling Unit Result submitted successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Result cannot currently be submitted.',
  })
  @ApiResponse({
    status: 404,
    description: 'Polling Unit Result not found.',
  })
  async submit(
    @Param(
      'organisationId',
      new ParseUUIDPipe(),
    )
    organisationId: string,

    @Param(
      'id',
      new ParseUUIDPipe(),
    )
    id: string,

    @Req()
    request: AuthenticatedRequest,
  ) {
    return this.resultsService.submit(
      organisationId,
      id,
      request.user.userId,
    );
  }

  /**
   * Synchronize a submitted result.
   */
  @Post('organisations/:organisationId/:id/synchronize')
  @Permissions('result.synchronize')
  @ApiOperation({
    summary: 'Synchronize a Polling Unit Result',
    description:
      'Synchronizes a submitted result after successful server-side validation.',
  })
  @ApiParam({
    name: 'organisationId',
    description: 'Organisation UUID',
  })
  @ApiParam({
    name: 'id',
    description: 'Polling Unit Result UUID',
  })
  @ApiResponse({
    status: 200,
    description: 'Polling Unit Result synchronized successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Result cannot currently be synchronized.',
  })
  @ApiResponse({
    status: 404,
    description: 'Polling Unit Result not found.',
  })
  async synchronize(
    @Param(
      'organisationId',
      new ParseUUIDPipe(),
    )
    organisationId: string,

    @Param(
      'id',
      new ParseUUIDPipe(),
    )
    id: string,

    @Req()
    request: AuthenticatedRequest,
  ) {
    return this.resultsService.synchronize(
      organisationId,
      id,
      request.user.userId,
    );
  }

  /**
   * Update a draft result.
   */
  @Patch('organisations/:organisationId/:id')
  @Permissions('result.update')
  @ApiOperation({
    summary: 'Update a draft Polling Unit Result',
    description:
      'Updates the vote records of a result while it remains in the DRAFT state.',
  })
  @ApiParam({
    name: 'organisationId',
    description: 'Organisation UUID',
  })
  @ApiParam({
    name: 'id',
    description: 'Polling Unit Result UUID',
  })
  @ApiResponse({
    status: 200,
    description: 'Polling Unit Result updated successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Result cannot currently be updated.',
  })
  @ApiResponse({
    status: 404,
    description: 'Polling Unit Result not found.',
  })
  async updateDraft(
    @Param(
      'organisationId',
      new ParseUUIDPipe(),
    )
    organisationId: string,

    @Param(
      'id',
      new ParseUUIDPipe(),
    )
    id: string,

    @Body()
    dto: UpdatePollingUnitResultDto,

    @Req()
    request: AuthenticatedRequest,
  ) {
    return this.resultsService.updateDraft(
      organisationId,
      id,
      dto,
      request.user.userId,
    );
  }

  /**
   * Flag a result for review.
   */
  @Post('organisations/:organisationId/:id/flag')
  @Permissions('result.flag')
  @ApiOperation({
    summary: 'Flag a Polling Unit Result',
    description:
      'Flags a submitted or synchronized result for review and records the reason.',
  })
  @ApiParam({
    name: 'organisationId',
    description: 'Organisation UUID',
  })
  @ApiParam({
    name: 'id',
    description: 'Polling Unit Result UUID',
  })
  @ApiResponse({
    status: 200,
    description: 'Polling Unit Result flagged successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Result cannot currently be flagged.',
  })
  @ApiResponse({
    status: 404,
    description: 'Polling Unit Result not found.',
  })
  async flag(
    @Param(
      'organisationId',
      new ParseUUIDPipe(),
    )
    organisationId: string,

    @Param(
      'id',
      new ParseUUIDPipe(),
    )
    id: string,

    @Body()
    dto: FlagPollingUnitResultDto,

    @Req()
    request: AuthenticatedRequest,
  ) {
    return this.resultsService.flag(
      organisationId,
      id,
      dto,
      request.user.userId,
    );
  }

  /**
   * Verify a result.
   */
  @Post('organisations/:organisationId/:id/verify')
  @Permissions('result.verify')
  @ApiOperation({
    summary: 'Verify a Polling Unit Result',
    description:
      'Verifies a result while enforcing separation between the original submitter and verifier.',
  })
  @ApiParam({
    name: 'organisationId',
    description: 'Organisation UUID',
  })
  @ApiParam({
    name: 'id',
    description: 'Polling Unit Result UUID',
  })
  @ApiResponse({
    status: 200,
    description: 'Polling Unit Result verified successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Result cannot currently be verified or the verifier is not permitted.',
  })
  @ApiResponse({
    status: 404,
    description: 'Polling Unit Result not found.',
  })
  async verify(
    @Param(
      'organisationId',
      new ParseUUIDPipe(),
    )
    organisationId: string,

    @Param(
      'id',
      new ParseUUIDPipe(),
    )
    id: string,

    @Req()
    request: AuthenticatedRequest,
  ) {
    return this.resultsService.verify(
      organisationId,
      id,
      request.user.userId,
    );
  }

  /**
   * Get one result.
   */
  @Get('organisations/:organisationId/:id')
  @Permissions('result.view')
  @ApiOperation({
    summary: 'Get a Polling Unit Result',
    description:
      'Returns a Polling Unit Result after organisation and contextual access validation.',
  })
  @ApiParam({
    name: 'organisationId',
    description: 'Organisation UUID',
  })
  @ApiParam({
    name: 'id',
    description: 'Polling Unit Result UUID',
  })
  @ApiResponse({
    status: 200,
    description: 'Polling Unit Result retrieved successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Polling Unit Result not found.',
  })
  async findById(
    @Param(
      'organisationId',
      new ParseUUIDPipe(),
    )
    organisationId: string,

    @Param(
      'id',
      new ParseUUIDPipe(),
    )
    id: string,

    @Req()
    request: AuthenticatedRequest,
  ) {
    return this.resultsService.findById(
        organisationId,
        id,
    );
  }
}