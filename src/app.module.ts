// src/app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Import your modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { AuditModule } from './modules/audit/audit.module';

/**
 * C:\Projects\PeopleFirstPolitician\backend\src\app.module.ts
 *
 * Geography module provides:
 * - States
 * - LGAs
 * - Wards
 * - Polling Units
 */
import { GeographyModule } from './modules/geography/geography.module';

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

        // 🔹 Railway / Production (uses DATABASE_URL)
        if (databaseUrl) {
          return {
            type: 'postgres' as const,
            url: databaseUrl,
            autoLoadEntities: true,

            // TEMP: keep true until DB is stable
            synchronize: true,

            ssl: {
              rejectUnauthorized: false,
            },
          };
        }

        // 🔹 Local development
        return {
          type: 'postgres' as const,
          host: configService.get<string>('DB_HOST'),
          port: Number(configService.get<string>('DB_PORT')) || 5432,
          username: configService.get<string>('DB_USERNAME'),
          password: configService.get<string>('DB_PASSWORD'),
          database: configService.get<string>('DB_NAME'),
          autoLoadEntities: true,

          synchronize: true,

          ...(isProduction && {
            ssl: {
              rejectUnauthorized: false,
            },
          }),
        };
      },
    }),

    // Your modules
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