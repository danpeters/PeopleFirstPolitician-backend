/**
 * File:
 * src/modules/candidacies/candidacies.module.ts
 *
 * Purpose:
 * - Defines the Candidacies feature module.
 * - Registers the Candidacy domain repositories required by
 *   CandidaciesService.
 * - Provides the CandidaciesController HTTP endpoints.
 * - Imports AuditModule for audit logging.
 * - Imports RolesModule for database-backed permission enforcement.
 *
 * Security:
 * - JWT authentication is enforced by the controller.
 * - Fine-grained permissions are enforced through PermissionsGuard.
 * - Organisation membership is independently validated by
 *   CandidaciesService.
 * - Political-party ownership by the organisation is independently
 *   validated by CandidaciesService.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Candidacy } from './entities/candidacy.entity';

import { Candidate } from '../candidates/entities/candidate.entity';

import { ElectionRace } from '../elections/entities/election-race.entity';

import { PoliticalParty } from '../political-parties/entities/political-party.entity';
import { PartySection } from '../political-parties/entities/party-section.entity';
import { OrganisationPoliticalParty } from '../political-parties/entities/organisation-political-party.entity';

import { OrganisationMembership } from '../organisations/entities/organisation-membership.entity';

import { AuditModule } from '../audit/audit.module';
import { RolesModule } from '../roles/roles.module';

import { CandidaciesController } from './candidacies.controller';
import { CandidaciesService } from './candidacies.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Candidacy,
      Candidate,
      ElectionRace,
      PoliticalParty,
      PartySection,
      OrganisationPoliticalParty,
      OrganisationMembership,
    ]),

    AuditModule,

    RolesModule,
  ],

  controllers: [
    CandidaciesController,
  ],

  providers: [
    CandidaciesService,
  ],

  exports: [
    TypeOrmModule,
    CandidaciesService,
  ],
})
export class CandidaciesModule {}