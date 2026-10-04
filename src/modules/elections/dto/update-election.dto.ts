/**
 * File:
 * C:\Projects\PeopleFirstPolitician\backend\src\modules\elections\dto\update-election.dto.ts
 *
 * Purpose:
 * - Defines the request payload used to update an Election.
 * - Allows individual Election fields to be updated without
 *   requiring the complete Election record.
 * - Validates supplied values before they reach the service layer.
 *
 * Security:
 * - This DTO does not contain organisationId.
 * - The Election identifier and organisation context are supplied
 *   through the authenticated request route.
 * - Authorisation is enforced separately through JwtAuthGuard,
 *   PermissionsGuard and the ElectionsService.
 *
 * Update behaviour:
 * - All fields are optional.
 * - Only fields explicitly supplied by the client are updated.
 * - Election status is restricted to the defined ElectionStatus values.
 */

import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

import { ElectionStatus } from '../entities/election.entity';

export class UpdateElectionDto {
  /**
   * Updated official name of the election.
   */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  name?: string;

  /**
   * Updated type/category of the election.
   */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  electionType?: string;

  /**
   * Updated scheduled election date.
   *
   * Must be supplied as a valid ISO date string when provided.
   */
  @IsOptional()
  @IsDateString()
  electionDate?: string;

  /**
   * Updated operational status of the election.
   */
  @IsOptional()
  @IsEnum(ElectionStatus)
  status?: ElectionStatus;

  /**
   * Updated description of the election.
   */
  @IsOptional()
  @IsString()
  description?: string;
}