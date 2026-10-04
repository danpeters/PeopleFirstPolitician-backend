/**
 * File:
 * C:\Projects\PeopleFirstPolitician\backend\src\modules\elections\election-positions.controller.ts
 *
 * Purpose:
 * - Provides authenticated API endpoints for Election Position management.
 * - Applies JWT authentication to all Election Position endpoints.
 * - Applies database-backed permission checks to each operation.
 * - Passes organisation context from the route to
 *   ElectionPositionsService.
 *
 * Security:
 * - All endpoints require an authenticated JWT.
 * - Organisation-scoped access is enforced by PermissionsGuard
 *   and independently verified by ElectionPositionsService.
 * - organisationId is taken from the route, never from a DTO.
 * - Election Position creation and updates require
 *   election.manage_positions.
 * - Election Position retrieval requires election.view.
 */

import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { Request } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../roles/guards/permissions.guard';
import { Permissions } from '../roles/decorators/permissions.decorator';

import { ElectionPositionsService } from './election-positions.service';

import { CreateElectionPositionDto } from './dto/create-election-position.dto';
import { UpdateElectionPositionDto } from './dto/update-election-position.dto';

import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

interface AuthenticatedRequest
  extends Request {
  user?: {
    userId?: string;
  };
}

@ApiTags('Election Positions')
@ApiBearerAuth()
@Controller(
  'organisations/:organisationId/election-positions',
)
@UseGuards(
  JwtAuthGuard,
  PermissionsGuard,
)
export class ElectionPositionsController {
  constructor(
    private readonly electionPositionsService:
      ElectionPositionsService,
  ) {}

  /**
   * Create a new Election Position.
   */
  @Post()
  @Permissions(
    'election.manage_positions',
  )
  @ApiOperation({
    summary: 'Create an election position',
  })
  @ApiParam({
    name: 'organisationId',
    description:
      'Organisation providing the authorisation context for the operation.',
  })
  @ApiResponse({
    status: 201,
    description:
      'Election Position created successfully.',
  })
  @ApiResponse({
    status: 403,
    description:
      'Authenticated user does not have the required permission or active organisation membership.',
  })
  @ApiResponse({
    status: 409,
    description:
      'An Election Position with the supplied code already exists.',
  })
  async create(
    @Param('organisationId')
    organisationId: string,

    @Body()
    createElectionPositionDto:
      CreateElectionPositionDto,

    @Req()
    request: AuthenticatedRequest,
  ) {
    const actorId =
      request.user?.userId ?? null;

    return this.electionPositionsService.create(
      createElectionPositionDto,
      organisationId,
      actorId,
    );
  }

  /**
   * Retrieve a paginated list of Election Positions.
   */
  @Get()
  @Permissions('election.view')
  @ApiOperation({
    summary: 'List election positions',
  })
  @ApiParam({
    name: 'organisationId',
    description:
      'Organisation providing the authorisation context for the operation.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description:
      'Page number. Defaults to 1.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description:
      'Number of records per page. Maximum 100.',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description:
      'Search by position code, name or description.',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    description:
      'Allowed fields: code, name, createdAt, updatedAt.',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    description:
      'Sort direction: ASC or DESC.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Paginated list of Election Positions.',
  })
  async findAll(
    @Param('organisationId')
    organisationId: string,

    @Query()
    paginationDto: PaginationQueryDto,

    @Req()
    request: AuthenticatedRequest,
  ) {
    const actorId =
      request.user?.userId ?? '';

    return this.electionPositionsService.findAll(
      organisationId,
      paginationDto,
      actorId,
    );
  }

  /**
   * Retrieve one Election Position by ID.
   */
  @Get(':id')
  @Permissions('election.view')
  @ApiOperation({
    summary: 'Get an election position',
  })
  @ApiParam({
    name: 'organisationId',
    description:
      'Organisation providing the authorisation context for the operation.',
  })
  @ApiParam({
    name: 'id',
    description:
      'Election Position UUID.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Election Position returned successfully.',
  })
  @ApiResponse({
    status: 404,
    description:
      'Election Position not found.',
  })
  async findById(
    @Param('organisationId')
    organisationId: string,

    @Param('id')
    id: string,

    @Req()
    request: AuthenticatedRequest,
  ) {
    const actorId =
      request.user?.userId ?? '';

    return this.electionPositionsService.findById(
      id,
      organisationId,
      actorId,
    );
  }

  /**
   * Update an existing Election Position.
   */
  @Patch(':id')
  @Permissions(
    'election.manage_positions',
  )
  @ApiOperation({
    summary: 'Update an election position',
  })
  @ApiParam({
    name: 'organisationId',
    description:
      'Organisation providing the authorisation context for the operation.',
  })
  @ApiParam({
    name: 'id',
    description:
      'Election Position UUID.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Election Position updated successfully.',
  })
  @ApiResponse({
    status: 404,
    description:
      'Election Position not found.',
  })
  @ApiResponse({
    status: 409,
    description:
      'An Election Position with the supplied code already exists.',
  })
  async update(
    @Param('organisationId')
    organisationId: string,

    @Param('id')
    id: string,

    @Body()
    updateElectionPositionDto:
      UpdateElectionPositionDto,

    @Req()
    request: AuthenticatedRequest,
  ) {
    const actorId =
      request.user?.userId ?? null;

    return this.electionPositionsService.update(
      id,
      updateElectionPositionDto,
      organisationId,
      actorId,
    );
  }
}