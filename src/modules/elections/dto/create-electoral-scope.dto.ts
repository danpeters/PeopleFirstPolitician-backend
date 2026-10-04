/**
 * File:
 * C:\Projects\PeopleFirstPolitician\backend\src\modules\elections\dto\create-electoral-scope.dto.ts
 *
 * Purpose:
 * - Defines the request payload for creating an Electoral Scope.
 * - Supports the geographical scope levels represented by the
 *   current ElectoralScope database model.
 *
 * Supported scope types:
 * - national
 * - state
 * - senatorial_district
 * - federal_constituency
 * - state_constituency
 * - local_government
 * - ward
 * - polling_unit
 *
 * Important:
 * - State, LGA and Ward relationships are represented directly
 *   by ElectoralScope.
 * - Polling Units are associated through the separate
 *   ElectoralScopePollingUnit mapping.
 * - Senatorial districts and constituencies do not currently
 *   have dedicated geography entities in the database model.
 *   The service layer must therefore reject unsupported
 *   relationship data rather than inventing it.
 *
 * Security:
 * - organisationId is deliberately not accepted here.
 * - Authentication and organisation context come from the API route.
 * - Permission enforcement is handled by the controller and
 *   PermissionsGuard.
 *
 * Validation:
 * - scopeType is required and must be a recognised ElectoralScopeType.
 * - name is required and limited to 180 characters.
 * - code is optional and limited to 100 characters.
 * - stateId, lgaId and wardId are optional UUIDs.
 *
 * Business-rule validation, including which geography fields are
 * required for each scope type, belongs in the service layer.
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

export class CreateElectoralScopeDto {
  /**
   * Type of Electoral Scope.
   */
  @IsEnum(ElectoralScopeType)
  scopeType!: ElectoralScopeType;

  /**
   * Human-readable name of the Electoral Scope.
   *
   * Examples:
   * - Nigeria
   * - Abia State
   * - Aba North
   * - Ariaria Market
   */
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  name!: string;

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