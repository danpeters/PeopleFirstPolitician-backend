/**
 * File:
 * C:\Projects\PeopleFirstPolitician\backend\src\modules\candidacies\dto\update-candidacy.dto.ts
 *
 * Purpose:
 * Defines the validated request payload used to update an existing
 * Candidacy.
 *
 * Important:
 * - All fields are optional because the update operation is partial.
 * - Cross-entity business rules are enforced by the Candidacy service.
 * - This DTO is responsible for request validation and shape only.
 */

import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

import { CandidacyStatus } from '../entities/candidacy.entity';

export class UpdateCandidacyDto {
  /**
   * Candidate participating in the electoral contest.
   */
  @IsOptional()
  @IsUUID()
  candidateId?: string;

  /**
   * Specific ElectionRace being contested.
   */
  @IsOptional()
  @IsUUID()
  electionRaceId?: string;

  /**
   * Political party under which the candidate contests.
   */
  @IsOptional()
  @IsUUID()
  politicalPartyId?: string;

  /**
   * Optional party organisational section associated with
   * the candidacy.
   */
  @IsOptional()
  @IsUUID()
  partySectionId?: string | null;

  /**
   * Updated lifecycle status of the candidacy.
   */
  @IsOptional()
  @IsEnum(CandidacyStatus)
  status?: CandidacyStatus;

  /**
   * Updated nomination or reference number.
   */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  nominationReference?: string | null;

  /**
   * Updated administrative notes.
   */
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string | null;
}
