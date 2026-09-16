/**
 * File: src/modules/geography/entities/polling-unit.entity.ts
 * 
 * Purpose:
 * - Stores Polling Units (smallest administrative unit)
 * - Critical for grassroots targeting
 * 
 * Security:
 * - Read-only for most users
 * - Admin-only for management
 */

import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Ward } from './ward.entity';

@Entity('polling_units')
export class PollingUnit {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 180 })
  name!: string;

  @Column({ type: 'varchar', length: 60, nullable: true })
  code!: string | null;

  @Column({ name: 'ward_id', type: 'uuid' })
  wardId!: string;

  @ManyToOne(() => Ward, (ward) => ward.pollingUnits, { eager: true })
  ward!: Ward;

  @Column({ type: 'numeric', precision: 10, scale: 7, nullable: true })
  latitude!: number | null;

  @Column({ type: 'numeric', precision: 10, scale: 7, nullable: true })
  longitude!: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
