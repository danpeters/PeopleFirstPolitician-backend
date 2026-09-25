/**
 * File: src/modules/auth/auth.controller.ts
 *
 * Purpose:
 * Authentication controller for the People First Politician
 * application.
 *
 * Responsibilities:
 * - Public user registration
 * - User login
 * - Access-token refresh
 * - User logout
 * - Password-reset request
 * - Password reset using a temporary token
 * - Retrieval of the currently authenticated user
 * - Change of the currently authenticated user's password
 *
 * Security:
 * - Registration does not require authentication.
 * - Login does not require authentication.
 * - Refresh does not require an access token.
 * - Logout validates the supplied refresh token.
 * - Forgot-password does not require authentication.
 * - Reset-password does not require authentication but requires
 *   a valid, unexpired password-reset token.
 * - Current-user and change-password routes require a valid
 *   JWT access token.
 * - The authenticated user's ID is obtained from the JWT rather
 *   than accepted from the client request body.
 */

import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { AuthService } from './auth.service';

import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  /**
   * Request password-reset instructions.
   *
   * Endpoint:
   * POST /auth/forgot-password
   *
   * Security:
   * - Public endpoint.
   * - Does not require JWT authentication.
   * - Does not reveal whether the email exists.
   */
  @Post('forgot-password')
  @ApiOperation({
    summary: 'Request password-reset instructions',
    description:
      'Sends password-reset instructions when an account is associated with the supplied email address.',
  })
  async forgotPassword(
    @Body()
    forgotPasswordDto: ForgotPasswordDto,
  ) {
    return this.authService.forgotPassword(
      forgotPasswordDto,
    );
  }

  /**
   * Reset a password using a valid temporary token.
   *
   * Endpoint:
   * POST /auth/reset-password
   *
   * Security:
   * - Public endpoint.
   * - Does not require an access token.
   * - Token validity and expiry are verified by AuthService.
   */
  @Post('reset-password')
  @ApiOperation({
    summary: 'Reset password',
    description:
      "Resets a user's password using a valid temporary password-reset token.",
  })
  async resetPassword(
    @Body()
    resetPasswordDto: ResetPasswordDto,
  ) {
    return this.authService.resetPassword(
      resetPasswordDto,
    );
  }

  /**
   * Register a new public user.
   *
   * Endpoint:
   * POST /auth/register
   *
   * Security:
   * - No JWT authentication is required.
   * - The registration DTO does not contain a role field.
   * - The backend always assigns the standard USER role.
   * - Administrative roles cannot be selected during registration.
   */
  @Post('register')
  @ApiOperation({
    summary: 'Register a new user',
    description:
      'Creates a standard user account through public registration. The user cannot select an administrative role.',
  })
  async register(
    @Body() registerDto: RegisterDto,
  ) {
    return this.authService.register(
      registerDto,
    );
  }

  /**
   * Login a user.
   *
   * Endpoint:
   * POST /auth/login
   *
   * Returns:
   * - access token
   * - refresh token
   * - safe user information
   */
  @Post('login')
  @ApiOperation({
    summary: 'Login user and return access token',
  })
  async login(
    @Body() loginDto: LoginDto,
  ) {
    return this.authService.login(
      loginDto,
    );
  }

  /**
   * Refresh the user's access token.
   *
   * Endpoint:
   * POST /auth/refresh
   *
   * Security:
   * - The refresh token is supplied in the request body.
   * - The refresh token is validated by AuthService.
   * - The refresh token is rotated after successful validation.
   *
   * Request body:
   * {
   *   "refreshToken": "..."
   * }
   */
  @Post('refresh')
  @ApiOperation({
    summary: 'Refresh access token',
    description:
      'Generates a new access token using a valid refresh token.',
  })
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
  ) {
    return this.authService.refresh(
      refreshTokenDto.refreshToken,
    );
  }

  /**
   * Logout the current user.
   *
   * Endpoint:
   * POST /auth/logout
   *
   * Security:
   * - The supplied refresh token must be valid.
   * - The stored refresh-token hash is removed after logout.
   * - The refresh token is supplied in the request body.
   */
  @Post('logout')
  @ApiOperation({
    summary: 'Logout user',
    description:
      'Logs out the user and invalidates the supplied refresh token.',
  })
  async logout(
    @Body() refreshTokenDto: RefreshTokenDto,
  ) {
    return this.authService.logout(
      refreshTokenDto.refreshToken,
    );
  }

  /**
   * Get the currently authenticated user.
   *
   * Endpoint:
   * GET /auth/me
   *
   * Security:
   * - JwtAuthGuard verifies the bearer access token.
   * - The JWT strategy places the authenticated user's ID
   *   in req.user.userId.
   * - The user ID is obtained from the authenticated request
   *   rather than from client-supplied input.
   */
  @Get('me')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get current logged-in user',
  })
  async me(
    @Req()
    req: {
      user: {
        userId: string;
      };
    },
  ) {
    return this.authService.me(
      req.user.userId,
    );
  }

  /**
   * Change the password of the currently authenticated user.
   *
   * Endpoint:
   * PATCH /auth/change-password
   *
   * Security:
   * - Requires a valid JWT access token.
   * - Uses the authenticated user's ID from req.user.
   * - Does not accept a user ID from the client.
   * - Current password must be verified before the new password
   *   is stored.
   * - Existing refresh credentials are invalidated after the
   *   password is changed.
   */
  @Patch('change-password')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Change current user password',
  })
  async changePassword(
    @Req()
    req: {
      user: {
        userId: string;
      };
    },

    @Body()
    changePasswordDto: ChangePasswordDto,
  ) {
    /**
     * Ensure that the new password and its confirmation match.
     */
    if (
      changePasswordDto.newPassword !==
      changePasswordDto.confirmPassword
    ) {
      throw new BadRequestException(
        'New password and confirmation do not match',
      );
    }

    /**
     * Delegate password changing to AuthService.
     *
     * The authenticated user's ID is taken from the JWT.
     */
    return this.authService.changePassword(
      req.user.userId,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
      req.user.userId,
    );
  }
}