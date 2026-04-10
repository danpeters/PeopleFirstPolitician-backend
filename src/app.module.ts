import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import appConfig from './config/app.config';
import authConfig from './config/auth.config';
import databaseConfig from './config/database.config';

/**
 * Root application module.
 *
 * Purpose:
 * - Loads global configuration for the whole application.
 * - Registers configuration providers such as ConfigService.
 *
 * Security notes:
 * - Secrets must come from environment variables.
 * - ConfigModule is global so sensitive settings are centrally managed.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [appConfig, authConfig, databaseConfig],
    }),
  ],
})
export class AppModule {}