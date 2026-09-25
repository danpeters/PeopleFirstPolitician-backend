/**
 * File: src/modules/auth/dto/forgot-password.dto.ts
 *
 * Purpose:
 * Data-transfer object for requesting a password-reset link.
 */

import {
  IsEmail,
  IsNotEmpty,
} from 'class-validator';

export class ForgotPasswordDto {
  /**
   * Email address associated with the user account.
   */
  @IsEmail()
  @IsNotEmpty()
  email: string;
}