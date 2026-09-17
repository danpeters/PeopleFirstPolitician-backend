// src/app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Import modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { AuditModule } from './modules/audit/audit.module';
import { GeographyModule } from './modules/geography/geography.module';

/**
 * Application module.
 *
 * Geography module provides:
 * - States
 * - LGAs
 * - Wards
 * - Polling Units
 *
 * Database:
 * - Railway/production uses DATABASE_URL.
 * - Local development uses DB_* variables.
 * - Production schema synchronisation is disabled.
 * - Local schema synchronisation remains enabled temporarily
 *   until TypeORM migrations are established.
 */

@Module({
  imports: [
    // Load environment variables
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Database connection (Railway + Local)
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('DATABASE_URL');
        const nodeEnv = configService.get<string>('NODE_ENV');

        const isProduction = nodeEnv === 'production';

        // Railway / Production
        if (databaseUrl) {
          return {
            type: 'postgres' as const,
            url: databaseUrl,
            autoLoadEntities: true,

            // Production database schema must not be
            // modified automatically.
            // Schema changes will be managed with migrations.
            synchronize: false,

            ssl: {
              rejectUnauthorized: false,
            },
          };
        }

        // Local development
        return {
          type: 'postgres' as const,
          host: configService.get<string>('DB_HOST'),
          port: Number(configService.get<string>('DB_PORT')) || 5432,
          username: configService.get<string>('DB_USERNAME'),
          password: configService.get<string>('DB_PASSWORD'),
          database: configService.get<string>('DB_NAME'),
          autoLoadEntities: true,

          // Temporarily enabled for local development.
          synchronize: true,

          ...(isProduction && {
            ssl: {
              rejectUnauthorized: false,
            },
          }),
        };
      },
    }),

    // Application modules
    AuthModule,
    UsersModule,
    RolesModule,
    AuditModule,
    GeographyModule,
  ],

  controllers: [
    AppController,
  ],

  providers: [
    AppService,
  ],
})
export class AppModule {}