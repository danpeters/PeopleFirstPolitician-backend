/**
 * File: C:\Projects\PeopleFirstPolitician\backend\src\modules\users\dto\create-user.dto.ts
 *
 * Purpose:
 * - Defines the allowed payload for creating a new internal user.
 *
 * Security notes:
 * - Validation helps block malformed or malicious input.
 * - Password length is enforced at DTO level, but hashing must still happen in the service.
 * - Role is provided as a role name for now, then resolved securely in the service.
 */

import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { RoleEnum } from '../../../common/enums/role.enum';

export class CreateUserDto {
  /**
   * Full display name of the user.
   */
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  /**
   * Unique email address.
   */
  @IsEmail()
  email!: string;

  /**
   * Optional phone number.
   */
  @IsOptional()
  @IsString()
  phone?: string;

  /**
   * Plain password from the client.
   *
   * Security note:
   * - This must NEVER be stored directly.
   * - It must be hashed inside the service before saving.
   */
  @IsString()
  @MinLength(8)
  password!: string;

  /**
   * Role name to assign.
   */
  @IsEnum(RoleEnum)
  roleName!: RoleEnum;
}