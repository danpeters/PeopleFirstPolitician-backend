/**
 * File:
 * C:\Projects\PeopleFirstPolitician\backend\src\modules\results\results.module.ts
 *
 * Purpose:
 * - Defines the Election Results feature module.
 * - Registers all repositories required by ResultsService.
 * - Imports AgentsModule for AgentAssignment repository access.
 * - Imports RolesModule for PermissionsGuard and permission repositories.
 * - Registers the ResultsController.
 * - Imports AuditModule so result lifecycle actions are auditable.
 *
 * Security:
 * - Result permissions are only the capability layer.
 * - Contextual validation ensures that users can only access
 *   results permitted by their organisation, campaign, assignment,
 *   election race and polling-unit context.
 * - AgentAssignment validation is handled through AgentsModule.
 * - Fine-grained permission enforcement is handled through RolesModule.
 * - Result verification enforces separation between
 *   submission and verification.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AgentsModule } from '../agents/agents.module';
import { AuditModule } from '../audit/audit.module';
import { RolesModule } from '../roles/roles.module';

import { Agent } from '../agents/entities/agent.entity';
import { Campaign } from '../campaigns/entities/campaign.entity';
import { Candidacy } from '../candidacies/entities/candidacy.entity';
import { Election } from '../elections/entities/election.entity';
import { ElectionRace } from '../elections/entities/election-race.entity';
import { PollingUnit } from '../geography/entities/polling-unit.entity';
import { User } from '../users/entities/user.entity';

import { PollingUnitResult } from './entities/polling-unit-result.entity';
import { PollingUnitResultVote } from './entities/polling-unit-result-vote.entity';
import { ResultEvidence } from './entities/result-evidence.entity';

import { ResultsController } from './results.controller';
import { ResultsService } from './results.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PollingUnitResult,
      PollingUnitResultVote,
      ResultEvidence,

      Agent,
      Campaign,
      Candidacy,
      Election,
      ElectionRace,
      PollingUnit,
      User,
    ]),

    AgentsModule,

    AuditModule,

    RolesModule,
  ],

  controllers: [
    ResultsController,
  ],

  providers: [
    ResultsService,
  ],

  exports: [
    ResultsService,
    TypeOrmModule,
  ],
})
export class ResultsModule {}