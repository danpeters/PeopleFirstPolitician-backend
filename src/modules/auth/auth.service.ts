/**
 * File: src/modules/auth/auth.service.ts
 *
 * Purpose:
 * Handles the authentication lifecycle:
 * - login
 * - access token generation
 * - refresh token generation
 * - refresh token rotation
 * - logout
 *
 * Security:
 * - passwords are verified with bcrypt
 * - refresh tokens are hashed before storage
 * - access and refresh tokens use separate secrets
 */

import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import type { SignOptions } from 'jsonwebtoken';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Login user with email and password.
   *
   * Steps:
   * 1. Find user by email
   * 2. Verify password
   * 3. Reject inactive users
   * 4. Generate access + refresh tokens
   * 5. Hash and store refresh token
   * 6. Return tokens and safe user payload
   */
  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== 'active') {
      throw new ForbiddenException('User account is inactive');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role.name);

    const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
    await this.usersService.updateRefreshTokenHash(user.id, refreshTokenHash);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role.name,
        status: user.status,
      },
    };
  }

  /**
   * Generate a new access token and refresh token pair.
   */
  async generateTokens(userId: string, email: string, role: string) {
    const payload: JwtPayload = {
      sub: userId,
      email,
      role,
    };

    const jwtSecret = this.configService.get<string>('auth.jwtSecret');
    
    const jwtExpiresIn =
      (this.configService.get<string>('auth.jwtExpiresIn') ?? '15m') as SignOptions['expiresIn'];

    const refreshSecret = this.configService.get<string>('auth.refreshSecret');
    
    const refreshExpiresIn =
      (this.configService.get<string>('auth.refreshExpiresIn') ?? '7d') as SignOptions['expiresIn'];




    if (!jwtSecret || !refreshSecret) {
      throw new UnauthorizedException('Authentication configuration is missing');
    }

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: jwtSecret,
        expiresIn: jwtExpiresIn,
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: refreshExpiresIn,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Refresh tokens using a valid refresh token.
   *
   * Steps:
   * 1. Verify refresh token signature
   * 2. Load user from database
   * 3. Ensure stored refresh token hash exists
   * 4. Compare provided refresh token against stored hash
   * 5. Issue new tokens
   * 6. Replace stored refresh token hash
   */
  async refreshTokens(refreshToken: string) {
    const refreshSecret = this.configService.get<string>('auth.refreshSecret');

    if (!refreshSecret) {
      throw new UnauthorizedException('Refresh configuration is missing');
    }

    let payload: JwtPayload;

    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.usersService.findByIdWithRefreshToken(payload.sub);

    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (!user.refreshTokenHash) {
      throw new UnauthorizedException('Refresh token not recognised');
    }

    const refreshMatches = await bcrypt.compare(
      refreshToken,
      user.refreshTokenHash,
    );

    if (!refreshMatches) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role.name);

    const newRefreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
    await this.usersService.updateRefreshTokenHash(user.id, newRefreshTokenHash);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  /**
   * Logout user by invalidating stored refresh token hash.
   *
   * Steps:
   * 1. Verify refresh token
   * 2. Find user
   * 3. Clear stored refresh token hash
   */
  async logout(refreshToken: string) {
    const refreshSecret = this.configService.get<string>('auth.refreshSecret');

    if (!refreshSecret) {
      throw new UnauthorizedException('Refresh configuration is missing');
    }

    let payload: JwtPayload;

    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.usersService.findByIdWithRefreshToken(payload.sub);

    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.usersService.updateRefreshTokenHash(user.id, null);
  }
}