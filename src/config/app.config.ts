/**
 * Application Configuration
 *
 * Purpose:
 * - Defines general application settings
 * - Loads values from environment variables (.env)
 *
 * Security Notes:
 * - No sensitive values should be hardcoded here
 * - All values must come from environment variables where possible
 */
export default () => ({
  app: {
    /**
     * Application name (for logging, display, etc.)
     */
    name: process.env.APP_NAME || 'PeopleFirstPolitician',

    /**
     * Server port
     * Default: 3000
     */
    port: parseInt(process.env.PORT || '3000', 10),

    /**
     * Environment mode (development, production, etc.)
     */
    nodeEnv: process.env.NODE_ENV || 'development',
  },
});