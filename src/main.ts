/**
 * File: src/main.ts
 *
 * Description:
 * Entry point of the NestJS application.
 * Configured for Railway deployment.
 *
 * Security:
 * - Validates incoming request data.
 * - Restricts CORS to explicitly allowed origins.
 * - Uses credentials only with trusted origins.
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { DataSource } from 'typeorm';

import { AppModule } from './app.module';
import { seedDatabase } from './common/seeds/database.seed';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
    /**
   * DATABASE INITIALISATION
   *
   * Ensure required roles and development seed data exist
   * before the API begins accepting requests.
   */
  const dataSource = app.get(DataSource);

  await seedDatabase(dataSource);

  /**
   * GLOBAL API PREFIX
   */
  app.setGlobalPrefix('api/v1');

  /**
   * GLOBAL VALIDATION
   */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  /**
   * CORS
   *
   * Local development:
   * - Uses CORS_ORIGINS from .env.
   *
   * Production:
   * - Uses CORS_ORIGINS from Railway when configured.
   * - Falls back to the official Vercel production frontend.
   */
  const configuredCorsOrigins = process.env.CORS_ORIGINS
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

    /**
   * CORS CONFIGURATION
   *
   * The API is used from both the production frontend and
   * local development environments.
   *
   * Production:
   *   https://people-first-politician-frontend.vercel.app
   *
   * Local development:
   *   http://localhost:3000
   *   http://127.0.0.1:3000
   *   http://localhost:5173
   *   http://127.0.0.1:5173
   *
   * CORS_ORIGINS can still be supplied through the environment
   * for additional trusted frontend origins.
   */

  const defaultCorsOrigins = [
    'https://people-first-politician-frontend.vercel.app',
    'https://peoplefirstpolitician.com',
    'https://www.peoplefirstpolitician.com',
    'https://people-first-politician-frontend.vercel.app',

    // Local backend / Swagger development
    'http://localhost:3000',
    'http://127.0.0.1:3000',

    // Common local frontend development ports
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ];

  /**
   * Combine environment-configured origins with the
   * application's trusted default origins.
   *
   * Set CORS_ORIGINS as a comma-separated list when
   * additional trusted origins are required.
   */
  const allowedOrigins = Array.from(
    new Set([
      ...defaultCorsOrigins,
      ...(configuredCorsOrigins ?? []),
    ]),
  );

  app.enableCors({
    origin: (origin, callback) => {
      /**
       * Allow requests without an Origin header.
       *
       * This covers:
       * - PowerShell
       * - server-to-server requests
       * - Postman
       * - some non-browser clients
       */
      if (!origin) {
        callback(null, true);
        return;
      }

      /**
       * Allow only explicitly trusted origins.
       */
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      /**
       * Reject all other browser origins.
       */
      callback(new Error('CORS origin not allowed'));
    },

    /**
     * Cookies/credentials are permitted for trusted origins.
     */
    credentials: true,
  });

  /**
   * SWAGGER
   */
  const config = new DocumentBuilder()
    .setTitle('People First Politician API')
    .setDescription('Backend API documentation')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  /**
   * PORT
   *
   * Railway provides PORT automatically.
   * Local development falls back to 3000.
   */
  const port = Number(process.env.PORT) || 3000;

  /**
   * HOST
   *
   * Railway requires the application to listen on 0.0.0.0.
   */
  const host = '0.0.0.0';

  await app.listen(port, host);

  /**
   * STARTUP LOGGING
   */
  console.log(`🚀 Application is running on: http://${host}:${port}/api/v1`);
  console.log(`📄 Swagger docs available at: http://${host}:${port}/api/docs`);
}

bootstrap();