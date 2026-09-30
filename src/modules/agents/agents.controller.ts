/**
 * File:
 * C:\Projects\PeopleFirstPolitician\backend\src\modules\agents\agents.controller.ts
 *
 * Purpose:
 * - Provides HTTP endpoints for Agent management.
 * - Uses the authenticated JWT user as the security identity.
 * - Keeps Agent operations organisation-scoped.
 * - Applies fine-grained database-backed permissions.
 * - Delegates organisation-membership enforcement to AgentsService.
 *
 * Security:
 * - All endpoints require JWT authentication.
 * - All endpoints require the appropriate Agent permission.
 * - organisationId comes from the route, never from the DTO.
 * - actorId comes exclusively from request.user.userId.
 * - AgentsService independently verifies ACTIVE
 *   OrganisationMembership before performing the operation.
 * - The controller never trusts a client-supplied actorId.
 */

import {
  Body,
  Controller,
  Delete,
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

import { AgentsService } from './agents.service';

import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { UpdateAgentStatusDto } from './dto/update-agent-status.dto';
import { CreateAgentAssignmentDto } from './dto/create-agent-assignment.dto';
import { UpdateAgentAssignmentStatusDto } from './dto/update-agent-assignment-status.dto';

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

@ApiTags('Agents')
@ApiBearerAuth()
@Controller('agents')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AgentsController {
  constructor(
    private readonly agentsService: AgentsService,
  ) {}

  @Post('organisations/:organisationId')
  @Permissions('agent.create')
  @ApiOperation({
    summary: 'Create an Agent',
    description:
      'Creates an Agent within the specified organisation. The authenticated user must have the agent.create permission and active membership in the organisation.',
  })
  @ApiParam({
    name: 'organisationId',
    description: 'Organisation UUID',
  })
  @ApiResponse({
    status: 201,
    description: 'Agent created successfully.',
  })
  @ApiResponse({
    status: 403,
    description:
      'Authenticated user lacks the required permission or does not have active membership in the organisation.',
  })
  async create(
    @Param(
      'organisationId',
      new ParseUUIDPipe(),
    )
    organisationId: string,

    @Body()
    createAgentDto: CreateAgentDto,

    @Req()
    request: AuthenticatedRequest,
  ) {
    return this.agentsService.create(
      createAgentDto,
      organisationId,
      request.user.userId,
    );
  }

  @Get('organisations/:organisationId')
  @Permissions('agent.view')
  @ApiOperation({
    summary: 'List Agents',
    description:
      'Returns a paginated list of Agents belonging to the specified organisation.',
  })
  @ApiParam({
    name: 'organisationId',
    description: 'Organisation UUID',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of records per page.',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description:
      'Search by Agent name, email, phone or Agent reference.',
  })
  @ApiResponse({
    status: 200,
    description: 'Agents retrieved successfully.',
  })
  async findAll(
    @Param(
      'organisationId',
      new ParseUUIDPipe(),
    )
    organisationId: string,

    @Query()
    paginationDto: PaginationQueryDto,

    @Req()
    request: AuthenticatedRequest,
  ) {
    return this.agentsService.findAll(
      organisationId,
      paginationDto,
      request.user.userId,
    );
  }

  @Get('organisations/:organisationId/:id')
  @Permissions('agent.view')
  @ApiOperation({
    summary: 'Get an Agent',
    description:
      'Returns one Agent belonging to the specified organisation.',
  })
  @ApiParam({
    name: 'organisationId',
    description: 'Organisation UUID',
  })
  @ApiParam({
    name: 'id',
    description: 'Agent UUID',
  })
  @ApiResponse({
    status: 200,
    description: 'Agent retrieved successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Agent not found.',
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
    return this.agentsService.findById(
      id,
      organisationId,
      request.user.userId,
    );
  }

  @Patch('organisations/:organisationId/:id')
  @Permissions('agent.update')
  @ApiOperation({
    summary: 'Update an Agent',
    description:
      'Updates Agent profile information. Status changes use a separate endpoint.',
  })
  @ApiParam({
    name: 'organisationId',
    description: 'Organisation UUID',
  })
  @ApiParam({
    name: 'id',
    description: 'Agent UUID',
  })
  @ApiResponse({
    status: 200,
    description: 'Agent updated successfully.',
  })
  async update(
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
    updateAgentDto: UpdateAgentDto,

    @Req()
    request: AuthenticatedRequest,
  ) {
    return this.agentsService.update(
      id,
      updateAgentDto,
      organisationId,
      request.user.userId,
    );
  }

  @Patch('organisations/:organisationId/:id/status')
  @Permissions('agent.suspend')
  @ApiOperation({
    summary: 'Change Agent status',
    description:
      'Changes the operational status of an Agent.',
  })
  @ApiParam({
    name: 'organisationId',
    description: 'Organisation UUID',
  })
  @ApiParam({
    name: 'id',
    description: 'Agent UUID',
  })
  @ApiResponse({
    status: 200,
    description: 'Agent status changed successfully.',
  })
  async updateStatus(
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
    updateStatusDto: UpdateAgentStatusDto,

    @Req()
    request: AuthenticatedRequest,
  ) {
    return this.agentsService.updateStatus(
      id,
      updateStatusDto,
      organisationId,
      request.user.userId,
    );
  }

  @Delete('organisations/:organisationId/:id')
  @Permissions('agent.remove')
  @ApiOperation({
    summary: 'Delete an Agent',
    description:
      'Soft-deletes an Agent from the organisation.',
  })
  @ApiParam({
    name: 'organisationId',
    description: 'Organisation UUID',
  })
  @ApiParam({
    name: 'id',
    description: 'Agent UUID',
  })
  @ApiResponse({
    status: 200,
    description: 'Agent deleted successfully.',
  })
  async remove(
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
    return this.agentsService.remove(
      id,
      organisationId,
      request.user.userId,
    );
  }

  @Post('organisations/:organisationId/:id/restore')
  @Permissions('agent.update')
  @ApiOperation({
    summary: 'Restore an Agent',
    description:
      'Restores a previously soft-deleted Agent.',
  })
  @ApiParam({
    name: 'organisationId',
    description: 'Organisation UUID',
  })
  @ApiParam({
    name: 'id',
    description: 'Agent UUID',
  })
  @ApiResponse({
    status: 201,
    description: 'Agent restored successfully.',
  })
  async restore(
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
    return this.agentsService.restore(
      id,
      organisationId,
      request.user.userId,
    );
  }

  @Post('organisations/:organisationId/assignments')
  @Permissions('agent_assignment.create')
  @ApiOperation({
    summary: 'Create an Agent Assignment',
    description:
      'Assigns an Agent to a Campaign and Polling Unit within the specified organisation.',
  })
  @ApiParam({
    name: 'organisationId',
    description: 'Organisation UUID',
  })
  @ApiResponse({
    status: 201,
    description: 'Agent assignment created successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid campaign scope or assignment data.',
  })
  @ApiResponse({
    status: 403,
    description:
      'Authenticated user lacks the required permission or active organisation membership.',
  })
  @ApiResponse({
    status: 409,
    description:
      'The Agent is already assigned to the polling unit for the campaign.',
  })
  async createAssignment(
    @Param(
      'organisationId',
      new ParseUUIDPipe(),
    )
    organisationId: string,

    @Body()
    dto: CreateAgentAssignmentDto,

    @Req()
    request: AuthenticatedRequest,
  ) {
    return this.agentsService.createAssignment(
      dto,
      organisationId,
      request.user.userId,
    );
  }

  @Get('organisations/:organisationId/assignments/:id')
  @Permissions('agent_assignment.view')
  @ApiOperation({
    summary: 'Get an Agent Assignment',
    description:
      'Returns one Agent Assignment belonging to the specified organisation.',
  })
  @ApiParam({
    name: 'organisationId',
    description: 'Organisation UUID',
  })
  @ApiParam({
    name: 'id',
    description: 'Agent Assignment UUID',
  })
  @ApiResponse({
    status: 200,
    description: 'Agent assignment retrieved successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Agent assignment not found.',
  })
  async findAssignmentById(
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
    return this.agentsService.findAssignmentById(
      id,
      organisationId,
      request.user.userId,
    );
  }

  @Patch('organisations/:organisationId/assignments/:id/status')
  @Permissions('agent_assignment.update')
  @ApiOperation({
    summary: 'Change Agent Assignment status',
    description:
      'Changes the status of an Agent Assignment.',
  })
  @ApiParam({
    name: 'organisationId',
    description: 'Organisation UUID',
  })
  @ApiParam({
    name: 'id',
    description: 'Agent Assignment UUID',
  })
  @ApiResponse({
    status: 200,
    description: 'Agent assignment status changed successfully.',
  })
  async updateAssignmentStatus(
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
    dto: UpdateAgentAssignmentStatusDto,

    @Req()
    request: AuthenticatedRequest,
  ) {
    return this.agentsService.updateAssignmentStatus(
      id,
      dto,
      organisationId,
      request.user.userId,
    );
  }

  @Delete('organisations/:organisationId/assignments/:id')
  @Permissions('agent_assignment.remove')
  @ApiOperation({
    summary: 'Delete an Agent Assignment',
    description:
      'Soft-deletes an Agent Assignment.',
  })
  @ApiParam({
    name: 'organisationId',
    description: 'Organisation UUID',
  })
  @ApiParam({
    name: 'id',
    description: 'Agent Assignment UUID',
  })
  @ApiResponse({
    status: 200,
    description: 'Agent assignment deleted successfully.',
  })
  async removeAssignment(
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
    return this.agentsService.removeAssignment(
      id,
      organisationId,
      request.user.userId,
    );
  }
}
