/**
 * File: src/modules/users/users.controller.ts
 *
 * Purpose:
 * Handles HTTP requests related to user management.
 *
 * Security model:
 * - JwtAuthGuard ensures the requester is authenticated
 * - RolesGuard ensures the requester has the required role
 *
 * Access policy:
 * - Only super_admin can manage users
 *
 * Response model:
 * - Uses standard success response format
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { buildSuccessResponse } from '../../common/utils/api-response.util';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * GET /api/v1/users
   * Returns users with pagination, search, and sorting.
   * Access: super_admin only
   */
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized (No token)' })
  @ApiResponse({ status: 403, description: 'Forbidden (Wrong role)' })
  @Roles('super_admin')
  @Get()
  async findAll(@Query() query: PaginationQueryDto) {
    const users = await this.usersService.findAll(query);
    return buildSuccessResponse('Users retrieved successfully', users);
  }

  /**
   * GET /api/v1/users/:id
   * Returns one user by ID.
   * Access: super_admin only
   */
  @ApiOperation({ summary: 'Get one user by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized (No token)' })
  @ApiResponse({ status: 403, description: 'Forbidden (Wrong role)' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Roles('super_admin')
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    return buildSuccessResponse('User retrieved successfully', user);
  }

  /**
   * POST /api/v1/users
   * Creates a new user.
   * Access: super_admin only
   */
  @ApiOperation({ summary: 'Create a new user (Admin only)' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized (No token)' })
  @ApiResponse({ status: 403, description: 'Forbidden (Wrong role)' })
  @Roles('super_admin')
  @Post()
  async create(@Body() createUserDto: CreateUserDto, @Request() req: any) {
    const createdUser = await this.usersService.create(
      createUserDto,
      req.user?.id ?? null,
    );
    return buildSuccessResponse('User created successfully', createdUser);
  }

  /**
   * PATCH /api/v1/users/:id
   * Updates a user's editable details.
   * Access: super_admin only
   */
  @ApiOperation({ summary: 'Update user details (Admin only)' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized (No token)' })
  @ApiResponse({ status: 403, description: 'Forbidden (Wrong role)' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Roles('super_admin')
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req: any,
  ) {
    const updatedUser = await this.usersService.update(
      id,
      updateUserDto,
      req.user?.id ?? null,
    );
    return buildSuccessResponse('User updated successfully', updatedUser);
  }

  /**
   * PATCH /api/v1/users/:id/status
   * Updates user status.
   * Access: super_admin only
   */
  @ApiOperation({ summary: 'Update user status (Admin only)' })
  @ApiResponse({ status: 200, description: 'User status updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized (No token)' })
  @ApiResponse({ status: 403, description: 'Forbidden (Wrong role)' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Roles('super_admin')
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() updateUserStatusDto: UpdateUserStatusDto,
    @Request() req: any,
  ) {
    const updatedUserStatus = await this.usersService.updateStatus(
      id,
      updateUserStatusDto,
      req.user?.id ?? null,
    );
    return buildSuccessResponse(
      'User status updated successfully',
      updatedUserStatus,
    );
  }

  /**
   * DELETE /api/v1/users/:id
   * Soft-deletes a user.
   * Access: super_admin only
   */
  @ApiOperation({ summary: 'Soft delete a user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized (No token)' })
  @ApiResponse({ status: 403, description: 'Forbidden (Wrong role)' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Roles('super_admin')
  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    const result = await this.usersService.remove(id, req.user?.id ?? null);
    return buildSuccessResponse('User deleted successfully', result);
  }

  /**
   * POST /api/v1/users/:id/restore
   * Restores a soft-deleted user.
   * Access: super_admin only
   */
  @ApiOperation({ summary: 'Restore a deleted user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User restored successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized (No token)' })
  @ApiResponse({ status: 403, description: 'Forbidden (Wrong role)' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Roles('super_admin')
  @Post(':id/restore')
  async restore(@Param('id') id: string, @Request() req: any) {
    const restoredUser = await this.usersService.restore(
      id,
      req.user?.id ?? null,
    );
    return buildSuccessResponse('User restored successfully', restoredUser);
  }
}