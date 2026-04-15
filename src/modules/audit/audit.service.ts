/**
 * File: src/modules/audit/audit.service.ts
 *
 * Purpose:
 * Provides reusable audit log write and read operations.
 *
 * Responsibilities:
 * - Write audit log records
 * - Read audit logs with pagination and filtering
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AuditLog } from './entities/audit-log.entity';
import { AuditQueryDto } from './dto/audit-query.dto';
import { buildPaginatedResponse } from '../../common/utils/pagination-response.util';

export interface CreateAuditLogInput {
  action: string;
  module: string;
  actorId?: string | null;
  targetId?: string | null;
  details?: Record<string, unknown> | null;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
  ) {}

  /**
   * Write one audit log record.
   */
  async log(input: CreateAuditLogInput): Promise<AuditLog> {
    const auditLog = this.auditRepository.create({
      action: input.action,
      module: input.module,
      actorId: input.actorId ?? null,
      targetId: input.targetId ?? null,
      details: input.details ?? null,
    });

    return this.auditRepository.save(auditLog);
  }

  /**
   * Fetch audit logs with pagination and optional filtering.
   *
   * Supported filters:
   * - page
   * - limit
   * - action
   * - module
   */
  async findAll(query: AuditQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const queryBuilder = this.auditRepository
      .createQueryBuilder('audit')
      .orderBy('audit.createdAt', 'DESC');

    if (query.action) {
      queryBuilder.andWhere('audit.action = :action', {
        action: query.action,
      });
    }

    if (query.module) {
      queryBuilder.andWhere('audit.module = :module', {
        module: query.module,
      });
    }

    queryBuilder.skip((page - 1) * limit).take(limit);

    const [logs, totalItems] = await queryBuilder.getManyAndCount();

    return buildPaginatedResponse(logs, page, limit, totalItems);
  }
}