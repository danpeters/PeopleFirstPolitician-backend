/**
 * File: C:\Projects\PeopleFirstPolitician\backend\src\modules\users\dto\update-user.dto.ts
 *
 * Purpose:
 * - Defines the validated payload for administrative user updates.
 * - Supports basic profile changes.
 * - Supports authorised role changes.
 *
 * Security notes:
 * - This DTO is used by the administrative UsersController.
 * - The UsersController protects the endpoint with JwtAuthGuard
 *   and RolesGuard.
 * - Only super_admin users can call the administrative update endpoint.
 * - Password changes are handled through a separate controlled flow.
 * - Role changes are validated by UsersService against an existing role.
 */

import {
  IsEmail,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateUserDto {
  /**
   * User's full name.
   */
  @IsOptional()
  @IsString()
  fullName?: string;

  /**
   * User's email address.
   */
  @IsOptional()
  @IsEmail()
  email?: string;

  /**
   * User's phone number.
   */
  @IsOptional()
  @IsString()
  phone?: string;

  /**
   * Administrative role assignment.
   *
   * Examples:
   * - super_admin
   * - campaign_manager
   * - analyst
   * - user
   *
   * The value is subsequently checked by UsersService
   * against the roles stored in the database.
   */
  @IsOptional()
  @IsString()
  roleName?: string;
}