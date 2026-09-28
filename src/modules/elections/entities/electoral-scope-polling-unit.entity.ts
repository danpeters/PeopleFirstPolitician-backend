/**
 * File: C:\Projects\PeopleFirstPolitician\backend\src\modules\elections\entities\electoral-scope-polling-unit.entity.ts
 *
 * Purpose:
 * Maps an Electoral Scope to the polling units that belong to that scope.
 *
 * Security:
 * - Prevents duplicate scope/polling-unit mappings.
 * - Uses UUID foreign keys.
 * - Polling units use RESTRICT deletion behaviour.
 * - Scope deletion cascades to its mapping records.
 */

import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { ElectoralScope } from './electoral-scope.entity';
import { PollingUnit } from '../../geography/entities/polling-unit.entity';

@Entity('electoral_scope_polling_units')
@Index(
  'UQ_electoral_scope_polling_units_scope_polling_unit',
  ['electoralScopeId', 'pollingUnitId'],
  { unique: true },
)
@Index('IDX_electoral_scope_polling_units_scope', ['electoralScopeId'])
@Index('IDX_electoral_scope_polling_units_polling_unit', ['pollingUnitId'])
export class ElectoralScopePollingUnit {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'electoral_scope_id', type: 'uuid' })
  electoralScopeId!: string;

  @ManyToOne(() => ElectoralScope, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'electoral_scope_id' })
  electoralScope!: ElectoralScope;

  @Column({ name: 'polling_unit_id', type: 'uuid' })
  pollingUnitId!: string;

  @ManyToOne(() => PollingUnit, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'polling_unit_id' })
  pollingUnit!: PollingUnit;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}