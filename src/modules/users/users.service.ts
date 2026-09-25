/**
 * File: src/modules/users/users.service.ts
 *
 * Purpose:
 * Handles all business logic related to users.
 *
 * Responsibilities:
 * - Create users
 * - Create public user accounts
 * - Fetch users with pagination, search, and sorting
 * - Fetch one user
 * - Find users by email and phone
 * - Update user details
 * - Update user status
 * - Store / clear refresh token hash
 * - Change user passwords
 * - Soft-delete and restore users
 * - Create the initial seed administrator
 * - Write audit logs for important user actions
 *
 * Security:
 * - Passwords are hashed with bcrypt before storage.
 * - Plaintext passwords are never stored.
 * - Refresh tokens are stored only as SHA-256 hashes.
 * - Sensitive password and refresh-token fields are removed
 *   before user information is returned to callers.
 * - Public registration cannot assign privileged roles.
 */

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import * as bcrypt from 'bcrypt';

import { User } from './entities/user.entity';
import { Role } from '../roles/entities/role.entity';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

import { UserStatusEnum } from '../../common/enums/user-status.enum';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { buildPaginatedResponse } from '../../common/utils/pagination-response.util';

import { AuditService } from '../audit/audit.service';
import { RoleEnum } from '../../common/enums/role.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,

    private readonly auditService: AuditService,
  ) {}

  /**
   * Create a new user.
   *
   * This method is intended for administrative/user-management
   * operations where the caller can specify the role.
   *
   * Security:
   * - Checks email uniqueness.
   * - Checks phone uniqueness.
   * - Validates that the requested role exists.
   * - Hashes the password with bcrypt.
   * - Never stores a plaintext password.
   * - Records the creation in the audit log.
   */
  async create(
    createUserDto: CreateUserDto,
    actorId: string | null,
  ) {
    const {
      fullName,
      email,
      phone,
      password,
      roleName,
    } = createUserDto;

    /**
     * Normalise the email address before checking uniqueness.
     */
    const normalisedEmail =
      email.trim().toLowerCase();

    /**
     * Remove unnecessary spaces from the other fields.
     */
    const normalisedFullName =
      fullName.trim();

    const normalisedPhone =
      phone?.trim();

    /**
     * Check whether the email address already exists.
     */
    const existingByEmail =
      await this.userRepository.findOne({
        where: {
          email: normalisedEmail,
        },
      });

    if (existingByEmail) {
      throw new ConflictException(
        'Email already exists',
      );
    }

    /**
     * Check whether the phone number already exists.
     */
    const existingByPhone =
      await this.userRepository.findOne({
        where: {
          phone: normalisedPhone,
        },
      });

    if (existingByPhone) {
      throw new ConflictException(
        'Phone already exists',
      );
    }

    /**
     * Find the requested role.
     */
    const role =
      await this.roleRepository.findOne({
        where: {
          name: roleName,
        },
      });

    if (!role) {
      throw new NotFoundException(
        'Role not found',
      );
    }

    /**
     * Hash the password before storing it.
     */
    const passwordHash =
      await bcrypt.hash(password, 10);

    /**
     * Create the user entity.
     */
    const user =
      this.userRepository.create({
        fullName: normalisedFullName,
        email: normalisedEmail,
        phone: normalisedPhone,
        passwordHash,
        role,
        status: UserStatusEnum.ACTIVE,
      });

    /**
     * Save the user to the database.
     */
    const savedUser =
      await this.userRepository.save(user);

    /**
     * Reload the complete user with its role relation.
     */
    const fullUser =
      await this.userRepository.findOne({
        where: {
          id: savedUser.id,
        },
        relations: ['role'],
      });

    if (!fullUser) {
      throw new NotFoundException(
        'Created user could not be loaded',
      );
    }

    /**
     * Record the user creation in the audit log.
     */
    await this.auditService.log({
      action: 'USER_CREATED',
      module: 'users',
      actorId,
      targetId: fullUser.id,
      details: {
        email: fullUser.email,
        role: fullUser.role?.name ?? null,
      },
    });

    /**
     * Return only safe user information.
     */
    return this.mapUserResponse(fullUser);
  }

  /**
   * Create a new public user account.
   *
   * This method is specifically used by public registration.
   *
   * Security:
   * - The caller cannot specify a role.
   * - The backend always assigns the USER role.
   * - The password is hashed before storage.
   * - Email uniqueness is checked.
   * - Phone uniqueness is checked.
   * - The new account is activated by default.
   * - Registration is recorded in the audit log.
   * - Password and refresh-token hashes are never returned.
   *
   * Important:
   * A public registration request must never be allowed
   * to assign ADMIN or any other privileged role.
   */
    /**
   * Create a new public user account.
   *
   * This method is specifically used by public registration.
   *
   * Security:
   * - The caller cannot specify a role.
   * - The backend always assigns the USER role.
   * - The password is hashed before storage.
   * - Email uniqueness is checked.
   * - Phone uniqueness is checked.
   * - The new account is activated by default.
   * - Registration is recorded in the audit log.
   * - Password and refresh-token hashes are never returned.
   *
   * Important:
   * A public registration request must never be allowed
   * to assign ADMIN or any other privileged role.
   */
  async createPublicUser(data: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
  }) {
    /**
     * Normalise the submitted registration data.
     */
    const fullName =
      data.fullName.trim();

    const email =
      data.email.trim().toLowerCase();

    const phone =
      data.phone.trim();

    /**
     * Check whether the email address already exists.
     */
    const existingByEmail =
      await this.userRepository.findOne({
        where: {
          email,
        },
      });

    if (existingByEmail) {
      throw new ConflictException(
        'Email already exists',
      );
    }

    /**
     * Check whether the phone number already exists.
     */
    const existingByPhone =
      await this.userRepository.findOne({
        where: {
          phone,
        },
      });

    if (existingByPhone) {
      throw new ConflictException(
        'Phone already exists',
      );
    }

    /**
     * Retrieve the standard USER role.
     *
     * The role is deliberately determined by the backend
     * rather than supplied by the public registration request.
     */
    const role =
      await this.roleRepository.findOne({
        where: {
          name: RoleEnum.USER,
        },
      });

    if (!role) {
      throw new NotFoundException(
        'Default USER role not found',
      );
    }

    /**
     * Hash the password securely.
     */
    const passwordHash =
      await bcrypt.hash(
        data.password,
        10,
      );

    /**
     * Create the new public user.
     *
     * No role is accepted from the public registration request.
     */
    const user =
      this.userRepository.create({
        fullName,
        email,
        phone,
        passwordHash,
        role,
        status: UserStatusEnum.ACTIVE,
      });

    /**
     * Save the new account.
     */
    const savedUser =
      await this.userRepository.save(user);

    /**
     * Reload the saved user together with its role.
     */
    const fullUser =
      await this.userRepository.findOne({
        where: {
          id: savedUser.id,
        },
        relations: ['role'],
      });

    if (!fullUser) {
      throw new NotFoundException(
        'Registered user could not be loaded',
      );
    }

    /**
     * Record the public registration in the audit log.
     *
     * actorId is null because the registration is performed
     * by the user themselves before authentication.
     */
    await this.auditService.log({
      action: 'USER_REGISTERED',
      module: 'auth',
      actorId: null,
      targetId: fullUser.id,
      details: {
        email: fullUser.email,
        role: fullUser.role?.name ?? null,
        registrationType: 'PUBLIC',
      },
    });

    /**
     * Return only safe user information.
     */
    return this.mapUserResponse(fullUser);
  }

  /**
   * Fetch all users with pagination, search, and sorting.
   *
   * Supported search fields:
   * - full name
   * - email
   * - phone
   *
   * Supported sorting fields:
   * - createdAt
   * - updatedAt
   * - fullName
   * - email
   */
  async findAll(
      query: PaginationQueryDto,
      includeDeleted = false,
    ) {
    const page =
      query.page ?? 1;

    const limit =
      query.limit ?? 10;

    const search =
      query.search?.trim();

    const sortBy =
      query.sortBy ?? 'createdAt';

    const sortOrder =
      query.sortOrder ?? 'DESC';

    /**
     * Restrict sorting to known database fields.
     *
     * This prevents arbitrary SQL expressions from being
     * supplied through the sortBy query parameter.
     */
    const allowedSortFields = [
      'createdAt',
      'updatedAt',
      'fullName',
      'email',
    ];

    const safeSortBy =
      allowedSortFields.includes(sortBy)
        ? sortBy
        : 'createdAt';

    /**
     * Build the user query.
     */
    const queryBuilder =
      this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect(
          'user.role',
          'role',
        );

    /**
     * Include soft-deleted users only when explicitly requested.
     *
     * Security:
     * - Normal user-management queries continue to exclude deleted users.
     * - Deleted accounts are exposed only when an authorised caller
     *   explicitly requests them.
     */
    if (includeDeleted) {
      queryBuilder.withDeleted();
    }

    /**
     * Apply search filtering when supplied.
     */
    if (search) {
      queryBuilder.andWhere(
        '(user.fullName ILIKE :search OR user.email ILIKE :search OR user.phone ILIKE :search)',
        {
          search: `%${search}%`,
        },
      );
    }

    /**
     * Apply safe sorting and pagination.
     */
    queryBuilder.orderBy(
      `user.${safeSortBy}`,
      sortOrder,
    );

    queryBuilder
      .skip((page - 1) * limit)
      .take(limit);

    /**
     * Execute the query.
     */
    const [users, totalItems] =
      await queryBuilder.getManyAndCount();

    /**
     * Remove sensitive fields before returning users.
     */
    const safeUsers =
      users.map((user) =>
        this.mapUserResponse(user),
      );

    /**
     * Return the standard paginated response.
     */
    return buildPaginatedResponse(
      safeUsers,
      page,
      limit,
      totalItems,
    );
  }

  /**
   * Fetch one user by ID.
   *
   * Sensitive password and refresh-token fields are removed
   * before returning the user.
   */
  async findOne(id: string) {
    const user =
      await this.userRepository.findOne({
        where: {
          id,
        },
        relations: ['role'],
      });

    if (!user) {
      throw new NotFoundException(
        'User not found',
      );
    }

    return this.mapUserResponse(user);
  }

  /**
   * Update editable user fields.
   *
   * Supported fields include:
   * - fullName
   * - email
   * - phone
   * - roleName, when supplied by an authorised administrative
   *   operation.
   *
   * Security:
   * - Email uniqueness is checked.
   * - Phone uniqueness is checked.
   * - Requested roles must exist.
   * - Changes are recorded in the audit log.
   */
  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    actorId: string | null,
  ) {
    const user =
      await this.userRepository.findOne({
        where: {
          id,
        },
        relations: ['role'],
      });

    if (!user) {
      throw new NotFoundException(
        'User not found',
      );
    }

    /**
     * Update email when supplied.
     */
    if (
      updateUserDto.email &&
      updateUserDto.email !== user.email
    ) {
      const normalisedEmail =
        updateUserDto.email
          .trim()
          .toLowerCase();

      const existingByEmail =
        await this.userRepository.findOne({
          where: {
            email: normalisedEmail,
          },
        });

      if (
        existingByEmail &&
        existingByEmail.id !== user.id
      ) {
        throw new ConflictException(
          'Email already exists',
        );
      }

      user.email = normalisedEmail;
    }

    /**
     * Update phone number when supplied.
     */
    if (
      updateUserDto.phone &&
      updateUserDto.phone !== user.phone
    ) {
      const normalisedPhone =
        updateUserDto.phone.trim();

      const existingByPhone =
        await this.userRepository.findOne({
          where: {
            phone: normalisedPhone,
          },
        });

      if (
        existingByPhone &&
        existingByPhone.id !== user.id
      ) {
        throw new ConflictException(
          'Phone already exists',
        );
      }

      user.phone = normalisedPhone;
    }

    /**
     * Update full name when supplied.
     */
    if (updateUserDto.fullName) {
      user.fullName =
        updateUserDto.fullName.trim();
    }

    /**
     * The UpdateUserDto may optionally contain roleName
     * for authorised administrative operations.
     */
    const dtoWithPossibleRole =
      updateUserDto as UpdateUserDto & {
        roleName?: string;
      };

    /**
     * Update the user's role when explicitly requested
     * through an authorised administrative operation.
     */
    if (dtoWithPossibleRole.roleName) {
      const role =
        await this.roleRepository.findOne({
          where: {
            name: dtoWithPossibleRole.roleName,
          },
        });

      if (!role) {
        throw new NotFoundException(
          'Role not found',
        );
      }

      user.role = role;
    }

    /**
     * Save the changes.
     */
    const savedUser =
      await this.userRepository.save(user);

    /**
     * Reload the complete user with its role.
     */
    const fullUser =
      await this.userRepository.findOne({
        where: {
          id: savedUser.id,
        },
        relations: ['role'],
      });

    if (!fullUser) {
      throw new NotFoundException(
        'Updated user could not be loaded',
      );
    }

    /**
     * Record the update in the audit log.
     */
    await this.auditService.log({
      action: 'USER_UPDATED',
      module: 'users',
      actorId,
      targetId: fullUser.id,
      details: {
        email: fullUser.email,
      },
    });

    return this.mapUserResponse(fullUser);
  }

  /**
   * Update user status.
   *
   * Supported statuses:
   * - ACTIVE
   * - INACTIVE
   * - SUSPENDED
   */
  async updateStatus(
    id: string,
    updateUserStatusDto: UpdateUserStatusDto,
    actorId: string | null,
  ) {
    const user =
      await this.userRepository.findOne({
        where: {
          id,
        },
        relations: ['role'],
      });

    if (!user) {
      throw new NotFoundException(
        'User not found',
      );
    }

    /**
     * Convert the submitted value to the status enum.
     */
    const nextStatus =
      updateUserStatusDto.status as UserStatusEnum;

    /**
     * Validate the requested status.
     */
    if (
      nextStatus !== UserStatusEnum.ACTIVE &&
      nextStatus !== UserStatusEnum.INACTIVE &&
      nextStatus !== UserStatusEnum.SUSPENDED
    ) {
      throw new BadRequestException(
        'Invalid user status',
      );
    }

    /**
     * Apply the new status.
     */
    user.status = nextStatus;

    /**
     * Save the status change.
     */
    const savedUser =
      await this.userRepository.save(user);

    /**
     * Reload the updated user.
     */
    const fullUser =
      await this.userRepository.findOne({
        where: {
          id: savedUser.id,
        },
        relations: ['role'],
      });

    if (!fullUser) {
      throw new NotFoundException(
        'Updated user could not be loaded',
      );
    }

    /**
     * Record the status change.
     */
    await this.auditService.log({
      action: 'USER_STATUS_UPDATED',
      module: 'users',
      actorId,
      targetId: fullUser.id,
      details: {
        status: fullUser.status,
      },
    });

    return this.mapUserResponse(fullUser);
  }

  /**
   * Find a user by email.
   *
   * Required by AuthService for login and registration.
   *
   * The role relation is loaded because authentication needs
   * the user's role when creating JWT payloads.
   */
  async findByEmail(email: string) {
    return this.userRepository.findOne({
      where: {
        email: email.trim().toLowerCase(),
      },
      relations: ['role'],
    });
  }

  /**
   * Find a user by phone number.
   *
   * Required by AuthService during public registration.
   *
   * This method is used to prevent multiple accounts from
   * being registered with the same phone number.
   */
  async findByPhone(phone: string) {
    return this.userRepository.findOne({
      where: {
        phone: phone.trim(),
      },
      relations: ['role'],
    });
  }

  /**
   * Find a user by ID including the stored refresh-token hash.
   *
   * Required by AuthService during refresh-token validation.
   *
   * The refresh-token hash is intentionally available internally
   * to AuthService but is removed by mapUserResponse() before
   * user data is returned externally.
   */
  async findByIdWithRefreshToken(
    userId: string,
  ) {
    return this.userRepository.findOne({
      where: {
        id: userId,
      },
      relations: ['role'],
    });
  }

  /**
   * Find a user by the stored refresh-token hash.
   *
   * Required by AuthService during logout.
   */
  async findByRefreshTokenHash(
    refreshTokenHash: string,
  ) {
    return this.userRepository.findOne({
      where: {
        refreshTokenHash,
      },
      relations: ['role'],
    });
  }

  /**
   * Store or clear the refresh-token hash.
   *
   * Passing null invalidates the currently stored refresh token.
   */
  async updateRefreshTokenHash(
    userId: string,
    hash: string | null,
  ) {
    await this.userRepository.update(
      userId,
      {
        refreshTokenHash: hash,
      },
    );
  }

  /**
   * Soft-delete a user.
   *
   * The record remains in the database but is marked as deleted.
   */
  async remove(
    id: string,
    actorId: string | null,
  ) {
    const user =
      await this.userRepository.findOne({
        where: {
          id,
        },
        relations: ['role'],
      });

    if (!user) {
      throw new NotFoundException(
        'User not found',
      );
    }

    /**
     * Perform the soft deletion.
     */
    await this.userRepository.softDelete(id);

    /**
     * Record the deletion.
     */
    await this.auditService.log({
      action: 'USER_DELETED',
      module: 'users',
      actorId,
      targetId: id,
      details: {
        deleted: true,
      },
    });

    return {
      id,
      deleted: true,
    };
  }

  /**
   * Restore a soft-deleted user.
   */
  async restore(
    id: string,
    actorId: string | null,
  ) {
    /**
     * Include soft-deleted records in the search.
     */
    const user =
      await this.userRepository.findOne({
        where: {
          id,
        },
        withDeleted: true,
        relations: ['role'],
      });

    if (!user) {
      throw new NotFoundException(
        'User not found',
      );
    }

    /**
     * Ensure that the account is actually deleted.
     */
    if (!user.deletedAt) {
      throw new BadRequestException(
        'User is not deleted',
      );
    }

    /**
     * Restore the account.
     */
    await this.userRepository.restore(id);

    /**
     * Reload the restored user.
     */
    const restoredUser =
      await this.userRepository.findOne({
        where: {
          id,
        },
        relations: ['role'],
      });

    if (!restoredUser) {
      throw new NotFoundException(
        'Restored user could not be loaded',
      );
    }

    /**
     * Record the restoration.
     */
    await this.auditService.log({
      action: 'USER_RESTORED',
      module: 'users',
      actorId,
      targetId: restoredUser.id,
      details: {
        restored: true,
      },
    });

    return this.mapUserResponse(
      restoredUser,
    );
  }

  /**
   * Change a user's password.
   *
   * Security:
   * - Verifies the current password before making any change.
   * - Prevents reuse of the current password.
   * - Hashes the new password with bcrypt.
   * - Clears the refresh-token hash so existing refresh credentials
   *   cannot be reused after a password change.
   * - Records the password change in the audit log.
   * - Never returns the password hash.
   */
  async changePassword(
    id: string,
    currentPassword: string,
    newPassword: string,
    actorId: string | null,
  ) {
    /**
     * Find the user.
     */
    const user =
      await this.userRepository.findOne({
        where: {
          id,
        },
      });

    if (!user) {
      throw new NotFoundException(
        'User not found',
      );
    }

    /**
     * Verify the current password.
     */
    const isCurrentPasswordValid =
      await bcrypt.compare(
        currentPassword,
        user.passwordHash,
      );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException(
        'Current password is incorrect',
      );
    }

    /**
     * Prevent reuse of the current password.
     */
    const isSamePassword =
      await bcrypt.compare(
        newPassword,
        user.passwordHash,
      );

    if (isSamePassword) {
      throw new BadRequestException(
        'New password must be different from the current password',
      );
    }

    /**
     * Hash the new password securely.
     */
    user.passwordHash =
      await bcrypt.hash(
        newPassword,
        10,
      );

    /**
     * Invalidate existing refresh credentials.
     *
     * The user will need to authenticate again.
     */
    user.refreshTokenHash = null;

    /**
     * Save the password change.
     */
    await this.userRepository.save(user);

    /**
     * Record the security-sensitive action.
     *
     * The password itself is never included in the audit record.
     */
    await this.auditService.log({
      action: 'PASSWORD_CHANGED',
      module: 'auth',
      actorId,
      targetId: user.id,
      details: {
        passwordChanged: true,
      },
    });

    return {
      message: 'Password changed successfully',
    };
  }

    /**
   * Find a user using a hashed password-reset token.
   *
   * Security:
   * - The raw token is never searched for.
   * - Only the SHA-256 token hash is stored and searched.
   */
  async findByPasswordResetTokenHash(
    passwordResetTokenHash: string,
  ) {
    return this.userRepository.findOne({
      where: {
        passwordResetTokenHash,
      },
    });
  }

  /**
   * Store a password-reset token hash and its expiry time.
   *
   * The raw token must never be passed to this method.
   */
  async setPasswordResetToken(
    userId: string,
    passwordResetTokenHash: string,
    passwordResetExpiresAt: Date,
  ) {
    const user = await this.userRepository.findOne({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.passwordResetTokenHash = passwordResetTokenHash;
    user.passwordResetExpiresAt = passwordResetExpiresAt;

    await this.userRepository.save(user);
  }

  /**
   * Clear the password-reset token.
   *
   * This is called after successful password reset and when
   * a reset request cannot be completed.
   */
  async clearPasswordResetToken(userId: string) {
    const user = await this.userRepository.findOne({
      where: {
        id: userId,
      },
    });

    if (!user) {
      return;
    }

    user.passwordResetTokenHash = null;
    user.passwordResetExpiresAt = null;

    await this.userRepository.save(user);
  }

  /**
   * Reset a user's password using a valid password-reset token.
   *
   * Security:
   * - Hashes the new password with bcrypt.
   * - Clears the password-reset token immediately.
   * - Invalidates all existing refresh credentials.
   * - Never records the password itself in the audit log.
   */
  async resetPassword(
    userId: string,
    newPassword: string,
    actorId: string | null = null,
  ) {
    const user = await this.userRepository.findOne({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    /**
     * Hash the new password.
     */
    user.passwordHash = await bcrypt.hash(
      newPassword,
      10,
    );

    /**
     * Invalidate all existing refresh sessions.
     */
    user.refreshTokenHash = null;

    /**
     * Make the reset token immediately unusable.
     */
    user.passwordResetTokenHash = null;
    user.passwordResetExpiresAt = null;

    await this.userRepository.save(user);

    /**
     * Record the security-sensitive operation.
     *
     * Never include the password or reset token.
     */
    await this.auditService.log({
      action: 'PASSWORD_RESET',
      module: 'auth',
      actorId,
      targetId: user.id,
      details: {
        passwordReset: true,
      },
    });

    return {
      message:
        'Password reset successfully. Please sign in with your new password.',
    };
  }

  /**
   * Remove sensitive fields before returning user objects.
   *
   * Sensitive fields removed:
   * - passwordHash
   * - refreshTokenHash
   *
   * This method is intentionally kept private so that every
   * externally returned user object passes through the same
   * security filter.
   */
  private mapUserResponse(user: User) {
    const {
      passwordHash,
      refreshTokenHash,
      ...safeUser
    } = user;

    return safeUser;
  }

  /**
   * Create a user account during system bootstrapping.
   *
   * This method is specifically intended for creation of the
   * initial administrator account during application setup.
   *
   * Security:
   * - The password received here must already be hashed.
   * - Plaintext passwords must never be passed to this method.
   * - The supplied password hash is stored directly.
   * - User status uses UserStatusEnum.
   *
   * Important:
   * This method is different from createPublicUser().
   * Public users must never be able to call this method or
   * provide an administrator role during registration.
   */
  async createSeedUser(data: {
    fullName: string;
    email: string;
    passwordHash: string;
    roleId: string;
    status: UserStatusEnum;
  }) {
    /**
     * Create the seed administrator entity.
     */
    const user =
      this.userRepository.create({
        fullName: data.fullName,
        email: data.email,
        passwordHash: data.passwordHash,
        roleId: data.roleId,
        status: data.status,
      });

    /**
     * Save and return the seed user.
     */
    return this.userRepository.save(user);
  }
}