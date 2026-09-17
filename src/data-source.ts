/**
 * File: src/data-source.ts
 *
 * Purpose:
 * TypeORM CLI DataSource configuration.
 *
 * This file is used for:
 * - TypeORM migrations
 * - Schema inspection
 * - Migration generation
 *
 * It does NOT initialise the NestJS application.
 */

import 'dotenv/config';

import { DataSource } from 'typeorm';

import { AuditLog } from './modules/audit/entities/audit-log.entity';
import { Lga } from './modules/geography/entities/lga.entity';
import { PollingUnit } from './modules/geography/entities/polling-unit.entity';
import { State } from './modules/geography/entities/state.entity';
import { Ward } from './modules/geography/entities/ward.entity';
import { Permission } from './modules/roles/entities/permission.entity';
import { Role } from './modules/roles/entities/role.entity';
import { User } from './modules/users/entities/user.entity';

const isProduction = process.env.NODE_ENV === 'production';

const databaseUrl = process.env.DATABASE_URL;

export default new DataSource({
  type: 'postgres',

  ...(databaseUrl
    ? {
        url: databaseUrl,
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 5432,
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'people_first_politician',
      }),

  entities: [
    AuditLog,
    Lga,
    PollingUnit,
    State,
    Ward,
    Permission,
    Role,
    User,
  ],

  migrations: [__dirname + '/migrations/*{.ts,.js}'],

  synchronize: false,

  logging: !isProduction,
  
  ...(databaseUrl && {
    ssl: {
      rejectUnauthorized: false,
    },
  }),
});