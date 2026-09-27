/**
 * File: C:\Projects\PeopleFirstPolitician\backend\src\modules\auth\auth.service.spec.ts
 *
 * Purpose:
 * Unit tests for AuthService.
 *
 * Security focus:
 * - Valid authentication
 * - Invalid credentials
 * - Inactive-account protection
 * - Refresh-token verification
 * - Refresh-token hashing and rotation
 * - Logout invalidation
 * - Safe authentication responses
 *
 * These tests use mocked dependencies and therefore do not require
 * a live PostgreSQL connection.
 */

import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';

import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { MailService } from './mail.service';

import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { UserStatusEnum } from '../../common/enums/user-status.enum';
import { RoleEnum } from '../../common/enums/role.enum';

describe('AuthService', () => {
  let authService: AuthService;

  /**
   * Mock UsersService.
   */
  const usersServiceMock = {
    findByEmail: jest.fn(),
    findOne: jest.fn(),
    findByIdWithRefreshToken: jest.fn(),
    findByRefreshTokenHash: jest.fn(),
    updateRefreshTokenHash: jest.fn(),
    createPublicUser: jest.fn(),
    findByPasswordResetTokenHash: jest.fn(),
    setPasswordResetToken: jest.fn(),
    clearPasswordResetToken: jest.fn(),
    resetPassword: jest.fn(),
    changePassword: jest.fn(),
  };

  /**
   * Mock JwtService.
   */
  const jwtServiceMock = {
    signAsync: jest.fn(),
  };

  /**
   * Mock MailService.
   */
  const mailServiceMock = {
    sendPasswordResetEmail: jest.fn(),
  };

  /**
   * Test-only configuration.
   *
   * These values are not production secrets.
   */
  const configServiceMock = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        'auth.refreshSecret': 'test-refresh-secret',
        'auth.refreshExpiresIn': '7d',
      };

      return config[key];
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule =
      await Test.createTestingModule({
        providers: [
          AuthService,

          {
            provide: UsersService,
            useValue: usersServiceMock,
          },

          {
            provide: JwtService,
            useValue: jwtServiceMock,
          },

          {
            provide: ConfigService,
            useValue: configServiceMock,
          },

          {
            provide: MailService,
            useValue: mailServiceMock,
          },
        ],
      }).compile();

    authService =
      module.get<AuthService>(AuthService);
  });

  describe('login()', () => {
    it('should authenticate an active user with valid credentials', async () => {
      const password = 'CorrectPassword@123';

      const passwordHash =
        await bcrypt.hash(password, 10);

      const user = {
        id: 'user-1',
        fullName: 'Test User',
        email: 'test@example.com',
        phone: '08000000000',
        passwordHash,
        refreshTokenHash: null,
        status: UserStatusEnum.ACTIVE,
        role: {
          id: 'role-1',
          name: RoleEnum.USER,
        },
      };

      usersServiceMock.findByEmail.mockResolvedValue(
        user,
      );

      usersServiceMock.findOne.mockResolvedValue({
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        status: user.status,
        role: user.role,
      });

      jwtServiceMock.signAsync.mockResolvedValue(
        'access-token',
      );

      const result =
        await authService.login({
          email: ' TEST@EXAMPLE.COM ',
          password,
        });

      /**
       * Verify that the service passes the supplied email
       * to UsersService.findByEmail().
       */
      expect(
        usersServiceMock.findByEmail,
      ).toHaveBeenCalledWith(
        ' TEST@EXAMPLE.COM ',
      );

      /**
       * Access token is generated through JwtService.
       */
      expect(
        jwtServiceMock.signAsync,
      ).toHaveBeenCalledTimes(1);

      expect(result).toHaveProperty(
        'accessToken',
        'access-token',
      );

      /**
       * Refresh token is generated separately by AuthService.
       */
      expect(result).toHaveProperty(
        'refreshToken',
      );

      expect(result.user).toBeDefined();

      /**
       * Sensitive authentication fields must not be
       * exposed in the returned user object.
       */
      expect(result.user).not.toHaveProperty(
        'passwordHash',
      );

      expect(result.user).not.toHaveProperty(
        'refreshTokenHash',
      );

      /**
       * Only the refresh-token hash is persisted.
       */
      expect(
        usersServiceMock.updateRefreshTokenHash,
      ).toHaveBeenCalledTimes(1);
    });

    it('should reject an unknown email', async () => {
      usersServiceMock.findByEmail.mockResolvedValue(
        null,
      );

      await expect(
        authService.login({
          email: 'unknown@example.com',
          password: 'WrongPassword@123',
        }),
      ).rejects.toBeInstanceOf(
        UnauthorizedException,
      );

      expect(
        usersServiceMock.findByEmail,
      ).toHaveBeenCalledWith(
        'unknown@example.com',
      );

      expect(
        jwtServiceMock.signAsync,
      ).not.toHaveBeenCalled();
    });

    it('should reject an inactive user', async () => {
      const password = 'CorrectPassword@123';

      const passwordHash =
        await bcrypt.hash(password, 10);

      const user = {
        id: 'user-2',
        fullName: 'Inactive User',
        email: 'inactive@example.com',
        phone: '08000000001',
        passwordHash,
        refreshTokenHash: null,
        status: UserStatusEnum.INACTIVE,
        role: {
          id: 'role-1',
          name: RoleEnum.USER,
        },
      };

      usersServiceMock.findByEmail.mockResolvedValue(
        user,
      );

      await expect(
        authService.login({
          email: user.email,
          password,
        }),
      ).rejects.toBeInstanceOf(
        UnauthorizedException,
      );

      expect(
        jwtServiceMock.signAsync,
      ).not.toHaveBeenCalled();
    });

    it('should reject an incorrect password', async () => {
      const correctPassword =
        'CorrectPassword@123';

      const passwordHash =
        await bcrypt.hash(
          correctPassword,
          10,
        );

      const user = {
        id: 'user-3',
        fullName: 'Password Test User',
        email: 'password@example.com',
        phone: '08000000002',
        passwordHash,
        refreshTokenHash: null,
        status: UserStatusEnum.ACTIVE,
        role: {
          id: 'role-1',
          name: RoleEnum.USER,
        },
      };

      usersServiceMock.findByEmail.mockResolvedValue(
        user,
      );

      await expect(
        authService.login({
          email: user.email,
          password: 'WrongPassword@123',
        }),
      ).rejects.toBeInstanceOf(
        UnauthorizedException,
      );

      expect(
        jwtServiceMock.signAsync,
      ).not.toHaveBeenCalled();
    });
  });

  describe('refresh()', () => {
    it('should reject a refresh token when the user does not exist', async () => {
      const refreshToken = jwt.sign(
        {
          sub: 'missing-user',
          email: 'missing@example.com',
          role: RoleEnum.USER,
          jti: 'test-jti-1',
        },
        'test-refresh-secret',
        {
          expiresIn: '7d',
        },
      );

      usersServiceMock.findByIdWithRefreshToken.mockResolvedValue(
        null,
      );

      await expect(
        authService.refresh(refreshToken),
      ).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('should reject a refresh token when no stored refresh hash exists', async () => {
      const refreshToken = jwt.sign(
        {
          sub: 'user-4',
          email: 'refresh@example.com',
          role: RoleEnum.USER,
          jti: 'test-jti-2',
        },
        'test-refresh-secret',
        {
          expiresIn: '7d',
        },
      );

      usersServiceMock.findByIdWithRefreshToken.mockResolvedValue(
        {
          id: 'user-4',
          email: 'refresh@example.com',
          status: UserStatusEnum.ACTIVE,
          refreshTokenHash: null,
          role: {
            name: RoleEnum.USER,
          },
        },
      );

      await expect(
        authService.refresh(refreshToken),
      ).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('should rotate the refresh token after successful validation', async () => {
      const refreshToken = jwt.sign(
        {
          sub: 'user-5',
          email: 'refresh@example.com',
          role: RoleEnum.USER,
          jti: 'test-jti-3',
        },
        'test-refresh-secret',
        {
          expiresIn: '7d',
        },
      );

      const refreshTokenHash =
        crypto
          .createHash('sha256')
          .update(refreshToken, 'utf8')
          .digest('hex');

      usersServiceMock.findByIdWithRefreshToken.mockResolvedValue(
        {
          id: 'user-5',
          email: 'refresh@example.com',
          status: UserStatusEnum.ACTIVE,
          refreshTokenHash,
          role: {
            name: RoleEnum.USER,
          },
        },
      );

      jwtServiceMock.signAsync.mockResolvedValue(
        'new-access-token',
      );

      const result =
        await authService.refresh(
          refreshToken,
        );

      expect(result).toHaveProperty(
        'accessToken',
        'new-access-token',
      );

      expect(result).toHaveProperty(
        'refreshToken',
      );

      expect(
        usersServiceMock.updateRefreshTokenHash,
      ).toHaveBeenCalledTimes(1);

      const [
        userId,
        storedHash,
      ] =
        usersServiceMock.updateRefreshTokenHash
          .mock.calls[0];

      expect(userId).toBe('user-5');

      expect(storedHash).toBeDefined();

      expect(storedHash).not.toBe(
        refreshToken,
      );

      expect(storedHash).toHaveLength(64);
    });
  });

  describe('logout()', () => {
    it('should reject an invalid refresh token', async () => {
      usersServiceMock.findByRefreshTokenHash.mockResolvedValue(
        null,
      );

      await expect(
        authService.logout(
          'invalid-refresh-token',
        ),
      ).rejects.toBeInstanceOf(
        UnauthorizedException,
      );

      expect(
        usersServiceMock.updateRefreshTokenHash,
      ).not.toHaveBeenCalled();
    });

    it('should clear the stored refresh token hash after logout', async () => {
      const refreshToken =
        'logout-refresh-token';

      const refreshTokenHash =
        crypto
          .createHash('sha256')
          .update(refreshToken, 'utf8')
          .digest('hex');

      usersServiceMock.findByRefreshTokenHash.mockResolvedValue(
        {
          id: 'user-6',
          email: 'logout@example.com',
          refreshTokenHash,
          status: UserStatusEnum.ACTIVE,
          role: {
            name: RoleEnum.USER,
          },
        },
      );

      const result =
        await authService.logout(
          refreshToken,
        );

      expect(result).toEqual({
        message: 'Logout successful',
      });

      expect(
        usersServiceMock.updateRefreshTokenHash,
      ).toHaveBeenCalledWith(
        'user-6',
        null,
      );
    });
  });
});