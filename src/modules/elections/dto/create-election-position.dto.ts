/**
 * File:
 * C:\Projects\PeopleFirstPolitician\backend\src\modules\elections\dto\create-election-position.dto.ts
 *
 * Purpose:
 * - Defines the request payload for creating an Election Position.
 * - Validates the position code and name before they reach the service layer.
 * - Allows an optional description to provide additional information
 *   about the Election Position.
 *
 * Examples of Election Positions:
 * - President
 * - Governor
 * - Senator
 * - Member, House of Representatives
 * - Member, State House of Assembly
 * - LGA Chairman
 * - Councillor
 *
 * Security:
 * - This DTO does not accept organisationId.
 * - Organisation context is supplied by the authenticated API route.
 * - Permission enforcement is handled by the controller and
 *   PermissionsGuard.
 * - Organisation membership is independently verified by the service.
 *
 * Validation:
 * - code is required and limited to 60 characters.
 * - name is required and limited to 120 characters.
 * - description is optional.
 */

import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateElectionPositionDto {
  /**
   * Unique machine-readable code for the Election Position.
   *
   * Examples:
   * - PRESIDENT
   * - GOVERNOR
   * - SENATOR
   * - HOUSE_OF_REPRESENTATIVES
   */
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  code!: string;

  /**
   * Human-readable name of the Election Position.
   *
   * Examples:
   * - President
   * - Governor
   * - Senator
   * - Member, House of Representatives
   */
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  /**
   * Optional explanatory description of the Election Position.
   */
  @IsOptional()
  @IsString()
  description?: string;
}