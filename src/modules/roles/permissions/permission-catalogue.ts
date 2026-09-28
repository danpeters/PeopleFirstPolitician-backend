/**
 * File:
 * C:\Projects\PeopleFirstPolitician\backend\src\modules\roles\permissions\permission-catalogue.ts
 *
 * Purpose:
 * - Defines the authoritative application permission catalogue.
 * - Keeps permission codes centralised and consistent.
 * - Provides descriptions for database seeding and documentation.
 *
 * Security principle:
 * - Permissions represent capabilities, not organisational positions.
 * - Platform roles are mapped to permissions separately.
 * - Organisation membership, campaign membership, campaign role,
 *   resource ownership and agent assignment provide additional
 *   contextual security controls.
 *
 * Important:
 * - Do not hard-code permission strings throughout the application.
 * - Use these constants when applying the @Permissions() decorator.
 */

export interface PermissionDefinition {
  code: string;
  description: string;
}

export const PERMISSION_CATALOGUE = [
  // ---------------------------------------------------------------------------
  // Organisation
  // ---------------------------------------------------------------------------

  {
    code: 'organisation.view',
    description: 'View organisation information',
  },
  {
    code: 'organisation.update',
    description: 'Update organisation information',
  },
  {
    code: 'organisation.manage_members',
    description: 'Manage organisation memberships',
  },
  {
    code: 'organisation.manage_staff',
    description: 'Manage organisation staff positions',
  },

  // ---------------------------------------------------------------------------
  // Users
  // ---------------------------------------------------------------------------

  {
    code: 'user.view',
    description: 'View users',
  },
  {
    code: 'user.create',
    description: 'Create users',
  },
  {
    code: 'user.update',
    description: 'Update user information',
  },
  {
    code: 'user.suspend',
    description: 'Suspend users',
  },
  {
    code: 'user.restore',
    description: 'Restore suspended or inactive users',
  },
  {
    code: 'user.delete',
    description: 'Permanently remove a user where authorised',
  },

  // ---------------------------------------------------------------------------
  // Geography
  // ---------------------------------------------------------------------------

  {
    code: 'geography.view',
    description: 'View State, LGA, Ward and Polling Unit geography',
  },
  {
    code: 'geography.import',
    description: 'Import geography data',
  },
  {
    code: 'geography.create',
    description: 'Create geography records',
  },
  {
    code: 'geography.update',
    description: 'Update geography records',
  },

  // ---------------------------------------------------------------------------
  // Political Parties
  // ---------------------------------------------------------------------------

  {
    code: 'party.view',
    description: 'View political party information',
  },
  {
    code: 'party.create',
    description: 'Create political parties',
  },
  {
    code: 'party.update',
    description: 'Update political party information',
  },
  {
    code: 'party.suspend',
    description: 'Suspend a political party',
  },
  {
    code: 'party.manage_members',
    description: 'Manage political party membership',
  },

  // ---------------------------------------------------------------------------
  // Elections
  // ---------------------------------------------------------------------------

  {
    code: 'election.view',
    description: 'View elections',
  },
  {
    code: 'election.create',
    description: 'Create elections',
  },
  {
    code: 'election.update',
    description: 'Update election information',
  },
  {
    code: 'election.manage_positions',
    description: 'Manage election positions',
  },
  {
    code: 'election.manage_scopes',
    description: 'Manage electoral scopes',
  },
  {
    code: 'election.manage_races',
    description: 'Manage election races',
  },

  // ---------------------------------------------------------------------------
  // Candidates
  // ---------------------------------------------------------------------------

  {
    code: 'candidate.view',
    description: 'View candidate information',
  },
  {
    code: 'candidate.create',
    description: 'Create candidates',
  },
  {
    code: 'candidate.update',
    description: 'Update candidate information',
  },
  {
    code: 'candidate.suspend',
    description: 'Suspend candidates',
  },

  // ---------------------------------------------------------------------------
  // Candidacies
  // ---------------------------------------------------------------------------

  {
    code: 'candidacy.view',
    description: 'View candidacies',
  },
  {
    code: 'candidacy.create',
    description: 'Create candidacies',
  },
  {
    code: 'candidacy.update',
    description: 'Update candidacy information',
  },
  {
    code: 'candidacy.withdraw',
    description: 'Withdraw a candidacy',
  },

  // ---------------------------------------------------------------------------
  // Campaigns
  // ---------------------------------------------------------------------------

  {
    code: 'campaign.view',
    description: 'View campaigns',
  },
  {
    code: 'campaign.create',
    description: 'Create campaigns',
  },
  {
    code: 'campaign.update',
    description: 'Update campaign information',
  },
  {
    code: 'campaign.activate',
    description: 'Activate campaigns',
  },
  {
    code: 'campaign.suspend',
    description: 'Suspend campaigns',
  },
  {
    code: 'campaign.complete',
    description: 'Complete campaigns',
  },

  // ---------------------------------------------------------------------------
  // Campaign Memberships
  // ---------------------------------------------------------------------------

  {
    code: 'campaign_membership.view',
    description: 'View campaign memberships',
  },
  {
    code: 'campaign_membership.create',
    description: 'Create campaign memberships',
  },
  {
    code: 'campaign_membership.update',
    description: 'Update campaign membership information',
  },
  {
    code: 'campaign_membership.change_status',
    description: 'Change campaign membership status',
  },
  {
    code: 'campaign_membership.remove',
    description: 'Remove campaign memberships',
  },
  {
    code: 'campaign_membership.restore',
    description: 'Restore campaign memberships',
  },
  {
    code: 'campaign_membership.assign_manager',
    description: 'Assign or change a campaign manager',
  },

  // ---------------------------------------------------------------------------
  // Polling Unit Agents
  // ---------------------------------------------------------------------------

  {
    code: 'agent.view',
    description: 'View polling unit agent information',
  },
  {
    code: 'agent.create',
    description: 'Create or register polling unit agents',
  },
  {
    code: 'agent.update',
    description: 'Update polling unit agent information',
  },
  {
    code: 'agent.suspend',
    description: 'Suspend polling unit agents',
  },
  {
    code: 'agent.remove',
    description: 'Remove polling unit agents',
  },

  // ---------------------------------------------------------------------------
  // Agent Assignments
  // ---------------------------------------------------------------------------

  {
    code: 'agent_assignment.view',
    description: 'View polling unit agent assignments',
  },
  {
    code: 'agent_assignment.create',
    description: 'Create polling unit agent assignments',
  },
  {
    code: 'agent_assignment.update',
    description: 'Update polling unit agent assignments',
  },
  {
    code: 'agent_assignment.remove',
    description: 'Remove polling unit agent assignments',
  },

  // ---------------------------------------------------------------------------
  // Election Results
  // ---------------------------------------------------------------------------

  {
    code: 'result.view',
    description: 'View election results',
  },
  {
    code: 'result.create',
    description: 'Create election result drafts',
  },
  {
    code: 'result.update_draft',
    description: 'Update election result drafts',
  },
  {
    code: 'result.submit',
    description: 'Submit election results',
  },
  {
    code: 'result.synchronize',
    description: 'Synchronize offline election results',
  },
  {
    code: 'result.verify',
    description: 'Verify submitted election results',
  },
  {
    code: 'result.flag',
    description: 'Flag election results for investigation',
  },
  {
    code: 'result.amend',
    description: 'Amend election results through the controlled workflow',
  },
  {
    code: 'result.export',
    description: 'Export election results',
  },

  // ---------------------------------------------------------------------------
  // Reports
  // ---------------------------------------------------------------------------

  {
    code: 'report.view',
    description: 'View reports',
  },
  {
    code: 'report.create',
    description: 'Generate reports',
  },
  {
    code: 'report.export',
    description: 'Export reports',
  },

  // ---------------------------------------------------------------------------
  // Audit
  // ---------------------------------------------------------------------------

  {
    code: 'audit.view',
    description: 'View audit records',
  },
  {
    code: 'audit.export',
    description: 'Export audit records',
  },
] as const satisfies readonly PermissionDefinition[];

/**
 * Compile-time/runtime-friendly list of permission codes.
 */
export const PERMISSION_CODES = PERMISSION_CATALOGUE.map(
  (permission) => permission.code,
);

/**
 * Expected catalogue size.
 *
 * This provides an immediate safety check if a permission is accidentally
 * added or removed without updating the intended security design.
 */
export const PERMISSION_CATALOGUE_SIZE = 69;