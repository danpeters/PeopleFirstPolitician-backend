/**
 * File:
 * C:\Projects\PeopleFirstPolitician\backend\src\modules\elections\dto\create-election.dto.ts
 *
 * Purpose:
 * - Defines the request payload used to create an Election.
 * - Validates election information before it reaches the service layer.
 * - Keeps client-supplied data aligned with the Election entity.
 *
 * Security:
 * - This DTO does not contain organisationId.
 * - Organisation context must come from the authenticated request route
 *   and security context rather than from client-supplied request data.
 * - Authorisation is enforced separately through JwtAuthGuard,
 *   PermissionsGuard and the ElectionsService.
 *
 * Validation:
 * - Election name is required and limited to 180 characters.
 * - Election type is required and limited to 60 characters.
 * - Election date must be a valid ISO date string.
 * - Status is optional and, when supplied, must be a valid ElectionStatus.
 * - Description is optional.
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

export class CreateElectionDto {
  /**
   * Official name of the election.
   *
   * Example:
   * "2027 General Election"
   */
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  name!: string;

  /**
   * Type/category of election.
   *
   * Examples:
   * - "general"
   * - "off-cycle"
   * - "local"
   *
   * The application currently stores this as a controlled-length
   * string rather than an enum because the Election entity defines
   * electionType as varchar(60).
   */
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  electionType!: string;

  /**
   * Date on which the election is scheduled to take place.
   *
   * Must be supplied as a valid ISO date string.
   *
   * Example:
   * "2027-02-20"
   */
  @IsDateString()
  electionDate!: string;

  /**
   * Initial operational status of the election.
   *
   * When omitted, the Election entity/database default is DRAFT.
   */
  @IsOptional()
  @IsEnum(ElectionStatus)
  status?: ElectionStatus;

  /**
   * Optional description providing additional information
   * about the election.
   */
  @IsOptional()
  @IsString()
  description?: string;
}