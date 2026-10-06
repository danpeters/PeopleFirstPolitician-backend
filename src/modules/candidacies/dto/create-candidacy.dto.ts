/**
 * File:
 * C:\Projects\PeopleFirstPolitician\backend\src\modules\candidacies\dto\create-candidacy.dto.ts
 *
 * Purpose:
 * Defines the validated request payload used to create a Candidacy.
 *
 * Domain:
 * - Candidate identifies the person contesting.
 * - ElectionRace identifies the specific electoral contest.
 * - PoliticalParty identifies the party under which the candidate contests.
 * - PartySection optionally identifies the relevant party organisational
 *   section.
 *
 * Important:
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

export class CreateCandidacyDto {
  /**
   * Candidate participating in the electoral contest.
   */
  @IsUUID()
  candidateId!: string;

  /**
   * Specific ElectionRace being contested.
   */
  @IsUUID()
  electionRaceId!: string;

  /**
   * Political party under which the candidate contests.
   */
  @IsUUID()
  politicalPartyId!: string;

  /**
   * Optional party organisational section associated with
   * the candidacy.
   */
  @IsOptional()
  @IsUUID()
  partySectionId?: string;

  /**
   * Initial lifecycle status of the candidacy.
   */
  @IsOptional()
  @IsEnum(CandidacyStatus)
  status?: CandidacyStatus;

  /**
   * Optional nomination or reference number.
   */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  nominationReference?: string;

  /**
   * Optional administrative notes.
   */
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string;
}