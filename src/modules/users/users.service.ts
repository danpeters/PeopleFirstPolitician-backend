/**
 * File: src/modules/users/users.service.ts
 *
 * Purpose:
 * Handles all business logic related to users.
 *
 * Responsibilities:
 * - Create users
 * - Fetch users with pagination, search, and sorting
 * - Fetch one user
 * - Update user details
 * - Update user status
 * - Find user by email for authentication
 * - Store / clear refresh token hash
 * - Soft-delete and restore users
 * - Write audit logs for important admin actions
 */

// File: C:\Projects\PeopleFirstPolitician\backend\src\modules\users\users.service.ts

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
   */
  async create(createUserDto: CreateUserDto, actorId: string | null) {
    const { fullName, email, phone, password, roleName } = createUserDto;

    const existingByEmail = await this.userRepository.findOne({
      where: { email },
    });

    if (existingByEmail) {
      throw new ConflictException('Email already exists');
    }

    const existingByPhone = await this.userRepository.findOne({
      where: { phone },
    });

    if (existingByPhone) {
      throw new ConflictException('Phone already exists');
    }

    const role = await this.roleRepository.findOne({
      where: { name: roleName },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = this.userRepository.create({
      fullName,
      email,
      phone,
      passwordHash,
      role,
      status: UserStatusEnum.ACTIVE,
    });

    const savedUser = await this.userRepository.save(user);

    const fullUser = await this.userRepository.findOne({
      where: { id: savedUser.id },
      relations: ['role'],
    });

    if (!fullUser) {
      throw new NotFoundException('Created user could not be loaded');
    }

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

    // File: C:\Projects\PeopleFirstPolitician\backend\src\modules\users\users.service.ts

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
   
    return this.mapUserResponse(fullUser);
  }

  /**
   * Fetch all users with pagination, search, and sorting.
   */
  async findAll(query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const search = query.search?.trim();
    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'DESC';

    const allowedSortFields = ['createdAt', 'updatedAt', 'fullName', 'email'];
    const safeSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : 'createdAt';

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role');

    if (search) {
      queryBuilder.andWhere(
        '(user.fullName ILIKE :search OR user.email ILIKE :search OR user.phone ILIKE :search)',
        {
          search: `%${search}%`,
        },
      );
    }

    queryBuilder.orderBy(`user.${safeSortBy}`, sortOrder);
    queryBuilder.skip((page - 1) * limit).take(limit);

    const [users, totalItems] = await queryBuilder.getManyAndCount();
    const safeUsers = users.map((user) => this.mapUserResponse(user));

    return buildPaginatedResponse(safeUsers, page, limit, totalItems);
  }

  /**
   * Fetch one user by ID.
   */
  async findOne(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['role'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.mapUserResponse(user);
  }

  /**
   * Update editable user fields.
   */
  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    actorId: string | null,
  ) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['role'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingByEmail = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });

      if (existingByEmail) {
        throw new ConflictException('Email already exists');
      }

      user.email = updateUserDto.email;
    }

    if (updateUserDto.phone && updateUserDto.phone !== user.phone) {
      const existingByPhone = await this.userRepository.findOne({
        where: { phone: updateUserDto.phone },
      });

      if (existingByPhone) {
        throw new ConflictException('Phone already exists');
      }

      user.phone = updateUserDto.phone;
    }

    if (updateUserDto.fullName) {
      user.fullName = updateUserDto.fullName;
    }

    const dtoWithPossibleRole = updateUserDto as UpdateUserDto & {
      roleName?: string;
    };

    if (dtoWithPossibleRole.roleName) {
      const role = await this.roleRepository.findOne({
        where: { name: dtoWithPossibleRole.roleName },
      });

      if (!role) {
        throw new NotFoundException('Role not found');
      }

      user.role = role;
    }

    const savedUser = await this.userRepository.save(user);

    const fullUser = await this.userRepository.findOne({
      where: { id: savedUser.id },
      relations: ['role'],
    });

    if (!fullUser) {
      throw new NotFoundException('Updated user could not be loaded');
    }

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
   */
  async updateStatus(
    id: string,
    updateUserStatusDto: UpdateUserStatusDto,
    actorId: string | null,
  ) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['role'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const nextStatus = updateUserStatusDto.status as UserStatusEnum;

    if (
      nextStatus !== UserStatusEnum.ACTIVE &&
      nextStatus !== UserStatusEnum.INACTIVE &&
      nextStatus !== UserStatusEnum.SUSPENDED
    ) {
      throw new BadRequestException('Invalid user status');
    }

    user.status = nextStatus;

    const savedUser = await this.userRepository.save(user);

    const fullUser = await this.userRepository.findOne({
      where: { id: savedUser.id },
      relations: ['role'],
    });

    if (!fullUser) {
      throw new NotFoundException('Updated user could not be loaded');
    }

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
   * Find user by email.
   *
   * Required by AuthService.
   */
  async findByEmail(email: string) {
    return this.userRepository.findOne({
      where: { email },
      relations: ['role'],
    });
  }

  /**
   * Find user by ID including refresh token hash.
   *
   * Required by AuthService.
   */
  async findByIdWithRefreshToken(userId: string) {
    return this.userRepository.findOne({
      where: { id: userId },
      relations: ['role'],
    });
  }

  /**
   * Store or clear refresh token hash.
   *
   * Required by AuthService.
   */
  async updateRefreshTokenHash(userId: string, hash: string | null) {
    await this.userRepository.update(userId, {
      refreshTokenHash: hash,
    });
  }

  /**
   * Soft-delete a user.
   */
  async remove(id: string, actorId: string | null) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['role'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.userRepository.softDelete(id);

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
  async restore(id: string, actorId: string | null) {
    const user = await this.userRepository.findOne({
      where: { id },
      withDeleted: true,
      relations: ['role'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.deletedAt) {
      throw new BadRequestException('User is not deleted');
    }

    await this.userRepository.restore(id);

    const restoredUser = await this.userRepository.findOne({
      where: { id },
      relations: ['role'],
    });

    if (!restoredUser) {
      throw new NotFoundException('Restored user could not be loaded');
    }

    await this.auditService.log({
      action: 'USER_RESTORED',
      module: 'users',
      actorId,
      targetId: restoredUser.id,
      details: {
        restored: true,
      },
    });

    return this.mapUserResponse(restoredUser);
  }


// File: C:\Projects\PeopleFirstPolitician\backend\src\modules\users\users.service.ts

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
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    /**
     * Verify the current password.
     */
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    /**
     * Prevent reuse of the current password.
     */
    const isSamePassword = await bcrypt.compare(
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
    // File: C:\Projects\PeopleFirstPolitician\backend\src\modules\users\users.service.ts

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.refreshTokenHash = null;

    console.log('[PASSWORD CHANGE] Saving new password hash for:', user.email);
    console.log('[PASSWORD CHANGE] New hash length:', user.passwordHash.length);

    const savedUser = await this.userRepository.save(user);

    console.log('[PASSWORD CHANGE] Database save completed.');
    console.log('[PASSWORD CHANGE] Saved hash length:', savedUser.passwordHash.length);

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
   * Remove sensitive fields before returning user objects.
   */
  private mapUserResponse(user: User) {
    const { passwordHash, refreshTokenHash, ...safeUser } = user;
    return safeUser;
  }

  /**
 * File:
 * C:\Projects\PeopleFirstPolitician\backend\src\modules\users\users.service.ts
 *
 * Purpose:
 * Creates a user account during system bootstrapping,
 * specifically for the initial administrator account.
 *
 * Security:
 * - The password received here must already be hashed.
 * - Plaintext passwords must never be stored.
 * - The password hash is stored in User.passwordHash.
 * - User status uses UserStatusEnum.
 *
 * Day 2 Module:
 * Users Module
 */
  async createSeedUser(data: {
    fullName: string;
    email: string;
    passwordHash: string;
    roleId: string;
    status: UserStatusEnum;
  }) {
    const user = this.userRepository.create({
      fullName: data.fullName,
      email: data.email,
      passwordHash: data.passwordHash,
      roleId: data.roleId,
      status: data.status,
    });

    return this.userRepository.save(user);
  }
}