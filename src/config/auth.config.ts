/**
 * Authentication Configuration
 *
 * Purpose:
 * - Manages JWT (JSON Web Token) settings
 * - Keeps secrets outside of source code
 *
 * Security Notes:
 * - NEVER hardcode JWT secrets
 * - Always use environment variables
 * - Use strong random secrets in production
 */
export default () => ({
  auth: {
    /**
     * Secret key used to sign access tokens
     */
    jwtSecret: process.env.JWT_SECRET || '',

    /**
     * Access token expiry time
     */
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',

    /**
     * Secret key for refresh tokens
     * Must be DIFFERENT from access token secret
     */
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || '',

    /**
     * Refresh token expiry time
     */
    jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
});