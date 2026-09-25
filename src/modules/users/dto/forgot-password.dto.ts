/**
 * ============================================================
 * File:
 * C:\Projects\PeopleFirstPolitician\backend\src\modules\auth\dto\forgot-password.dto.ts
 *
 * Purpose:
 * Validates a password-recovery request.
 *
 * Security:
 * - Only an email address is accepted.
 * - No user ID or role information is accepted.
 * ============================================================
 */

import {
  IsEmail,
  IsNotEmpty,
  IsString,
} from 'class-validator';

export class ForgotPasswordDto {
  /**
   * Email address associated with the account.
   */
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email!: string;
}