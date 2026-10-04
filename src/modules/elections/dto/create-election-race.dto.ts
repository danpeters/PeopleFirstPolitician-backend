/**
 * File:
 * C:\Projects\PeopleFirstPolitician\backend\src\modules\elections\dto\create-election-race.dto.ts
 *
 * Purpose:
 * Defines validated input for creating an Election Race.
 *
 * Security:
 * - Organisation context is supplied by the route and is not accepted
 *   from this DTO.
 * - Referenced Election, Election Position and Electoral Scope records
 *   are validated by the service layer.
 */

import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

import { ElectionRaceStatus } from '../entities/election-race.entity';

export class CreateElectionRaceDto {
  @IsUUID()
  electionId!: string;

  @IsUUID()
  electionPositionId!: string;

  @IsUUID()
  electoralScopeId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  code!: string;

  @IsOptional()
  @IsEnum(ElectionRaceStatus)
  status?: ElectionRaceStatus;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;
}