/**
 * File:
 * C:\Projects\PeopleFirstPolitician\backend\src\modules\candidacies\candidacies.service.ts
 *
 * Purpose:
 * - Provides business, validation, access-control and audit operations
 *   for Candidacy records.
 *
 * Security model:
 * User
 *   ↓
 * OrganisationMembership
 *   ↓
 * Organisation
 *   ↓
 * OrganisationPoliticalParty
 *   ↓
 * PoliticalParty
 *   ↓
 * Candidacy
 *
 * Important:
 * - Candidacy does not contain an organisation_id.
 * - Organisation authorisation is established through the selected
 *   PoliticalParty and the OrganisationPoliticalParty relationship.
 * - Non-super_admin users must have an active membership in the
 *   requested Organisation.
 * - Platform super_admin users may administer candidacies without
 *   organisation membership checks.
 *
 * Business rules:
 * - Candidate must exist and not be soft-deleted.
 * - ElectionRace must exist and not be soft-deleted.
 * - PoliticalParty must exist and not be soft-deleted.
 * - The PoliticalParty must be associated with the requested
 *   Organisation.
 * - Optional PartySection must exist and not be soft-deleted.
 * - If PartySection is supplied, it must belong to the selected
 *   PoliticalParty.
 * - Candidate + ElectionRace must be unique.
 * - PoliticalParty + ElectionRace must be unique.
 * - Database constraints remain the final integrity boundary.
 *
 * Audit:
 * - Create and update operations are recorded through AuditService.
 * - No authentication secrets are written to audit details.
 */

import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import {
  FindOptionsWhere,
  IsNull,
  Repository,
} from 'typeorm';

import {
  Candidacy,
  CandidacyStatus,
} from './entities/candidacy.entity';

import { CreateCandidacyDto } from './dto/create-candidacy.dto';
import { UpdateCandidacyDto } from './dto/update-candidacy.dto';

import { Candidate } from '../candidates/entities/candidate.entity';
import { ElectionRace } from '../elections/entities/election-race.entity';
import { PoliticalParty } from '../political-parties/entities/political-party.entity';
import { PartySection } from '../political-parties/entities/party-section.entity';
import { OrganisationPoliticalParty } from '../political-parties/entities/organisation-political-party.entity';

import {
  OrganisationMembership,
  OrganisationMembershipStatus,
} from '../organisations/entities/organisation-membership.entity';

import { AuditService } from '../audit/audit.service';

import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { buildPaginatedResponse } from '../../common/utils/pagination-response.util';

@Injectable()
export class CandidaciesService {
  constructor(
    @InjectRepository(Candidacy)
    private readonly candidacyRepository: Repository<Candidacy>,

    @InjectRepository(Candidate)
    private readonly candidateRepository: Repository<Candidate>,

    @InjectRepository(ElectionRace)
    private readonly electionRaceRepository: Repository<ElectionRace>,

    @InjectRepository(PoliticalParty)
    private readonly politicalPartyRepository: Repository<PoliticalParty>,

    @InjectRepository(PartySection)
    private readonly partySectionRepository: Repository<PartySection>,

    @InjectRepository(OrganisationPoliticalParty)
    private readonly organisationPoliticalPartyRepository: Repository<OrganisationPoliticalParty>,

    @InjectRepository(OrganisationMembership)
    private readonly organisationMembershipRepository: Repository<OrganisationMembership>,

    private readonly auditService: AuditService,
  ) {}

  /**
   * Confirms that the requesting user has access to the requested
   * Organisation.
   *
   * Platform super_admin users are allowed to administer
   * organisation-scoped candidacies without requiring an
   * OrganisationMembership.
   *
   * All other users must have an active OrganisationMembership.
   */
  private async assertOrganisationMembership(
    organisationId: string,
    actorId: string,
    actorRole: string,
  ): Promise<void> {
    if (actorRole === 'super_admin') {
      return;
    }

    const membership =
      await this.organisationMembershipRepository.findOne({
        where: {
          organisationId,
          userId: actorId,
          status: OrganisationMembershipStatus.ACTIVE,
        },
      });

    if (!membership) {
      throw new ForbiddenException(
        'Access denied: your Organisation Membership is not active for this Organisation.',
      );
    }
  }

  /**
   * Confirms that the selected PoliticalParty is associated with
   * the requested Organisation.
   */
  private async assertOrganisationPoliticalParty(
    organisationId: string,
    politicalPartyId: string,
  ): Promise<void> {
    const relationship =
      await this.organisationPoliticalPartyRepository.findOne({
        where: {
          organisationId,
          politicalPartyId,
        },
      });

    if (!relationship) {
      throw new ForbiddenException(
        'Access denied: the selected Political Party is not associated with this Organisation.',
      );
    }
  }

  /**
   * Loads and validates a Candidate.
   */
  private async validateCandidate(
    candidateId: string,
  ): Promise<Candidate> {
    const candidate =
      await this.candidateRepository.findOne({
        where: {
          id: candidateId,
          deletedAt: IsNull(),
        },
      });

    if (!candidate) {
      throw new NotFoundException(
        'Candidate not found.',
      );
    }

    return candidate;
  }

  /**
   * Loads and validates an ElectionRace.
   */
  private async validateElectionRace(
    electionRaceId: string,
  ): Promise<ElectionRace> {
    const electionRace =
      await this.electionRaceRepository.findOne({
        where: {
          id: electionRaceId,
          deletedAt: IsNull(),
        },
      });

    if (!electionRace) {
      throw new NotFoundException(
        'Election Race not found.',
      );
    }

    return electionRace;
  }

  /**
   * Loads and validates a PoliticalParty.
   */
  private async validatePoliticalParty(
    politicalPartyId: string,
  ): Promise<PoliticalParty> {
    const politicalParty =
      await this.politicalPartyRepository.findOne({
        where: {
          id: politicalPartyId,
          deletedAt: IsNull(),
        },
      });

    if (!politicalParty) {
      throw new NotFoundException(
        'Political Party not found.',
      );
    }

    return politicalParty;
  }

  /**
   * Loads and validates an optional PartySection.
   *
   * The section must belong to the selected PoliticalParty.
   */
  private async validatePartySection(
    partySectionId: string,
    politicalPartyId: string,
  ): Promise<PartySection> {
    const partySection =
      await this.partySectionRepository.findOne({
        where: {
          id: partySectionId,
          deletedAt: IsNull(),
        },
      });

    if (!partySection) {
      throw new NotFoundException(
        'Party Section not found.',
      );
    }

    if (
      partySection.politicalPartyId !==
      politicalPartyId
    ) {
      throw new ConflictException(
        'The selected Party Section does not belong to the selected Political Party.',
      );
    }

    return partySection;
  }

  /**
   * Checks whether the requested candidate/race combination
   * already exists.
   */
  private async assertCandidateRaceIsUnique(
    candidateId: string,
    electionRaceId: string,
    excludeCandidacyId?: string,
  ): Promise<void> {
    const where: FindOptionsWhere<Candidacy> = {
      candidateId,
      electionRaceId,
      deletedAt: IsNull(),
    };

    if (excludeCandidacyId) {
      const existing =
        await this.candidacyRepository
          .createQueryBuilder('candidacy')
          .where('candidacy.candidate_id = :candidateId', {
            candidateId,
          })
          .andWhere(
            'candidacy.election_race_id = :electionRaceId',
            { electionRaceId },
          )
          .andWhere(
            'candidacy.deleted_at IS NULL',
          )
          .andWhere(
            'candidacy.id != :excludeCandidacyId',
            { excludeCandidacyId },
          )
          .getOne();

      if (existing) {
        throw new ConflictException(
          'This Candidate already has a Candidacy in the selected Election Race.',
        );
      }

      return;
    }

    const existing =
      await this.candidacyRepository.findOne({
        where,
      });

    if (existing) {
      throw new ConflictException(
        'This Candidate already has a Candidacy in the selected Election Race.',
      );
    }
  }

  /**
   * Checks whether the requested party/race combination
   * already exists.
   */
  private async assertPartyRaceIsUnique(
    politicalPartyId: string,
    electionRaceId: string,
    excludeCandidacyId?: string,
  ): Promise<void> {
    if (excludeCandidacyId) {
      const existing =
        await this.candidacyRepository
          .createQueryBuilder('candidacy')
          .where(
            'candidacy.political_party_id = :politicalPartyId',
            { politicalPartyId },
          )
          .andWhere(
            'candidacy.election_race_id = :electionRaceId',
            { electionRaceId },
          )
          .andWhere(
            'candidacy.deleted_at IS NULL',
          )
          .andWhere(
            'candidacy.id != :excludeCandidacyId',
            { excludeCandidacyId },
          )
          .getOne();

      if (existing) {
        throw new ConflictException(
          'This Political Party already has a Candidacy in the selected Election Race.',
        );
      }

      return;
    }

    const existing =
      await this.candidacyRepository.findOne({
        where: {
          politicalPartyId,
          electionRaceId,
          deletedAt: IsNull(),
        },
      });

    if (existing) {
      throw new ConflictException(
        'This Political Party already has a Candidacy in the selected Election Race.',
      );
    }
  }

  /**
   * Creates a Candidacy.
   */
  async create(
    organisationId: string,
    dto: CreateCandidacyDto,
    actorId: string,
    actorRole: string,
  ): Promise<Candidacy> {
    await this.assertOrganisationMembership(
      organisationId,
      actorId,
      actorRole,
    );

    const candidate =
      await this.validateCandidate(
        dto.candidateId,
      );

    const electionRace =
      await this.validateElectionRace(
        dto.electionRaceId,
      );

    const politicalParty =
      await this.validatePoliticalParty(
        dto.politicalPartyId,
      );

    await this.assertOrganisationPoliticalParty(
      organisationId,
      politicalParty.id,
    );

    await this.assertCandidateRaceIsUnique(
      candidate.id,
      electionRace.id,
    );

    await this.assertPartyRaceIsUnique(
      politicalParty.id,
      electionRace.id,
    );

    if (dto.partySectionId) {
      await this.validatePartySection(
        dto.partySectionId,
        politicalParty.id,
      );
    }

    const candidacy =
      this.candidacyRepository.create({
        candidateId: candidate.id,
        electionRaceId: electionRace.id,
        politicalPartyId: politicalParty.id,
        partySectionId:
          dto.partySectionId ?? null,
        status:
          dto.status ?? CandidacyStatus.DRAFT,
        nominationReference:
          dto.nominationReference?.trim() ?? null,
        notes: dto.notes?.trim() ?? null,
      });

    const saved =
      await this.candidacyRepository.save(
        candidacy,
      );

    await this.auditService.log({
      action: 'CANDIDACY_CREATED',
      module: 'candidacies',
      actorId,
      targetId: saved.id,
      details: {
        candidateId: saved.candidateId,
        electionRaceId: saved.electionRaceId,
        politicalPartyId:
          saved.politicalPartyId,
        partySectionId:
          saved.partySectionId,
        status: saved.status,
      },
    });

    return this.findById(
      saved.id,
      organisationId,
      actorId,
      actorRole,
    );
  }

  /**
   * Returns a paginated list of Candidacies accessible
   * within the requested Organisation.
   *
   * Because Candidacy has no organisation_id, the query is
   * restricted through OrganisationPoliticalParty.
   */
  async findAll(
    organisationId: string,
    query: PaginationQueryDto,
    actorId: string,
    actorRole: string,
  ) {
    await this.assertOrganisationMembership(
      organisationId,
      actorId,
      actorRole,
    );

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const safeLimit = Math.min(
      Math.max(limit, 1),
      100,
    );

    const queryBuilder =
      this.candidacyRepository
        .createQueryBuilder('candidacy')
        .innerJoin(
          OrganisationPoliticalParty,
          'organisationParty',
          'organisationParty.political_party_id = candidacy.political_party_id AND organisationParty.organisation_id = :organisationId',
          { organisationId },
        )
        .leftJoinAndSelect(
          'candidacy.candidate',
          'candidate',
        )
        .leftJoinAndSelect(
          'candidacy.electionRace',
          'electionRace',
        )
        .leftJoinAndSelect(
          'candidacy.partySection',
          'partySection',
        )
        .leftJoinAndSelect(
          'candidacy.politicalParty',
          'politicalParty',
        )
        .where(
          'candidacy.deleted_at IS NULL',
        );

    if (query.search?.trim()) {
      const search =
        `%${query.search.trim()}%`;

      queryBuilder.andWhere(
        `(
          candidate.display_name ILIKE :search
          OR politicalParty.name ILIKE :search
          OR politicalParty.abbreviation ILIKE :search
          OR candidacy.nomination_reference ILIKE :search
        )`,
        { search },
      );
    }

    const allowedSortFields: Record<
        string,
        string
    > = {
        createdAt: 'candidacy.createdAt',
        updatedAt: 'candidacy.updatedAt',
        status: 'candidacy.status',
        nominationReference:
            'candidacy.nominationReference',
    };

    const sortField =
      allowedSortFields[
        query.sortBy ?? ''
      ] ??
      'candidacy.created_at';

    const sortOrder =
      query.sortOrder === 'ASC'
        ? 'ASC'
        : 'DESC';

    queryBuilder.orderBy(
      sortField,
      sortOrder,
    );

    queryBuilder
      .skip((page - 1) * safeLimit)
      .take(safeLimit);

    const [items, totalItems] =
      await queryBuilder.getManyAndCount();

    return buildPaginatedResponse(
      items,
      page,
      safeLimit,
      totalItems,
    );
  }

  /**
   * Finds one Candidacy and confirms that it belongs to
   * a PoliticalParty associated with the requested Organisation.
   */
  async findById(
    candidacyId: string,
    organisationId: string,
    actorId: string,
    actorRole: string,
  ): Promise<Candidacy> {
    await this.assertOrganisationMembership(
      organisationId,
      actorId,
      actorRole,
    );

    const candidacy =
      await this.candidacyRepository.findOne({
        where: {
          id: candidacyId,
          deletedAt: IsNull(),
        },
        relations: [
          'candidate',
          'electionRace',
          'politicalParty',
          'partySection',
        ],
      });

    if (!candidacy) {
      throw new NotFoundException(
        'Candidacy not found.',
      );
    }

    await this.assertOrganisationPoliticalParty(
      organisationId,
      candidacy.politicalPartyId,
    );

    return candidacy;
  }

  /**
   * Updates an existing Candidacy.
   *
   * Cross-entity validation is repeated whenever a
   * relationship changes.
   */
  async update(
    candidacyId: string,
    organisationId: string,
    dto: UpdateCandidacyDto,
    actorId: string,
    actorRole: string,
  ): Promise<Candidacy> {
    const existing =
      await this.findById(
        candidacyId,
        organisationId,
        actorId,
        actorRole,
      );

    const resultingCandidateId =
      dto.candidateId ??
      existing.candidateId;

    const resultingRaceId =
      dto.electionRaceId ??
      existing.electionRaceId;

    const resultingPartyId =
      dto.politicalPartyId ??
      existing.politicalPartyId;

    await this.validateCandidate(
      resultingCandidateId,
    );

    await this.validateElectionRace(
      resultingRaceId,
    );

    await this.validatePoliticalParty(
      resultingPartyId,
    );

    await this.assertOrganisationPoliticalParty(
      organisationId,
      resultingPartyId,
    );

    await this.assertCandidateRaceIsUnique(
      resultingCandidateId,
      resultingRaceId,
      existing.id,
    );

    await this.assertPartyRaceIsUnique(
      resultingPartyId,
      resultingRaceId,
      existing.id,
    );

    if (dto.partySectionId !== undefined) {
      if (dto.partySectionId === null) {
        existing.partySectionId = null;
      } else {
        await this.validatePartySection(
          dto.partySectionId,
          resultingPartyId,
        );

        existing.partySectionId =
          dto.partySectionId;
      }
    }

    if (dto.candidateId !== undefined) {
      existing.candidateId =
        resultingCandidateId;
    }

    if (dto.electionRaceId !== undefined) {
      existing.electionRaceId =
        resultingRaceId;
    }

    if (dto.politicalPartyId !== undefined) {
      existing.politicalPartyId =
        resultingPartyId;
    }

    if (dto.status !== undefined) {
      existing.status = dto.status;
    }

    if (
      dto.nominationReference !==
      undefined
    ) {
      existing.nominationReference =
        dto.nominationReference?.trim() ??
        null;
    }

    if (dto.notes !== undefined) {
      existing.notes =
        dto.notes?.trim() ?? null;
    }

    const saved =
      await this.candidacyRepository.save(
        existing,
      );

    await this.auditService.log({
      action: 'CANDIDACY_UPDATED',
      module: 'candidacies',
      actorId,
      targetId: saved.id,
      details: {
        candidateId: saved.candidateId,
        electionRaceId:
          saved.electionRaceId,
        politicalPartyId:
          saved.politicalPartyId,
        partySectionId:
          saved.partySectionId,
        status: saved.status,
      },
    });

    return this.findById(
      saved.id,
      organisationId,
      actorId,
      actorRole,
    );
  }
}