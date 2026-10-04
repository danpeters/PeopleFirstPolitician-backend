/**
 * File:
 * C:\Projects\PeopleFirstPolitician\backend\src\modules\elections\electoral-scopes.controller.ts
 *
 * Purpose:
 * - Exposes the Electoral Scope management API.
 * - Provides endpoints for creating, viewing, listing and updating
 *   Electoral Scopes.
 *
 * Security:
 * - All endpoints require JWT authentication.
 * - All endpoints require database-backed permission checks.
 * - Organisation context is supplied through :organisationId.
 * - The PermissionsGuard independently verifies the authenticated
 *   user's active organisation membership and role.
 *
 * Permissions:
 * - election.view
 *     Used for listing and viewing Electoral Scopes.
 *
 * - election.manage_scopes
 *     Used for creating and updating Electoral Scopes.
 *
 * Important:
 * - The controller does not accept organisationId in request DTOs.
 * - The organisation ID comes from the route.
 * - Business validation is delegated to ElectoralScopesService.
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

import { ElectoralScopesService } from './electoral-scopes.service';

import { CreateElectoralScopeDto } from './dto/create-electoral-scope.dto';
import { UpdateElectoralScopeDto } from './dto/update-electoral-scope.dto';

import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

interface AuthenticatedRequest extends Request {
  user?: {
    userId?: string;
  };
}

@ApiTags('Electoral Scopes')
@ApiBearerAuth()
@Controller('organisations/:organisationId/electoral-scopes')
@UseGuards(
  JwtAuthGuard,
  PermissionsGuard,
)
export class ElectoralScopesController {
  constructor(
    private readonly electoralScopesService:
      ElectoralScopesService,
  ) {}

  /**
   * Create an Electoral Scope.
   */
  @Post()
  @Permissions('election.manage_scopes')
  @ApiOperation({
    summary: 'Create an Electoral Scope',
    description:
      'Creates a geographical scope associated with an electoral contest.',
  })
  @ApiParam({
    name: 'organisationId',
    description:
      'Organisation providing the authorisation context for the operation.',
  })
  @ApiResponse({
    status: 201,
    description:
      'Electoral Scope created successfully.',
  })
  @ApiResponse({
    status: 400,
    description:
      'Invalid Electoral Scope or geographical relationship.',
  })
  @ApiResponse({
    status: 403,
    description:
      'Authenticated user does not have the required permission or active organisation membership.',
  })
  @ApiResponse({
    status: 409,
    description:
      'An equivalent Electoral Scope already exists.',
  })
  async create(
    @Param('organisationId')
    organisationId: string,

    @Body()
    createElectoralScopeDto: CreateElectoralScopeDto,

    @Req()
    request: AuthenticatedRequest,
  ) {
    const actorId =
      request.user?.userId ?? null;

    if (!actorId) {
      throw new Error(
        'Authenticated user ID is required.',
      );
    }

    return this.electoralScopesService.create(
      organisationId,
      actorId,
      createElectoralScopeDto,
    );
  }

  /**
   * List Electoral Scopes.
   */
  @Get()
  @Permissions('election.view')
  @ApiOperation({
    summary: 'List Electoral Scopes',
    description:
      'Returns paginated Electoral Scopes with optional search.',
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
      'Search by scope name, code or scope type.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Paginated list of Electoral Scopes.',
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

    return this.electoralScopesService.findAll(
        organisationId,
        paginationDto,
        actorId,
    );
  }

  /**
   * Get one Electoral Scope by ID.
   */
  @Get(':id')
  @Permissions('election.view')
  @ApiOperation({
    summary: 'Get an Electoral Scope',
    description:
      'Returns one Electoral Scope together with its State, LGA and Ward relationships.',
  })
  @ApiParam({
    name: 'organisationId',
    description:
      'Organisation providing the authorisation context for the operation.',
  })
  @ApiParam({
    name: 'id',
    description:
      'Electoral Scope UUID.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Electoral Scope returned successfully.',
  })
  @ApiResponse({
    status: 404,
    description:
      'Electoral Scope not found.',
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

    return this.electoralScopesService.findById(
        id,
        organisationId,
        actorId,
    );
  }

  /**
   * Update an Electoral Scope.
   */
  @Patch(':id')
  @Permissions('election.manage_scopes')
  @ApiOperation({
    summary: 'Update an Electoral Scope',
    description:
      'Updates an Electoral Scope and validates the complete resulting geographical relationship.',
  })
  @ApiParam({
    name: 'organisationId',
    description:
      'Organisation providing the authorisation context for the operation.',
  })
  @ApiParam({
    name: 'id',
    description:
      'Electoral Scope UUID.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Electoral Scope updated successfully.',
  })
  @ApiResponse({
    status: 400,
    description:
      'Invalid Electoral Scope or geographical relationship.',
  })
  @ApiResponse({
    status: 403,
    description:
      'Authenticated user does not have the required permission or active organisation membership.',
  })
  @ApiResponse({
    status: 404,
    description:
      'Electoral Scope not found.',
  })
  @ApiResponse({
    status: 409,
    description:
      'An equivalent Electoral Scope already exists.',
  })
  async update(
    @Param('organisationId')
    organisationId: string,

    @Param('id')
    id: string,

    @Body()
    updateElectoralScopeDto: UpdateElectoralScopeDto,

    @Req()
    request: AuthenticatedRequest,
  ) {
    const actorId =
      request.user?.userId ?? null;

    if (!actorId) {
      throw new Error(
        'Authenticated user ID is required.',
      );
    }

    return this.electoralScopesService.update(
        id,
        updateElectoralScopeDto,
        organisationId,
        actorId,
    );
  }
}