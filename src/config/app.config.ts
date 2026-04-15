/**
 * File: src/config/app.config.ts
 *
 * Purpose:
 * Central application-level configuration.
 *
 * Values exposed:
 * - port
 * - apiPrefix
 * - corsOrigins
 */

import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  apiPrefix: process.env.API_PREFIX ?? 'api/v1',
  corsOrigins: (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
}));