/**
 * File: src/modules/roles/roles.service.ts
 *
 * Purpose:
 * Service layer for role management.
 * Supports:
 * - paginated role listing
 * - lookup by id
 * - lookup by name
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Role } from './entities/role.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  /**
   * Get paginated list of roles
   */
  async findAll(query?: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }) {
    const page = Number(query?.page) > 0 ? Number(query?.page) : 1;
    const limit = Number(query?.limit) > 0 ? Number(query?.limit) : 10;
    const skip = (page - 1) * limit;

    const sortBy = query?.sortBy || 'name';
    const sortOrder = query?.sortOrder === 'DESC' ? 'DESC' : 'ASC';

    const qb = this.roleRepository.createQueryBuilder('role');

    if (query?.search) {
      qb.where('LOWER(role.name) LIKE LOWER(:search)', {
        search: `%${query.search}%`,
      }).orWhere('LOWER(role.description) LIKE LOWER(:search)', {
        search: `%${query.search}%`,
      });
    }

    qb.orderBy(`role.${sortBy}`, sortOrder).skip(skip).take(limit);

    const [items, totalItems] = await qb.getManyAndCount();

    return {
      items,
      meta: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    };
  }

  /**
   * Find one role by ID
   */
  async findOne(id: string) {
    const role = await this.roleRepository.findOne({
      where: { id },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID "${id}" not found`);
    }

    return role;
  }

  /**
   * Find one role by exact name
   * Needed for admin seeding and auth logic.
   */
  async findByName(name: string) {
    return this.roleRepository.findOne({
      where: { name },
    });
  }
}