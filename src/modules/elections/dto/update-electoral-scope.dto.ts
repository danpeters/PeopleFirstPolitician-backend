/**
 * File:
 * C:\Projects\PeopleFirstPolitician\backend\src\modules\elections\dto\update-electoral-scope.dto.ts
 *
 * Purpose:
 * - Defines the request payload for updating an existing Electoral Scope.
 * - Supports partial updates so that clients only submit fields
 *   that need to change.
 *
 * Security:
 * - organisationId is deliberately not accepted here.
 * - The organisation context comes from the authenticated API route.
 * - Permission enforcement is handled by the controller and
 *   PermissionsGuard.
 *
 * Validation:
 * - All fields are optional.
 * - scopeType, when supplied, must be a recognised ElectoralScopeType.
 * - name, when supplied, is limited to 180 characters.
 * - code, when supplied, is limited to 100 characters.
 * - stateId, lgaId and wardId, when supplied, must be UUIDs.
 *
 * Important:
 * - Business-rule validation remains in the service layer.
 * - The service must validate the complete resulting scope after
 *   applying the partial update.
 */

import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsString,
  MaxLength,
} from 'class-validator';

import {
  ElectoralScopeType,
} from '../entities/electoral-scope.entity';

export class UpdateElectoralScopeDto {
  /**
   * Type of Electoral Scope.
   */
  @IsOptional()
  @IsEnum(ElectoralScopeType)
  scopeType?: ElectoralScopeType;

  /**
   * Human-readable name of the Electoral Scope.
   */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  name?: string;

  /**
   * Optional machine-readable electoral scope code.
   */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  code?: string;

  /**
   * State associated with the Electoral Scope.
   */
  @IsOptional()
  @IsUUID()
  stateId?: string;

  /**
   * LGA associated with the Electoral Scope.
   */
  @IsOptional()
  @IsUUID()
  lgaId?: string;

  /**
   * Ward associated with the Electoral Scope.
   */
  @IsOptional()
  @IsUUID()
  wardId?: string;
}