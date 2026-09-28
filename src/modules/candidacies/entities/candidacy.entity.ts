/**
 * File:
 * C:\Projects\PeopleFirstPolitician\backend\src\modules\candidacies\entities\candidacy.entity.ts
 *
 * Purpose:
 * Defines the Candidacy entity representing a Candidate's participation
 * in a specific ElectionRace under a PoliticalParty and, where applicable,
 * a PartySection.
 *
 * Domain distinction:
 *
 * Candidate
 *   = the person.
 *
 * ElectionRace
 *   = a specific electoral contest within an Election.
 *
 * Candidacy
 *   = the Candidate's participation in that specific ElectionRace.
 *
 * PoliticalParty
 *   = the political party under which the Candidate contests.
 *
 * PartySection
 *   = the relevant organisational/geographical section of the party,
 *     where applicable.
 *
 * Security:
 * - Uses UUID primary keys.
 * - Requires valid Candidate, ElectionRace and PoliticalParty records.
 * - PartySection is optional.
 * - Uses RESTRICT deletion behaviour for historical electoral records.
 * - Prevents duplicate candidate participation in the same race.
 * - Prevents duplicate party participation in the same race.
 * - Supports controlled candidacy status values.
 * - Supports soft deletion for historical protection.
 * - Database constraints are enforced through TypeORM migrations.
 *
 * Important:
 * Cross-entity business rules, such as ensuring that a PartySection
 * belongs to the selected PoliticalParty and matches the geographical
 * level of the ElectionRace, must also be enforced at the service layer.
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

import { Candidate } from '../../candidates/entities/candidate.entity';
import { ElectionRace } from '../../elections/entities/election-race.entity';
import { PartySection } from '../../political-parties/entities/party-section.entity';
import { PoliticalParty } from '../../political-parties/entities/political-party.entity';

export enum CandidacyStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  WITHDRAWN = 'withdrawn',
  DISQUALIFIED = 'disqualified',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('candidacies')
@Index('UQ_candidacies_candidate_race', ['candidateId', 'electionRaceId'], {
  unique: true,
})
@Index('UQ_candidacies_party_race', ['politicalPartyId', 'electionRaceId'], {
  unique: true,
})
@Index('IDX_candidacies_candidate', ['candidateId'])
@Index('IDX_candidacies_race', ['electionRaceId'])
@Index('IDX_candidacies_party', ['politicalPartyId'])
@Index('IDX_candidacies_party_section', ['partySectionId'])
@Index('IDX_candidacies_status', ['status'])
export class Candidacy {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * Person participating in the electoral contest.
   */
  @Column({ name: 'candidate_id', type: 'uuid' })
  candidateId!: string;

  @ManyToOne(() => Candidate, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'candidate_id' })
  candidate!: Candidate;

  /**
   * Specific electoral contest in which the candidate is participating.
   */
  @Column({ name: 'election_race_id', type: 'uuid' })
  electionRaceId!: string;

  @ManyToOne(() => ElectionRace, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'election_race_id' })
  electionRace!: ElectionRace;

  /**
   * Political party under which the candidate contests.
   */
  @Column({ name: 'political_party_id', type: 'uuid' })
  politicalPartyId!: string;

  @ManyToOne(() => PoliticalParty, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'political_party_id' })
  politicalParty!: PoliticalParty;

  /**
   * Relevant organisational/geographical section of the political party.
   *
   * Nullable because some races, particularly national-level races,
   * may not require an explicit PartySection record at candidacy level.
   */
  @Column({
    name: 'party_section_id',
    type: 'uuid',
    nullable: true,
  })
  partySectionId!: string | null;

  @ManyToOne(() => PartySection, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'party_section_id' })
  partySection!: PartySection | null;

  /**
   * Controlled lifecycle state of the candidacy.
   */
  @Column({
    type: 'enum',
    enum: CandidacyStatus,
    default: CandidacyStatus.DRAFT,
  })
  status!: CandidacyStatus;

  /**
   * Optional nomination/reference number supplied by the organisation
   * or electoral workflow.
   */
  @Column({
    name: 'nomination_reference',
    type: 'varchar',
    length: 120,
    nullable: true,
  })
  nominationReference!: string | null;

  /**
   * Optional operational notes.
   *
   * Sensitive information should only be stored here when appropriate
   * access controls are enforced.
   */
  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt!: Date | null;
}