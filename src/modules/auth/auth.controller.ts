/**
 * File: src/modules/auth/auth.controller.ts
 *
 * Purpose:
 * Authentication controller.
 * Includes login, refresh, logout, current-user route,
 * and change-password functionality.
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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login user and return access token' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(@Body() body: { refreshToken: string }) {
    return this.authService.refresh(body.refreshToken);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout user' })
  async logout(@Body() body: { refreshToken: string }) {
    return this.authService.logout(body.refreshToken);
  }

  /**
   * Get the currently authenticated user.
   *
   * Security:
   * - JwtAuthGuard verifies the bearer access token.
   * - The JWT strategy places the authenticated user's ID in req.user.userId.
   * - The user ID is passed to AuthService.me().
   */
  @Get('me')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current logged-in user' })
  async me(@Req() req: { user: { userId: string } }) {
    return this.authService.me(req.user.userId);
  }

  /**
   * Change the password of the currently authenticated user.
   *
   * Security:
   * - Requires a valid JWT access token.
   * - Uses the authenticated user's ID from req.user.
   * - Does not accept a user ID from the client.
   * - Current password must be verified before the new password is stored.
   */
  @Patch('change-password')
  @ApiBearerAuth('bearer')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Change current user password' })
  async changePassword(
    @Req() req: { user: { userId: string } },
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    if (
      changePasswordDto.newPassword !==
      changePasswordDto.confirmPassword
    ) {
      throw new BadRequestException(
        'New password and confirmation do not match',
      );
    }

    return this.authService.changePassword(
      req.user.userId,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
      req.user.userId,
    );
  }
}