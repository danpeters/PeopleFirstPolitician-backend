/**
 * ============================================================
 * File:
 * C:\Projects\PeopleFirstPolitician\backend\src\modules\auth\dto\reset-password.dto.ts
 *
 * Purpose:
 * Validates a password-reset request.
 *
 * Security:
 * - Requires the temporary reset token.
 * - Requires a strong new password.
 * - Requires password confirmation.
 * ============================================================
 */

import {
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class ResetPasswordDto {
  /**
   * Temporary password-reset token received by email.
   */
  @IsString()
  @IsNotEmpty()
  token!: string;

  /**
   * New password.
   */
  @IsString()
  @IsNotEmpty()
  @MinLength(12)
  @Matches(/[A-Z]/, {
    message:
      'New password must contain at least one uppercase letter',
  })
  @Matches(/[a-z]/, {
    message:
      'New password must contain at least one lowercase letter',
  })
  @Matches(/[0-9]/, {
    message:
      'New password must contain at least one number',
  })
  @Matches(/[^A-Za-z0-9]/, {
    message:
      'New password must contain at least one special character',
  })
  newPassword!: string;

  /**
   * Password confirmation.
   *
   * Equality is checked in AuthController/AuthService.
   */
  @IsString()
  @IsNotEmpty()
  confirmPassword!: string;
}