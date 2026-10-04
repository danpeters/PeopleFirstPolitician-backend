/**
 * File:
 * C:\Projects\PeopleFirstPolitician\backend\src\modules\elections\dto\update-election-position.dto.ts
 *
 * Purpose:
 * - Defines the request payload for updating an existing Election Position.
 * - Allows individual Election Position fields to be changed without
 *   requiring the complete record to be resubmitted.
 *
 * Security:
 * - This DTO does not accept organisationId.
 * - Organisation context is supplied by the authenticated API route.
 * - Permission enforcement is handled by the controller and
 *   PermissionsGuard.
 * - Organisation membership is independently verified by the service.
 *
 * Validation:
 * - All fields are optional because this DTO supports partial updates.
 * - code, when supplied, is limited to 60 characters.
 * - name, when supplied, is limited to 120 characters.
 * - description, when supplied, must be a string.
 *
 * Important:
 * - The Election Position ID is supplied through the API route.
 * - Only fields explicitly supplied by the client are updated.
 */

import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateElectionPositionDto {
  /**
   * Updated unique machine-readable code for the Election Position.
   *
   * Examples:
   * - PRESIDENT
   * - GOVERNOR
   * - SENATOR
   * - HOUSE_OF_REPRESENTATIVES
   */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  code?: string;

  /**
   * Updated human-readable name of the Election Position.
   */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name?: string;

  /**
   * Updated explanatory description of the Election Position.
   *
   * An empty string may be supplied when the description should
   * be cleared by the service layer.
   */
  @IsOptional()
  @IsString()
  description?: string;
}