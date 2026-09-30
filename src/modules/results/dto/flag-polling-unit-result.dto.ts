/**
 * File:
 * C:\Projects\PeopleFirstPolitician\backend\src\modules\results\dto\flag-polling-unit-result.dto.ts
 *
 * Purpose:
 * Defines and validates the information supplied when flagging
 * a Polling Unit Result for review.
 *
 * Security:
 * - organisationId comes from the route.
 * - actorId comes from the authenticated JWT.
 * - result status is controlled by the service.
 * - flaggedByUserId is obtained from the authenticated user.
 * - flaggedAt is controlled by the service.
 * - A result cannot be flagged arbitrarily; the service validates
 *   the permitted result lifecycle and organisation context.
 */

import {
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';

export class FlagPollingUnitResultDto {
  /**
   * Reason why the result requires review.
   */
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  reason!: string;
}