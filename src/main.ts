/**
 * File: src/main.ts
 *
 * Purpose:
 * Application bootstrap entry point.
 *
 * Responsibilities:
 * - create Nest application
 * - apply security middleware
 * - apply global validation
 * - configure CORS
 * - configure global API prefix
 * - configure Swagger
 * - start HTTP server
 */

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { AppLogger } from './common/logger/app.logger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const appLogger = new AppLogger();
  app.useLogger(appLogger);

  /**
   * Security headers
   */
  app.use(helmet());

  /**
   * Restricted CORS
   *
   * Update these origins later to match:
   * - your frontend local dev URL
   * - your production frontend URL
   */
  app.enableCors({
    origin: [
      'http://localhost:3001',
      'http://127.0.0.1:3001',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ],
    credentials: true,
  });

  /**
   * Global API prefix
   *
   * All routes become:
   * /api/v1/...
   */
  app.setGlobalPrefix('api/v1');

  /**
   * Global validation pipe
   *
   * Security-critical settings:
   * - whitelist: removes unknown fields
   * - forbidNonWhitelisted: rejects unexpected fields
   * - transform: converts input types automatically
   */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  /**
   * Swagger API documentation
   */
  const swaggerConfig = new DocumentBuilder()
    .setTitle('People First Politician API')
    .setDescription('Backend API documentation for People First Politician')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Paste only the JWT access token',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  /**
   * Start server
   */
  const port = process.env.PORT || 3000;
  await app.listen(port);

  const appUrl = await app.getUrl();

  appLogger.log(`Application is running on: ${appUrl}/api/v1`, 'Bootstrap');
  appLogger.log(`Swagger docs available at: ${appUrl}/api/docs`, 'Bootstrap');
}

bootstrap();