/**
 * File: src/modules/auth/auth.service.ts
 *
 * Purpose:
 * Authentication service.
 * Includes temporary seedAdmin() helper for first production setup.
 */

import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

import * as bcrypt from 'bcrypt';

import { LoginDto } from './dto/login.dto';

import { UsersService } from '../users/users.service';

import { RolesService } from '../roles/roles.service';

import { UserStatusEnum } from '../../common/enums/user-status.enum';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly rolesService: RolesService,
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
     * IMPORTANT:
     * Compare incoming password against passwordHash
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
   * TEMPORARY:
   * Creates first admin account in production
   */
  async seedAdmin() {
    const adminEmail = 'admin@example.com';

    const adminPassword = 'NewStrongPassword@123';

    const adminFullName = 'System Administrator';

    /**
     * Check if admin already exists
     */
    const existingUser = await this.usersService.findByEmail(adminEmail);

    if (existingUser) {
      return {
        message: 'Admin user already exists',

        email: existingUser.email,
      };
    }

    /**
     * Find super_admin role
     */
    const adminRole = await this.rolesService.findByName('super_admin');

    if (!adminRole) {
      throw new InternalServerErrorException(
        'Required role "super_admin" does not exist.',
      );
    }

    /**
     * Hash password securely
     */
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    /**
     * Create admin user
     */
    const createdUser = await this.usersService.createSeedUser({
      fullName: adminFullName,

      email: adminEmail,

      passwordHash: hashedPassword,

      roleId: adminRole.id,

      status: UserStatusEnum.ACTIVE,
    });

    return {
      message: 'Admin user seeded successfully',

      credentials: {
        email: adminEmail,

        password: adminPassword,
      },

      user: {
        id: createdUser.id,

        fullName: createdUser.fullName,

        email: createdUser.email,

        roleId: createdUser.roleId,

        status: createdUser.status,
      },
    };
  }
}