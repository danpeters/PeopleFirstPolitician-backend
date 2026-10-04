/**
 * File:
 * C:\Projects\PeopleFirstPolitician\backend\src\modules\elections\election-races.controller.ts
 *
 * Purpose:
 * Provides authenticated API endpoints for Election Race management.
 *
 * Security:
 * - All endpoints require an authenticated JWT.
 * - Database-backed election permissions are enforced.
 * - organisationId is taken from the route.
 * - Actor identity is taken from the authenticated user.
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

import { ElectionRacesService } from './election-races.service';

import { CreateElectionRaceDto } from './dto/create-election-race.dto';
import { UpdateElectionRaceDto } from './dto/update-election-race.dto';

import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

interface AuthenticatedRequest extends Request {
  user?: {
    userId?: string;
  };
}

@ApiTags('Election Races')
@ApiBearerAuth()
@Controller(
  'organisations/:organisationId/election-races',
)
@UseGuards(
  JwtAuthGuard,
  PermissionsGuard,
)
export class ElectionRacesController {
  constructor(
    private readonly electionRacesService:
      ElectionRacesService,
  ) {}

  /**
   * Create a new Election Race.
   */
  @Post()
  @Permissions('election.manage_races')
  @ApiOperation({
    summary: 'Create an election race',
  })
  @ApiParam({
    name: 'organisationId',
    description:
      'Organisation providing the authorisation context for the operation.',
  })
  @ApiResponse({
    status: 201,
    description:
      'Election Race created successfully.',
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
    createElectionRaceDto:
      CreateElectionRaceDto,

    @Req()
    request: AuthenticatedRequest,
  ) {
    const actorId =
      request.user?.userId ?? null;

    return this.electionRacesService.create(
      createElectionRaceDto,
      organisationId,
      actorId,
    );
  }

  /**
   * Retrieve a paginated list of Election Races.
   */
  @Get()
  @Permissions('election.view')
  @ApiOperation({
    summary: 'List election races',
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
      'Search by race name, code, status or description.',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    description:
      'Allowed fields: name, code, status, createdAt, updatedAt.',
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
      'Paginated list of Election Races.',
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

    return this.electionRacesService.findAll(
      organisationId,
      paginationDto,
      actorId,
    );
  }

  /**
   * Retrieve one Election Race by ID.
   */
  @Get(':id')
  @Permissions('election.view')
  @ApiOperation({
    summary: 'Get an election race',
  })
  @ApiParam({
    name: 'organisationId',
    description:
      'Organisation providing the authorisation context for the operation.',
  })
  @ApiParam({
    name: 'id',
    description:
      'Election Race UUID.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Election Race returned successfully.',
  })
  @ApiResponse({
    status: 404,
    description:
      'Election Race not found.',
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

    return this.electionRacesService.findById(
      id,
      organisationId,
      actorId,
    );
  }

  /**
   * Update an existing Election Race.
   */
  @Patch(':id')
  @Permissions('election.manage_races')
  @ApiOperation({
    summary: 'Update an election race',
  })
  @ApiParam({
    name: 'organisationId',
    description:
      'Organisation providing the authorisation context for the operation.',
  })
  @ApiParam({
    name: 'id',
    description:
      'Election Race UUID.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Election Race updated successfully.',
  })
  @ApiResponse({
    status: 404,
    description:
      'Election Race not found.',
  })
  async update(
    @Param('organisationId')
    organisationId: string,

    @Param('id')
    id: string,

    @Body()
    updateElectionRaceDto:
      UpdateElectionRaceDto,

    @Req()
    request: AuthenticatedRequest,
  ) {
    const actorId =
      request.user?.userId ?? null;

    return this.electionRacesService.update(
      id,
      updateElectionRaceDto,
      organisationId,
      actorId,
    );
  }
}