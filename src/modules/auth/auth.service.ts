/**
 * File: src/modules/auth/auth.service.ts
 *
 * Purpose:
 * Authentication service.
 */

import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

import * as bcrypt from 'bcrypt';

import { LoginDto } from './dto/login.dto';

import { UsersService } from '../users/users.service';

import { UserStatusEnum } from '../../common/enums/user-status.enum';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Login user
   */
  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    /**
     * Reject inactive or suspended accounts.
     */
    if (user.status !== UserStatusEnum.ACTIVE) {
      throw new UnauthorizedException('Account is not active');
    }

    /**
     * Compare incoming password against passwordHash.
     */
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    /**
     * JWT payload
     */
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role?.name ?? null,
    };

    /**
     * Generate JWT access token
     */
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      message: 'Login successful',

      accessToken,

      user: {
        id: user.id,

        fullName: user.fullName,

        email: user.email,

        role: user.role?.name ?? null,

        status: user.status,
      },
    };
  }

  /**
   * Refresh token placeholder
   */
  async refresh(refreshToken: string) {
    return {
      message: 'Refresh endpoint not fully wired yet',
      refreshToken,
    };
  }

  /**
   * Logout placeholder
   */
  async logout(refreshToken: string) {
    return {
      message: 'Logout endpoint not fully wired yet',
      refreshToken,
    };
  }

  /**
   * Get the currently authenticated user.
   *
   * Purpose:
   * - Retrieves the currently authenticated user by ID.
   * - The user ID is extracted from the validated JWT.
   * - Delegates the user lookup to UsersService.
   *
   * Security:
   * - UsersService.findOne() returns a safe user object.
   * - passwordHash and refreshTokenHash are removed before
   *   the user object is returned to the client.
   *
   * @param userId - ID of the authenticated user.
   */
  async me(userId: string) {
    return this.usersService.findOne(userId);
  }

  /**
   * Change the password of the currently authenticated user.
   *
   * The actual password verification and hashing are delegated
   * to UsersService so passwordHash remains inside the users
   * business-logic layer.
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    actorId: string | null,
  ) {
    return this.usersService.changePassword(
      userId,
      currentPassword,
      newPassword,
      actorId,
    );
  }
}