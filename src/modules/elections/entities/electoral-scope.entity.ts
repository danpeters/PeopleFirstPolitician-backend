/**
 * File: C:\Projects\PeopleFirstPolitician\backend\src\modules\elections\entities\electoral-scope.entity.ts
 *
 * Purpose:
 * Defines the geographical/electoral scope associated with an election
 * or electoral contest.
 *
 * Security:
 * - Uses UUID primary keys.
 * - Restricts scope type and status to defined enum values.
 * - References shared State, LGA, and Ward geography.
 * - Uses RESTRICT deletion behaviour to protect shared geography.
 * - Supports soft deletion.
 */

import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { State } from '../../geography/entities/state.entity';
import { Lga } from '../../geography/entities/lga.entity';
import { Ward } from '../../geography/entities/ward.entity';

export enum ElectoralScopeType {
  NATIONAL = 'national',
  STATE = 'state',
  SENATORIAL_DISTRICT = 'senatorial_district',
  FEDERAL_CONSTITUENCY = 'federal_constituency',
  STATE_CONSTITUENCY = 'state_constituency',
  LOCAL_GOVERNMENT = 'local_government',
  WARD = 'ward',
  POLLING_UNIT = 'polling_unit',
}

export enum ElectoralScopeStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('electoral_scopes')
@Index('IDX_electoral_scopes_type', ['scopeType'])
@Index('IDX_electoral_scopes_state', ['stateId'])
@Index('IDX_electoral_scopes_lga', ['lgaId'])
@Index('IDX_electoral_scopes_ward', ['wardId'])
export class ElectoralScope {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    name: 'scope_type',
    type: 'enum',
    enum: ElectoralScopeType,
  })
  scopeType!: ElectoralScopeType;

  @Column({ type: 'varchar', length: 180 })
  name!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  code!: string | null;

  @Column({
    type: 'enum',
    enum: ElectoralScopeStatus,
    default: ElectoralScopeStatus.ACTIVE,
  })
  status!: ElectoralScopeStatus;

  @Column({ name: 'state_id', type: 'uuid', nullable: true })
  stateId!: string | null;

  @ManyToOne(() => State, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'state_id' })
  state!: State | null;

  @Column({ name: 'lga_id', type: 'uuid', nullable: true })
  lgaId!: string | null;

  @ManyToOne(() => Lga, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'lga_id' })
  lga!: Lga | null;

  @Column({ name: 'ward_id', type: 'uuid', nullable: true })
  wardId!: string | null;

  @ManyToOne(() => Ward, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'ward_id' })
  ward!: Ward | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt!: Date | null;
}