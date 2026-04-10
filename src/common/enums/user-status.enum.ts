/**
 * User status enumeration.
 *
 * Purpose:
 * - Defines valid account states for internal users.
 *
 * Security notes:
 * - Suspended users must be denied login.
 * - Inactive users should not be treated as fully active accounts.
 */
export enum UserStatusEnum {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}
