/**
 * File: src/modules/geography/entities/state.entity.ts
 * 
 * Purpose:
 * - Stores Nigerian states (or equivalent administrative regions)
 * - Foundation for LGA, Ward, Polling Unit hierarchy
 * 
 * Security:
 * - Read-only for most users
 * - Admin-only for import/management
 */

import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Lga } from './lga.entity';

@Entity('states')
export class State {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 120, unique: true })
  name!: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  code!: string | null;

  @OneToMany(() => Lga, (lga) => lga.state)
  lgas!: Lga[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}