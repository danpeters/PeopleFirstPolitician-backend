/**
 * File: src/config/database.config.ts
 *
 * Purpose:
 * Central database configuration for PostgreSQL.
 *
 * Values exposed:
 * - host
 * - port
 * - username
 * - password
 * - name
 * - synchronize
 * - logging
 */

import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? '',
  name: process.env.DB_NAME ?? 'people_first_politician',
  synchronize: (process.env.DB_SYNCHRONIZE ?? 'true').toLowerCase() === 'true',
  logging: (process.env.DB_LOGGING ?? 'true').toLowerCase() === 'true',
}));