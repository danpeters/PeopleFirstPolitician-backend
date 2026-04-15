/**
 * File: src/modules/roles/roles.controller.ts
 *
 * Purpose:
 * Handles HTTP requests related to roles.
 *
 * Security model:
 * - JwtAuthGuard ensures the requester is authenticated
 * - RolesGuard ensures the requester has the required role
 *
 * Access policy:
 * - Only super_admin can view roles
 *
 * Response model:
 * - Uses standard success response format
 */

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { buildSuccessResponse } from '../../common/utils/api-response.util';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@ApiTags('Roles')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  /**
   * GET /api/v1/roles
   * Returns roles with pagination, search, and sorting.
   * Access: super_admin only
   */
  @ApiOperation({ summary: 'Get all roles (Admin only)' })
  @ApiResponse({ status: 200, description: 'Roles retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized (No token)' })
  @ApiResponse({ status: 403, description: 'Forbidden (Wrong role)' })
  @Roles('super_admin')
  @Get()
  async findAll(@Query() query: PaginationQueryDto) {
    const roles = await this.rolesService.findAll(query);
    return buildSuccessResponse('Roles retrieved successfully', roles);
  }
}