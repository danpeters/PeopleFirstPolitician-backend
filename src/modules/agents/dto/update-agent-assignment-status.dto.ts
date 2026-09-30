/**
 * File:
 * C:\Projects\PeopleFirstPolitician\backend\src\modules\agents\dto\update-agent-assignment-status.dto.ts
 *
 * Purpose:
 * Defines the controlled input used to change the status
 * of an Agent Assignment.
 *
 * Security:
 * - Status changes are performed only through the service.
 * - Authentication and authorisation are enforced by the controller.
 * - Assignment ownership and organisation access are verified
 *   by the service.
 * - Audit logging is performed by the service.
 */

import { IsEnum } from 'class-validator';

import { AgentAssignmentStatus } from '../entities/agent-assignment.entity';

export class UpdateAgentAssignmentStatusDto {
  /**
   * New Agent Assignment status.
   */
  @IsEnum(AgentAssignmentStatus)
  status!: AgentAssignmentStatus;
}