/**
 * File: C:\Projects\PeopleFirstPolitician\backend\src\modules\elections\entities\election-position.entity.ts
 *
 * Purpose:
 * Defines election positions such as President, Governor, Senator,
 * House of Representatives, State House of Assembly, LGA Chairman,
 * and Councillor.
 *
 * Security:
 * - Uses UUID primary keys.
 * - Uses a unique position code.
 * - Supports controlled database relationships through migrations.
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

@Entity('election_positions')
@Index('UQ_election_positions_code', ['code'], { unique: true })
@Index('IDX_election_positions_name', ['name'])
export class ElectionPosition {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 60 })
  code!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt!: Date | null;
}