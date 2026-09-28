/**
 * File: C:\Projects\PeopleFirstPolitician\backend\src\app.module.ts
 *
 * Purpose:
 * - Defines the root NestJS application module.
 * - Loads application configuration.
 * - Configures the PostgreSQL database connection.
 * - Registers application feature modules.
 * - Registers the global request-rate limiting configuration.
 * - Activates the global ThrottlerGuard.
 *
 * Security:
 * - Authentication and application endpoints are protected by
 *   the NestJS throttler infrastructure.
 * - Sensitive authentication endpoints can apply stricter
 *   endpoint-specific limits through @Throttle().
 * - Rate limiting helps reduce brute-force and automated abuse.
 * - Production database schema synchronisation remains disabled.
 * - Local development schema synchronisation remains temporarily
 *   enabled until TypeORM migrations are established.
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

import { AppController } from './app.controller';
import { AppService } from './app.service';
import authConfig from './config/auth.config';

// Application modules
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
    // Sensitive authentication endpoints use stricter limits
    // through @Throttle() in AuthController.
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
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],

      useFactory: (configService: ConfigService) => {
        const databaseUrl =
          configService.get<string>('DATABASE_URL');

        const nodeEnv =
          configService.get<string>('NODE_ENV');

        const isProduction =
          nodeEnv === 'production';

        // -------------------------------------------------------------
        // Railway / Production
        // -------------------------------------------------------------
        if (databaseUrl) {
          return {
            type: 'postgres' as const,
            url: databaseUrl,
            autoLoadEntities: true,

            // Production schema must not be modified automatically.
            // Database changes will be managed through migrations.
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
          autoLoadEntities: true,

          // Temporarily enabled for local development.
          // This will be replaced by migrations later.
          synchronize: true,

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
    // This activates the ThrottlerModule configuration for incoming
    // HTTP requests.
    //
    // Endpoint-specific @Throttle() decorators in controllers can
    // override the global baseline where required.
    //
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}