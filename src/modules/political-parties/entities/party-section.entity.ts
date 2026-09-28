/**
 * File: C:\Projects\PeopleFirstPolitician\backend\src\modules\political-parties\entities\party-section.entity.ts
 *
 * Purpose:
 * Defines political-party organisational sections at national,
 * state, senatorial district, federal constituency, state constituency,
 * local government, and ward levels.
 *
 * Security:
 * - Associates every section with a political party.
 * - Prevents duplicate section names within the same party.
 * - Supports hierarchical parent/child sections.
 * - Uses RESTRICT for party deletion.
 * - Uses SET NULL when a parent section is removed.
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

import { PoliticalParty } from './political-party.entity';

export enum PartySectionLevel {
  NATIONAL = 'national',
  STATE = 'state',
  SENATORIAL_DISTRICT = 'senatorial_district',
  FEDERAL_CONSTITUENCY = 'federal_constituency',
  STATE_CONSTITUENCY = 'state_constituency',
  LOCAL_GOVERNMENT = 'local_government',
  WARD = 'ward',
}

export enum PartySectionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('party_sections')
@Index(
  'UQ_party_sections_party_name',
  ['politicalPartyId', 'name'],
  { unique: true },
)
@Index('IDX_party_sections_party', ['politicalPartyId'])
@Index('IDX_party_sections_parent', ['parentSectionId'])
export class PartySection {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'political_party_id', type: 'uuid' })
  politicalPartyId!: string;

  @ManyToOne(() => PoliticalParty, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'political_party_id' })
  politicalParty!: PoliticalParty;

  @Column({ name: 'parent_section_id', type: 'uuid', nullable: true })
  parentSectionId!: string | null;

  @ManyToOne(() => PartySection, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'parent_section_id' })
  parentSection!: PartySection | null;

  @Column({ type: 'varchar', length: 180 })
  name!: string;

  @Column({ type: 'varchar', length: 60, nullable: true })
  code!: string | null;

  @Column({
    type: 'enum',
    enum: PartySectionLevel,
  })
  level!: PartySectionLevel;

  @Column({
    type: 'enum',
    enum: PartySectionStatus,
    default: PartySectionStatus.ACTIVE,
  })
  status!: PartySectionStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt!: Date | null;
}