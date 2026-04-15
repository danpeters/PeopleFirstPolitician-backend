/**
 * File: src/modules/roles/roles.service.ts
 *
 * Purpose:
 * Handles business logic related to roles.
 *
 * Responsibilities:
 * - Fetch roles with pagination, search, and sorting
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Role } from './entities/role.entity';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { buildPaginatedResponse } from '../../common/utils/pagination-response.util';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  /**
   * Fetch all roles with pagination, search, and sorting.
   *
   * Supported query options:
   * - page
   * - limit
   * - search
   * - sortBy
   * - sortOrder
   */
  async findAll(query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const search = query.search?.trim();
    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'DESC';

    const allowedSortFields = ['createdAt', 'updatedAt', 'name', 'description'];
    const safeSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : 'createdAt';

    const queryBuilder = this.roleRepository.createQueryBuilder('role');

    if (search) {
      queryBuilder.andWhere(
        '(role.name ILIKE :search OR role.description ILIKE :search)',
        {
          search: `%${search}%`,
        },
      );
    }

    queryBuilder.orderBy(`role.${safeSortBy}`, sortOrder);
    queryBuilder.skip((page - 1) * limit).take(limit);

    const [roles, totalItems] = await queryBuilder.getManyAndCount();

    return buildPaginatedResponse(roles, page, limit, totalItems);
  }
}