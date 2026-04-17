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

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly rolesService: RolesService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role?.name ?? null,
    };

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

  async refresh(refreshToken: string) {
    return {
      message: 'Refresh endpoint not fully wired yet',
      refreshToken,
    };
  }

  async logout(refreshToken: string) {
    return {
      message: 'Logout endpoint not fully wired yet',
      refreshToken,
    };
  }

  /**
   * TEMPORARY: create first admin user
   */
  async seedAdmin() {
    const adminEmail = 'admin@example.com';
    const adminPassword = 'NewStrongPassword@123';
    const adminFullName = 'System Administrator';

    const existingUser = await this.usersService.findByEmail(adminEmail);
    if (existingUser) {
      return {
        message: 'Admin user already exists',
        email: existingUser.email,
      };
    }

    const adminRole = await this.rolesService.findByName('super_admin');
    if (!adminRole) {
      throw new InternalServerErrorException(
        'Required role "super_admin" does not exist. Seed roles first.',
      );
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const createdUser = await this.usersService.createSeedUser({
      fullName: adminFullName,
      email: adminEmail,
      password: hashedPassword,
      roleId: adminRole.id,
      status: 'active',
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