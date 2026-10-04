/**
 * File: src/modules/elections/dto/elections-query.dto.ts
 *
 * Purpose:
 * Extends the common pagination query parameters with
 * election-management-specific status filtering.
 */

import { IsIn, IsOptional, IsString } from 'class-validator';

import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { ElectionStatus } from '../entities/election.entity';

export class ElectionsQueryDto extends PaginationQueryDto {
  /**
   * Optional election lifecycle status filter.
   *
   * Supported values:
   * - draft
   * - active
   * - completed
   * - cancelled
   */
  @IsOptional()
  @IsString()
  @IsIn([
    ElectionStatus.DRAFT,
    ElectionStatus.ACTIVE,
    ElectionStatus.COMPLETED,
    ElectionStatus.CANCELLED,
  ])
  status?: ElectionStatus;
}