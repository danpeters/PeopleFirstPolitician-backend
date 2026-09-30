/**
 * File:
 * C:\Projects\PeopleFirstPolitician\backend\src\modules\results\results.service.ts
 *
 * Purpose:
 * - Provides the business logic for polling-unit result management.
 * - Enforces organisation and AgentAssignment context.
 * - Validates Election, ElectionRace, PollingUnit and Candidacy relationships.
 * - Maintains the result lifecycle.
 * - Records auditable result actions.
 *
 * Security model:
 * Authenticated User
 *      ↓
 * Agent.userId
 *      ↓
 * Agent
 *      ↓
 * Active AgentAssignment
 *      ↓
 * Campaign + Organisation + PollingUnit
 *      ↓
 * Campaign Candidacy
 *      ↓
 * ElectionRace
 *      ↓
 * PollingUnitResult
 *
 * Important:
 * - Campaign membership alone is not sufficient for field result submission.
 * - The submitting user must be linked to the assigned Agent.
 * - The AgentAssignment must be active.
 * - The AgentAssignment must belong to the submitted Polling Unit.
 * - The Campaign must belong to the supplied Organisation.
 * - The Campaign Candidacy must belong to the submitted ElectionRace.
 * - Every vote Candidacy must belong to the same ElectionRace.
 * - A result submitter must not verify their own result.
 */

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AuditService } from '../audit/audit.service';
import { Agent } from '../agents/entities/agent.entity';
import {
  AgentAssignment,
  AgentAssignmentStatus,
} from '../agents/entities/agent-assignment.entity';
import { Campaign } from '../campaigns/entities/campaign.entity';
import { Candidacy } from '../candidacies/entities/candidacy.entity';
import { Election } from '../elections/entities/election.entity';
import { ElectionRace } from '../elections/entities/election-race.entity';
import { PollingUnit } from '../geography/entities/polling-unit.entity';
import { User } from '../users/entities/user.entity';

import {
  PollingUnitResult,
  PollingUnitResultStatus,
} from './entities/polling-unit-result.entity';
import { PollingUnitResultVote } from './entities/polling-unit-result-vote.entity';

export interface CreatePollingUnitResultInput {
  clientReference: string;
  electionId: string;
  electionRaceId: string;
  pollingUnitId: string;
  agentAssignmentId: string;
  votes: Array<{
    candidacyId: string;
    votes: number;
  }>;
}

export interface UpdatePollingUnitResultInput {
  votes?: Array<{
    candidacyId: string;
    votes: number;
  }>;
}

export interface FlagPollingUnitResultInput {
  reason: string;
}

@Injectable()
export class ResultsService {
  constructor(
    @InjectRepository(PollingUnitResult)
    private readonly resultRepository: Repository<PollingUnitResult>,

    @InjectRepository(PollingUnitResultVote)
    private readonly voteRepository: Repository<PollingUnitResultVote>,

    @InjectRepository(AgentAssignment)
    private readonly assignmentRepository: Repository<AgentAssignment>,

    @InjectRepository(Agent)
    private readonly agentRepository: Repository<Agent>,

    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,

    @InjectRepository(Election)
    private readonly electionRepository: Repository<Election>,

    @InjectRepository(ElectionRace)
    private readonly electionRaceRepository: Repository<ElectionRace>,

    @InjectRepository(PollingUnit)
    private readonly pollingUnitRepository: Repository<PollingUnit>,

    @InjectRepository(Candidacy)
    private readonly candidacyRepository: Repository<Candidacy>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly auditService: AuditService,
  ) {}

  /**
   * Create a draft result.
   *
   * A draft may be created by an authorised field agent before final
   * submission. The same contextual assignment rules apply.
   */
  async createDraft(
    organisationId: string,
    input: CreatePollingUnitResultInput,
    actorId: string,
  ): Promise<PollingUnitResult> {
    await this.validateSubmissionContext(
      organisationId,
      input,
      actorId,
    );

    const existing = await this.resultRepository.findOne({
      where: {
        electionRaceId: input.electionRaceId,
        pollingUnitId: input.pollingUnitId,
      },
    });

    if (existing) {
      throw new ConflictException(
        'A result already exists for this election race and polling unit.',
      );
    }

    const existingClientReference =
      await this.resultRepository.findOne({
        where: {
          clientReference: input.clientReference.trim(),
        },
        withDeleted: true,
      });

    if (existingClientReference) {
      throw new ConflictException(
        'The client reference has already been used.',
      );
    }

    const result = this.resultRepository.create({
      clientReference: input.clientReference.trim(),
      electionId: input.electionId,
      electionRaceId: input.electionRaceId,
      pollingUnitId: input.pollingUnitId,
      agentAssignmentId: input.agentAssignmentId,
      submittedByUserId: actorId,
      status: PollingUnitResultStatus.DRAFT,
    });

    const savedResult =
      await this.resultRepository.save(result);

    await this.replaceVotes(
      savedResult.id,
      input.electionRaceId,
      input.votes,
    );

    await this.auditService.log({
      action: 'RESULT_CREATED',
      module: 'results',
      actorId,
      targetId: savedResult.id,
      details: {
        clientReference: savedResult.clientReference,
        organisationId,
        electionId: savedResult.electionId,
        electionRaceId: savedResult.electionRaceId,
        pollingUnitId: savedResult.pollingUnitId,
        agentAssignmentId: savedResult.agentAssignmentId,
        voteCount: input.votes.length,
      },
    });

    return this.findResultEntity(organisationId, savedResult.id);
  }

  /**
   * Submit a draft result.
   */
  async submit(
    organisationId: string,
    resultId: string,
    actorId: string,
  ): Promise<PollingUnitResult> {
    const result = await this.getResult(resultId);

    await this.validateExistingResultContext(
      organisationId,
      result,
      actorId,
    );

    if (result.submittedByUserId !== actorId) {
      throw new ForbiddenException(
        'Only the result submitter can submit this result.',
      );
    }

    if (result.status !== PollingUnitResultStatus.DRAFT) {
      throw new ConflictException(
        'Only a draft result can be submitted.',
      );
    }

    result.status = PollingUnitResultStatus.SUBMITTED;
    result.submittedAt = new Date();

    const savedResult =
      await this.resultRepository.save(result);

    await this.auditService.log({
      action: 'RESULT_SUBMITTED',
      module: 'results',
      actorId,
      targetId: result.id,
      details: {
        organisationId,
        electionId: result.electionId,
        electionRaceId: result.electionRaceId,
        pollingUnitId: result.pollingUnitId,
        agentAssignmentId: result.agentAssignmentId,
      },
    });

    return this.findResultEntity(organisationId, savedResult.id);
  }

  /**
   * Synchronise a submitted result.
   *
   * This represents transition from an offline client to the
   * central server. It does not alter the submitted vote data.
   */
  async synchronize(
    organisationId: string,
    resultId: string,
    actorId: string,
  ): Promise<PollingUnitResult> {
    const result = await this.getResult(resultId);

    await this.validateExistingResultContext(
      organisationId,
      result,
      actorId,
    );

    if (result.submittedByUserId !== actorId) {
      throw new ForbiddenException(
        'Only the result submitter can synchronize this result.',
      );
    }

    if (result.status !== PollingUnitResultStatus.SUBMITTED) {
      throw new ConflictException(
        'Only a submitted result can be synchronized.',
      );
    }

    result.status = PollingUnitResultStatus.SYNCHRONIZED;
    result.synchronizedAt = new Date();

    const savedResult =
      await this.resultRepository.save(result);

    await this.auditService.log({
      action: 'RESULT_SYNCHRONIZED',
      module: 'results',
      actorId,
      targetId: result.id,
      details: {
        organisationId,
        electionId: result.electionId,
        electionRaceId: result.electionRaceId,
        pollingUnitId: result.pollingUnitId,
      },
    });

    return this.findResultEntity(organisationId, savedResult.id);
  }

  /**
   * Update a draft result.
   */
  async updateDraft(
    organisationId: string,
    resultId: string,
    input: UpdatePollingUnitResultInput,
    actorId: string,
  ): Promise<PollingUnitResult> {
    const result = await this.getResult(resultId);

    await this.validateExistingResultContext(
      organisationId,
      result,
      actorId,
    );

    if (result.submittedByUserId !== actorId) {
      throw new ForbiddenException(
        'Only the result submitter can update this result.',
      );
    }

    if (result.status !== PollingUnitResultStatus.DRAFT) {
      throw new ConflictException(
        'Only a draft result can be updated.',
      );
    }

    if (input.votes !== undefined) {
      await this.replaceVotes(
        result.id,
        result.electionRaceId,
        input.votes,
      );
    }

    await this.auditService.log({
      action: 'RESULT_DRAFT_UPDATED',
      module: 'results',
      actorId,
      targetId: result.id,
      details: {
        organisationId,
        electionId: result.electionId,
        electionRaceId: result.electionRaceId,
        pollingUnitId: result.pollingUnitId,
        voteCount: input.votes?.length ?? 0,
      },
    });

    return this.findResultEntity(organisationId, result.id);
  }

  /**
   * Flag a submitted/synchronized result for review.
   */
  async flag(
    organisationId: string,
    resultId: string,
    input: FlagPollingUnitResultInput,
    actorId: string,
  ): Promise<PollingUnitResult> {
    const result = await this.getResult(resultId);

    await this.validateResultOrganisation(
      organisationId,
      result,
    );

    const reason = input.reason?.trim();

    if (!reason) {
      throw new BadRequestException(
        'A flag reason is required.',
      );
    }

    if (
      result.status !== PollingUnitResultStatus.SUBMITTED &&
      result.status !== PollingUnitResultStatus.SYNCHRONIZED
    ) {
      throw new ConflictException(
        'Only submitted or synchronized results can be flagged.',
      );
    }

    result.status = PollingUnitResultStatus.FLAGGED;
    result.flaggedAt = new Date();
    result.flaggedByUserId = actorId;
    result.flagReason = reason;

    const savedResult =
      await this.resultRepository.save(result);

    await this.auditService.log({
      action: 'RESULT_FLAGGED',
      module: 'results',
      actorId,
      targetId: result.id,
      details: {
        organisationId,
        reason,
        electionId: result.electionId,
        electionRaceId: result.electionRaceId,
        pollingUnitId: result.pollingUnitId,
      },
    });

    return this.findResultEntity(organisationId, savedResult.id);
  }

  /**
   * Verify a result.
   *
   * Separation of duties:
   * The person who submitted the result cannot verify it.
   */
  async verify(
    organisationId: string,
    resultId: string,
    actorId: string,
  ): Promise<PollingUnitResult> {
    const result = await this.getResult(resultId);

    await this.validateResultOrganisation(
      organisationId,
      result,
    );

    if (result.submittedByUserId === actorId) {
      throw new ForbiddenException(
        'The result submitter cannot verify the same result.',
      );
    }

    if (
      result.status !== PollingUnitResultStatus.SUBMITTED &&
      result.status !== PollingUnitResultStatus.SYNCHRONIZED &&
      result.status !== PollingUnitResultStatus.FLAGGED
    ) {
      throw new ConflictException(
        'This result is not in a verifiable state.',
      );
    }

    result.status = PollingUnitResultStatus.VERIFIED;
    result.verifiedAt = new Date();
    result.verifiedByUserId = actorId;

    const savedResult =
      await this.resultRepository.save(result);

    await this.auditService.log({
      action: 'RESULT_VERIFIED',
      module: 'results',
      actorId,
      targetId: result.id,
      details: {
        organisationId,
        electionId: result.electionId,
        electionRaceId: result.electionRaceId,
        pollingUnitId: result.pollingUnitId,
        submittedByUserId: result.submittedByUserId,
      },
    });

    return this.findResultEntity(organisationId, savedResult.id);
  }

  private async findResultEntity(
    organisationId: string,
    resultId: string,
  ): Promise<PollingUnitResult> {
    const result = await this.getResult(resultId);

    await this.validateResultOrganisation(
        organisationId,
        result,
    );

    return result;
  }

  /**
   * Find one result.
   */
  async findById(
  organisationId: string,
  resultId: string,
): Promise<{
  result: PollingUnitResult;
  votes: PollingUnitResultVote[];
}> {
  const result = await this.getResult(resultId);

  await this.validateResultOrganisation(
    organisationId,
    result,
  );

  const votes = await this.voteRepository.find({
    where: {
      pollingUnitResultId: result.id,
    },
    order: {
      createdAt: 'ASC',
    },
  });

  return {
    result,
    votes,
  };
}

  /**
   * Validate all contextual relationships required for field submission.
   */
  private async validateSubmissionContext(
    organisationId: string,
    input: CreatePollingUnitResultInput,
    actorId: string,
  ): Promise<void> {
    if (!organisationId) {
      throw new BadRequestException(
        'organisationId is required.',
      );
    }

    if (!input.clientReference?.trim()) {
      throw new BadRequestException(
        'clientReference is required.',
      );
    }

    if (!input.electionId) {
      throw new BadRequestException(
        'electionId is required.',
      );
    }

    if (!input.electionRaceId) {
      throw new BadRequestException(
        'electionRaceId is required.',
      );
    }

    if (!input.pollingUnitId) {
      throw new BadRequestException(
        'pollingUnitId is required.',
      );
    }

    if (!input.agentAssignmentId) {
      throw new BadRequestException(
        'agentAssignmentId is required.',
      );
    }

    const actor = await this.userRepository.findOne({
      where: { id: actorId },
    });

    if (!actor) {
      throw new NotFoundException(
        'Submitting user was not found.',
      );
    }

    const assignment =
      await this.assignmentRepository.findOne({
        where: {
          id: input.agentAssignmentId,
        },
        relations: {
          agent: true,
          campaign: true,
          pollingUnit: true,
        },
      });

    if (!assignment) {
      throw new NotFoundException(
        'Agent assignment was not found.',
      );
    }

    if (
      assignment.status !== AgentAssignmentStatus.ACTIVE ||
      assignment.deletedAt
    ) {
      throw new ForbiddenException(
        'The agent assignment is not active.',
      );
    }

    if (
      assignment.pollingUnitId !== input.pollingUnitId
    ) {
      throw new ForbiddenException(
        'The agent assignment does not belong to the submitted polling unit.',
      );
    }

    const agent = assignment.agent;

    if (!agent) {
      throw new NotFoundException(
        'The assigned agent was not found.',
      );
    }

    if (agent.status !== 'active' || agent.deletedAt) {
      throw new ForbiddenException(
        'The assigned agent is not active.',
      );
    }

    if (agent.userId !== actorId) {
      throw new ForbiddenException(
        'The authenticated user is not linked to the assigned agent.',
      );
    }

    const campaign = assignment.campaign;

    if (!campaign || campaign.deletedAt) {
      throw new NotFoundException(
        'The campaign associated with the assignment was not found.',
      );
    }

    if (campaign.organisationId !== organisationId) {
      throw new ForbiddenException(
        'The campaign does not belong to the specified organisation.',
      );
    }

    const campaignCandidacy =
      await this.candidacyRepository.findOne({
        where: {
          id: campaign.candidacyId,
        },
      });

    if (!campaignCandidacy || campaignCandidacy.deletedAt) {
      throw new NotFoundException(
        'The campaign candidacy was not found.',
      );
    }

    const electionRace =
      await this.electionRaceRepository.findOne({
        where: {
          id: input.electionRaceId,
        },
      });

    if (!electionRace || electionRace.deletedAt) {
      throw new NotFoundException(
        'Election race was not found.',
      );
    }

    if (
      campaignCandidacy.electionRaceId !==
      electionRace.id
    ) {
      throw new ForbiddenException(
        'The campaign candidacy does not belong to the submitted election race.',
      );
    }

    const election =
      await this.electionRepository.findOne({
        where: {
          id: input.electionId,
        },
      });

    if (!election || election.deletedAt) {
      throw new NotFoundException(
        'Election was not found.',
      );
    }

    if (electionRace.electionId !== input.electionId) {
      throw new BadRequestException(
        'The election race does not belong to the specified election.',
      );
    }

    const pollingUnit =
      await this.pollingUnitRepository.findOne({
        where: {
          id: input.pollingUnitId,
        },
      });

    if (!pollingUnit) {
      throw new NotFoundException(
        'Polling unit was not found.',
      );
    }

    await this.validateVotes(
      electionRace.id,
      input.votes,
    );
  }

  /**
   * Validate an existing result against its organisation and
   * AgentAssignment context.
   */
  private async validateExistingResultContext(
    organisationId: string,
    result: PollingUnitResult,
    actorId: string,
  ): Promise<void> {
    const assignment =
      await this.assignmentRepository.findOne({
        where: {
          id: result.agentAssignmentId,
        },
        relations: {
          agent: true,
          campaign: true,
          pollingUnit: true,
        },
      });

    if (!assignment) {
      throw new NotFoundException(
        'The result agent assignment was not found.',
      );
    }

    if (
      assignment.status !== AgentAssignmentStatus.ACTIVE ||
      assignment.deletedAt
    ) {
      throw new ForbiddenException(
        'The result agent assignment is not active.',
      );
    }

    if (
      assignment.pollingUnitId !== result.pollingUnitId
    ) {
      throw new ForbiddenException(
        'The result assignment does not match the result polling unit.',
      );
    }

    if (!assignment.agent) {
      throw new NotFoundException(
        'The result agent was not found.',
      );
    }

    if (
      assignment.agent.status !== 'active' ||
      assignment.agent.deletedAt
    ) {
      throw new ForbiddenException(
        'The result agent is not active.',
      );
    }

    if (assignment.agent.userId !== actorId) {
      throw new ForbiddenException(
        'The authenticated user is not linked to the result agent.',
      );
    }

    const campaign = assignment.campaign;

    if (!campaign || campaign.deletedAt) {
      throw new NotFoundException(
        'The result campaign was not found.',
      );
    }

    if (campaign.organisationId !== organisationId) {
      throw new ForbiddenException(
        'The result campaign does not belong to the specified organisation.',
      );
    }

    const campaignCandidacy =
      await this.candidacyRepository.findOne({
        where: {
          id: campaign.candidacyId,
        },
      });

    if (!campaignCandidacy || campaignCandidacy.deletedAt) {
      throw new NotFoundException(
        'The result campaign candidacy was not found.',
      );
    }

    if (
      campaignCandidacy.electionRaceId !==
      result.electionRaceId
    ) {
      throw new ForbiddenException(
        'The result campaign candidacy does not belong to the result election race.',
      );
    }
  }

  /**
   * Validate organisation ownership for review/verification
   * operations without requiring the actor to be the submitting agent.
   */
  private async validateResultOrganisation(
    organisationId: string,
    result: PollingUnitResult,
  ): Promise<void> {
    const assignment =
      await this.assignmentRepository.findOne({
        where: {
          id: result.agentAssignmentId,
        },
        relations: {
          campaign: true,
        },
      });

    if (!assignment) {
      throw new NotFoundException(
        'The result agent assignment was not found.',
      );
    }

    const campaign = assignment.campaign;

    if (!campaign || campaign.deletedAt) {
      throw new NotFoundException(
        'The result campaign was not found.',
      );
    }

    if (campaign.organisationId !== organisationId) {
      throw new ForbiddenException(
        'The result does not belong to the specified organisation.',
      );
    }
  }

  /**
   * Validate vote rows against the result's ElectionRace.
   */
  private async validateVotes(
    electionRaceId: string,
    votes: Array<{
      candidacyId: string;
      votes: number;
    }>,
  ): Promise<void> {
    if (!Array.isArray(votes)) {
      throw new BadRequestException(
        'votes must be an array.',
      );
    }

    const seen = new Set<string>();

    for (const vote of votes) {
      if (!vote?.candidacyId) {
        throw new BadRequestException(
          'Each vote row requires a candidacyId.',
        );
      }

      if (
        !Number.isInteger(vote.votes) ||
        vote.votes < 0
      ) {
        throw new BadRequestException(
          'Vote counts must be non-negative integers.',
        );
      }

      if (seen.has(vote.candidacyId)) {
        throw new BadRequestException(
          'A candidacy cannot appear more than once in a result.',
        );
      }

      seen.add(vote.candidacyId);

      const candidacy =
        await this.candidacyRepository.findOne({
          where: {
            id: vote.candidacyId,
          },
        });

      if (!candidacy || candidacy.deletedAt) {
        throw new NotFoundException(
          `Candidacy ${vote.candidacyId} was not found.`,
        );
      }

      if (
        candidacy.electionRaceId !== electionRaceId
      ) {
        throw new BadRequestException(
          `Candidacy ${vote.candidacyId} does not belong to the submitted election race.`,
        );
      }
    }
  }

  /**
   * Replace all vote rows for a draft result.
   */
  private async replaceVotes(
    resultId: string,
    electionRaceId: string,
    votes: Array<{
      candidacyId: string;
      votes: number;
    }>,
  ): Promise<void> {
    await this.validateVotes(
      electionRaceId,
      votes,
    );

    await this.voteRepository.delete({
      pollingUnitResultId: resultId,
    });

    if (votes.length === 0) {
      return;
    }

    const voteEntities = votes.map((vote) =>
      this.voteRepository.create({
        pollingUnitResultId: resultId,
        candidacyId: vote.candidacyId,
        votes: vote.votes,
      }),
    );

    await this.voteRepository.save(voteEntities);
  }

  /**
   * Fetch a result or throw a clear 404.
   */
  private async getResult(
    resultId: string,
  ): Promise<PollingUnitResult> {
    const result =
      await this.resultRepository.findOne({
        where: {
          id: resultId,
        },
      });

    if (!result) {
      throw new NotFoundException(
        'Polling-unit result was not found.',
      );
    }

    return result;
  }
}