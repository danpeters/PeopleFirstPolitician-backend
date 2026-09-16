// File: C:\Projects\PeopleFirstPolitician\backend\src\modules\auth\dto\change-password.dto.ts

import {
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

/**
 * Change Password DTO
 *
 * Purpose:
 * - Validates the user's current password.
 * - Validates the new password.
 * - Requires a strong new password.
 *
 * Security:
 * - Passwords are accepted only as request data.
 * - Passwords are never logged.
 */
export class ChangePasswordDto {
  @IsString()
  @MinLength(1)
  currentPassword: string;

  @IsString()
  @MinLength(12, {
    message: 'New password must be at least 12 characters long',
  })
  @Matches(/[A-Z]/, {
    message: 'New password must contain at least one uppercase letter',
  })
  @Matches(/[a-z]/, {
    message: 'New password must contain at least one lowercase letter',
  })
  @Matches(/[0-9]/, {
    message: 'New password must contain at least one number',
  })
  @Matches(/[^A-Za-z0-9]/, {
    message: 'New password must contain at least one special character',
  })
  newPassword: string;

  @IsString()
  @MinLength(1)
  confirmPassword: string;
}