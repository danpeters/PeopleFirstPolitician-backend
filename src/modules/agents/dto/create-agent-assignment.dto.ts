/**
 * File:
 * C:\Projects\PeopleFirstPolitician\backend\src\modules\agents\dto\create-agent-assignment.dto.ts
 *
 * Purpose:
 * Defines and validates the fields permitted when assigning
 * an Agent to a Polling Unit within a Campaign.
 *
 * Security:
 * - assignedByUserId is obtained from the authenticated user.
 * - status is assigned by the service.
 * - assignedAt is assigned by the service.
 * - unassignedAt is controlled by the service.
 * - deletedAt is never accepted from the client.
 *
 * Important:
 * - The Agent, Campaign and Polling Unit must be validated
 *   by the service before the assignment is created.
 * - The Campaign must belong to the requesting Organisation.
 * - The Agent must belong to the requesting Organisation.
 * - The Polling Unit must be compatible with the Campaign's
 *   ElectionRace/ElectoralScope.
 */

import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateAgentAssignmentDto {
  /**
   * Agent being assigned.
   */
  @IsUUID()
  agentId!: string;

  /**
   * Campaign within which the Agent will operate.
   */
  @IsUUID()
  campaignId!: string;

  /**
   * Polling Unit to which the Agent will be assigned.
   */
  @IsUUID()
  pollingUnitId!: string;

  /**
   * Optional administrative notes about the assignment.
   */
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string;
}