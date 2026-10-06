/**
 * File: src/modules/auth/auth.service.ts
 *
 * Purpose:
 * Authentication service for the People First Politician application.
 *
 * Responsibilities:
 * - Authenticate users during login.
 * - Generate and manage access tokens.
 * - Generate and rotate refresh tokens.
 * - Store only hashed refresh tokens.
 * - Logout users by invalidating refresh tokens.
 * - Register new public users.
 * - Retrieve the currently authenticated user.
 * - Change authenticated users' passwords.
 * - Request password-reset instructions.
 * - Reset passwords using temporary password-reset tokens.
 *
 * Security:
 * - Access tokens use the configured JWT secret.
 * - Refresh tokens use a separate refresh secret.
 * - Only the SHA-256 hash of a refresh token is stored.
 * - Raw refresh tokens are never stored in the database.
 * - Public registration cannot assign privileged roles.
 * - Password hashing is handled by UsersService.
 * - Password-reset tokens are cryptographically random.
 * - Only password-reset token hashes are stored.
 * - Password-reset tokens expire after 30 minutes.
 * - Password-reset tokens are invalidated after successful use.
 * - Existing refresh credentials are invalidated after a password reset.
 * - Sensitive password and refresh-token information is never
 *   returned to the client.
 */

import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

import {
  createHash,
  randomBytes,
  randomUUID,
} from 'crypto';

import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

import { MailService } from './mail.service';

import { UsersService } from '../users/users.service';

import { UserStatusEnum } from '../../common/enums/user-status.enum';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  OrganisationMembership,
  OrganisationMembershipStatus,
} from '../organisations/entities/organisation-membership.entity';

import { OrganisationStatus } from '../organisations/entities/organisation.entity';

@Injectable()
export class AuthService {
  constructor(
  private readonly usersService: UsersService,
  private readonly jwtService: JwtService,
  private readonly configService: ConfigService,
  private readonly mailService: MailService,

  @InjectRepository(OrganisationMembership)
  private readonly organisationMembershipRepository: Repository<OrganisationMembership>,
) {}

  /**
   * Authenticate a user.
   *
   * Process:
   * 1. Find the user using the supplied email address.
   * 2. Confirm that the account is active.
   * 3. Compare the supplied password against the stored password hash.
   * 4. Generate an access token.
   * 5. Generate a refresh token using the separate refresh secret.
   * 6. Store only the SHA-256 hash of the refresh token.
   *
   * Security:
   * - Invalid credentials produce the same generic error.
   * - Inactive accounts cannot authenticate.
   * - The raw refresh token is never stored in the database.
   */
  async login(loginDto: LoginDto) {
    /**
     * Find the user by email address.
     */
    const user = await this.usersService.findByEmail(
      loginDto.email,
    );

    /**
     * Reject authentication when the account does not exist.
     */
    if (!user) {
      throw new UnauthorizedException(
        'Invalid credentials',
      );
    }

    /**
     * Reject inactive or suspended accounts.
     */
    if (user.status !== UserStatusEnum.ACTIVE) {
      throw new UnauthorizedException(
        'Account is not active',
      );
    }

    /**
     * Compare the supplied password with the stored password hash.
     */
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    /**
     * Reject invalid passwords.
     */
    if (!isPasswordValid) {
      throw new UnauthorizedException(
        'Invalid credentials',
      );
    }

    /**
     * JWT payload shared by the access and refresh tokens.
     *
     * jti provides a unique identifier for the token instance.
     */
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role?.name ?? null,
      jti: randomUUID(),
    };

    /**
     * Generate the short-lived access token.
     */
    const accessToken =
      await this.jwtService.signAsync(payload);

    /**
     * Retrieve the separate refresh-token secret.
     */
    const refreshSecret =
      this.configService.get<string>(
        'auth.refreshSecret',
      );

    /**
     * Retrieve the configured refresh-token lifetime.
     *
     * Defaults to seven days when no value is configured.
     */
    const refreshExpiresIn =
      this.configService.get<string>(
        'auth.refreshExpiresIn',
      ) ?? '7d';

    /**
     * Ensure that the refresh secret has been configured.
     */
    if (!refreshSecret) {
      throw new Error(
        'Refresh token secret is not configured',
      );
    }

    /**
     * Generate the refresh token using the separate
     * refresh-token secret.
     */
    const refreshToken = jwt.sign(
      payload,
      refreshSecret,
      {
        expiresIn:
          refreshExpiresIn as jwt.SignOptions['expiresIn'],
      },
    );

    /**
     * Hash the refresh token before storing it.
     *
     * The raw refresh token is returned to the client but
     * is never persisted in the database.
     */
    const refreshTokenHash = createHash('sha256')
      .update(refreshToken, 'utf8')
      .digest('hex');

    /**
     * Store only the refresh-token hash.
     */
    await this.usersService.updateRefreshTokenHash(
      user.id,
      refreshTokenHash,
    );

    /**
     * Retrieve the complete authenticated user representation.
     *
     * This keeps the login response consistent with /auth/me and
     * ensures that the frontend receives:
     * - id
     * - fullName
     * - email
     * - phone
     * - complete role object
     * - status
     * - timestamps
     *
     * UsersService.findOne() loads the role relation and applies
     * the standard sensitive-field filtering before returning the
     * user object.
     */
    const authenticatedUser =
      await this.usersService.findOne(user.id);

    /**
     * Return the authentication result.
     */
    return {
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: authenticatedUser,
    };
  }

  /**
   * Refresh the access and refresh tokens.
   *
   * Process:
   * 1. Verify the supplied refresh token.
   * 2. Retrieve the associated user.
   * 3. Confirm that the account remains active.
   * 4. Hash the supplied refresh token.
   * 5. Compare the hash with the stored hash.
   * 6. Generate a new access token.
   * 7. Generate a new refresh token.
   * 8. Replace the old stored refresh-token hash.
   *
   * Security:
   * - Refresh tokens use a separate secret.
   * - Refresh-token hashes are stored instead of raw tokens.
   * - Refresh-token rotation invalidates the previously stored token.
   */
  async refresh(refreshToken: string) {
    /**
     * Retrieve the refresh-token secret.
     */
    const refreshSecret =
      this.configService.get<string>(
        'auth.refreshSecret',
      );

    /**
     * Retrieve the refresh-token lifetime.
     */
    const refreshExpiresIn =
      this.configService.get<string>(
        'auth.refreshExpiresIn',
      ) ?? '7d';

    /**
     * Ensure that the refresh secret has been configured.
     */
    if (!refreshSecret) {
      throw new UnauthorizedException(
        'Refresh token secret is not configured',
      );
    }

    /**
     * Define the expected refresh-token payload.
     */
    let payload: {
      sub: string;
      email: string;
      role: string | null;
    };

    /**
     * Verify the supplied refresh token.
     */
    try {
      payload = jwt.verify(
        refreshToken,
        refreshSecret,
      ) as typeof payload;
    } catch {
      throw new UnauthorizedException(
        'Invalid or expired refresh token',
      );
    }

    /**
     * A valid refresh token must contain a user ID.
     */
    if (!payload.sub) {
      throw new UnauthorizedException(
        'Invalid refresh token',
      );
    }

    /**
     * Retrieve the user together with the stored
     * refresh-token hash.
     */
    const user =
      await this.usersService.findByIdWithRefreshToken(
        payload.sub,
      );

    /**
     * Reject the token when the user does not exist.
     */
    if (!user) {
      throw new UnauthorizedException(
        'Invalid refresh token',
      );
    }

    /**
     * Reject inactive or suspended accounts.
     */
    if (user.status !== UserStatusEnum.ACTIVE) {
      throw new UnauthorizedException(
        'Account is not active',
      );
    }

    /**
     * A refresh token cannot be accepted when there is
     * no corresponding stored hash.
     */
    if (!user.refreshTokenHash) {
      throw new UnauthorizedException(
        'Refresh token is not valid',
      );
    }

    /**
     * Hash the supplied refresh token.
     */
    const refreshTokenHash = createHash('sha256')
      .update(refreshToken, 'utf8')
      .digest('hex');

    /**
     * Compare the supplied token hash with the stored hash.
     */
    const isRefreshTokenValid =
      refreshTokenHash === user.refreshTokenHash;

    /**
     * Reject an invalid or previously rotated token.
     */
    if (!isRefreshTokenValid) {
      throw new UnauthorizedException(
        'Refresh token is not valid',
      );
    }

    /**
     * Construct a new payload for token rotation.
     */
    const newPayload = {
      sub: user.id,
      email: user.email,
      role: user.role?.name ?? null,
      jti: randomUUID(),
    };

    /**
     * Generate a new access token.
     */
    const accessToken =
      await this.jwtService.signAsync(newPayload);

    /**
     * Generate a new refresh token.
     */
    const newRefreshToken = jwt.sign(
      newPayload,
      refreshSecret,
      {
        expiresIn:
          refreshExpiresIn as jwt.SignOptions['expiresIn'],
      },
    );

    /**
     * Hash the new refresh token.
     */
    const newRefreshTokenHash = createHash('sha256')
      .update(newRefreshToken, 'utf8')
      .digest('hex');

    /**
     * Replace the previous refresh-token hash.
     *
     * This implements refresh-token rotation.
     */
    await this.usersService.updateRefreshTokenHash(
      user.id,
      newRefreshTokenHash,
    );

    /**
     * Return the newly generated tokens.
     */
    return {
      message: 'Token refreshed successfully',
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Logout the current user.
   *
   * Process:
   * 1. Hash the supplied refresh token.
   * 2. Find the user associated with that hash.
   * 3. Remove the stored refresh-token hash.
   *
   * Removing the stored hash invalidates the refresh token
   * and prevents it from being reused.
   */
  async logout(refreshToken: string) {
    /**
     * Hash the supplied refresh token.
     */
    const refreshTokenHash = createHash('sha256')
      .update(refreshToken, 'utf8')
      .digest('hex');

    /**
     * Find the user associated with the refresh-token hash.
     */
    const user =
      await this.usersService.findByRefreshTokenHash(
        refreshTokenHash,
      );

    /**
     * Reject an unknown refresh token.
     */
    if (!user) {
      throw new UnauthorizedException(
        'Refresh token is not valid',
      );
    }

    /**
     * Remove the stored refresh-token hash.
     *
     * This invalidates the refresh token.
     */
    await this.usersService.updateRefreshTokenHash(
      user.id,
      null,
    );

    return {
      message: 'Logout successful',
    };
  }

  /**
   * Request a password reset.
   *
   * Security:
   * - Does not reveal whether an email address exists.
   * - Generates a cryptographically secure random token.
   * - Stores only the SHA-256 token hash.
   * - Gives the token a short expiry period.
   */
  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
  ) {
    /**
     * Normalise the supplied email address.
     */
    const email =
      forgotPasswordDto.email
        .trim()
        .toLowerCase();

    /**
     * Find the user by email.
     */
    const user =
      await this.usersService.findByEmail(email);

    /**
     * Always return the same response when the account
     * does not exist. This prevents account enumeration.
     */
    if (!user) {
      return {
        message:
          'If an account is associated with this email address, password-reset instructions have been sent.',
      };
    }

    /**
     * Generate a 256-bit cryptographically secure token.
     *
     * The raw token is sent to the user by email.
     * Only its SHA-256 hash is stored in the database.
     */
    const rawToken =
      randomBytes(32).toString('hex');

    /**
     * Store only the SHA-256 hash.
     */
    const tokenHash =
      createHash('sha256')
        .update(rawToken, 'utf8')
        .digest('hex');

    /**
     * Token expires after 30 minutes.
     */
    const expiresAt =
      new Date(
        Date.now() + 30 * 60 * 1000,
      );

    /**
     * Store the reset-token hash and expiry.
     */
    await this.usersService.setPasswordResetToken(
      user.id,
      tokenHash,
      expiresAt,
    );

    /**
     * Build the frontend reset URL.
     */
    const frontendUrl =
      this.configService.get<string>(
        'FRONTEND_URL',
      ) ?? 'http://localhost:3001';

    const resetUrl =
      `${frontendUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;

    /**
     * Send the reset instructions.
     *
     * If delivery fails, remove the reset token so that
     * an unusable token is not left in the database.
     */
    try {
      await this.mailService.sendPasswordResetEmail(
        user.email,
        resetUrl,
      );
    } catch (error) {
      await this.usersService.clearPasswordResetToken(
        user.id,
      );

      console.error(
        'Password-reset email delivery failed:',
        error,
      );

      /**
       * Do not expose the mail-delivery failure or the
       * existence of the account to the caller.
       */
    }

    /**
     * Never return the token or reset URL.
     */
    return {
      message:
        'If an account is associated with this email address, password-reset instructions have been sent.',
    };
  }

  /**
   * Complete a password reset using a temporary token.
   *
   * Security:
   * - The supplied token is hashed before database lookup.
   * - Expired tokens are rejected.
   * - The token is invalidated after successful use.
   * - Existing refresh sessions are invalidated.
   * - Password confirmation is verified.
   */
  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ) {
    /**
     * Verify that the two new-password fields match.
     */
    if (
      resetPasswordDto.newPassword !==
      resetPasswordDto.confirmPassword
    ) {
      throw new BadRequestException(
        'New password and confirmation do not match',
      );
    }

    /**
     * Hash the supplied raw token before looking it up.
     *
     * The raw token is never stored in the database.
     */
    const tokenHash =
      createHash('sha256')
        .update(
          resetPasswordDto.token,
          'utf8',
        )
        .digest('hex');

    /**
     * Find the user associated with the reset-token hash.
     */
    const user =
      await this.usersService.findByPasswordResetTokenHash(
        tokenHash,
      );

    /**
     * Reject an unknown token.
     */
    if (!user) {
      throw new UnauthorizedException(
        'Invalid or expired password-reset token',
      );
    }

    /**
     * Verify token expiry.
     */
    if (
      !user.passwordResetExpiresAt ||
      user.passwordResetExpiresAt.getTime() <
        Date.now()
    ) {
      await this.usersService.clearPasswordResetToken(
        user.id,
      );

      throw new UnauthorizedException(
        'Invalid or expired password-reset token',
      );
    }

    /**
     * Reset the password.
     *
     * UsersService is responsible for:
     * - hashing the new password,
     * - invalidating the refresh token,
     * - clearing the password-reset token,
     * - recording the password-reset audit event.
     */
    await this.usersService.resetPassword(
      user.id,
      resetPasswordDto.newPassword,
      null,
    );

    return {
      message:
        'Password reset successful. You can now log in with your new password.',
    };
  }

  /**
   * Register a new public user.
   *
   * Process:
   * 1. Normalise the submitted email address.
   * 2. Validate password confirmation.
   * 3. Check for an existing email address.
   * 4. Check for an existing phone number.
   * 5. Delegate account creation to UsersService.
   * 6. Return a safe representation of the new user.
   *
   * Security:
   * - Public registration cannot specify an administrative role.
   * - The backend controls the role assigned to a public user.
   * - Password hashing is delegated to UsersService.
   * - Password hashes are never returned to the client.
   * - Refresh-token hashes are never returned to the client.
   *
   * Important:
   * A public registration request must never be trusted to
   * provide a role such as ADMIN, SUPER_ADMIN, MODERATOR, or
   * any other privileged role.
   */
  async register(registerDto: RegisterDto) {
    /**
     * Normalise the email address.
     *
     * This prevents duplicate accounts caused by differences
     * in capitalisation or accidental surrounding spaces.
     */
    const email =
      registerDto.email
        .trim()
        .toLowerCase();

    /**
     * Remove unnecessary spaces from the supplied name
     * and telephone number.
     */
    const fullName =
      registerDto.fullName.trim();

    const phone =
      registerDto.phone.trim();

    /**
     * Confirm that both password fields contain the same value.
     */
    if (
      registerDto.password !==
      registerDto.confirmPassword
    ) {
      throw new UnauthorizedException(
        'Password and confirm password do not match',
      );
    }

    /**
     * Check whether the email address is already registered.
     */
    const existingEmail =
      await this.usersService.findByEmail(email);

    if (existingEmail) {
      throw new UnauthorizedException(
        'An account with this email address already exists',
      );
    }

    /**
     * Check whether the phone number is already registered.
     */
    const existingPhone =
      await this.usersService.findByPhone(phone);

    if (existingPhone) {
      throw new UnauthorizedException(
        'An account with this phone number already exists',
      );
    }

    /**
     * Create the public user account.
     *
     * UsersService is responsible for:
     * - hashing the password,
     * - assigning the standard USER role,
     * - creating the database record,
     * - recording the registration audit event,
     * - returning a safe user representation.
     */
    const user =
      await this.usersService.createPublicUser({
        fullName,
        email,
        phone,
        password: registerDto.password,
      });

    /**
     * Return only safe information to the client.
     */
    return {
      message: 'Registration successful',
      user,
    };
  }

  /**
   * Get the currently authenticated user.
   *
   * @param userId
   * Unique identifier of the authenticated user.
   *
   * Returns:
   * A safe user representation provided by UsersService.
   */
  async me(userId: string) {
    return this.usersService.findOne(userId);
  }

  /**
 * Get the active organisation memberships of the currently
 * authenticated user.
 *
 * Security:
 * - The user ID comes from the authenticated JWT.
 * - The client cannot supply another user's ID.
 * - Only active memberships are returned.
 * - Only active organisations are returned.
 *
 * This provides the frontend with the organisation context
 * required by organisation-scoped modules such as Agents.
 */
async myOrganisations(userId: string) {
  const memberships =
    await this.organisationMembershipRepository.find({
      where: {
        userId,
        status: OrganisationMembershipStatus.ACTIVE,
        organisation: {
          status: OrganisationStatus.ACTIVE,
        },
      },
      relations: ['organisation', 'role'],
      order: {
        createdAt: 'ASC',
      },
    });

  return memberships.map((membership) => ({
    membershipId: membership.id,
    organisationId: membership.organisationId,
    organisationName: membership.organisation.name,
    organisationSlug: membership.organisation.slug,
    roleId: membership.roleId,
    roleName: membership.role.name,
    status: membership.status,
  }));
}

  /**
   * Change the password of the currently authenticated user.
   *
   * @param userId
   * Unique identifier of the user changing the password.
   *
   * @param currentPassword
   * The user's existing password.
   *
   * @param newPassword
   * The new password to be stored.
   *
   * @param actorId
   * Identifier of the user performing the action.
   * This is used for audit logging.
   *
   * Password validation, hashing and audit logging are
   * delegated to UsersService.
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