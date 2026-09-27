/**
 * File: C:\Projects\PeopleFirstPolitician\backend\src\modules\organisations\entities\organisation.entity.ts
 *
 * Purpose:
 * Defines the Organisation entity for the People First Politician
 * multi-tenant architecture.
 *
 * Security principle:
 * Each organisation represents an independent tenant. Tenant-owned
 * application data must be associated with an organisation and must
 * never be accessible across organisation boundaries unless an
 * explicitly authorised platform-level operation permits it.
 */

import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum OrganisationStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  INACTIVE = 'inactive',
}

@Entity('organisations')
@Index('IDX_organisations_slug', ['slug'], { unique: true })
export class Organisation {
  /**
   * Globally unique organisation identifier.
   *
   * UUIDs are used so that organisation identifiers are not
   * sequential integers that could make enumeration easier.
   */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * Official/display name of the organisation.
   */
  @Column({
    type: 'varchar',
    length: 180,
  })
  name!: string;

  /**
   * Internal stable identifier for the organisation.
   *
   * Although unique, this value must not be used as a mechanism
   * for discovering other organisations.
   */
  @Column({
    type: 'varchar',
    length: 180,
  })
  slug!: string;

  /**
   * Current lifecycle status of the organisation.
   */
  @Column({
    type: 'varchar',
    length: 30,
    default: OrganisationStatus.ACTIVE,
  })
  status!: OrganisationStatus;

  /**
   * Timestamp when the organisation was created.
   */
  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt!: Date;

  /**
   * Timestamp when the organisation was last modified.
   */
  @UpdateDateColumn({
    name: 'updated_at',
  })
  updatedAt!: Date;

  /**
   * Soft-deletion timestamp.
   *
   * Records are retained rather than physically deleted so that
   * auditability and recovery remain possible.
   */
  @DeleteDateColumn({
    name: 'deleted_at',
    nullable: true,
  })
  deletedAt!: Date | null;
}