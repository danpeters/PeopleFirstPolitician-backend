// File: C:\Projects\PeopleFirstPolitician\backend\scripts\import-geography.ts

/**
 * People First Politician
 * Geography Data Importer
 *
 * Purpose:
 * - Import Nigerian States, LGAs, Wards and Polling Units.
 * - Preserve the State -> LGA -> Ward -> Polling Unit hierarchy.
 * - Use a database transaction so that a failed import is rolled back.
 *
 * Safety:
 * - The importer checks that all geography tables are empty.
 * - If any geography table contains data, the importer stops.
 * - No partial import is allowed.
 */

import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

import { State } from '../src/modules/geography/entities/state.entity';
import { Lga } from '../src/modules/geography/entities/lga.entity';
import { Ward } from '../src/modules/geography/entities/ward.entity';
import { PollingUnit } from '../src/modules/geography/entities/polling-unit.entity';

dotenv.config({
  path: path.resolve(__dirname, '../.env'),
});

const CSV_FILE = path.resolve(
  __dirname,
  '../data/Nigeria_polling_units.csv',
);

const BATCH_SIZE = 1000;

interface GeographyRecord {
  state: string;
  lg: string;
  ward: string;
  state_code: string;
  lg_code: string;
  ward_code: string;
  pu_code: string;
  code: string;
  location: string;
  ward_des?: string;
  lg_des?: string;
}

function clean(value: unknown): string {
  return String(value ?? '').trim();
}

function normalise(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Database configuration.
 *
 * Values are read from the existing backend environment variables.
 * The password is intentionally not printed to the console.
 */
const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'people_first_politician',
  entities: [State, Lga, Ward, PollingUnit],
  synchronize: false,
});

async function main(): Promise<void> {
  console.log('==============================================');
  console.log('People First Politician - Geography Import');
  console.log('==============================================');
  console.log('');

  if (!fs.existsSync(CSV_FILE)) {
    throw new Error(
      `Geography CSV file was not found: ${CSV_FILE}`,
    );
  }

  console.log(`CSV file: ${CSV_FILE}`);
  console.log('');

  /*
   * Read CSV.
   */
  console.log('Reading CSV file...');

  const csvContent = fs.readFileSync(CSV_FILE, 'utf8');

  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
    relax_column_count: true,
    trim: true,
  }) as GeographyRecord[];

  console.log(`CSV records read: ${records.length}`);
  console.log('');

  if (records.length !== 176846) {
    throw new Error(
      `Unexpected CSV record count. Expected 176846 but found ${records.length}.`,
    );
  }

  /*
   * Connect to PostgreSQL.
   */
  console.log('Connecting to PostgreSQL...');

  await dataSource.initialize();

  console.log('Database connection successful.');
  console.log('');

  const stateRepository = dataSource.getRepository(State);
  const lgaRepository = dataSource.getRepository(Lga);
  const wardRepository = dataSource.getRepository(Ward);
  const pollingUnitRepository = dataSource.getRepository(PollingUnit);

  /*
   * Safety check.
   *
   * The importer will not run if any geography table already
   * contains records.
   */
  console.log('Checking existing geography data...');

  const stateCount = await stateRepository.count();
  const lgaCount = await lgaRepository.count();
  const wardCount = await wardRepository.count();
  const pollingUnitCount = await pollingUnitRepository.count();

  console.log(`States:         ${stateCount}`);
  console.log(`LGAs:           ${lgaCount}`);
  console.log(`Wards:          ${wardCount}`);
  console.log(`Polling Units:  ${pollingUnitCount}`);
  console.log('');

  if (
    stateCount > 0 ||
    lgaCount > 0 ||
    wardCount > 0 ||
    pollingUnitCount > 0
  ) {
    throw new Error(
      'Import stopped because one or more geography tables already contain data.',
    );
  }

  console.log('All geography tables are empty.');
  console.log('');

  /*
   * Build unique geography structures from the CSV.
   *
   * LGA codes are not globally unique, so State + LGA code
   * is used as the LGA identity.
   *
   * Ward codes are not globally unique, so State + LGA +
   * Ward code is used as the Ward identity.
   */
  const stateMap = new Map<
    string,
    {
      name: string;
      code: string;
    }
  >();

  const lgaMap = new Map<
    string,
    {
      name: string;
      code: string;
      stateCode: string;
    }
  >();

  const wardMap = new Map<
    string,
    {
      name: string;
      code: string;
      stateCode: string;
      lgaCode: string;
    }
  >();

  for (const record of records) {
    const state = clean(record.state);
    const lga = clean(record.lg);
    const ward = clean(record.ward);

    const stateCode = clean(record.state_code);
    const lgaCode = clean(record.lg_code);
    const wardCode = clean(record.ward_code);

    const stateKey = normalise(stateCode);

    if (!stateMap.has(stateKey)) {
      stateMap.set(stateKey, {
        name: state,
        code: stateCode,
      });
    }

    const lgaKey = `${stateKey}|${normalise(lgaCode)}`;

    if (!lgaMap.has(lgaKey)) {
      lgaMap.set(lgaKey, {
        name: lga,
        code: lgaCode,
        stateCode,
      });
    }

    const wardKey =
      `${stateKey}|${normalise(lgaCode)}|${normalise(wardCode)}`;

    if (!wardMap.has(wardKey)) {
      wardMap.set(wardKey, {
        name: ward,
        code: wardCode,
        stateCode,
        lgaCode,
      });
    }
  }

  console.log('----------------------------------------------');
  console.log('DATA PREPARATION');
  console.log('----------------------------------------------');
  console.log(`States prepared:  ${stateMap.size}`);
  console.log(`LGAs prepared:    ${lgaMap.size}`);
  console.log(`Wards prepared:   ${wardMap.size}`);
  console.log(`Polling Units:    ${records.length}`);
  console.log('');

  if (
    stateMap.size !== 37 ||
    lgaMap.size !== 774 ||
    wardMap.size !== 8809
  ) {
    throw new Error(
      'Prepared geography counts do not match the expected values.',
    );
  }

  /*
   * Start the transaction.
   */
  const queryRunner = dataSource.createQueryRunner();

  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    console.log('==============================================');
    console.log('STARTING DATABASE TRANSACTION');
    console.log('==============================================');
    console.log('');

    /*
     * Maps database IDs to CSV composite keys.
     */
    const stateIdMap = new Map<string, string>();
    const lgaIdMap = new Map<string, string>();
    const wardIdMap = new Map<string, string>();

    /*
     * --------------------------------------------------------
     * 1. STATES
     * --------------------------------------------------------
     */
    console.log('Importing States/FCT...');

    for (const [stateKey, stateData] of stateMap) {
      const state = queryRunner.manager.create(State, {
        name: stateData.name,
        code: stateData.code,
      });

      const savedState = await queryRunner.manager.save(
        State,
        state,
      );

      stateIdMap.set(stateKey, savedState.id);
    }

    console.log(`States imported: ${stateIdMap.size}`);
    console.log('');

    /*
     * --------------------------------------------------------
     * 2. LGAs
     * --------------------------------------------------------
     */
    console.log('Importing LGAs...');

    const lgaEntries = Array.from(lgaMap.entries());

    for (let i = 0; i < lgaEntries.length; i += BATCH_SIZE) {
      const batch = lgaEntries.slice(i, i + BATCH_SIZE);

      for (const [lgaKey, lgaData] of batch) {
        const stateKey = normalise(lgaData.stateCode);
        const stateId = stateIdMap.get(stateKey);

        if (!stateId) {
          throw new Error(
            `State ID not found for LGA: ${lgaData.name}`,
          );
        }

        const lga = queryRunner.manager.create(Lga, {
          name: lgaData.name,
          code: lgaData.code,
          stateId,
        });

        const savedLga = await queryRunner.manager.save(
          Lga,
          lga,
        );

        lgaIdMap.set(lgaKey, savedLga.id);
      }

      console.log(
        `LGAs imported: ${Math.min(
          i + BATCH_SIZE,
          lgaEntries.length,
        )} / ${lgaEntries.length}`,
      );
    }

    console.log('');

    /*
     * --------------------------------------------------------
     * 3. WARDS
     * --------------------------------------------------------
     */
    console.log('Importing Wards...');

    const wardEntries = Array.from(wardMap.entries());

    for (let i = 0; i < wardEntries.length; i += BATCH_SIZE) {
      const batch = wardEntries.slice(i, i + BATCH_SIZE);

      for (const [wardKey, wardData] of batch) {
        const stateKey = normalise(wardData.stateCode);
        const lgaKey =
          `${stateKey}|${normalise(wardData.lgaCode)}`;

        const lgaId = lgaIdMap.get(lgaKey);

        if (!lgaId) {
          throw new Error(
            `LGA ID not found for Ward: ${wardData.name}`,
          );
        }

        const ward = queryRunner.manager.create(Ward, {
          name: wardData.name,
          code: wardData.code,
          lgaId,
        });

        const savedWard = await queryRunner.manager.save(
          Ward,
          ward,
        );

        wardIdMap.set(wardKey, savedWard.id);
      }

      console.log(
        `Wards imported: ${Math.min(
          i + BATCH_SIZE,
          wardEntries.length,
        )} / ${wardEntries.length}`,
      );
    }

    console.log('');

    /*
     * --------------------------------------------------------
     * 4. POLLING UNITS
     * --------------------------------------------------------
     */
    console.log('Importing Polling Units...');
    console.log(
      'This is the largest stage and may take some time.',
    );
    console.log('');

    let pollingUnitsImported = 0;

    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);

      const pollingUnits: PollingUnit[] = [];

      for (const record of batch) {
        const stateKey = normalise(clean(record.state_code));

        const wardKey =
          `${stateKey}|${normalise(clean(record.lg_code))}|${normalise(
            clean(record.ward_code),
          )}`;

        const wardId = wardIdMap.get(wardKey);

        if (!wardId) {
          throw new Error(
            `Ward ID not found for Polling Unit: ${clean(
              record.code,
            )}`,
          );
        }

        const pollingUnit = queryRunner.manager.create(
          PollingUnit,
          {
            name:
              clean(record.location) ||
              `Polling Unit ${clean(record.code)}`,
            code: clean(record.code),
            wardId,
          },
        );

        pollingUnits.push(pollingUnit);
      }

      await queryRunner.manager.save(
        PollingUnit,
        pollingUnits,
        {
          chunk: BATCH_SIZE,
        },
      );

      pollingUnitsImported += batch.length;

      console.log(
        `Polling Units imported: ${pollingUnitsImported} / ${records.length}`,
      );
    }

    console.log('');

    /*
     * Commit only after every record has been inserted.
     */
    console.log('Committing transaction...');

    await queryRunner.commitTransaction();

    console.log('');
    console.log('==============================================');
    console.log('GEOGRAPHY IMPORT COMPLETED SUCCESSFULLY');
    console.log('==============================================');
    console.log('');
    console.log(`States:         ${stateIdMap.size}`);
    console.log(`LGAs:           ${lgaIdMap.size}`);
    console.log(`Wards:          ${wardIdMap.size}`);
    console.log(`Polling Units:  ${pollingUnitsImported}`);
    console.log('');
    console.log('Transaction committed.');
  } catch (error: unknown) {
    console.error('');
    console.error('==============================================');
    console.error('GEOGRAPHY IMPORT FAILED');
    console.error('==============================================');
    console.error('');
    console.error('Rolling back transaction...');

    await queryRunner.rollbackTransaction();

    console.error('Transaction rolled back.');
    console.error('');

    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }

    process.exitCode = 1;
  } finally {
    await queryRunner.release();
    await dataSource.destroy();
  }
}

main().catch(async (error: unknown) => {
  console.error('');
  console.error('FATAL ERROR: Geography import could not start.');
  console.error('');

  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(error);
  }

  if (dataSource.isInitialized) {
    await dataSource.destroy();
  }

  process.exit(1);
});