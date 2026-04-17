/**
 * File: src/modules/auth/auth.controller.ts
 *
 * Purpose:
 * Authentication controller.
 * Includes a temporary seed-admin endpoint for first production setup.
 */

import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

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

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current logged-in user' })
  async me() {
    return {
      message: 'Protected route working. Add your JWT guard/user extraction here if not already wired.',
    };
  }

  /**
   * TEMPORARY ENDPOINT
   * Use once to seed the first admin user in production.
   * Remove after successful setup.
   */
  @Post('seed-admin')
  @ApiOperation({ summary: 'TEMP: Seed first admin user' })
  async seedAdmin() {
    return this.authService.seedAdmin();
  }
}