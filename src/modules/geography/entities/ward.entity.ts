// File: C:\Projects\PeopleFirstPolitician\backend\src\modules\geography\entities\ward.entity.ts
/**
 * File: src/modules/geography/entities/ward.entity.ts
 * 
 * Purpose:
 * - Stores Ward level administrative units
 * - Critical for field operations and reporting
 * 
 * Security:
 * - Read-only for most users
 * - Admin-only for management
 */

import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Lga } from './lga.entity';
import { PollingUnit } from './polling-unit.entity';

@Entity('wards')
export class Ward {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  /**
   * Electoral Ward code from the source electoral dataset.
   *
   * Important:
   * - This code is not globally unique.
   * - It is unique within its parent LGA.
   * - The LGA relationship is therefore retained separately through lgaId.
   */
  @Column({ name: 'code', type: 'varchar', length: 10 })
  code!: string;

  @Column({ name: 'lga_id', type: 'uuid' })
  lgaId!: string;

  @ManyToOne(() => Lga, (lga) => lga.wards, { eager: true })
  lga!: Lga;

  @OneToMany(() => PollingUnit, (pu) => pu.ward)
  pollingUnits!: PollingUnit[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}