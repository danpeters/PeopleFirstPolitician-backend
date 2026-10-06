/**
 * File: src/modules/auth/dto/register.dto.ts
 *
 * Purpose:
 * Data Transfer Object (DTO) for public user registration.
 *
 * Security:
 * - Users cannot select their own role.
 * - Password confirmation is required.
 * - Input validation is handled using class-validator.
 *
 * Registration fields:
 * - fullName
 * - email
 * - phone
 * - password
 * - confirmPassword
 */

import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  /**
   * Full name of the person registering.
   */
  @IsString()
  @IsNotEmpty()
  fullName: string;

  /**
   * Email address used for authentication.
   */
  @IsEmail()
  @IsNotEmpty()
  email: string;

  /**
   * Phone number of the person registering.
   *
   * The validation pattern allows common international
   * and Nigerian telephone number formats.
   */
  @IsNotEmpty({
    message: 'Phone number is required',
  })
  @Matches(/^\d{11}$/, {
    message: 'Phone number must contain exactly 11 digits',
  })
  phone: string;

  /**
   * Password for the new account.
   *
   * Requires:
   * - minimum 8 characters
   * - at least one uppercase letter
   * - at least one lowercase letter
   * - at least one number
   */
  @IsString()
  @MinLength(8)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
    {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    },
  )
  password: string;

  /**
   * Password confirmation.
   *
   * The actual comparison with password is performed
   * in AuthService.register().
   */
  @IsString()
  @IsNotEmpty()
  confirmPassword: string;
}