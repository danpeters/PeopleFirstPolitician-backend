// File: C:\Projects\PeopleFirstPolitician\backend\scripts\validate-geography.js
//
// Purpose:
// - Validate the downloaded Nigeria polling-unit dataset.
// - Confirm the State → LGA → Ward → Polling Unit hierarchy.
// - Detect missing codes and duplicate polling-unit codes.
// - Produce a validation summary only.
//
// Security:
// - This script is READ-ONLY.
// - It does not connect to PostgreSQL.
// - It does not modify application data.

/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');

const csvPath = path.join(
  __dirname,
  '..',
  'data',
  'Nigeria_polling_units.csv',
);

if (!fs.existsSync(csvPath)) {
  console.error(`CSV file not found: ${csvPath}`);
  process.exit(1);
}

const csv = fs.readFileSync(csvPath, 'utf8');

const lines = csv
  .split(/\r?\n/)
  .filter((line) => line.trim().length > 0);

if (lines.length < 2) {
  console.error('CSV file does not contain enough data.');
  process.exit(1);
}

/**
 * Parse a CSV line while respecting quoted fields.
 */
function parseCsvLine(line) {
  const fields = [];
  let field = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"' && insideQuotes && nextChar === '"') {
      field += '"';
      i += 1;
      continue;
    }

    if (char === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (char === ',' && !insideQuotes) {
      fields.push(field.trim());
      field = '';
      continue;
    }

    field += char;
  }

  fields.push(field.trim());

  return fields;
}

const headers = parseCsvLine(lines[0]).map((header) =>
  header.trim().toLowerCase(),
);

const requiredHeaders = [
  'state',
  'lg',
  'ward',
  'state_code',
  'lg_code',
  'ward_code',
  'pu_code',
  'code',
  'location',
];

const missingHeaders = requiredHeaders.filter(
  (header) => !headers.includes(header),
);

if (missingHeaders.length > 0) {
  console.error('Missing required CSV columns:');
  console.error(missingHeaders.join(', '));
  process.exit(1);
}

const rows = [];

for (let i = 1; i < lines.length; i += 1) {
  const values = parseCsvLine(lines[i]);

  const row = {};

  headers.forEach((header, index) => {
    row[header] = values[index] ?? '';
  });

  rows.push(row);
}

const uniqueStates = new Set();
const uniqueLgas = new Set();
const uniqueWards = new Set();
const uniquePollingUnits = new Set();

const missingStateCodes = [];
const missingLgaCodes = [];
const missingWardCodes = [];
const missingPollingUnitCodes = [];

const duplicatePollingUnits = [];

for (const row of rows) {
  const stateCode = row.state_code;
  const lgaCode = row.lg_code;
  const wardCode = row.ward_code;
  const pollingUnitCode = row.code;

  if (stateCode) {
    uniqueStates.add(stateCode);
  } else {
    missingStateCodes.push(row);
  }

  if (stateCode && lgaCode) {
    uniqueLgas.add(`${stateCode}/${lgaCode}`);
  } else {
    missingLgaCodes.push(row);
  }

  if (stateCode && lgaCode && wardCode) {
    uniqueWards.add(`${stateCode}/${lgaCode}/${wardCode}`);
  } else {
    missingWardCodes.push(row);
  }

  if (pollingUnitCode) {
    if (uniquePollingUnits.has(pollingUnitCode)) {
      duplicatePollingUnits.push(pollingUnitCode);
    }

    uniquePollingUnits.add(pollingUnitCode);
  } else {
    missingPollingUnitCodes.push(row);
  }
}

console.log('');
console.log('==============================================');
console.log(' PEOPLE FIRST POLITICIAN');
console.log(' NIGERIA GEOGRAPHY DATA VALIDATION');
console.log('==============================================');
console.log('');

console.log(`CSV file: ${csvPath}`);
console.log(`Total records: ${rows.length}`);
console.log(`Unique States/FCT: ${uniqueStates.size}`);
console.log(`Unique State/LGA combinations: ${uniqueLgas.size}`);
console.log(`Unique State/LGA/Ward combinations: ${uniqueWards.size}`);
console.log(`Unique Polling Unit codes: ${uniquePollingUnits.size}`);
console.log('');

console.log('Validation checks:');
console.log(`Missing State codes: ${missingStateCodes.length}`);
console.log(`Missing LGA codes: ${missingLgaCodes.length}`);
console.log(`Missing Ward codes: ${missingWardCodes.length}`);
console.log(`Missing Polling Unit codes: ${missingPollingUnitCodes.length}`);
console.log(`Duplicate Polling Unit codes: ${duplicatePollingUnits.length}`);
console.log('');

if (
  missingStateCodes.length === 0 &&
  missingLgaCodes.length === 0 &&
  missingWardCodes.length === 0 &&
  missingPollingUnitCodes.length === 0 &&
  duplicatePollingUnits.length === 0
) {
  console.log('RESULT: BASIC VALIDATION PASSED');
} else {
  console.log('RESULT: VALIDATION REQUIRES REVIEW');
}

console.log('');