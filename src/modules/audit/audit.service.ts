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
   *
   * Security:
   * - Audit details are sanitised before persistence.
   * - Authentication secrets must never be stored in audit logs.
   * - Sanitisation is recursive so nested objects are also protected.
   */
  async log(input: CreateAuditLogInput): Promise<AuditLog> {
    const safeDetails = this.sanitiseAuditDetails(
      input.details ?? null,
    );

    const auditLog = this.auditRepository.create({
      action: input.action,
      module: input.module,
      actorId: input.actorId ?? null,
      targetId: input.targetId ?? null,
      details: safeDetails,
    });

    return this.auditRepository.save(auditLog);
  }

  /**
   * Remove sensitive authentication fields from audit details.
   *
   * Security-sensitive fields:
   * - password
   * - passwordHash
   * - refreshToken
   * - refreshTokenHash
   * - passwordResetToken
   * - passwordResetTokenHash
   * - accessToken
   * - token
   *
   * The comparison is case-insensitive.
   */
  private sanitiseAuditDetails(
    value: unknown,
  ): Record<string, unknown> | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (
      typeof value !== 'object' ||
      Array.isArray(value)
    ) {
      return null;
    }

    const sensitiveFields = new Set([
      'password',
      'passwordhash',
      'refreshtoken',
      'refreshtokenhash',
      'passwordresettoken',
      'passwordresettokenhash',
      'accesstoken',
      'token',
    ]);

    const sanitiseValue = (current: unknown): unknown => {
      if (Array.isArray(current)) {
        return current.map((item) =>
          sanitiseValue(item),
        );
      }

      if (
        current === null ||
        typeof current !== 'object'
      ) {
        return current;
      }

      const result: Record<string, unknown> = {};

      for (const [key, nestedValue] of Object.entries(
        current,
      )) {
        if (
          sensitiveFields.has(
            key.toLowerCase(),
          )
        ) {
          continue;
        }

        result[key] = sanitiseValue(nestedValue);
      }

      return result;
    };

    return sanitiseValue(value) as Record<
      string,
      unknown
    >;
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