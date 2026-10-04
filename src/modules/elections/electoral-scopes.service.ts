/**
 * File:
 * C:\Projects\PeopleFirstPolitician\backend\src\modules\elections\electoral-scopes.service.ts
 *
 * Purpose:
 * - Provides business logic for Electoral Scope management.
 * - Validates geographical relationships before creating or updating
 *   Electoral Scopes.
 * - Enforces organisation membership for organisation-scoped operations.
 * - Supports paginated listing and searching.
 *
 * Supported scope types:
 * - NATIONAL
 * - STATE
 * - LOCAL_GOVERNMENT
 * - WARD
 *
 * Current model limitations:
 * - SENATORIAL_DISTRICT, FEDERAL_CONSTITUENCY and
 *   STATE_CONSTITUENCY exist in the database enum.
 * - The current geography model does not contain dedicated entities
 *   or relationships for these three scope types.
 * - POLLING_UNIT scopes require the separate
 *   ElectoralScopePollingUnit mapping.
 * - These unsupported creation paths are therefore rejected rather
 *   than represented incorrectly.
 *
 * Security:
 * - organisationId comes from the authenticated route context.
 * - Active organisation membership is verified inside the service.
 * - Controller-level JWT and permission checks are enforced separately.
 * - Soft-deleted scopes are excluded from normal queries.
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
  ElectoralScope,
  ElectoralScopeStatus,
  ElectoralScopeType,
} from './entities/electoral-scope.entity';

import { State } from '../geography/entities/state.entity';
import { Lga } from '../geography/entities/lga.entity';
import { Ward } from '../geography/entities/ward.entity';

import {
  OrganisationMembership,
  OrganisationMembershipStatus,
} from '../organisations/entities/organisation-membership.entity';

import { AuditService } from '../audit/audit.service';

import { CreateElectoralScopeDto } from './dto/create-electoral-scope.dto';
import { UpdateElectoralScopeDto } from './dto/update-electoral-scope.dto';

import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { buildPaginatedResponse } from '../../common/utils/pagination-response.util';

@Injectable()
export class ElectoralScopesService {
  constructor(
    @InjectRepository(ElectoralScope)
    private readonly electoralScopeRepository:
      Repository<ElectoralScope>,

    @InjectRepository(State)
    private readonly stateRepository:
      Repository<State>,

    @InjectRepository(Lga)
    private readonly lgaRepository:
      Repository<Lga>,

    @InjectRepository(Ward)
    private readonly wardRepository:
      Repository<Ward>,

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
   * Validate that a State exists.
   */
  private async validateState(
    stateId: string,
  ): Promise<State> {
    const state =
      await this.stateRepository.findOne({
        where: {
          id: stateId,
        },
      });

    if (!state) {
      throw new BadRequestException(
        `State with ID ${stateId} was not found.`,
      );
    }

    return state;
  }

  /**
   * Validate that an LGA exists and, when a State is supplied,
   * belongs to that State.
   */
  private async validateLga(
    lgaId: string,
    stateId?: string | null,
  ): Promise<Lga> {
    const lga =
      await this.lgaRepository.findOne({
        where: {
          id: lgaId,
        },
      });

    if (!lga) {
      throw new BadRequestException(
        `LGA with ID ${lgaId} was not found.`,
      );
    }

    if (
      stateId &&
      lga.stateId !== stateId
    ) {
      throw new BadRequestException(
        'The selected LGA does not belong to the selected State.',
      );
    }

    return lga;
  }

  /**
   * Validate that a Ward exists and, when an LGA is supplied,
   * belongs to that LGA.
   */
  private async validateWard(
    wardId: string,
    lgaId?: string | null,
  ): Promise<Ward> {
    const ward =
        await this.wardRepository.findOne({
            where: {
            id: wardId,
            },
            relations: {
            lga: true,
            },
        });

    if (!ward) {
      throw new BadRequestException(
        `Ward with ID ${wardId} was not found.`,
      );
    }

    if (
      lgaId &&
      ward.lgaId !== lgaId
    ) {
      throw new BadRequestException(
        'The selected Ward does not belong to the selected LGA.',
      );
    }

    return ward;
  }

  /**
   * Validate the geographical relationships represented by
   * an Electoral Scope.
   */
  private async validateScopeGeography(
    scopeType: ElectoralScopeType,
    stateId?: string | null,
    lgaId?: string | null,
    wardId?: string | null,
  ): Promise<void> {
    switch (scopeType) {
      case ElectoralScopeType.NATIONAL: {
        if (
          stateId ||
          lgaId ||
          wardId
        ) {
          throw new BadRequestException(
            'A national Electoral Scope must not specify a State, LGA or Ward.',
          );
        }

        return;
      }

      case ElectoralScopeType.STATE: {
        if (!stateId) {
          throw new BadRequestException(
            'A State Electoral Scope requires stateId.',
          );
        }

        if (
          lgaId ||
          wardId
        ) {
          throw new BadRequestException(
            'A State Electoral Scope must not specify an LGA or Ward.',
          );
        }

        await this.validateState(
          stateId,
        );

        return;
      }

      case ElectoralScopeType.LOCAL_GOVERNMENT: {
        if (!lgaId) {
          throw new BadRequestException(
            'A Local Government Electoral Scope requires lgaId.',
          );
        }

        if (wardId) {
          throw new BadRequestException(
            'A Local Government Electoral Scope must not specify wardId.',
          );
        }

        await this.validateLga(
          lgaId,
          stateId,
        );

        if (stateId) {
          await this.validateState(
            stateId,
          );
        }

        return;
      }

      case ElectoralScopeType.WARD: {
        if (!wardId) {
          throw new BadRequestException(
            'A Ward Electoral Scope requires wardId.',
          );
        }

        const ward =
          await this.validateWard(
            wardId,
            lgaId,
          );

        if (lgaId) {
          await this.validateLga(
            lgaId,
            stateId,
          );
        }

        if (
          stateId &&
          ward.lgaId !== lgaId
        ) {
          throw new BadRequestException(
            'The selected Ward does not belong to the selected State.',
          );
        }

        if (stateId) {
          await this.validateState(
            stateId,
          );
        }

        return;
      }

      case ElectoralScopeType.POLLING_UNIT: {
        throw new BadRequestException(
          'Polling Unit Electoral Scopes require the ElectoralScopePollingUnit mapping workflow and cannot be created directly with the current ElectoralScope request model.',
        );
      }

      case ElectoralScopeType.SENATORIAL_DISTRICT:
      case ElectoralScopeType.FEDERAL_CONSTITUENCY:
      case ElectoralScopeType.STATE_CONSTITUENCY: {
        throw new BadRequestException(
          `The ${scopeType} Electoral Scope type is defined in the database, but its required geographical entity is not yet represented in the current data model.`,
        );
      }

      default: {
        throw new BadRequestException(
          'Unsupported Electoral Scope type.',
        );
      }
    }
  }

  /**
   * Create a new Electoral Scope.
   */
  async create(
    organisationId: string,
    actorId: string,
    createElectoralScopeDto: CreateElectoralScopeDto,
  ) {
    await this.assertOrganisationAccess(
      organisationId,
      actorId,
    );

    const name =
      createElectoralScopeDto.name.trim();

    const code =
      createElectoralScopeDto.code?.trim() ||
      null;

    await this.validateScopeGeography(
      createElectoralScopeDto.scopeType,
      createElectoralScopeDto.stateId ?? null,
      createElectoralScopeDto.lgaId ?? null,
      createElectoralScopeDto.wardId ?? null,
    );

    const duplicate =
      await this.electoralScopeRepository.findOne({
        where: {
          scopeType:
            createElectoralScopeDto.scopeType,
          name,
          deletedAt: IsNull(),
        },
      });

    if (duplicate) {
      throw new ConflictException(
        'An Electoral Scope with this type and name already exists.',
      );
    }

    const scope =
      this.electoralScopeRepository.create({
        scopeType:
          createElectoralScopeDto.scopeType,

        name,

        code,

        status:
          ElectoralScopeStatus.ACTIVE,

        stateId:
          createElectoralScopeDto.stateId ??
          null,

        lgaId:
          createElectoralScopeDto.lgaId ??
          null,

        wardId:
          createElectoralScopeDto.wardId ??
          null,
      });

    const savedScope =
      await this.electoralScopeRepository.save(
        scope,
      );

    await this.auditService.log({
      action:
        'ELECTORAL_SCOPE_CREATED',

      module:
        'elections',

      actorId,

      targetId:
        savedScope.id,

      details: {
        organisationId,

        scopeType:
          savedScope.scopeType,

        name:
          savedScope.name,

        code:
          savedScope.code,
      },
    });

    return this.findById(
      savedScope.id,
      organisationId,
      actorId,
    );
  }

  /**
   * Find Electoral Scopes.
   *
   * Supports:
   * - pagination
   * - search
   *
   * Deleted scopes are excluded.
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
      Number(
        paginationDto.page ?? 1,
      );

    const limit =
      Number(
        paginationDto.limit ?? 20,
      );

    const safePage =
      Number.isFinite(page) &&
      page > 0
        ? Math.floor(page)
        : 1;

    const safeLimit =
      Number.isFinite(limit) &&
      limit > 0 &&
      limit <= 100
        ? Math.floor(limit)
        : 20;

    const search =
      (
        paginationDto.search ??
        ''
      ).trim();

    const query =
      this.electoralScopeRepository
        .createQueryBuilder('scope')
        .where(
          'scope.deleted_at IS NULL',
        );

    if (search) {
      query.andWhere(
        `(
          LOWER(scope.name) LIKE LOWER(:search)
          OR LOWER(COALESCE(scope.code, '')) LIKE LOWER(:search)
          OR LOWER(scope.scope_type::text) LIKE LOWER(:search)
        )`,
        {
          search: `%${search}%`,
        },
      );
    }

    query
      .orderBy(
        'scope.name',
        'ASC',
      )
      .skip(
        (safePage - 1) *
          safeLimit,
      )
      .take(
        safeLimit,
      );

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
   * Find one Electoral Scope by ID.
   */
  async findById(
    electoralScopeId: string,
    organisationId: string,
    actorId: string,
  ) {
    await this.assertOrganisationAccess(
      organisationId,
      actorId,
    );

    if (!electoralScopeId) {
      throw new BadRequestException(
        'Electoral Scope ID is required.',
      );
    }

    const scope =
      await this.electoralScopeRepository.findOne({
        where: {
          id: electoralScopeId,
          deletedAt: IsNull(),
        },
        relations: {
          state: true,
          lga: true,
          ward: true,
        },
      });

    if (!scope) {
      throw new NotFoundException(
        'Electoral Scope not found.',
      );
    }

    return scope;
  }

  /**
   * Update an existing Electoral Scope.
   *
   * The complete resulting geography is validated after applying
   * the supplied partial update.
   */
  async update(
    electoralScopeId: string,
    updateElectoralScopeDto: UpdateElectoralScopeDto,
    organisationId: string,
    actorId: string,
  ) {
    await this.assertOrganisationAccess(
      organisationId,
      actorId,
    );

    if (!electoralScopeId) {
      throw new BadRequestException(
        'Electoral Scope ID is required.',
      );
    }

    const scope =
      await this.electoralScopeRepository.findOne({
        where: {
          id: electoralScopeId,
          deletedAt: IsNull(),
        },
      });

    if (!scope) {
      throw new NotFoundException(
        'Electoral Scope not found.',
      );
    }

    const resultingScopeType =
      updateElectoralScopeDto.scopeType ??
      scope.scopeType;

    const resultingName =
      updateElectoralScopeDto.name !==
      undefined
        ? updateElectoralScopeDto.name.trim()
        : scope.name;

    const resultingCode =
      updateElectoralScopeDto.code !==
      undefined
        ? updateElectoralScopeDto.code.trim() ||
          null
        : scope.code;

    const resultingStateId =
      updateElectoralScopeDto.stateId !==
      undefined
        ? updateElectoralScopeDto.stateId
        : scope.stateId;

    const resultingLgaId =
      updateElectoralScopeDto.lgaId !==
      undefined
        ? updateElectoralScopeDto.lgaId
        : scope.lgaId;

    const resultingWardId =
      updateElectoralScopeDto.wardId !==
      undefined
        ? updateElectoralScopeDto.wardId
        : scope.wardId;

    await this.validateScopeGeography(
      resultingScopeType,
      resultingStateId,
      resultingLgaId,
      resultingWardId,
    );

    const duplicate =
      await this.electoralScopeRepository.findOne({
        where: {
          scopeType:
            resultingScopeType,

          name:
            resultingName,

          deletedAt:
            IsNull(),
        },
      });

    if (
      duplicate &&
      duplicate.id !== electoralScopeId
    ) {
      throw new ConflictException(
        'An Electoral Scope with this type and name already exists.',
      );
    }

    scope.scopeType =
      resultingScopeType;

    scope.name =
      resultingName;

    scope.code =
      resultingCode;

    scope.stateId =
      resultingStateId ?? null;

    scope.lgaId =
      resultingLgaId ?? null;

    scope.wardId =
      resultingWardId ?? null;

    const updatedScope =
      await this.electoralScopeRepository.save(
        scope,
      );

    await this.auditService.log({
      action:
        'ELECTORAL_SCOPE_UPDATED',

      module:
        'elections',

      actorId,

      targetId:
        updatedScope.id,

      details: {
        organisationId,

        scopeType:
          updatedScope.scopeType,

        name:
          updatedScope.name,

        code:
          updatedScope.code,
      },
    });

    return this.findById(
      updatedScope.id,
      organisationId,
      actorId,
    );
  }
}


