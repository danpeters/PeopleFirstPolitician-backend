/**
 * File:
 * C:\Projects\PeopleFirstPolitician\backend\src\modules\elections\elections.controller.ts
 *
 * Purpose:
 * - Provides authenticated API endpoints for Election management.
 * - Applies JWT authentication to all Election endpoints.
 * - Applies database-backed permission checks to each operation.
 * - Passes organisation context from the route to ElectionsService.
 *
 * Security:
 * - All endpoints require an authenticated JWT.
 * - Organisation-scoped access is enforced by PermissionsGuard
 *   and independently verified by ElectionsService.
 * - organisationId is taken from the route, never from the DTO.
 * - Election creation requires election.create.
 * - Election retrieval requires election.view.
 * - Election updates require election.update.
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

import { ElectionsService } from './elections.service';

import { CreateElectionDto } from './dto/create-election.dto';
import { UpdateElectionDto } from './dto/update-election.dto';

import { ElectionsQueryDto } from './dto/elections-query.dto';

interface AuthenticatedRequest
  extends Request {
  user?: {
    userId?: string;
  };
}

@ApiTags('Elections')
@ApiBearerAuth()
@Controller('organisations/:organisationId/elections')
@UseGuards(
  JwtAuthGuard,
  PermissionsGuard,
)
export class ElectionsController {
  constructor(
    private readonly electionsService:
      ElectionsService,
  ) {}

  /**
   * Create a new Election.
   */
  @Post()
  @Permissions('election.create')
  @ApiOperation({
    summary: 'Create an election',
  })
  @ApiParam({
    name: 'organisationId',
    description:
      'Organisation providing the authorisation context for the operation.',
  })
  @ApiResponse({
    status: 201,
    description:
      'Election created successfully.',
  })
  @ApiResponse({
    status: 403,
    description:
      'Authenticated user does not have the required permission or active organisation membership.',
  })
  async create(
    @Param('organisationId')
    organisationId: string,

    @Body()
    createElectionDto: CreateElectionDto,

    @Req()
    request: AuthenticatedRequest,
  ) {
    const actorId =
      request.user?.userId ?? null;

    return this.electionsService.create(
      createElectionDto,
      organisationId,
      actorId,
    );
  }

  /**
   * Retrieve a paginated list of Elections.
   */
  @Get()
  @Permissions('election.view')
  @ApiOperation({
    summary: 'List elections',
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
      'Search by election name, type, status or description.',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    description:
      'Allowed fields: name, electionType, electionDate, status, createdAt, updatedAt.',
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
      'Paginated list of elections.',
  })
  async findAll(
    @Param('organisationId')
    organisationId: string,

    @Query()
    paginationDto: ElectionsQueryDto,

    @Req()
    request: AuthenticatedRequest,
  ) {
    const actorId =
      request.user?.userId ?? '';

    return this.electionsService.findAll(
      organisationId,
      paginationDto,
      actorId,
    );
  }

  /**
   * Retrieve one Election by ID.
   */
  @Get(':id')
  @Permissions('election.view')
  @ApiOperation({
    summary: 'Get an election',
  })
  @ApiParam({
    name: 'organisationId',
    description:
      'Organisation providing the authorisation context for the operation.',
  })
  @ApiParam({
    name: 'id',
    description:
      'Election UUID.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Election returned successfully.',
  })
  @ApiResponse({
    status: 404,
    description:
      'Election not found.',
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

    return this.electionsService.findById(
      id,
      organisationId,
      actorId,
    );
  }

  /**
   * Update an existing Election.
   */
  @Patch(':id')
  @Permissions('election.update')
  @ApiOperation({
    summary: 'Update an election',
  })
  @ApiParam({
    name: 'organisationId',
    description:
      'Organisation providing the authorisation context for the operation.',
  })
  @ApiParam({
    name: 'id',
    description:
      'Election UUID.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Election updated successfully.',
  })
  @ApiResponse({
    status: 404,
    description:
      'Election not found.',
  })
  async update(
    @Param('organisationId')
    organisationId: string,

    @Param('id')
    id: string,

    @Body()
    updateElectionDto: UpdateElectionDto,

    @Req()
    request: AuthenticatedRequest,
  ) {
    const actorId =
      request.user?.userId ?? null;

    return this.electionsService.update(
      id,
      updateElectionDto,
      organisationId,
      actorId,
    );
  }
}