/**
 * File:
 * C:\Projects\PeopleFirstPolitician\backend\src\modules\elections\elections.service.ts
 *
 * Purpose:
 * - Provides business logic for Election management.
 * - Enforces organisation-scoped access through the authenticated
 *   user's active organisation membership.
 * - Supports Election creation, retrieval, pagination, searching,
 *   updating and status management.
 * - Excludes soft-deleted Election records from normal operations.
 * - Records important Election-management actions in the audit log.
 *
 * Important architecture note:
 * - The current Election entity is not directly linked to an
 *   organisation.
 * - organisationId is therefore used as an authorisation context
 *   for the API operation rather than being persisted on Election.
 * - This preserves the existing Election data model.
 *
 * Security:
 * - organisationId comes from the authenticated route context.
 * - It is never accepted from CreateElectionDto or UpdateElectionDto.
 * - Active organisation membership is verified inside the service.
 * - The controller separately enforces JWT authentication and
 *   election permissions.
 * - Soft-deleted records are excluded from normal queries.
 * - Sort fields are explicitly allow-listed to prevent arbitrary
 *   SQL expressions from being supplied through query parameters.
 */

import {
  BadRequestException,
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
  ElectionStatus,
} from './entities/election.entity';

import {
  OrganisationMembership,
  OrganisationMembershipStatus,
} from '../organisations/entities/organisation-membership.entity';

import { CreateElectionDto } from './dto/create-election.dto';
import { UpdateElectionDto } from './dto/update-election.dto';

import { AuditService } from '../audit/audit.service';

import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { buildPaginatedResponse } from '../../common/utils/pagination-response.util';

import { ElectionsQueryDto } from './dto/elections-query.dto';

@Injectable()
export class ElectionsService {
  constructor(
    @InjectRepository(Election)
    private readonly electionRepository:
      Repository<Election>,

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
   * Create a new Election.
   *
   * Election records are initially created using the supplied
   * status when present; otherwise the entity/database default
   * is used.
   */
  async create(
    createElectionDto: CreateElectionDto,
    organisationId: string,
    actorId: string | null,
  ) {
    await this.assertOrganisationAccess(
      organisationId,
      actorId ?? '',
    );

    /**
     * Normalise user-supplied text before persistence.
     */
    const name =
      createElectionDto.name.trim();

    const electionType =
      createElectionDto.electionType.trim();

    const description =
      createElectionDto.description?.trim() || null;

    /**
     * Create the Election entity.
     *
     * organisationId is deliberately not persisted because
     * the current Election entity is organisation-independent.
     */
    const election =
      this.electionRepository.create({
        name,
        electionType,
        electionDate:
          createElectionDto.electionDate,
        status:
          createElectionDto.status ??
          ElectionStatus.DRAFT,
        description,
      });

    const savedElection =
      await this.electionRepository.save(
        election,
      );

    /**
     * Record the administrative action.
     */
    await this.auditService.log({
      action: 'ELECTION_CREATED',
      module: 'elections',
      actorId,
      targetId: savedElection.id,
      details: {
        organisationId,
        name: savedElection.name,
        electionType:
          savedElection.electionType,
        electionDate:
          savedElection.electionDate,
        status:
          savedElection.status,
      },
    });

    return this.findById(
      savedElection.id,
      organisationId,
      actorId ?? '',
    );
  }

  /**
   * Find Elections.
   *
   * Supports:
   * - pagination
   * - search
   * - safe sorting
   *
   * Deleted Elections are excluded.
   */
  async findAll(
    organisationId: string,
    paginationDto: ElectionsQueryDto,
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

    const status =
      paginationDto.status;

    const requestedSortBy =
      paginationDto.sortBy ??
      'electionDate';

    const requestedSortOrder =
      paginationDto.sortOrder ??
      'DESC';

    /**
     * Only permit known Election fields to be used
     * for ordering.
     */
    const allowedSortFields = [
      'name',
      'electionType',
      'electionDate',
      'status',
      'createdAt',
      'updatedAt',
    ];

    const safeSortBy =
      allowedSortFields.includes(
        requestedSortBy,
      )
        ? requestedSortBy
        : 'electionDate';

    const safeSortOrder =
      requestedSortOrder === 'ASC'
        ? 'ASC'
        : 'DESC';

    const query =
      this.electionRepository
        .createQueryBuilder('election')
        .where(
          'election.deleted_at IS NULL',
        );

    /**
     * Search across the principal Election fields.
     */
    if (search) {
      query.andWhere(
        `(
          LOWER(election.name) LIKE LOWER(:search)
          OR LOWER(election.election_type) LIKE LOWER(:search)
          OR LOWER(election.status::text) LIKE LOWER(:search)
          OR LOWER(COALESCE(election.description, '')) LIKE LOWER(:search)
        )`,
        {
          search: `%${search}%`,
        },
      );
    }

        /**
         * Optional lifecycle status filter.
         */
        if (status) {
          query.andWhere(
            'election.status = :status',
            {
              status,
            },
          );
        }

        query
          .orderBy(
            `election.${safeSortBy}`,
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
   * Find a single Election by ID.
   *
   * Deleted Elections are not returned.
   */
  async findById(
    electionId: string,
    organisationId: string,
    actorId: string,
  ) {
    await this.assertOrganisationAccess(
      organisationId,
      actorId,
    );

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
   * Update an existing Election.
   *
   * Only fields supplied in the DTO are changed.
   */
  async update(
    electionId: string,
    updateElectionDto: UpdateElectionDto,
    organisationId: string,
    actorId: string | null,
  ) {
    await this.assertOrganisationAccess(
      organisationId,
      actorId ?? '',
    );

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

    /**
     * Apply only fields explicitly supplied
     * by the client.
     */
    if (
      updateElectionDto.name !==
      undefined
    ) {
      election.name =
        updateElectionDto.name.trim();
    }

    if (
      updateElectionDto.electionType !==
      undefined
    ) {
      election.electionType =
        updateElectionDto.electionType.trim();
    }

    if (
      updateElectionDto.electionDate !==
      undefined
    ) {
      election.electionDate =
        updateElectionDto.electionDate;
    }

    if (
      updateElectionDto.status !==
      undefined
    ) {
      election.status =
        updateElectionDto.status;
    }

    if (
      updateElectionDto.description !==
      undefined
    ) {
      election.description =
        updateElectionDto.description.trim() ||
        null;
    }

    const updatedElection =
      await this.electionRepository.save(
        election,
      );

    /**
     * Record the administrative action.
     */
    await this.auditService.log({
      action: 'ELECTION_UPDATED',
      module: 'elections',
      actorId,
      targetId: updatedElection.id,
      details: {
        organisationId,
        name: updatedElection.name,
        electionType:
          updatedElection.electionType,
        electionDate:
          updatedElection.electionDate,
        status:
          updatedElection.status,
      },
    });

    return updatedElection;
  }
}