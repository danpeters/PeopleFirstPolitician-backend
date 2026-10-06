/**
 * File:
 * src/modules/candidacies/candidacies.controller.ts
 *
 * Purpose:
 * - Exposes organisation-scoped REST APIs for Candidacy management.
 * - Enforces JWT authentication.
 * - Enforces election permissions through PermissionsGuard.
 * - Delegates business validation and organisation/party ownership
 *   checks to CandidaciesService.
 *
 * Security:
 * - organisationId is taken from the route and is never accepted
 *   from the request body.
 * - The authenticated user's identity and platform role are taken
 *   from request.user.
 * - Permission checks are handled by PermissionsGuard.
 * - Organisation membership and political-party ownership checks
 *   are enforced by CandidaciesService.
 * - Platform super_admin users may administer candidacies without
 *   organisation membership.
 *
 * Endpoints:
 * - POST  /organisations/:organisationId/candidacies
 * - GET   /organisations/:organisationId/candidacies
 * - GET   /organisations/:organisationId/candidacies/:id
 * - PATCH /organisations/:organisationId/candidacies/:id
 */

import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
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

import { CandidaciesService } from './candidacies.service';
import { CreateCandidacyDto } from './dto/create-candidacy.dto';
import { UpdateCandidacyDto } from './dto/update-candidacy.dto';

import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

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

@ApiTags('Candidacies')
@ApiBearerAuth()
@Controller('organisations/:organisationId/candidacies')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CandidaciesController {
  constructor(
    private readonly candidaciesService: CandidaciesService,
  ) {}

  /**
   * Create a new candidacy within an organisation context.
   */
  @Post()
  @Permissions('election.create')
  @ApiOperation({
    summary: 'Create a candidacy',
    description:
      'Creates a candidacy for a candidate, election race and political party. ' +
      'The selected political party must be associated with the organisation.',
  })
  @ApiParam({
    name: 'organisationId',
    description: 'Organisation UUID',
    format: 'uuid',
  })
  @ApiResponse({
    status: 201,
    description: 'Candidacy created successfully.',
  })
  @ApiResponse({
    status: 403,
    description:
      'Authenticated user lacks the required permission or organisation access.',
  })
  @ApiResponse({
    status: 409,
    description:
      'The candidacy conflicts with an existing candidate/race or party/race candidacy.',
  })
  async create(
    @Param('organisationId', new ParseUUIDPipe())
    organisationId: string,

    @Body()
    dto: CreateCandidacyDto,

    @Req()
    request: AuthenticatedRequest,
  ) {
    return this.candidaciesService.create(
      organisationId,
      dto,
      request.user.userId,
      request.user.role,
    );
  }

  /**
   * List candidacies belonging to the organisation context.
   */
  @Get()
  @Permissions('election.view')
  @ApiOperation({
    summary: 'List candidacies',
    description:
      'Returns a paginated list of candidacies available within the organisation context.',
  })
  @ApiParam({
    name: 'organisationId',
    description: 'Organisation UUID',
    format: 'uuid',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    example: 1,
    description: 'Page number starting from 1.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 10,
    description: 'Number of records per page, maximum 100.',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    example: 'candidate',
    description:
      'Searches candidate name, political party name/abbreviation and nomination reference.',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    example: 'createdAt',
    description:
      'Allowed sort fields are controlled by the service layer.',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    example: 'DESC',
    enum: ['ASC', 'DESC'],
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of candidacies.',
  })
  async findAll(
    @Param('organisationId', new ParseUUIDPipe())
    organisationId: string,

    @Query()
    query: PaginationQueryDto,

    @Req()
    request: AuthenticatedRequest,
  ) {
    return this.candidaciesService.findAll(
      organisationId,
      query,
      request.user.userId,
      request.user.role,
    );
  }

  /**
   * Retrieve one candidacy by ID.
   */
  @Get(':id')
  @Permissions('election.view')
  @ApiOperation({
    summary: 'Get a candidacy',
    description:
      'Returns a single candidacy after validating organisation and political-party access.',
  })
  @ApiParam({
    name: 'organisationId',
    description: 'Organisation UUID',
    format: 'uuid',
  })
  @ApiParam({
    name: 'id',
    description: 'Candidacy UUID',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Candidacy retrieved successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Candidacy not found.',
  })
  async findById(
    @Param('organisationId', new ParseUUIDPipe())
    organisationId: string,

    @Param('id', new ParseUUIDPipe())
    id: string,

    @Req()
    request: AuthenticatedRequest,
  ) {
    return this.candidaciesService.findById(
      id,
      organisationId,
      request.user.userId,
      request.user.role,
    );
  }

  /**
   * Update an existing candidacy.
   */
  @Patch(':id')
  @Permissions('election.update')
  @ApiOperation({
    summary: 'Update a candidacy',
    description:
      'Updates an existing candidacy while revalidating candidate, race, political-party and party-section relationships.',
  })
  @ApiParam({
    name: 'organisationId',
    description: 'Organisation UUID',
    format: 'uuid',
  })
  @ApiParam({
    name: 'id',
    description: 'Candidacy UUID',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Candidacy updated successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Candidacy not found.',
  })
  @ApiResponse({
    status: 409,
    description:
      'The update conflicts with an existing candidate/race or party/race candidacy.',
  })
  async update(
    @Param('organisationId', new ParseUUIDPipe())
    organisationId: string,

    @Param('id', new ParseUUIDPipe())
    id: string,

    @Body()
    dto: UpdateCandidacyDto,

    @Req()
    request: AuthenticatedRequest,
  ) {
    return this.candidaciesService.update(
      id,
      organisationId,
      dto,
      request.user.userId,
      request.user.role,
    );
  }
}