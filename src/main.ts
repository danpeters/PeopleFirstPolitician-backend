import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';

/**
 * Application bootstrap.
 *
 * Purpose:
 * - Starts the NestJS application.
 * - Applies global validation, security headers, and controlled CORS.
 *
 * Security measures:
 * - Helmet adds safer HTTP headers
 * - ValidationPipe strips unexpected fields
 * - Restricted CORS limits browser access to approved origins
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // Get configuration service from the application context.
  const configService = app.get(ConfigService);

  // Prefix all routes with /api/v1
  app.setGlobalPrefix('api/v1');

  // Secure HTTP headers
  app.use(helmet());

  // Restrict browser origins
  app.enableCors({
    origin: ['http://localhost:3001'],
    credentials: true,
  });

  // Global request validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Read port from config
  const port = configService.get<number>('app.port') || 3000;

  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}/api/v1`);
}

bootstrap();