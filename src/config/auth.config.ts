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
 *
 * Security:
 * - JWT_SECRET must be supplied through the environment.
 * - REFRESH_SECRET must be supplied through the environment.
 * - No insecure fallback secrets are permitted.
 * - The application will fail during configuration if either
 *   required secret is missing.
 */

import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => {
  /**
   * JWT signing secret.
   *
   * This must be supplied through the JWT_SECRET environment variable.
   * A fallback value is deliberately not provided.
   */
  const jwtSecret = process.env.JWT_SECRET;

  /**
   * Refresh-token signing secret.
   *
   * This must be supplied through the REFRESH_SECRET environment variable.
   * A fallback value is deliberately not provided.
   */
  const refreshSecret = process.env.REFRESH_SECRET;

  /**
   * Fail immediately if either production authentication secret
   * is missing.
   *
   * This prevents the application from accidentally running with
   * a known or insecure fallback secret.
   */
  if (!jwtSecret) {
    throw new Error(
      'JWT_SECRET environment variable is required but was not provided.',
    );
  }

  if (!refreshSecret) {
    throw new Error(
      'REFRESH_SECRET environment variable is required but was not provided.',
    );
  }

  return {
    jwtSecret,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '15m',

    refreshSecret,
    refreshExpiresIn: process.env.REFRESH_EXPIRES_IN ?? '7d',
  };
});