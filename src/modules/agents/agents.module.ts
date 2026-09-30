/**
 * File:
 * C:\Projects\PeopleFirstPolitician\backend\src\modules\agents\agents.module.ts
 *
 * Purpose:
 * - Defines the Agents feature module.
 * - Registers Agent and AgentAssignment repositories.
 * - Registers User and OrganisationMembership repositories required
 *   for organisation-scoped authorisation.
 * - Imports AuditModule so AgentsService can record audit events.
 * - Imports RolesModule so the AgentsController can use the
 *   database-backed PermissionsGuard and permission repositories.
 * - Registers the Agents controller and service.
 *
 * Security:
 * - Agent access is organisation-scoped.
 * - OrganisationMembership is used to verify that the requesting
 *   user belongs to the organisation being accessed.
 * - Fine-grained Agent permissions are enforced through
 *   PermissionsGuard.
 * - Audit logging is provided through AuditModule.
 * - This module does not grant permissions by itself.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Agent } from './entities/agent.entity';
import { AgentAssignment } from './entities/agent-assignment.entity';

import { User } from '../users/entities/user.entity';

import { OrganisationMembership } from '../organisations/entities/organisation-membership.entity';

import { Campaign } from '../campaigns/entities/campaign.entity';
import { Candidacy } from '../candidacies/entities/candidacy.entity';

import { ElectionRace } from '../elections/entities/election-race.entity';
import { ElectoralScope } from '../elections/entities/electoral-scope.entity';

import { PollingUnit } from '../geography/entities/polling-unit.entity';
import { Ward } from '../geography/entities/ward.entity';
import { Lga } from '../geography/entities/lga.entity';

import { AuditModule } from '../audit/audit.module';

import { RolesModule } from '../roles/roles.module';

import { AgentsService } from './agents.service';
import { AgentsController } from './agents.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Agent,
      AgentAssignment,
      User,
      OrganisationMembership,
      Campaign,
      Candidacy,
      ElectionRace,
      ElectoralScope,
      PollingUnit,
      Ward,
      Lga,
    ]),

    AuditModule,

    /**
     * Provides:
     * - PermissionsGuard
     * - Role
     * - Permission
     * - RolePermission repositories
     */
    RolesModule,
  ],

  controllers: [
    AgentsController,
  ],

  providers: [
    AgentsService,
  ],

  exports: [
    TypeOrmModule,
    AgentsService,
  ],
})
export class AgentsModule {}