/**
 * Role enumeration.
 *
 * Purpose:
 * - Defines the allowed system role names in one central place.
 * - Prevents inconsistent hardcoded role strings across the codebase.
 *
 * Security notes:
 * - Role checks should use these enum values rather than raw strings.
 * - Authorization must still be enforced on the backend, not only in the UI.
 */
export enum RoleEnum {
  SUPER_ADMIN = 'super_admin',
  CAMPAIGN_MANAGER = 'campaign_manager',
  ANALYST = 'analyst',
}
