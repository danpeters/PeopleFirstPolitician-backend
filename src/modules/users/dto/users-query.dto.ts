/**
 * File: src/modules/users/dto/users-query.dto.ts
 *
 * Purpose:
 * Extends the common pagination query parameters with
 * the user-management-specific includeDeleted option.
 */

import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class UsersQueryDto extends PaginationQueryDto {
  /**
   * Query-string values accepted for soft-delete filtering.
   *
   * "true"  = include soft-deleted users
   * "false" = exclude soft-deleted users
   */
  @IsOptional()
  @IsString()
  @IsIn(['true', 'false'])
  includeDeleted?: string;
}
