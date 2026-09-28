/**
 * File: C:\Projects\PeopleFirstPolitician\backend\src\data-source.ts
 *
 * Purpose:
 * TypeORM CLI DataSource configuration.
 *
 * This file is used for:
 * - TypeORM migrations
 * - Schema inspection
 * - Migration generation
 *
 * It does NOT initialise the NestJS application.
 *
 * Multi-tenant security:
 * - Organisation and OrganisationMembership entities are registered
 *   so that TypeORM can manage the multi-tenant security foundation.
 * - Tenant-owned records will be scoped to their organisation.
 * - Database schema changes must be applied through explicit migrations.
 */

import 'dotenv/config';

import { DataSource } from 'typeorm';

import { AuditLog } from './modules/audit/entities/audit-log.entity';
import { Lga } from './modules/geography/entities/lga.entity';
import { PollingUnit } from './modules/geography/entities/polling-unit.entity';
import { State } from './modules/geography/entities/state.entity';
import { Ward } from './modules/geography/entities/ward.entity';

import { Organisation } from './modules/organisations/entities/organisation.entity';
import { OrganisationMembership } from './modules/organisations/entities/organisation-membership.entity';

import { Permission } from './modules/roles/entities/permission.entity';
import { Role } from './modules/roles/entities/role.entity';
import { User } from './modules/users/entities/user.entity';

import { PoliticalParty } from './modules/political-parties/entities/political-party.entity';
import { OrganisationPoliticalParty } from './modules/political-parties/entities/organisation-political-party.entity';
import { PartySection } from './modules/political-parties/entities/party-section.entity';

import { Election } from './modules/elections/entities/election.entity';
import { ElectionPosition } from './modules/elections/entities/election-position.entity';
import { ElectoralScope } from './modules/elections/entities/electoral-scope.entity';
import { ElectoralScopePollingUnit } from './modules/elections/entities/electoral-scope-polling-unit.entity';

import { ElectionRace } from './modules/elections/entities/election-race.entity';
import { Candidate } from './modules/candidates/entities/candidate.entity';
import { Candidacy } from './modules/candidacies/entities/candidacy.entity';

import { Campaign } from './modules/campaigns/entities/campaign.entity';
import { CampaignMembership } from './modules/campaign-memberships/entities/campaign-membership.entity';

const isProduction = process.env.NODE_ENV === 'production';

const databaseUrl = process.env.DATABASE_URL;

export default new DataSource({
  type: 'postgres',

  ...(databaseUrl
    ? {
        url: databaseUrl,
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 5432,
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'people_first_politician',
      }),

      entities: [
        // Core audit
        AuditLog,

        // Geography
        Lga,
        PollingUnit,
        State,
        Ward,

        // Organisations / multi-tenant security
        Organisation,
        OrganisationMembership,

        // Elections
        Election,
        ElectionPosition,
        ElectoralScope,
        ElectoralScopePollingUnit,
        ElectionRace,

        // Candidates / candidacies
        Candidate,
        Candidacy,

        // Campaigns
	Campaign,
	CampaignMembership,
	// Political parties
	PoliticalParty,
        OrganisationPoliticalParty,
        PartySection,

        // Access control
        Permission,
        Role,
        User,
      ],

  migrations: [__dirname + '/migrations/*{.ts,.js}'],

  synchronize: false,

  logging: !isProduction,

  ...(databaseUrl && {
    ssl: {
      rejectUnauthorized: false,
    },
  }),
});