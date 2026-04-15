/**
 * File: src/config/auth.config.ts
 *
 * Purpose:
 * Central authentication configuration.
 *
 * Values exposed:
 * - jwtSecret
 * - jwtExpiresIn
 * - refreshSecret
 * - refreshExpiresIn
 */

import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  jwtSecret:
    process.env.JWT_SECRET ?? 'ChangeThisToAVeryStrongSecretKey123!',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '15m',

  refreshSecret:
    process.env.REFRESH_SECRET ?? 'ChangeThisToAnotherVeryStrongSecretKey456!',
  refreshExpiresIn: process.env.REFRESH_EXPIRES_IN ?? '7d',
}));