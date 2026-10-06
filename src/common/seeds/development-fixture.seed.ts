/**
 * Development fixture for People First Politician.
 *
 * Purpose:
 * Creates the minimum reusable development data needed to test:
 *   Organisation -> Campaign -> Agent -> Agent Assignment
 * using an existing authenticated development user and existing geography.
 *
 * IMPORTANT:
 * - Development/test data only. Do not run against production.
 * - Does not create or modify geography records.
 * - Does not create an AgentAssignment; that should be created through
 *   the Agent Assignment API so that the endpoint itself is tested.
 * - Safe to run repeatedly: records are looked up by development codes/slugs.
 */

import 'dotenv/config';
import { DataSource } from 'typeorm';

import AppDataSource from '../../data-source';

const DEVELOPMENT = {
  userEmail: 'danpeters234@gmail.com',
  organisationSlug: 'pfp-development-test-org',
  organisationName: 'PFP Development Test Organisation',
  partyAbbreviation: 'PFP-TEST',
  partyName: 'People First Development Test Party',
  electionPositionCode: 'GOV-TEST',
  electionPositionName: 'Governor (Development Test)',
  electionCode: 'PFP-DEV-ELECTION-2026',
  electionName: 'PFP Development Test Election 2026',
  scopeCode: 'ABIA-ABA-NORTH-ARIARIA-TEST',
  scopeName: 'Ariaria Market Ward Development Test Scope',
  raceCode: 'PFP-DEV-GOV-ABIA-TEST',
  raceName: 'Development Test Governor Race - Abia',
  candidateDisplayName: 'Development Test Candidate',
  campaignCode: 'PFP-DEV-CAMPAIGN-001',
  campaignName: 'Development Test Campaign - Abia',
  agentReference: 'PFP-DEV-AGENT-001',
  agentFirstName: 'Development',
  agentLastName: 'Test Agent',
  agentDisplayName: 'Development Test Agent',
};

const GEO = {
  stateId: '8394a30a-8bd2-449f-b949-0fe211cf8300',
  lgaId: 'eb44d772-f37e-4cec-8115-3ebcfe2c6309',
  wardId: '599c348e-3d97-42fa-b3de-011bc1bc3573',
  pollingUnitId: '526ee954-d718-4a09-a5a2-3fced91482c9',
};

async function getOne<T>(
  dataSource: DataSource,
  sql: string,
  parameters: unknown[] = [],
): Promise<T> {
  const rows = (await dataSource.query(sql, parameters)) as T[];
  if (!rows.length) {
    throw new Error(`Expected a row but none was returned. SQL: ${sql}`);
  }
  return rows[0];
}

async function seedDevelopmentFixture(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Development fixture cannot run when NODE_ENV=production.');
  }

  await AppDataSource.initialize();

  try {
    await AppDataSource.transaction(async (manager) => {
      // ---------------------------------------------------------------
      // 1. Verify existing development user.
      // ---------------------------------------------------------------
      const user = await getOne<{ id: string }>(
        manager.connection,
        `SELECT id FROM users WHERE email = $1 AND "deletedAt" IS NULL LIMIT 1`,
        [DEVELOPMENT.userEmail],
      );

      // ---------------------------------------------------------------
      // 2. Verify the existing geography chain.
      // ---------------------------------------------------------------
      const geography = await getOne<{ polling_unit_id: string }>(
        manager.connection,
        `
          SELECT pu.id AS polling_unit_id
          FROM states s
          JOIN lgas l ON l.state_id = s.id
          JOIN wards w ON w.lga_id = l.id
          JOIN polling_units pu ON pu.ward_id = w.id
          WHERE s.id = $1 AND l.id = $2 AND w.id = $3 AND pu.id = $4
          LIMIT 1
        `,
        [GEO.stateId, GEO.lgaId, GEO.wardId, GEO.pollingUnitId],
      );

      // ---------------------------------------------------------------
      // 3. Organisation.
      // ---------------------------------------------------------------
      const organisation = await getOne<{ id: string }>(
        manager.connection,
        `
          INSERT INTO organisations (name, slug, status)
          VALUES ($1, $2, 'active')
          ON CONFLICT (slug)
          DO UPDATE SET name = EXCLUDED.name, status = 'active', deleted_at = NULL
          RETURNING id
        `,
        [DEVELOPMENT.organisationName, DEVELOPMENT.organisationSlug],
      );

      // ---------------------------------------------------------------
      // 4. Active campaign_manager organisation membership.
      // ---------------------------------------------------------------
      const role = await getOne<{ id: string }>(
        manager.connection,
        `SELECT id FROM roles WHERE name = 'campaign_manager' LIMIT 1`,
      );

      const membership = await getOne<{ id: string }>(
        manager.connection,
        `
          INSERT INTO organisation_memberships
            (organisation_id, user_id, role_id, status)
          VALUES ($1, $2, $3, 'active')
          ON CONFLICT (organisation_id, user_id)
          DO UPDATE SET role_id = EXCLUDED.role_id,
                        status = 'active',
                        deleted_at = NULL
          RETURNING id
        `,
        [organisation.id, user.id, role.id],
      );

      // Keep the variable intentionally referenced so the fixture output
      // makes the membership relationship explicit.
      void membership;

            // ---------------------------------------------------------------
      // 4b. Active super_admin organisation membership.
      //
      // The development administrator is a platform-level super_admin,
      // but organisation-scoped services also require an active
      // organisation membership. This ensures the administrator can
      // access organisation-scoped development pages such as Elections.
      // ---------------------------------------------------------------
      const adminUser = await getOne<{ id: string }>(
        manager.connection,
        `
          SELECT id
          FROM users
          WHERE email = $1
            AND "deletedAt" IS NULL
          LIMIT 1
        `,
        ['admin@example.com'],
      );

      const superAdminRole = await getOne<{ id: string }>(
        manager.connection,
        `SELECT id FROM roles WHERE name = 'super_admin' LIMIT 1`,
      );

      const adminMembership = await getOne<{ id: string }>(
        manager.connection,
        `
          INSERT INTO organisation_memberships
            (organisation_id, user_id, role_id, status)
          VALUES ($1, $2, $3, 'active')
          ON CONFLICT (organisation_id, user_id)
          DO UPDATE SET role_id = EXCLUDED.role_id,
                        status = 'active',
                        deleted_at = NULL
          RETURNING id
        `,
        [organisation.id, adminUser.id, superAdminRole.id],
      );

      void adminMembership;

      // ---------------------------------------------------------------
      // 5. Development political party.
      // ---------------------------------------------------------------
      const party = await getOne<{ id: string }>(
        manager.connection,
        `
          INSERT INTO political_parties (name, abbreviation, status)
          VALUES ($1, $2, 'active')
          ON CONFLICT (abbreviation)
          DO UPDATE SET name = EXCLUDED.name,
                        status = 'active',
                        deleted_at = NULL
          RETURNING id
        `,
        [DEVELOPMENT.partyName, DEVELOPMENT.partyAbbreviation],
      );

      // ---------------------------------------------------------------
      // 6. Election.
      // ---------------------------------------------------------------
      let election = await manager.connection.query(
        `SELECT id FROM elections WHERE name = $1 AND deleted_at IS NULL LIMIT 1`,
        [DEVELOPMENT.electionName],
      ) as { id: string }[];
      if (!election.length) {
        election = await manager.connection.query(
          `
            INSERT INTO elections
              (name, election_type, election_date, status, description)
            VALUES ($1, 'development_test', '2026-12-01', 'active', $2)
            RETURNING id
          `,
          [
            DEVELOPMENT.electionName,
            'Development-only election fixture for automated application testing.',
          ],
        ) as { id: string }[];
      }
      const electionRow = election[0];

      // ---------------------------------------------------------------
      // 7. Election position.
      // ---------------------------------------------------------------
      const position = await getOne<{ id: string }>(
        manager.connection,
        `
          INSERT INTO election_positions (code, name, description)
          VALUES ($1, $2, $3)
          ON CONFLICT (code)
          DO UPDATE SET name = EXCLUDED.name, deleted_at = NULL
          RETURNING id
        `,
        [
          DEVELOPMENT.electionPositionCode,
          DEVELOPMENT.electionPositionName,
          'Development-only position used to test campaign and agent workflows.',
        ],
      );

      // ---------------------------------------------------------------
      // 8. Ward-level electoral scope using existing geography.
      // ---------------------------------------------------------------
      let scope = await manager.connection.query(
        `SELECT id FROM electoral_scopes WHERE code = $1 AND deleted_at IS NULL LIMIT 1`,
        [DEVELOPMENT.scopeCode],
      ) as { id: string }[];
      if (!scope.length) {
        scope = await manager.connection.query(
          `
            INSERT INTO electoral_scopes
              (scope_type, name, code, status, state_id, lga_id, ward_id)
            VALUES ('ward', $1, $2, 'active', $3, $4, $5)
            RETURNING id
          `,
          [
            DEVELOPMENT.scopeName,
            DEVELOPMENT.scopeCode,
            GEO.stateId,
            GEO.lgaId,
            GEO.wardId,
          ],
        ) as { id: string }[];
      } else {
        await manager.connection.query(
          `
            UPDATE electoral_scopes
            SET name = $1, status = 'active', state_id = $2, lga_id = $3,
                ward_id = $4, deleted_at = NULL
            WHERE id = $5
          `,
          [
            DEVELOPMENT.scopeName,
            GEO.stateId,
            GEO.lgaId,
            GEO.wardId,
            scope[0].id,
          ],
        );
      }
      const scopeRow = scope[0];

      // ---------------------------------------------------------------
      // 9. Election race.
      // ---------------------------------------------------------------
      const race = await getOne<{ id: string }>(
        manager.connection,
        `
          INSERT INTO election_races
            (election_id, election_position_id, electoral_scope_id,
             name, code, status, description)
          VALUES ($1, $2, $3, $4, $5, 'active', $6)
          ON CONFLICT (code)
          DO UPDATE SET name = EXCLUDED.name,
                        election_position_id = EXCLUDED.election_position_id,
                        electoral_scope_id = EXCLUDED.electoral_scope_id,
                        status = 'active',
                        deleted_at = NULL
          RETURNING id
        `,
        [
          electionRow.id,
          position.id,
          scopeRow.id,
          DEVELOPMENT.raceName,
          DEVELOPMENT.raceCode,
          'Development-only race used to test campaign and agent workflows.',
        ],
      );

      // ---------------------------------------------------------------
      // 10. Candidate.
      // ---------------------------------------------------------------
      let candidate = await manager.connection.query(
        `SELECT id FROM candidates WHERE display_name = $1 AND deleted_at IS NULL LIMIT 1`,
        [DEVELOPMENT.candidateDisplayName],
      ) as { id: string }[];
      if (!candidate.length) {
        candidate = await manager.connection.query(
          `
            INSERT INTO candidates
              (first_name, last_name, display_name, status)
            VALUES ($1, $2, $3, 'active')
            RETURNING id
          `,
          ['Development', 'Test Candidate', DEVELOPMENT.candidateDisplayName],
        ) as { id: string }[];
      }
      const candidateRow = candidate[0];

      // ---------------------------------------------------------------
      // 11. Candidacy.
      // ---------------------------------------------------------------
      const candidacy = await getOne<{ id: string }>(
        manager.connection,
        `
          INSERT INTO candidacies
            (candidate_id, election_race_id, political_party_id, status,
             nomination_reference, notes)
          VALUES ($1, $2, $3, 'active', $4, $5)
          ON CONFLICT (candidate_id, election_race_id)
          DO UPDATE SET political_party_id = EXCLUDED.political_party_id,
                        status = 'active',
                        deleted_at = NULL
          RETURNING id
        `,
        [
          candidateRow.id,
          race.id,
          party.id,
          'PFP-DEV-NOM-001',
          'Development-only candidacy fixture.',
        ],
      );

      // ---------------------------------------------------------------
      // 12. Campaign.
      // ---------------------------------------------------------------
      const campaign = await getOne<{ id: string }>(
        manager.connection,
        `
          INSERT INTO campaigns
            (candidacy_id, organisation_id, name, code, status, description)
          VALUES ($1, $2, $3, $4, 'active', $5)
          ON CONFLICT (code)
          DO UPDATE SET candidacy_id = EXCLUDED.candidacy_id,
                        organisation_id = EXCLUDED.organisation_id,
                        name = EXCLUDED.name,
                        status = 'active',
                        deleted_at = NULL
          RETURNING id
        `,
        [
          candidacy.id,
          organisation.id,
          DEVELOPMENT.campaignName,
          DEVELOPMENT.campaignCode,
          'Development-only campaign fixture for Agent Assignment API testing.',
        ],
      );

      // ---------------------------------------------------------------
      // 13. Agent. Do not attach the manager's User account to the Agent;
      //     the API's Agent Assignment test should exercise the distinction
      //     between Agent identity and PFP User identity.
      // ---------------------------------------------------------------
      const agent = await getOne<{ id: string }>(
        manager.connection,
        `
          INSERT INTO agents
            (organisation_id, user_id, first_name, last_name, display_name,
             phone, email, photo_url, photo_version, agent_reference,
             identification_type, identification_reference, status, notes)
          VALUES ($1, NULL, $2, $3, $4, NULL, NULL, NULL, 1, $5,
                  'development_test', 'PFP-DEV-ID-001', 'active', $6)
          ON CONFLICT (organisation_id, agent_reference)
          WHERE agent_reference IS NOT NULL
          DO UPDATE SET first_name = EXCLUDED.first_name,
                        last_name = EXCLUDED.last_name,
                        display_name = EXCLUDED.display_name,
                        status = 'active',
                        deleted_at = NULL
          RETURNING id
        `,
        [
          organisation.id,
          DEVELOPMENT.agentFirstName,
          DEVELOPMENT.agentLastName,
          DEVELOPMENT.agentDisplayName,
          DEVELOPMENT.agentReference,
          'Development-only agent fixture.',
        ],
      );

      console.log('\nDevelopment fixture ready.');
      console.log(`User:         ${user.id} (${DEVELOPMENT.userEmail})`);
      console.log(`Organisation: ${organisation.id}`);
      console.log(`Membership:   campaign_manager`);
      console.log(`Party:        ${party.id} (${DEVELOPMENT.partyAbbreviation})`);
      console.log(`Election:     ${electionRow.id}`);
      console.log(`Race:         ${race.id}`);
      console.log(`Scope:        ${scopeRow.id} (${DEVELOPMENT.scopeName})`);
      console.log(`Candidate:    ${candidateRow.id}`);
      console.log(`Candidacy:    ${candidacy.id}`);
      console.log(`Campaign:     ${campaign.id} (${DEVELOPMENT.campaignCode})`);
      console.log(`Agent:        ${agent.id} (${DEVELOPMENT.agentReference})`);
      console.log(`Polling Unit: ${geography.polling_unit_id}`);
      console.log('\nThe Agent Assignment itself is intentionally NOT created here.');
      console.log('Create it through POST /api/v1/agents/organisations/:organisationId/assignments.');
    });
  } finally {
    await AppDataSource.destroy();
  }
}

seedDevelopmentFixture().catch((error) => {
  console.error('\nDevelopment fixture failed.');
  console.error(error);
  process.exitCode = 1;
});
