/**
 * File: src/modules/audit/audit.controller.ts
 *
 * Purpose:
 * Exposes audit log read endpoints for admin monitoring.
 *
 * Security model:
 * - JwtAuthGuard ensures the requester is authenticated
 * - RolesGuard ensures the requester has the required role
 *
 * Access policy:
 * - Only super_admin can view audit logs
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

import { AuditService } from './audit.service';
import { AuditQueryDto } from './dto/audit-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { buildSuccessResponse } from '../../common/utils/api-response.util';

@ApiTags('Audit')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  /**
   * GET /api/v1/audit
   * Returns audit logs with pagination and filtering.
   * Access: super_admin only
   */
  @ApiOperation({ summary: 'Get audit logs (Admin only)' })
  @ApiResponse({ status: 200, description: 'Audit logs retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized (No token)' })
  @ApiResponse({ status: 403, description: 'Forbidden (Wrong role)' })
  @Roles('super_admin')
  @Get()
  async findAll(@Query() query: AuditQueryDto) {
    const logs = await this.auditService.findAll(query);
    return buildSuccessResponse('Audit logs retrieved successfully', logs);
  }
}