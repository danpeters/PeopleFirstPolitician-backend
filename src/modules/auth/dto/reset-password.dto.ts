/**
 * File: src/modules/auth/dto/reset-password.dto.ts
 *
 * Purpose:
 * Data-transfer object for resetting a user's password
 * using a temporary password-reset token.
 */

import {
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';

export class ResetPasswordDto {
  /**
   * Temporary password-reset token.
   */
  @IsString()
  @IsNotEmpty()
  token: string;

  /**
   * New password.
   */
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  newPassword: string;

  /**
   * Confirmation of the new password.
   */
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  confirmPassword: string;
}