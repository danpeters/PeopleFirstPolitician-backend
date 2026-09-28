/**
 * File:
 * C:\Projects\PeopleFirstPolitician\backend\src\app.module.ts
 *
 * Purpose:
 * - Defines the root NestJS application module.
 * - Loads application configuration.
 * - Configures the PostgreSQL database connection.
 * - Registers all application entities explicitly with TypeORM.
 * - Registers application feature modules.
 * - Registers the global request-rate limiting configuration.
 * - Activates the global ThrottlerGuard.
 *
 * Database architecture:
 * - PostgreSQL is the application database.
 * - TypeORM migrations are the authoritative mechanism for
 *   database schema changes.
 * - Automatic schema synchronisation is disabled.
 * - Entities are explicitly registered so that all TypeORM
 *   relationships are available at runtime.
 *
 * Security:
 * - Authentication and application endpoints are protected by
 *   the NestJS throttler infrastructure.
 * - Sensitive authentication endpoints can apply stricter
 *   endpoint-specific limits through @Throttle().
 * - Rate limiting helps reduce brute-force and automated abuse.
 * - Database schema synchronisation is disabled.
 * - Database changes must be made through explicit migrations.
 * - Explicit entity registration prevents incomplete ORM metadata
 *   discovery when a domain entity is not directly owned by a
 *   currently exposed NestJS feature module.
 */

import { Module } from '@nestjs/common';
import {
  ConfigModule,
  ConfigService,
} from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import {
  ThrottlerGuard,
  ThrottlerModule,
} from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';

// Root application
import { AppController } from './app.controller';
import { AppService } from './app.service';
import authConfig from './config/auth.config';

// -------------------------------------------------------------------
// Core entities
// -------------------------------------------------------------------
import { AuditLog } from './modules/audit/entities/audit-log.entity';

// -------------------------------------------------------------------
// Geography entities
// -------------------------------------------------------------------
import { Lga } from './modules/geography/entities/lga.entity';
import { PollingUnit } from './modules/geography/entities/polling-unit.entity';
import { State } from './modules/geography/entities/state.entity';
import { Ward } from './modules/geography/entities/ward.entity';

// -------------------------------------------------------------------
// Organisation entities
// -------------------------------------------------------------------
import { Organisation } from './modules/organisations/entities/organisation.entity';
import { OrganisationMembership } from './modules/organisations/entities/organisation-membership.entity';

// -------------------------------------------------------------------
// Political party entities
// -------------------------------------------------------------------
import { PoliticalParty } from './modules/political-parties/entities/political-party.entity';
import { OrganisationPoliticalParty } from './modules/political-parties/entities/organisation-political-party.entity';
import { PartySection } from './modules/political-parties/entities/party-section.entity';

// -------------------------------------------------------------------
// Election entities
// -------------------------------------------------------------------
import { Election } from './modules/elections/entities/election.entity';
import { ElectionPosition } from './modules/elections/entities/election-position.entity';
import { ElectoralScope } from './modules/elections/entities/electoral-scope.entity';
import { ElectoralScopePollingUnit } from './modules/elections/entities/electoral-scope-polling-unit.entity';
import { ElectionRace } from './modules/elections/entities/election-race.entity';

// -------------------------------------------------------------------
// Candidate / candidacy entities
// -------------------------------------------------------------------
import { Candidate } from './modules/candidates/entities/candidate.entity';
import { Candidacy } from './modules/candidacies/entities/candidacy.entity';

// -------------------------------------------------------------------
// Campaign entities
// -------------------------------------------------------------------
import { Campaign } from './modules/campaigns/entities/campaign.entity';
import { CampaignMembership } from './modules/campaign-memberships/entities/campaign-membership.entity';

// -------------------------------------------------------------------
// Access-control entities
// -------------------------------------------------------------------
import { Permission } from './modules/roles/entities/permission.entity';
import { Role } from './modules/roles/entities/role.entity';
import { RolePermission } from './modules/roles/entities/role-permission.entity';

// -------------------------------------------------------------------
// User entity
// -------------------------------------------------------------------
import { User } from './modules/users/entities/user.entity';

// -------------------------------------------------------------------
// Application feature modules
// -------------------------------------------------------------------
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { AuditModule } from './modules/audit/audit.module';
import { GeographyModule } from './modules/geography/geography.module';
import { CampaignMembershipsModule } from './modules/campaign-memberships/campaign-memberships.module';

@Module({
  imports: [
    // ---------------------------------------------------------------
    // Global configuration
    // ---------------------------------------------------------------
    ConfigModule.forRoot({
      isGlobal: true,
      load: [authConfig],
    }),

    // ---------------------------------------------------------------
    // Global rate limiting configuration
    // ---------------------------------------------------------------
    //
    // Baseline:
    // - 60 requests per 60 seconds per client.
    //
    // Sensitive authentication endpoints can use stricter
    // endpoint-specific limits through @Throttle().
    //
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 60,
      },
    ]),

    // ---------------------------------------------------------------
    // Database connection
    // ---------------------------------------------------------------
    //
    // IMPORTANT:
    // TypeORM migrations are now the authoritative mechanism for
    // schema changes. Therefore synchronize MUST remain false.
    //
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],

      useFactory: (configService: ConfigService) => {
        const databaseUrl =
          configService.get<string>('DATABASE_URL');

        const nodeEnv =
          configService.get<string>('NODE_ENV');

        const isProduction =
          nodeEnv === 'production';

        const entities = [
          // Core audit
          AuditLog,

          // Geography
          Lga,
          PollingUnit,
          State,
          Ward,

          // Organisations
          Organisation,
          OrganisationMembership,

          // Political parties
          PoliticalParty,
          OrganisationPoliticalParty,
          PartySection,

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

          // Access control
          Permission,
          Role,
          RolePermission,

          // Users
          User,
        ];

        // -------------------------------------------------------------
        // Railway / Production
        // -------------------------------------------------------------
        if (databaseUrl) {
          return {
            type: 'postgres' as const,
            url: databaseUrl,
            entities,

            // Schema changes are handled exclusively by migrations.
            synchronize: false,

            ssl: {
              rejectUnauthorized: false,
            },
          };
        }

        // -------------------------------------------------------------
        // Local development
        // -------------------------------------------------------------
        return {
          type: 'postgres' as const,
          host: configService.get<string>('DB_HOST'),
          port:
            Number(
              configService.get<string>('DB_PORT'),
            ) || 5432,
          username:
            configService.get<string>('DB_USERNAME'),
          password:
            configService.get<string>('DB_PASSWORD'),
          database:
            configService.get<string>('DB_NAME'),

          entities,

          // Schema changes are handled exclusively by migrations.
          synchronize: false,

          ...(isProduction && {
            ssl: {
              rejectUnauthorized: false,
            },
          }),
        };
      },
    }),

    // ---------------------------------------------------------------
    // Application modules
    // ---------------------------------------------------------------
    AuthModule,
    UsersModule,
    RolesModule,
    AuditModule,
    GeographyModule,
    CampaignMembershipsModule,
  ],

  controllers: [
    AppController,
  ],

  providers: [
    AppService,

    // -------------------------------------------------------------
    // Global rate-limiting guard
    // -------------------------------------------------------------
    //
    // Activates the ThrottlerModule configuration for incoming
    // HTTP requests.
    //
    // Endpoint-specific @Throttle() decorators can override the
    // global baseline where required.
    //
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}