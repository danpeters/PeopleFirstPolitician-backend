/**
 * File: src/modules/users/users.controller.ts
 *
 * Purpose:
 * Handles HTTP requests related to user management.
 *
 * Security:
 * - JwtAuthGuard requires authentication.
 * - RolesGuard enforces role-based access.
 * - Only super_admin can manage users.
 *
 * Soft-delete policy:
 * - Deleted users are excluded by default.
 * - includeDeleted=true explicitly includes them.
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
import { UsersQueryDto } from './dto/users-query.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

import { buildSuccessResponse } from '../../common/utils/api-response.util';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * GET /api/v1/users
   *
   * The includeDeleted parameter is part of UsersQueryDto.
   *
   * This is required because the application's validation rejects
   * unknown query parameters. Previously includeDeleted was supplied
   * separately while @Query() used PaginationQueryDto, causing:
   *
   * GET /users?...&includeDeleted=true
   *
   * to return HTTP 400 Bad Request.
   */
  @ApiOperation({
    summary: 'Get all users (Admin only)',
    description:
      'Returns users with pagination, search, and sorting. Soft-deleted users are excluded by default. Use includeDeleted=true to include them.',
  })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid query parameters' })
  @ApiResponse({ status: 401, description: 'Unauthorized (No token)' })
  @ApiResponse({ status: 403, description: 'Forbidden (Wrong role)' })
  @Roles('super_admin')
  @Get()
  async findAll(@Query() query: UsersQueryDto) {
    /**
     * Convert the validated query-string value into a boolean.
     */
    const showDeleted = query.includeDeleted === 'true';

    /**
     * Remove the controller-specific flag before passing the
     * remaining pagination/search/sorting fields to UsersService.
     */
    const {
      includeDeleted: _includeDeleted,
      ...paginationQuery
    } = query;

    const users = await this.usersService.findAll(
      paginationQuery,
      showDeleted,
    );

    return buildSuccessResponse(
      'Users retrieved successfully',
      users,
    );
  }

  /**
   * GET /api/v1/users/:id
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
      req.user?.userId ?? null,
    );

    return buildSuccessResponse(
      'User created successfully',
      createdUser,
    );
  }

  /**
   * PATCH /api/v1/users/:id
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
      req.user?.userId ?? null,
    );

    return buildSuccessResponse(
      'User updated successfully',
      updatedUser,
    );
  }

  /**
   * PATCH /api/v1/users/:id/status
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
      req.user?.userId ?? null,
    );

    return buildSuccessResponse(
      'User status updated successfully',
      updatedUserStatus,
    );
  }

  /**
   * DELETE /api/v1/users/:id
   *
   * Performs a TypeORM soft delete.
   */
  @ApiOperation({ summary: 'Soft delete a user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized (No token)' })
  @ApiResponse({ status: 403, description: 'Forbidden (Wrong role)' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Roles('super_admin')
  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    const result = await this.usersService.remove(
      id,
      req.user?.userId ?? null,
    );

    return buildSuccessResponse(
      'User deleted successfully',
      result,
    );
  }

  /**
   * POST /api/v1/users/:id/restore
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
      req.user?.userId ?? null,
    );

    return buildSuccessResponse(
      'User restored successfully',
      restoredUser,
    );
  }
}
