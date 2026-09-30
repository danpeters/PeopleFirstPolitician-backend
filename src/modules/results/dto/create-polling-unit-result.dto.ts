/**
 * File:
 * C:\Projects\PeopleFirstPolitician\backend\src\modules\results\dto\create-polling-unit-result.dto.ts
 *
 * Purpose:
 * Defines and validates the fields permitted when creating
 * a draft Polling Unit Result.
 *
 * Security:
 * - organisationId comes from the route.
 * - submittedByUserId comes from the authenticated JWT.
 * - status is assigned by the service.
 * - submittedAt/synchronizedAt/verifiedAt are controlled by the service.
 * - verification and flagging fields are never accepted from the client.
 * - AgentAssignment is validated by the service.
 * - Candidacies are validated against the ElectionRace by the service.
 */

import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PollingUnitResultVoteDto {
  /**
   * Candidacy receiving the recorded votes.
   */
  @IsUUID()
  candidacyId!: string;

  /**
   * Number of votes recorded for the Candidacy.
   */
  @IsInt()
  @Min(0)
  votes!: number;
}

export class CreatePollingUnitResultDto {
  /**
   * Client-generated idempotency reference.
   *
   * This is particularly important for offline submission because
   * a device may retry synchronization after a network interruption.
   */
  @IsString()
  @IsNotEmpty()
  clientReference!: string;

  /**
   * Election to which the result belongs.
   */
  @IsUUID()
  electionId!: string;

  /**
   * Election Race to which the result belongs.
   */
  @IsUUID()
  electionRaceId!: string;

  /**
   * Polling Unit where the result was recorded.
   */
  @IsUUID()
  pollingUnitId!: string;

  /**
   * Agent Assignment authorising the field submission.
   */
  @IsUUID()
  agentAssignmentId!: string;

  /**
   * Vote records for the Candidacies contesting the Election Race.
   */
  @IsArray()
  @ArrayMinSize(0)
  @ValidateNested({ each: true })
  @Type(() => PollingUnitResultVoteDto)
  votes!: PollingUnitResultVoteDto[];
}