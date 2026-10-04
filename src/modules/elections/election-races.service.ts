/**
 * File:
 * C:\Projects\PeopleFirstPolitician\backend\src\modules\elections\election-races.service.ts
 *
 * Purpose:
 * Provides business logic for Election Race management.
 *
 * Responsibilities:
 * - Enforces organisation-scoped access.
 * - Validates referenced Election records.
 * - Validates referenced Election Position records.
 * - Validates referenced Electoral Scope records.
 * - Creates and updates Election Races.
 * - Supports pagination, searching and safe sorting.
 * - Prevents duplicate race codes.
 * - Prevents duplicate Election + Position + Scope combinations.
 * - Excludes soft-deleted records from normal operations.
 * - Records important Race-management actions in the audit log.
 *
 * Important architecture note:
 * - ElectionRace does not directly contain organisationId.
 * - organisationId is therefore used as the authorisation context.
 * - The service verifies active organisation membership before
 *   performing organisation-scoped operations.
 */

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import {
  IsNull,
  Repository,
} from 'typeorm';

import {
  Election,
} from './entities/election.entity';

import {
  ElectionPosition,
} from './entities/election-position.entity';

import {
  ElectionRace,
  ElectionRaceStatus,
} from './entities/election-race.entity';

import {
  ElectoralScope,
} from './entities/electoral-scope.entity';

import {
  OrganisationMembership,
  OrganisationMembershipStatus,
} from '../organisations/entities/organisation-membership.entity';

import {
  CreateElectionRaceDto,
} from './dto/create-election-race.dto';

import {
  UpdateElectionRaceDto,
} from './dto/update-election-race.dto';

import {
  AuditService,
} from '../audit/audit.service';

import {
  PaginationQueryDto,
} from '../../common/dto/pagination-query.dto';

import {
  buildPaginatedResponse,
} from '../../common/utils/pagination-response.util';

@Injectable()
export class ElectionRacesService {
  constructor(
    @InjectRepository(ElectionRace)
    private readonly electionRaceRepository:
      Repository<ElectionRace>,

    @InjectRepository(Election)
    private readonly electionRepository:
      Repository<Election>,

    @InjectRepository(ElectionPosition)
    private readonly electionPositionRepository:
      Repository<ElectionPosition>,

    @InjectRepository(ElectoralScope)
    private readonly electoralScopeRepository:
      Repository<ElectoralScope>,

    @InjectRepository(OrganisationMembership)
    private readonly organisationMembershipRepository:
      Repository<OrganisationMembership>,

    private readonly auditService:
      AuditService,
  ) {}

  /**
   * Verify that the authenticated user has ACTIVE membership
   * in the organisation being accessed.
   */
  async assertOrganisationAccess(
    organisationId: string,
    userId: string,
  ): Promise<void> {
    if (!organisationId) {
      throw new BadRequestException(
        'Organisation context is required.',
      );
    }

    if (!userId) {
      throw new ForbiddenException(
        'Authenticated user context is required.',
      );
    }

    const membership =
      await this.organisationMembershipRepository.findOne({
        where: {
          organisationId,
          userId,
          status: OrganisationMembershipStatus.ACTIVE,
        },
      });

    if (!membership) {
      throw new ForbiddenException(
        'You do not have active membership in this organisation.',
      );
    }
  }

  /**
   * Validate the referenced Election.
   */
  private async validateElection(
    electionId: string,
  ): Promise<Election> {
    if (!electionId) {
      throw new BadRequestException(
        'Election ID is required.',
      );
    }

    const election =
      await this.electionRepository.findOne({
        where: {
          id: electionId,
          deletedAt: IsNull(),
        },
      });

    if (!election) {
      throw new NotFoundException(
        'Election not found.',
      );
    }

    return election;
  }

  /**
   * Validate the referenced Election Position.
   */
  private async validateElectionPosition(
    electionPositionId: string,
  ): Promise<ElectionPosition> {
    if (!electionPositionId) {
      throw new BadRequestException(
        'Election Position ID is required.',
      );
    }

    const electionPosition =
      await this.electionPositionRepository.findOne({
        where: {
          id: electionPositionId,
          deletedAt: IsNull(),
        },
      });

    if (!electionPosition) {
      throw new NotFoundException(
        'Election Position not found.',
      );
    }

    return electionPosition;
  }

  /**
   * Validate the referenced Electoral Scope.
   */
  private async validateElectoralScope(
    electoralScopeId: string,
  ): Promise<ElectoralScope> {
    if (!electoralScopeId) {
      throw new BadRequestException(
        'Electoral Scope ID is required.',
      );
    }

    const electoralScope =
      await this.electoralScopeRepository.findOne({
        where: {
          id: electoralScopeId,
          deletedAt: IsNull(),
        },
      });

    if (!electoralScope) {
      throw new NotFoundException(
        'Electoral Scope not found.',
      );
    }

    return electoralScope;
  }

  /**
   * Create a new Election Race.
   */
  async create(
    createElectionRaceDto: CreateElectionRaceDto,
    organisationId: string,
    actorId: string | null,
  ) {
    await this.assertOrganisationAccess(
      organisationId,
      actorId ?? '',
    );

    const election =
      await this.validateElection(
        createElectionRaceDto.electionId,
      );

    const electionPosition =
      await this.validateElectionPosition(
        createElectionRaceDto.electionPositionId,
      );

    const electoralScope =
      await this.validateElectoralScope(
        createElectionRaceDto.electoralScopeId,
      );

    const name =
      createElectionRaceDto.name.trim();

    const code =
      createElectionRaceDto.code
        .trim()
        .toUpperCase();

    const description =
      createElectionRaceDto.description?.trim() ||
      null;

    /**
     * Check for an existing non-deleted race
     * with the same code.
     */
    const existingCode =
      await this.electionRaceRepository.findOne({
        where: {
          code,
          deletedAt: IsNull(),
        },
      });

    if (existingCode) {
      throw new ConflictException(
        'An Election Race with this code already exists.',
      );
    }

    /**
     * Check for an existing non-deleted race
     * using the same Election, Position and Scope.
     */
    const existingCombination =
      await this.electionRaceRepository.findOne({
        where: {
          electionId: election.id,
          electionPositionId: electionPosition.id,
          electoralScopeId: electoralScope.id,
          deletedAt: IsNull(),
        },
      });

    if (existingCombination) {
      throw new ConflictException(
        'An Election Race already exists for this Election, Election Position and Electoral Scope.',
      );
    }

    const electionRace =
      this.electionRaceRepository.create({
        electionId: election.id,
        electionPositionId: electionPosition.id,
        electoralScopeId: electoralScope.id,
        name,
        code,
        status:
          createElectionRaceDto.status ??
          ElectionRaceStatus.DRAFT,
        description,
      });

    const savedRace =
      await this.electionRaceRepository.save(
        electionRace,
      );

    await this.auditService.log({
      action: 'ELECTION_RACE_CREATED',
      module: 'elections',
      actorId,
      targetId: savedRace.id,
      details: {
        organisationId,
        electionId: savedRace.electionId,
        electionPositionId:
          savedRace.electionPositionId,
        electoralScopeId:
          savedRace.electoralScopeId,
        name: savedRace.name,
        code: savedRace.code,
        status: savedRace.status,
      },
    });

    return this.findById(
      savedRace.id,
      organisationId,
      actorId ?? '',
    );
  }

  /**
   * Find Election Races.
   *
   * Supports:
   * - pagination
   * - search
   * - safe sorting
   *
   * Soft-deleted races are excluded.
   */
  async findAll(
    organisationId: string,
    paginationDto: PaginationQueryDto,
    actorId: string,
  ) {
    await this.assertOrganisationAccess(
      organisationId,
      actorId,
    );

    const page =
      Number(paginationDto.page ?? 1);

    const limit =
      Number(paginationDto.limit ?? 20);

    const safePage =
      Number.isFinite(page) && page > 0
        ? Math.floor(page)
        : 1;

    const safeLimit =
      Number.isFinite(limit) &&
      limit > 0 &&
      limit <= 100
        ? Math.floor(limit)
        : 20;

    const search =
      (paginationDto.search ?? '').trim();

    const requestedSortBy =
      paginationDto.sortBy ??
      'createdAt';

    const requestedSortOrder =
      paginationDto.sortOrder ??
      'DESC';

    const allowedSortFields = [
      'name',
      'code',
      'status',
      'createdAt',
      'updatedAt',
    ];

    const safeSortBy =
      allowedSortFields.includes(
        requestedSortBy,
      )
        ? requestedSortBy
        : 'createdAt';

    const safeSortOrder =
      requestedSortOrder === 'ASC'
        ? 'ASC'
        : 'DESC';

    const query =
      this.electionRaceRepository
        .createQueryBuilder('electionRace')
        .where(
          'electionRace.deleted_at IS NULL',
        );

    if (search) {
      query.andWhere(
        `(
          LOWER(electionRace.name) LIKE LOWER(:search)
          OR LOWER(electionRace.code) LIKE LOWER(:search)
          OR LOWER(electionRace.status::text) LIKE LOWER(:search)
          OR LOWER(COALESCE(electionRace.description, '')) LIKE LOWER(:search)
        )`,
        {
          search: `%${search}%`,
        },
      );
    }

    query
      .orderBy(
        `electionRace.${safeSortBy}`,
        safeSortOrder,
      )
      .skip(
        (safePage - 1) *
          safeLimit,
      )
      .take(safeLimit);

    const [items, total] =
      await query.getManyAndCount();

    return buildPaginatedResponse(
      items,
      total,
      safePage,
      safeLimit,
    );
  }

  /**
   * Find a single Election Race by ID.
   */
  async findById(
    electionRaceId: string,
    organisationId: string,
    actorId: string,
  ) {
    await this.assertOrganisationAccess(
      organisationId,
      actorId,
    );

    if (!electionRaceId) {
      throw new BadRequestException(
        'Election Race ID is required.',
      );
    }

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
   * Update an existing Election Race.
   *
   * Only fields supplied in the DTO are changed.
   */
  async update(
    electionRaceId: string,
    updateElectionRaceDto: UpdateElectionRaceDto,
    organisationId: string,
    actorId: string | null,
  ) {
    await this.assertOrganisationAccess(
      organisationId,
      actorId ?? '',
    );

    if (!electionRaceId) {
      throw new BadRequestException(
        'Election Race ID is required.',
      );
    }

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

    let electionId =
      electionRace.electionId;

    let electionPositionId =
      electionRace.electionPositionId;

    let electoralScopeId =
      electionRace.electoralScopeId;

    if (
      updateElectionRaceDto.electionId !==
      undefined
    ) {
      electionId =
        updateElectionRaceDto.electionId;
    }

    if (
      updateElectionRaceDto.electionPositionId !==
      undefined
    ) {
      electionPositionId =
        updateElectionRaceDto.electionPositionId;
    }

    if (
      updateElectionRaceDto.electoralScopeId !==
      undefined
    ) {
      electoralScopeId =
        updateElectionRaceDto.electoralScopeId;
    }

    /**
     * Validate referenced records whenever the
     * relationship is changed.
     */
    if (
      updateElectionRaceDto.electionId !==
      undefined
    ) {
      await this.validateElection(
        electionId,
      );
    }

    if (
      updateElectionRaceDto.electionPositionId !==
      undefined
    ) {
      await this.validateElectionPosition(
        electionPositionId,
      );
    }

    if (
      updateElectionRaceDto.electoralScopeId !==
      undefined
    ) {
      await this.validateElectoralScope(
        electoralScopeId,
      );
    }

    /**
     * Check the resulting relationship combination
     * if any relationship field changes.
     */
    if (
      updateElectionRaceDto.electionId !==
        undefined ||
      updateElectionRaceDto.electionPositionId !==
        undefined ||
      updateElectionRaceDto.electoralScopeId !==
        undefined
    ) {
      const existingCombination =
        await this.electionRaceRepository.findOne({
          where: {
            electionId,
            electionPositionId,
            electoralScopeId,
            deletedAt: IsNull(),
          },
        });

      if (
        existingCombination &&
        existingCombination.id !==
          electionRace.id
      ) {
        throw new ConflictException(
          'An Election Race already exists for this Election, Election Position and Electoral Scope.',
        );
      }

      electionRace.electionId =
        electionId;

      electionRace.electionPositionId =
        electionPositionId;

      electionRace.electoralScopeId =
        electoralScopeId;
    }

    if (
      updateElectionRaceDto.code !==
      undefined
    ) {
      const code =
        updateElectionRaceDto.code
          .trim()
          .toUpperCase();

      const existingCode =
        await this.electionRaceRepository.findOne({
          where: {
            code,
            deletedAt: IsNull(),
          },
        });

      if (
        existingCode &&
        existingCode.id !==
          electionRace.id
      ) {
        throw new ConflictException(
          'An Election Race with this code already exists.',
        );
      }

      electionRace.code = code;
    }

    if (
      updateElectionRaceDto.name !==
      undefined
    ) {
      electionRace.name =
        updateElectionRaceDto.name.trim();
    }

    if (
      updateElectionRaceDto.status !==
      undefined
    ) {
      electionRace.status =
        updateElectionRaceDto.status;
    }

    if (
      updateElectionRaceDto.description !==
      undefined
    ) {
      electionRace.description =
        updateElectionRaceDto.description.trim() ||
        null;
    }

    const updatedRace =
      await this.electionRaceRepository.save(
        electionRace,
      );

    await this.auditService.log({
      action: 'ELECTION_RACE_UPDATED',
      module: 'elections',
      actorId,
      targetId: updatedRace.id,
      details: {
        organisationId,
        electionId: updatedRace.electionId,
        electionPositionId:
          updatedRace.electionPositionId,
        electoralScopeId:
          updatedRace.electoralScopeId,
        name: updatedRace.name,
        code: updatedRace.code,
        status: updatedRace.status,
      },
    });

    return updatedRace;
  }
}