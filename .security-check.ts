import dataSource from './src/data-source';

async function check() {
  await dataSource.initialize();

  console.log('\n--- Organisation membership constraints ---');

  const membershipConstraints = await dataSource.query(`
    SELECT
      tc.constraint_name,
      tc.constraint_type,
      kcu.column_name
    FROM information_schema.table_constraints tc
    LEFT JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    WHERE tc.table_schema = 'public'
      AND tc.table_name = 'organisation_memberships'
    ORDER BY tc.constraint_name, kcu.ordinal_position;
  `);

  console.table(membershipConstraints);

  console.log('\n--- Organisation political-party constraints ---');

  const partyConstraints = await dataSource.query(`
    SELECT
      tc.constraint_name,
      tc.constraint_type,
      kcu.column_name
    FROM information_schema.table_constraints tc
    LEFT JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    WHERE tc.table_schema = 'public'
      AND tc.table_name = 'organisation_political_parties'
    ORDER BY tc.constraint_name, kcu.ordinal_position;
  `);

  console.table(partyConstraints);

  await dataSource.destroy();
}

check().catch((error) => {
  console.error('\nSecurity constraint verification failed:', error.message);
  process.exit(1);
});
