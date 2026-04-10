/**
 * Database Configuration
 *
 * Purpose:
 * - Defines PostgreSQL connection settings
 * - Loads credentials from environment variables
 *
 * Security Notes:
 * - NEVER hardcode database passwords
 * - Use environment variables for all credentials
 * - Ensure database is not publicly exposed
 */
export default () => ({
  database: {
    /**
     * Database host (localhost or remote server)
     */
    host: process.env.DB_HOST || '127.0.0.1',

    /**
     * Database port
     */
    port: parseInt(process.env.DB_PORT || '5432', 10),

    /**
     * Database name
     */
    name: process.env.DB_NAME || 'peoplefirst',

    /**
     * Database username
     */
    user: process.env.DB_USER || 'postgres',

    /**
     * Database password
     */
    password: process.env.DB_PASSWORD || 'postgres',
  },
});