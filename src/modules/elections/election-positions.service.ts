/**
 * File:
 * C:\Projects\PeopleFirstPolitician\backend\src\modules\elections\election-positions.service.ts
 *
 * Purpose:
 * - Provides business logic for Election Position management.
 * - Supports Election Position creation, retrieval, pagination,
 *   searching and updating.
 * - Enforces organisation-scoped access through the authenticated
 *   user's active organisation membership.
 * - Excludes soft-deleted Election Position records from normal
 *   operations.
 * - Records important Election Position management actions in the
 *   audit log.
 *
 * Important architecture note:
 * - The current Election Position entity is not directly linked to
 *   an organisation.
 * - organisationId is therefore used as an authorisation context
 *   for the API operation rather than being persisted on the
 *   Election Position.
 * - This preserves the existing Election Position data model.
 *
 * Security:
 * - organisationId comes from the authenticated route context.
 * - It is never accepted from CreateElectionPositionDto or
 *   UpdateElectionPositionDto.
 * - Active organisation membership is verified inside the service.
 * - The controller separately enforces JWT authentication and
 *   election permissions.
 * - Soft-deleted records are excluded from normal queries.
 * - Sort fields are explicitly allow-listed to prevent arbitrary
 *   SQL expressions from being supplied through query parameters.
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
  ElectionPosition,
} from './entities/election-position.entity';

import {
  OrganisationMembership,
  OrganisationMembershipStatus,
} from '../organisations/entities/organisation-membership.entity';

import {
  CreateElectionPositionDto,
} from './dto/create-election-position.dto';

import {
  UpdateElectionPositionDto,
} from './dto/update-election-position.dto';

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
export class ElectionPositionsService {
  constructor(
    @InjectRepository(ElectionPosition)
    private readonly electionPositionRepository:
      Repository<ElectionPosition>,

    @InjectRepository(OrganisationMembership)
    private readonly organisationMembershipRepository:
      Repository<OrganisationMembership>,

    private readonly auditService:
      AuditService,
  ) {}

  /**
   * Verify that the authenticated user has ACTIVE membership
   * in the organisation being accessed.
   *
   * This check is intentionally performed in the service layer
   * rather than relying only on the controller guard.
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
   * Create a new Election Position.
   *
   * Position codes are normalised to uppercase because they are
   * intended to be machine-readable identifiers.
   *
   * Position names and descriptions are trimmed before persistence.
   */
  async create(
    createElectionPositionDto:
      CreateElectionPositionDto,
    organisationId: string,
    actorId: string | null,
  ) {
    await this.assertOrganisationAccess(
      organisationId,
      actorId ?? '',
    );

    const code =
      createElectionPositionDto.code
        .trim()
        .toUpperCase();

    const name =
      createElectionPositionDto.name.trim();

    const description =
      createElectionPositionDto.description?.trim() ||
      null;

    /**
     * Check for an existing non-deleted position with
     * the same code.
     *
     * This provides a clear application-level error rather
     * than exposing a database unique-constraint error.
     */
    const existingPosition =
      await this.electionPositionRepository.findOne({
        where: {
          code,
          deletedAt: IsNull(),
        },
      });

    if (existingPosition) {
      throw new ConflictException(
        'An Election Position with this code already exists.',
      );
    }

    const electionPosition =
      this.electionPositionRepository.create({
        code,
        name,
        description,
      });

    const savedPosition =
      await this.electionPositionRepository.save(
        electionPosition,
      );

    /**
     * Record the administrative action.
     */
    await this.auditService.log({
      action: 'ELECTION_POSITION_CREATED',
      module: 'elections',
      actorId,
      targetId: savedPosition.id,
      details: {
        organisationId,
        code: savedPosition.code,
        name: savedPosition.name,
      },
    });

    return this.findById(
      savedPosition.id,
      organisationId,
      actorId ?? '',
    );
  }

  /**
   * Find Election Positions.
   *
   * Supports:
   * - pagination
   * - search
   * - safe sorting
   *
   * Deleted Election Positions are excluded.
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
      'name';

    const requestedSortOrder =
      paginationDto.sortOrder ??
      'ASC';

    /**
     * Only permit known Election Position fields
     * for ordering.
     */
    const allowedSortFields = [
      'code',
      'name',
      'createdAt',
      'updatedAt',
    ];

    const safeSortBy =
      allowedSortFields.includes(
        requestedSortBy,
      )
        ? requestedSortBy
        : 'name';

    const safeSortOrder =
      requestedSortOrder === 'DESC'
        ? 'DESC'
        : 'ASC';

    const query =
      this.electionPositionRepository
        .createQueryBuilder(
          'electionPosition',
        )
        .where(
          'electionPosition.deleted_at IS NULL',
        );

    /**
     * Search across the principal Election Position
     * fields.
     */
    if (search) {
      query.andWhere(
        `(
          LOWER(electionPosition.code) LIKE LOWER(:search)
          OR LOWER(electionPosition.name) LIKE LOWER(:search)
          OR LOWER(COALESCE(electionPosition.description, '')) LIKE LOWER(:search)
        )`,
        {
          search: `%${search}%`,
        },
      );
    }

    query
      .orderBy(
        `electionPosition.${safeSortBy}`,
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
      safePage,
      safeLimit,
      total,
    );
  }

  /**
   * Find a single Election Position by ID.
   *
   * Deleted Election Positions are not returned.
   */
  async findById(
    electionPositionId: string,
    organisationId: string,
    actorId: string,
  ) {
    await this.assertOrganisationAccess(
      organisationId,
      actorId,
    );

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
   * Update an existing Election Position.
   *
   * Only fields supplied in the DTO are changed.
   */
  async update(
    electionPositionId: string,
    updateElectionPositionDto:
      UpdateElectionPositionDto,
    organisationId: string,
    actorId: string | null,
  ) {
    await this.assertOrganisationAccess(
      organisationId,
      actorId ?? '',
    );

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

    /**
     * Apply only fields explicitly supplied
     * by the client.
     */
    if (
      updateElectionPositionDto.code !==
      undefined
    ) {
      const code =
        updateElectionPositionDto.code
          .trim()
          .toUpperCase();

      const existingPosition =
        await this.electionPositionRepository.findOne({
          where: {
            code,
            deletedAt: IsNull(),
          },
        });

      if (
        existingPosition &&
        existingPosition.id !==
          electionPosition.id
      ) {
        throw new ConflictException(
          'An Election Position with this code already exists.',
        );
      }

      electionPosition.code = code;
    }

    if (
      updateElectionPositionDto.name !==
      undefined
    ) {
      electionPosition.name =
        updateElectionPositionDto.name.trim();
    }

    if (
      updateElectionPositionDto.description !==
      undefined
    ) {
      electionPosition.description =
        updateElectionPositionDto.description.trim() ||
        null;
    }

    const updatedPosition =
      await this.electionPositionRepository.save(
        electionPosition,
      );

    /**
     * Record the administrative action.
     */
    await this.auditService.log({
      action: 'ELECTION_POSITION_UPDATED',
      module: 'elections',
      actorId,
      targetId: updatedPosition.id,
      details: {
        organisationId,
        code: updatedPosition.code,
        name: updatedPosition.name,
      },
    });

    return updatedPosition;
  }
}