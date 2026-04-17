/**
 * File: src/main.ts
 * Description:
 * Entry point of the NestJS application.
 * Configured for Railway deployment (binds to 0.0.0.0 and dynamic PORT).
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

// (Optional but recommended)
import { ValidationPipe } from '@nestjs/common';

// Swagger (only if already installed in your project)
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  /**
   * GLOBAL SETTINGS
   */
  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  /**
   * CORS (important for frontend access)
   */
  app.enableCors({
    origin: true,
    credentials: true,
  });

  /**
   * SWAGGER SETUP (safe for production, but optional)
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
   * PORT CONFIGURATION (CRITICAL FOR RAILWAY)
   */
  const port = Number(process.env.PORT) || 3000;

  /**
   * HOST CONFIGURATION (CRITICAL FIX)
   * Railway requires 0.0.0.0 (NOT localhost / 127.0.0.1 / ::1)
   */
  const host = '0.0.0.0';

  await app.listen(port, host);

  /**
   * LOGGING
   */
  console.log(`🚀 Application is running on: http://${host}:${port}/api/v1`);
  console.log(`📄 Swagger docs available at: http://${host}:${port}/api/docs`);
}

bootstrap();