/**
 * File:
 * C:\Projects\PeopleFirstPolitician\backend\src\modules\results\dto\update-polling-unit-result.dto.ts
 *
 * Purpose:
 * Defines and validates the fields permitted when updating
 * a Polling Unit Result while it is still a draft.
 *
 * Security:
 * - organisationId comes from the route.
 * - actorId comes from the authenticated JWT.
 * - status is controlled by the service.
 * - verification fields are never accepted from the client.
 * - AgentAssignment cannot be changed through this DTO.
 * - Election, ElectionRace and Polling Unit cannot be changed
 *   after the result has been created.
 */

import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdatePollingUnitResultVoteDto {
  /**
   * Candidacy receiving the recorded votes.
   */
  @IsUUID()
  candidacyId!: string;

  /**
   * Updated number of votes recorded for the Candidacy.
   */
  @IsInt()
  @Min(0)
  votes!: number;
}

export class UpdatePollingUnitResultDto {
  /**
   * Updated vote records for the Election Race.
   *
   * The service will validate that every Candidacy belongs
   * to the same Election Race as the result.
   */
  @IsArray()
  @ArrayMinSize(0)
  @ValidateNested({ each: true })
  @Type(() => UpdatePollingUnitResultVoteDto)
  votes!: UpdatePollingUnitResultVoteDto[];
}