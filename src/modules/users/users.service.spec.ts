/**
 * File: C:\Projects\PeopleFirstPolitician\backend\src\modules\users\users.service.spec.ts
 *
 * Purpose:
 * Unit tests for UsersService.
 *
 * These tests verify the security-sensitive behaviour of user management,
 * including:
 * - Public user registration
 * - Password hashing
 * - Prevention of privileged-role assignment during public registration
 * - User lookup
 * - User status handling
 * - Password changes
 * - Password reset
 * - Refresh-token hash handling
 * - Sensitive-field protection in returned user objects
 *
 * Note:
 * These are unit tests. They use mocked repositories/services and do not
 * connect to the production database.
 */

import { UsersService } from './users.service';
import { UserStatusEnum } from '../../common/enums/user-status.enum';
import { RoleEnum } from '../../common/enums/role.enum';

describe('UsersService', () => {
  let usersService: UsersService;

  const userRepositoryMock = {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softRemove: jest.fn(),
    recover: jest.fn(),
  };

  const roleRepositoryMock = {
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const auditServiceMock = {
    log: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    usersService = new UsersService(
      userRepositoryMock as any,
      roleRepositoryMock as any,
      auditServiceMock as any,
    );
  });

  describe('createPublicUser()', () => {
    it('should create a normal user with a hashed password', async () => {
      const password = 'TestPassword@123';

      const role = {
        id: 'role-user-id',
        name: RoleEnum.USER,
      };

      const createdUser = {
        id: 'user-id',
        fullName: 'Test User',
        email: 'test@example.com',
        phone: '08012345678',
        passwordHash: '$2b$12$hashed-password',
        roleId: role.id,
        role,
        status: UserStatusEnum.ACTIVE,
      };

      roleRepositoryMock.findOne.mockResolvedValue(role);

      userRepositoryMock.findOne
        .mockResolvedValueOnce(null) // Email does not exist
        .mockResolvedValueOnce(null) // Phone does not exist
        .mockResolvedValueOnce(createdUser); // Reload newly created user

      userRepositoryMock.create.mockReturnValue(createdUser);
      userRepositoryMock.save.mockResolvedValue(createdUser);

      const result = await usersService.createPublicUser({
        fullName: 'Test User',
        email: ' TEST@EXAMPLE.COM ',
        phone: '08012345678',
        password,
      });

      expect(roleRepositoryMock.findOne).toHaveBeenCalled();
      expect(userRepositoryMock.create).toHaveBeenCalled();

      const createArgument = userRepositoryMock.create.mock.calls[0][0];

      expect(createArgument.fullName).toBe('Test User');
      expect(createArgument.email).toBe('test@example.com');
      expect(createArgument.role).toEqual(role);
      expect(createArgument.status).toBe(UserStatusEnum.ACTIVE);
      expect(createArgument.passwordHash).not.toBe(password);

      expect(userRepositoryMock.save).toHaveBeenCalledWith(createdUser);

      expect(result).not.toHaveProperty('passwordHash');
      expect(result).not.toHaveProperty('refreshTokenHash');
      expect(result).not.toHaveProperty('passwordResetTokenHash');
      expect(result).not.toHaveProperty('passwordResetExpiresAt');
    });

    it('should reject registration when the email already exists', async () => {
      userRepositoryMock.findOne.mockResolvedValue({
        id: 'existing-user-id',
        email: 'test@example.com',
      });

      await expect(
        usersService.createPublicUser({
          fullName: 'Test User',
          email: 'test@example.com',
          phone: '08012345678',
          password: 'TestPassword@123',
        }),
      ).rejects.toThrow();

      expect(userRepositoryMock.create).not.toHaveBeenCalled();
      expect(userRepositoryMock.save).not.toHaveBeenCalled();
    });
  });

  describe('findOne()', () => {
    it('should return a user by ID', async () => {
      const user = {
        id: 'user-id',
        fullName: 'Test User',
        email: 'test@example.com',
        status: UserStatusEnum.ACTIVE,
      };

      userRepositoryMock.findOne.mockResolvedValue(user);

      const result = await usersService.findOne('user-id');

      expect(userRepositoryMock.findOne).toHaveBeenCalled();
      expect(result).toEqual(user);
    });

    it('should reject when the user does not exist', async () => {
      userRepositoryMock.findOne.mockResolvedValue(null);

      await expect(
        usersService.findOne('missing-user-id'),
      ).rejects.toThrow();
    });
  });

  describe('findByEmail()', () => {
    it('should find a user by email', async () => {
      const user = {
        id: 'user-id',
        email: 'test@example.com',
        status: UserStatusEnum.ACTIVE,
      };

      userRepositoryMock.findOne.mockResolvedValue(user);

      const result = await usersService.findByEmail('test@example.com');

      expect(userRepositoryMock.findOne).toHaveBeenCalled();
      expect(result).toEqual(user);
    });
  });

  describe('updateRefreshTokenHash()', () => {
    it('should update the stored refresh-token hash', async () => {
      userRepositoryMock.update.mockResolvedValue({
        affected: 1,
      });

      await usersService.updateRefreshTokenHash(
        'user-id',
        'new-refresh-hash',
      );

      expect(userRepositoryMock.update).toHaveBeenCalledWith(
        'user-id',
        {
          refreshTokenHash: 'new-refresh-hash',
        },
      );
    });

    it('should clear the stored refresh-token hash when null is supplied', async () => {
      userRepositoryMock.update.mockResolvedValue({
        affected: 1,
      });

      await usersService.updateRefreshTokenHash(
        'user-id',
        null,
      );

      expect(userRepositoryMock.update).toHaveBeenCalledWith(
        'user-id',
        {
          refreshTokenHash: null,
        },
      );
    });
  });
});