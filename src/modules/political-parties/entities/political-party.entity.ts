import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum PoliticalPartyStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

@Entity('political_parties')
@Index('UQ_political_parties_abbreviation', ['abbreviation'], {
  unique: true,
})
export class PoliticalParty {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'varchar',
    length: 180,
  })
  name!: string;

  @Column({
    type: 'varchar',
    length: 30,
  })
  abbreviation!: string;

  @Column({
    name: 'logo_url',
    type: 'text',
    nullable: true,
  })
  logoUrl!: string | null;

  @Column({
    type: 'varchar',
    length: 30,
    default: PoliticalPartyStatus.ACTIVE,
  })
  status!: PoliticalPartyStatus;

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
  })
  updatedAt!: Date;

  @DeleteDateColumn({
    name: 'deleted_at',
    nullable: true,
  })
  deletedAt!: Date | null;
}
