import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { Organisation } from '../../organisations/entities/organisation.entity';
import { PoliticalParty } from './political-party.entity';

@Entity('organisation_political_parties')
@Unique('UQ_organisation_political_parties_org_party', [
  'organisationId',
  'politicalPartyId',
])
@Index('IDX_organisation_political_parties_organisation', ['organisationId'])
@Index('IDX_organisation_political_parties_party', ['politicalPartyId'])
export class OrganisationPoliticalParty {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Organisation, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'organisation_id',
  })
  organisation!: Organisation;

  @Column({
    name: 'organisation_id',
    type: 'uuid',
  })
  organisationId!: string;

  @ManyToOne(() => PoliticalParty, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'political_party_id',
  })
  politicalParty!: PoliticalParty;

  @Column({
    name: 'political_party_id',
    type: 'uuid',
  })
  politicalPartyId!: string;

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
  })
  updatedAt!: Date;
}
