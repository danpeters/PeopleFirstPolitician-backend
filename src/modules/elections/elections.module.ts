/**
 * File:
 * C:\Projects\PeopleFirstPolitician\backend\src\modules\elections\elections.module.ts
 *
 * Purpose:
 * - Defines the Elections feature module.
 * - Registers all Election-domain repositories used by the feature.
 * - Registers Election, Election Position and Electoral Scope services.
 * - Registers Election, Election Position and Electoral Scope controllers.
 * - Imports AuditModule for administrative audit logging.
 * - Imports RolesModule for database-backed permission enforcement.
 *
 * Security:
 * - Election endpoints use JwtAuthGuard and PermissionsGuard
 *   at controller level.
 * - Election Position endpoints use JwtAuthGuard and
 *   PermissionsGuard at controller level.
 * - Electoral Scope endpoints use JwtAuthGuard and
 *   PermissionsGuard at controller level.
 * - Services independently verify active organisation membership
 *   before performing organisation-scoped operations.
 * - This module does not grant permissions by itself.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Election } from './entities/election.entity';
import { ElectionPosition } from './entities/election-position.entity';
import { ElectionRace } from './entities/election-race.entity';
import { ElectoralScope } from './entities/electoral-scope.entity';
import { ElectoralScopePollingUnit } from './entities/electoral-scope-polling-unit.entity';

import { ElectionsService } from './elections.service';
import { ElectionPositionsService } from './election-positions.service';
import { ElectoralScopesService } from './electoral-scopes.service';

import { ElectionsController } from './elections.controller';
import { ElectionPositionsController } from './election-positions.controller';
import { ElectoralScopesController } from './electoral-scopes.controller';

import { AuditModule } from '../audit/audit.module';
import { RolesModule } from '../roles/roles.module';

import { OrganisationMembership } from '../organisations/entities/organisation-membership.entity';

import { State } from '../geography/entities/state.entity';
import { Lga } from '../geography/entities/lga.entity';
import { Ward } from '../geography/entities/ward.entity';
import { PollingUnit } from '../geography/entities/polling-unit.entity';

import { ElectionRacesService } from './election-races.service';
import { ElectionRacesController } from './election-races.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Election,
      ElectionPosition,
      ElectionRace,
      ElectoralScope,
      ElectoralScopePollingUnit,
      OrganisationMembership,
      State,
      Lga,
      Ward,
      PollingUnit,
    ]),

    AuditModule,

    RolesModule,
  ],

  controllers: [
    ElectionsController,
    ElectionPositionsController,
    ElectoralScopesController,
    ElectionRacesController,
  ],

  providers: [
    ElectionsService,
    ElectionPositionsService,
    ElectoralScopesService,
    ElectionRacesService,
  ],

  exports: [
    TypeOrmModule,
    ElectionsService,
    ElectionPositionsService,
    ElectoralScopesService,
    ElectionRacesService,
  ],

})
export class ElectionsModule {}