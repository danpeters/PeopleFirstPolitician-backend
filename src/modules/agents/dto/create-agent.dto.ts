/**
 * File:
 * C:\Projects\PeopleFirstPolitician\backend\src\modules\agents\dto\create-agent.dto.ts
 *
 * Purpose:
 * Defines and validates the fields permitted when creating an Agent.
 *
 * Security:
 * - organisationId is deliberately NOT accepted from the client.
 * - status is assigned by the service.
 * - audit fields are never accepted from the client.
 * - deletedAt is never accepted from the client.
 * - User/account association is handled by the service.
 */

import {
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateAgentDto {
  /**
   * Agent's first name.
   */
  @IsString()
  @MaxLength(100)
  firstName!: string;

  /**
   * Agent's middle name.
   */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  middleName?: string;

  /**
   * Agent's last name.
   */
  @IsString()
  @MaxLength(100)
  lastName!: string;

  /**
   * Optional display name used by the application.
   */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  displayName?: string;

  /**
   * Agent telephone number.
   */
  @IsString()
  @MaxLength(50)
  phone!: string;

  /**
   * Optional email address.
   */
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  /**
   * Optional existing platform user account associated with
   * this Agent.
   *
   * This does NOT create or modify the User account.
   */
  @IsOptional()
  @IsUUID()
  userId?: string;

  /**
   * Optional photograph URL/storage reference.
   *
   * Actual file upload/storage will be handled separately.
   */
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  photoUrl?: string;

  /**
   * Optional identification type.
   */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  identificationType?: string;

  /**
   * Optional identification reference.
   */
  @IsOptional()
  @IsString()
  @MaxLength(255)
  identificationReference?: string;

  /**
   * Optional unique organisation-level Agent reference.
   *
   * Example:
   * MSF-AGT-0001
   */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  agentReference?: string;

  /**
   * Optional administrative notes.
   */
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string;
}