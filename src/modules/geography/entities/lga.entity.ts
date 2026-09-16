// File: C:\Projects\PeopleFirstPolitician\backend\src\modules\geography\entities\lga.entity.ts
/**
 * File: src/modules/geography/entities/lga.entity.ts
 * 
 * Purpose:
 * - Stores Local Government Areas
 * - Links to State and Ward
 * 
 * Security:
 * - Read-only for most users
 * - Admin-only for management
 */

import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { State } from './state.entity';
import { Ward } from './ward.entity';

@Entity('lgas')
export class Lga {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  /**
   * Electoral LGA code from the source electoral dataset.
   *
   * Important:
   * - This code is not globally unique.
   * - It is unique only within a State.
   * - The State relationship is therefore retained separately through stateId.
   */
  @Column({ name: 'code', type: 'varchar', length: 10 })
  code!: string;

  @Column({ name: 'state_id', type: 'uuid' })
  stateId!: string;

  @ManyToOne(() => State, (state) => state.lgas, { eager: true })
  state!: State;

  @OneToMany(() => Ward, (ward) => ward.lga)
  wards!: Ward[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}