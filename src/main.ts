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

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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

  const allowedOrigins =
    configuredCorsOrigins && configuredCorsOrigins.length > 0
      ? configuredCorsOrigins
      : ['https://people-first-politician-frontend.vercel.app'];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header.
      // This covers tools such as PowerShell, server-to-server requests,
      // and some non-browser clients.
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('CORS origin not allowed'));
    },
    credentials: true,
  });

  /**
   * SWAGGER
   */
  const config = new DocumentBuilder()
    .setTitle('People First Politician API')
    .setDescription('Backend API documentation')
    .setVersion('1.0')
    .addBearerAuth()
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