/**
 * File:
 * C:\Projects\PeopleFirstPolitician\backend\src\modules\agents\agents.service.ts
 *
 * Purpose:
 * - Provides business logic for Agent management.
 * - Enforces organisation-scoped access.
 * - Manages Agent creation, retrieval, updating, status changes,
 *   soft deletion and restoration.
 * - Validates associated platform Users.
 * - Prevents duplicate Agent references within an organisation.
 * - Records important Agent-management audit events.
 *
 * Security:
 * - organisationId is never accepted from CreateAgentDto.
 * - The requesting user must have ACTIVE membership in the
 *   organisation before an Agent operation is permitted.
 * - Agent records are always accessed together with organisationId.
 * - Deleted Agents are excluded from normal queries.
 * - Status changes are handled separately from profile updates.
 * - Audit events record important administrative mutations.
 */

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';

import {
  Agent,
  AgentStatus,
} from './entities/agent.entity';

import {
  AgentAssignment,
  AgentAssignmentStatus,
} from './entities/agent-assignment.entity';

import { User } from '../users/entities/user.entity';

import {
  OrganisationMembership,
  OrganisationMembershipStatus,
} from '../organisations/entities/organisation-membership.entity';

import { Campaign } from '../campaigns/entities/campaign.entity';
import { Candidacy } from '../candidacies/entities/candidacy.entity';

import { ElectionRace } from '../elections/entities/election-race.entity';

import {
  ElectoralScope,
  ElectoralScopeType,
} from '../elections/entities/electoral-scope.entity';

import { PollingUnit } from '../geography/entities/polling-unit.entity';
import { Ward } from '../geography/entities/ward.entity';
import { Lga } from '../geography/entities/lga.entity';

import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { UpdateAgentStatusDto } from './dto/update-agent-status.dto';

import { CreateAgentAssignmentDto } from './dto/create-agent-assignment.dto';
import { UpdateAgentAssignmentStatusDto } from './dto/update-agent-assignment-status.dto';

import { AuditService } from '../audit/audit.service';

import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { buildPaginatedResponse } from '../../common/utils/pagination-response.util';

@Injectable()
export class AgentsService {
 constructor(
  @InjectRepository(Agent)
  private readonly agentRepository: Repository<Agent>,

  @InjectRepository(AgentAssignment)
  private readonly agentAssignmentRepository:
    Repository<AgentAssignment>,

  @InjectRepository(User)
  private readonly userRepository: Repository<User>,

  @InjectRepository(OrganisationMembership)
  private readonly organisationMembershipRepository:
    Repository<OrganisationMembership>,

  @InjectRepository(Campaign)
  private readonly campaignRepository:
    Repository<Campaign>,

  @InjectRepository(Candidacy)
  private readonly candidacyRepository:
    Repository<Candidacy>,

  @InjectRepository(ElectionRace)
  private readonly electionRaceRepository:
    Repository<ElectionRace>,

  @InjectRepository(ElectoralScope)
  private readonly electoralScopeRepository:
    Repository<ElectoralScope>,

  @InjectRepository(PollingUnit)
  private readonly pollingUnitRepository:
    Repository<PollingUnit>,

  @InjectRepository(Ward)
  private readonly wardRepository:
    Repository<Ward>,

  @InjectRepository(Lga)
  private readonly lgaRepository:
    Repository<Lga>,

  private readonly auditService: AuditService,
) {}

  /**
   * Verify that a user has ACTIVE membership in the
   * organisation being accessed.
   *
   * This check is intentionally performed inside the service
   * rather than relying only on the controller.
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
   * Verify that a polling unit falls within the electoral scope
   * of the campaign's election race.
   *
   * The current geography model supports reliable validation for:
   * - NATIONAL
   * - STATE
   * - LOCAL_GOVERNMENT
   * - WARD
   * - POLLING_UNIT
   *
   * District and constituency scopes are deliberately rejected
   * because the current data model does not contain the required
   * geographic relationships for safe validation.
   */
  private async assertPollingUnitWithinCampaignScope(
    campaign: Campaign,
    pollingUnit: PollingUnit,
  ): Promise<void> {
    const candidacy = await this.candidacyRepository.findOne({
      where: {
        id: campaign.candidacyId,
        deletedAt: IsNull(),
      },
    });

    if (!candidacy) {
      throw new BadRequestException(
        'The campaign is linked to an invalid or deleted candidacy.',
      );
    }

    const electionRace = await this.electionRaceRepository.findOne({
      where: {
        id: candidacy.electionRaceId,
        deletedAt: IsNull(),
      },
    });

    if (!electionRace) {
      throw new BadRequestException(
        'The campaign is linked to an invalid or deleted election race.',
      );
    }

    const electoralScope = await this.electoralScopeRepository.findOne({
      where: {
        id: electionRace.electoralScopeId,
        deletedAt: IsNull(),
      },
    });

    if (!electoralScope) {
      throw new BadRequestException(
        'The election race has no valid electoral scope.',
      );
    }

    switch (electoralScope.scopeType) {
      case ElectoralScopeType.NATIONAL:
        return;

      case ElectoralScopeType.STATE: {
        if (!electoralScope.stateId) {
          throw new BadRequestException(
            'The state electoral scope is missing its state.',
          );
        }

        const lga = await this.lgaRepository.findOne({
          where: {
            id: pollingUnit.ward.lgaId,
          },
        });

        if (!lga || lga.stateId !== electoralScope.stateId) {
          throw new BadRequestException(
            'The polling unit is outside the campaign electoral scope.',
          );
        }

        return;
      }

      case ElectoralScopeType.LOCAL_GOVERNMENT: {
        if (!electoralScope.lgaId) {
          throw new BadRequestException(
            'The local-government electoral scope is missing its LGA.',
          );
        }

        if (pollingUnit.ward.lgaId !== electoralScope.lgaId) {
          throw new BadRequestException(
            'The polling unit is outside the campaign electoral scope.',
          );
        }

        return;
      }

      case ElectoralScopeType.WARD: {
        if (!electoralScope.wardId) {
          throw new BadRequestException(
            'The ward electoral scope is missing its ward.',
          );
        }

        if (pollingUnit.wardId !== electoralScope.wardId) {
          throw new BadRequestException(
            'The polling unit is outside the campaign electoral scope.',
          );
        }

        return;
      }

      case ElectoralScopeType.POLLING_UNIT:
        throw new BadRequestException(
          'Polling-unit electoral scopes cannot currently be validated because the ElectoralScope entity does not store a pollingUnitId.',
        );

      case ElectoralScopeType.SENATORIAL_DISTRICT:
      case ElectoralScopeType.FEDERAL_CONSTITUENCY:
      case ElectoralScopeType.STATE_CONSTITUENCY:
        throw new BadRequestException(
          `The ${electoralScope.scopeType} scope cannot currently be validated because the required geographic relationship is not available in the system.`,
        );

      default:
        throw new BadRequestException(
          'The campaign has an unsupported electoral scope.',
        );
    }
  }

  /**
   * Create an Agent Assignment.
   *
   * An assignment links an existing Agent to a Campaign and Polling Unit.
   * All three records are validated against the requesting organisation
   * before the assignment is persisted.
   */
  async createAssignment(
    dto: CreateAgentAssignmentDto,
    organisationId: string,
    actorId: string,
  ) {
    await this.assertOrganisationAccess(organisationId, actorId);

    const agent = await this.agentRepository.findOne({
      where: {
        id: dto.agentId,
        organisationId,
        deletedAt: IsNull(),
      },
    });

    if (!agent) {
      throw new NotFoundException(
        'Agent not found in this organisation.',
      );
    }

    if (agent.status !== AgentStatus.ACTIVE) {
      throw new BadRequestException(
        'Only an active Agent can be assigned.',
      );
    }

    const campaign = await this.campaignRepository.findOne({
      where: {
        id: dto.campaignId,
        organisationId,
        deletedAt: IsNull(),
      },
    });

    if (!campaign) {
      throw new NotFoundException(
        'Campaign not found in this organisation.',
      );
    }

    const pollingUnit = await this.pollingUnitRepository.findOne({
      where: {
        id: dto.pollingUnitId,
      },
    });

    if (!pollingUnit) {
      throw new NotFoundException(
        'Polling unit not found.',
      );
    }

    await this.assertPollingUnitWithinCampaignScope(
      campaign,
      pollingUnit,
    );

    const existingAssignment =
      await this.agentAssignmentRepository.findOne({
        where: {
          agentId: agent.id,
          campaignId: campaign.id,
          pollingUnitId: pollingUnit.id,
          deletedAt: IsNull(),
        },
      });

    if (existingAssignment) {
      throw new ConflictException(
        'This Agent is already assigned to this polling unit for this campaign.',
      );
    }

    const assignment = this.agentAssignmentRepository.create({
      agentId: agent.id,
      campaignId: campaign.id,
      pollingUnitId: pollingUnit.id,
      status: AgentAssignmentStatus.ACTIVE,
      assignedAt: new Date(),
      unassignedAt: null,
      assignedByUserId: actorId,
      notes: dto.notes?.trim() || null,
    });

    const savedAssignment =
      await this.agentAssignmentRepository.save(assignment);

    await this.auditService.log({
      action: 'AGENT_ASSIGNMENT_CREATED',
      module: 'agents',
      actorId,
      targetId: savedAssignment.id,
      details: {
        organisationId,
        agentId: agent.id,
        campaignId: campaign.id,
        pollingUnitId: pollingUnit.id,
      },
    });

    return savedAssignment;
  }

  /**
   * Retrieve an Agent Assignment within an organisation.
   */
  async findAssignmentById(
    id: string,
    organisationId: string,
    actorId: string,
  ) {
    await this.assertOrganisationAccess(organisationId, actorId);

    const assignment = await this.agentAssignmentRepository.findOne({
      where: {
        id,
        deletedAt: IsNull(),
      },
    });

    if (!assignment) {
      throw new NotFoundException(
        'Agent assignment not found.',
      );
    }

    const agent = await this.agentRepository.findOne({
      where: {
        id: assignment.agentId,
        organisationId,
        deletedAt: IsNull(),
      },
    });

    if (!agent) {
      throw new NotFoundException(
        'Agent assignment not found in this organisation.',
      );
    }

    return assignment;
  }

  /**
   * Change Agent Assignment status.
   */
  async updateAssignmentStatus(
    id: string,
    dto: UpdateAgentAssignmentStatusDto,
    organisationId: string,
    actorId: string,
  ) {
    const assignment = await this.findAssignmentById(
      id,
      organisationId,
      actorId,
    );

    const previousStatus = assignment.status;

    if (previousStatus === dto.status) {
      return assignment;
    }

    assignment.status = dto.status;

    if (dto.status === AgentAssignmentStatus.ENDED) {
      assignment.unassignedAt =
        assignment.unassignedAt ?? new Date();
    } else if (dto.status === AgentAssignmentStatus.ACTIVE) {
      assignment.unassignedAt = null;
    }

    const savedAssignment =
      await this.agentAssignmentRepository.save(assignment);

    await this.auditService.log({
      action: 'AGENT_ASSIGNMENT_STATUS_CHANGED',
      module: 'agents',
      actorId,
      targetId: savedAssignment.id,
      details: {
        organisationId,
        previousStatus,
        newStatus: savedAssignment.status,
      },
    });

    return savedAssignment;
  }

  /**
   * Soft-delete an Agent Assignment.
   */
  async removeAssignment(
    id: string,
    organisationId: string,
    actorId: string,
  ) {
    const assignment = await this.findAssignmentById(
      id,
      organisationId,
      actorId,
    );

    await this.agentAssignmentRepository.softRemove(
      assignment,
    );

    await this.auditService.log({
      action: 'AGENT_ASSIGNMENT_DELETED',
      module: 'agents',
      actorId,
      targetId: assignment.id,
      details: {
        organisationId,
        agentId: assignment.agentId,
        campaignId: assignment.campaignId,
        pollingUnitId: assignment.pollingUnitId,
      },
    });

    return {
      success: true,
      message: 'Agent assignment deleted successfully.',
    };
  }

  async create(
    createAgentDto: CreateAgentDto,
    organisationId: string,
    actorId: string | null,
  ) {
    await this.assertOrganisationAccess(
      organisationId,
      actorId ?? '',
    );

    /**
     * Validate the optional associated platform User.
     */
    if (createAgentDto.userId) {
      const user = await this.userRepository.findOne({
        where: {
          id: createAgentDto.userId,
        },
      });

      if (!user) {
        throw new NotFoundException(
          'Associated user was not found.',
        );
      }
    }

    /**
     * Agent references are unique within an organisation.
     */
    if (createAgentDto.agentReference) {
      const existingReference =
        await this.agentRepository.findOne({
          where: {
            organisationId,
            agentReference:
              createAgentDto.agentReference.trim(),
            deletedAt: IsNull(),
          },
        });

      if (existingReference) {
        throw new ConflictException(
          'Agent reference already exists in this organisation.',
        );
      }
    }

    /**
     * Prevent the same User account from being attached to
     * multiple active Agent records within the same organisation.
     */
    if (createAgentDto.userId) {
      const existingUserAgent =
        await this.agentRepository.findOne({
          where: {
            organisationId,
            userId: createAgentDto.userId,
            deletedAt: IsNull(),
          },
        });

      if (existingUserAgent) {
        throw new ConflictException(
          'This user is already associated with an Agent in this organisation.',
        );
      }
    }

    /**
     * Normalise user-supplied strings before persistence.
     */
    const firstName = createAgentDto.firstName.trim();

    const middleName =
      createAgentDto.middleName?.trim() || null;

    const lastName = createAgentDto.lastName.trim();

    const displayName =
      createAgentDto.displayName?.trim() ||
      [firstName, middleName, lastName]
        .filter(Boolean)
        .join(' ');

    const phone = createAgentDto.phone.trim();

    const email =
      createAgentDto.email?.trim().toLowerCase() || null;

    const agentReference =
      createAgentDto.agentReference?.trim() || null;

    const identificationType =
      createAgentDto.identificationType?.trim() || null;

    const identificationReference =
      createAgentDto.identificationReference?.trim() || null;

    const notes =
      createAgentDto.notes?.trim() || null;

    const photoUrl =
      createAgentDto.photoUrl?.trim() || null;

    const agent = this.agentRepository.create({
      organisationId,
      userId: createAgentDto.userId ?? null,

      firstName,
      middleName,
      lastName,
      displayName,

      phone,
      email,

      photoUrl,
      photoVersion: 1,

      agentReference,

      identificationType,
      identificationReference,

      status: AgentStatus.ACTIVE,

      notes,
    });

    const savedAgent =
      await this.agentRepository.save(agent);

    /**
     * Record the administrative action.
     */
    await this.auditService.log({
      action: 'AGENT_CREATED',
      module: 'agents',
      actorId,
      targetId: savedAgent.id,
      details: {
        organisationId,
        agentReference:
          savedAgent.agentReference,
        displayName:
          savedAgent.displayName,
        userId:
          savedAgent.userId,
      },
    });

    return this.findById(
      savedAgent.id,
      organisationId,
      actorId ?? '',
    );
  }

  /**
   * Find Agents belonging to an organisation.
   *
   * Supports:
   * - pagination
   * - search
   * - sorting
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

    const query =
      this.agentRepository
        .createQueryBuilder('agent')
        .where(
          'agent.organisation_id = :organisationId',
          { organisationId },
        )
        .andWhere(
          'agent.deleted_at IS NULL',
        );

    if (search) {
      query.andWhere(
        `(
          LOWER(agent.first_name) LIKE LOWER(:search)
          OR LOWER(agent.middle_name) LIKE LOWER(:search)
          OR LOWER(agent.last_name) LIKE LOWER(:search)
          OR LOWER(agent.display_name) LIKE LOWER(:search)
          OR LOWER(agent.email) LIKE LOWER(:search)
          OR LOWER(agent.phone) LIKE LOWER(:search)
          OR LOWER(agent.agent_reference) LIKE LOWER(:search)
        )`,
        {
          search: `%${search}%`,
        },
      );
    }

    query
      .orderBy(
        'agent.display_name',
        'ASC',
      )
      .skip((safePage - 1) * safeLimit)
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
   * Find one Agent within an organisation.
   */
  async findById(
    id: string,
    organisationId: string,
    actorId: string,
  ) {
    await this.assertOrganisationAccess(
      organisationId,
      actorId,
    );

    const agent =
      await this.agentRepository.findOne({
        where: {
          id,
          organisationId,
          deletedAt: IsNull(),
        },
      });

    if (!agent) {
      throw new NotFoundException(
        'Agent not found.',
      );
    }

    return agent;
  }

  /**
   * Update Agent profile information.
   *
   * Status is intentionally excluded from this method.
   */
  async update(
    id: string,
    updateAgentDto: UpdateAgentDto,
    organisationId: string,
    actorId: string | null,
  ) {
    const agent =
      await this.findById(
        id,
        organisationId,
        actorId ?? '',
      );

    /**
     * Validate a new User association.
     */
    if (
      updateAgentDto.userId &&
      updateAgentDto.userId !== agent.userId
    ) {
      const user =
        await this.userRepository.findOne({
          where: {
            id: updateAgentDto.userId,
          },
        });

      if (!user) {
        throw new NotFoundException(
          'Associated user was not found.',
        );
      }

      const existingUserAgent =
        await this.agentRepository.findOne({
          where: {
            organisationId,
            userId: updateAgentDto.userId,
            deletedAt: IsNull(),
          },
        });

      if (
        existingUserAgent &&
        existingUserAgent.id !== agent.id
      ) {
        throw new ConflictException(
          'This user is already associated with another Agent in this organisation.',
        );
      }
    }

    /**
     * Validate Agent reference uniqueness.
     */
    if (
      updateAgentDto.agentReference !== undefined
    ) {
      const agentReference =
        updateAgentDto.agentReference.trim();

      if (
        agentReference &&
        agentReference !== agent.agentReference
      ) {
        const existingReference =
          await this.agentRepository.findOne({
            where: {
              organisationId,
              agentReference,
              deletedAt: IsNull(),
            },
          });

        if (
          existingReference &&
          existingReference.id !== agent.id
        ) {
          throw new ConflictException(
            'Agent reference already exists in this organisation.',
          );
        }
      }
    }

    /**
     * Apply only fields explicitly supplied by the caller.
     */
    if (updateAgentDto.firstName !== undefined) {
      agent.firstName =
        updateAgentDto.firstName.trim();
    }

    if (updateAgentDto.middleName !== undefined) {
      agent.middleName =
        updateAgentDto.middleName.trim() || null;
    }

    if (updateAgentDto.lastName !== undefined) {
      agent.lastName =
        updateAgentDto.lastName.trim();
    }

    if (updateAgentDto.displayName !== undefined) {
      agent.displayName =
        updateAgentDto.displayName.trim();
    } else if (
      updateAgentDto.firstName !== undefined ||
      updateAgentDto.middleName !== undefined ||
      updateAgentDto.lastName !== undefined
    ) {
      agent.displayName = [
        agent.firstName,
        agent.middleName,
        agent.lastName,
      ]
        .filter(Boolean)
        .join(' ');
    }

    if (updateAgentDto.phone !== undefined) {
      agent.phone =
        updateAgentDto.phone.trim();
    }

    if (updateAgentDto.email !== undefined) {
      agent.email =
        updateAgentDto.email.trim().toLowerCase() ||
        null;
    }

    if (updateAgentDto.userId !== undefined) {
      agent.userId =
        updateAgentDto.userId;
    }

    if (updateAgentDto.photoUrl !== undefined) {
      const newPhotoUrl =
        updateAgentDto.photoUrl.trim() || null;

      if (
        newPhotoUrl !== agent.photoUrl
      ) {
        agent.photoUrl = newPhotoUrl;

        agent.photoVersion =
          (agent.photoVersion ?? 0) + 1;

        agent.photoCapturedAt =
          newPhotoUrl ? new Date() : null;
      }
    }

    if (
      updateAgentDto.identificationType !==
      undefined
    ) {
      agent.identificationType =
        updateAgentDto.identificationType.trim() ||
        null;
    }

    if (
      updateAgentDto.identificationReference !==
      undefined
    ) {
      agent.identificationReference =
        updateAgentDto.identificationReference.trim() ||
        null;
    }

    if (
      updateAgentDto.agentReference !==
      undefined
    ) {
      agent.agentReference =
        updateAgentDto.agentReference.trim() ||
        null;
    }

    if (updateAgentDto.notes !== undefined) {
      agent.notes =
        updateAgentDto.notes.trim() || null;
    }

    const savedAgent =
      await this.agentRepository.save(agent);

    await this.auditService.log({
      action: 'AGENT_UPDATED',
      module: 'agents',
      actorId,
      targetId: savedAgent.id,
      details: {
        organisationId,
        changedFields:
          Object.keys(updateAgentDto),
      },
    });

    return this.findById(
      savedAgent.id,
      organisationId,
      actorId ?? '',
    );
  }

  /**
   * Change Agent status.
   */
  async updateStatus(
    id: string,
    updateStatusDto: UpdateAgentStatusDto,
    organisationId: string,
    actorId: string | null,
  ) {
    const agent =
      await this.findById(
        id,
        organisationId,
        actorId ?? '',
      );

    if (
      agent.status ===
      updateStatusDto.status
    ) {
      return agent;
    }

    /**
     * IMPORTANT:
     * Capture the old status BEFORE changing it.
     */
    const previousStatus = agent.status;

    agent.status =
      updateStatusDto.status;

    const savedAgent =
      await this.agentRepository.save(agent);

    await this.auditService.log({
      action: 'AGENT_STATUS_CHANGED',
      module: 'agents',
      actorId,
      targetId: savedAgent.id,
      details: {
        organisationId,
        previousStatus,
        newStatus:
          updateStatusDto.status,
      },
    });

    return savedAgent;
  }

  /**
   * Soft-delete an Agent.
   */
  async remove(
    id: string,
    organisationId: string,
    actorId: string | null,
  ) {
    const agent =
      await this.findById(
        id,
        organisationId,
        actorId ?? '',
      );

    await this.agentRepository.softRemove(
      agent,
    );

    await this.auditService.log({
      action: 'AGENT_DELETED',
      module: 'agents',
      actorId,
      targetId: agent.id,
      details: {
        organisationId,
        agentReference:
          agent.agentReference,
      },
    });

    return {
      success: true,
      message: 'Agent deleted successfully.',
    };
  }

  /**
   * Restore a previously deleted Agent.
   *
   * This method intentionally queries withDeleted=true.
   */
  async restore(
    id: string,
    organisationId: string,
    actorId: string | null,
  ) {
    await this.assertOrganisationAccess(
      organisationId,
      actorId ?? '',
    );

    const agent =
      await this.agentRepository.findOne({
        where: {
          id,
          organisationId,
        },
        withDeleted: true,
      });

    if (!agent) {
      throw new NotFoundException(
        'Agent not found.',
      );
    }

    if (!agent.deletedAt) {
      throw new BadRequestException(
        'Agent is not deleted.',
      );
    }

    /**
     * Ensure restoration will not create a duplicate
     * active Agent reference.
     */
    if (agent.agentReference) {
      const existingReference =
        await this.agentRepository.findOne({
          where: {
            organisationId,
            agentReference:
              agent.agentReference,
            deletedAt: IsNull(),
          },
        });

      if (existingReference) {
        throw new ConflictException(
          'The Agent reference is already in use by another active Agent.',
        );
      }
    }

    await this.agentRepository.restore(
      agent.id,
    );

    const restoredAgent =
      await this.findById(
        agent.id,
        organisationId,
        actorId ?? '',
      );

    await this.auditService.log({
      action: 'AGENT_RESTORED',
      module: 'agents',
      actorId,
      targetId: restoredAgent.id,
      details: {
        organisationId,
        agentReference:
          restoredAgent.agentReference,
      },
    });

    return restoredAgent;
  }
}