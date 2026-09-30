/**
 * File:
 * C:\Projects\PeopleFirstPolitician\backend\src\modules\agents\dto\update-agent-status.dto.ts
 *
 * Purpose:
 * Defines the controlled input used to activate, deactivate,
 * or suspend an Agent.
 *
 * Security:
 * Agent status is changed only through the service after
 * authentication, authorisation and Agent existence checks.
 */

import { IsEnum } from 'class-validator';

import { AgentStatus } from '../entities/agent.entity';

export class UpdateAgentStatusDto {
  /**
   * New Agent status.
   */
  @IsEnum(AgentStatus)
  status!: AgentStatus;
}