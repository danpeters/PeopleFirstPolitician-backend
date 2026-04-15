/**
 * File: C:\Projects\PeopleFirstPolitician\backend\src\modules\users\dto\update-user.dto.ts
 *
 * Purpose:
 * - Defines the allowed payload for updating basic user profile fields.
 *
 * Security notes:
 * - Only non-sensitive profile fields are included here.
 * - Password updates should be handled in a separate, controlled flow later.
 */

import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}