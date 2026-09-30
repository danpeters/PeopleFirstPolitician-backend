/**
 * File:
 * C:\Projects\PeopleFirstPolitician\backend\src\modules\agents\dto\update-agent.dto.ts
 *
 * Purpose:
 * Defines fields that may be changed after an Agent has been created.
 *
 * Security:
 * - organisationId cannot be changed through this DTO.
 * - status has its own controlled endpoint.
 * - deletedAt cannot be changed through this DTO.
 * - createdAt and updatedAt are database-managed.
 */

import {
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class UpdateAgentDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  middleName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  /**
   * Associates the Agent with an existing platform User.
   *
   * Supplying null is intentionally not supported here.
   * A future dedicated endpoint can safely detach the account.
   */
  @IsOptional()
  @IsUUID()
  userId?: string;

  /**
   * Photograph URL/storage reference.
   */
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  photoUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  identificationType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  identificationReference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  agentReference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string;
}