/**
 * File: C:\Projects\PeopleFirstPolitician\backend\src\common\enums\role.enum.ts
 *
 * Purpose:
 * - Defines all recognised application roles in one central location.
 * - Prevents inconsistent role strings across the codebase.
 * - Provides a single source of truth for authentication,
 *   authorisation, and database role initialisation.
 *
 * Security:
 * - Roles must be assigned by trusted backend logic.
 * - Public registration must never accept a role from the client.
 * - Privileged roles such as SUPER_ADMIN must never be
 *   self-assigned through a public API.
 */

export enum RoleEnum {
  /**
   * Full system administration privileges.
   */
  SUPER_ADMIN = 'super_admin',

  /**
   * Manages campaign-related activities.
   */
  CAMPAIGN_MANAGER = 'campaign_manager',

  /**
   * Performs analytical and reporting functions.
   */
  ANALYST = 'analyst',

  /**
   * Ordinary registered People First Politician user.
   *
   * This is the default role assigned during public registration.
   */
  USER = 'user',
}