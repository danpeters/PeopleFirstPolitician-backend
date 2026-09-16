// File: C:\Projects\PeopleFirstPolitician\backend\src\modules\geography\geography.service.ts

/**
 * File: C:\Projects\PeopleFirstPolitician\backend\src\modules\geography\geography.service.ts
 *
 * Purpose:
 * Handles read-only business logic for geographical data.
 *
 * Current responsibilities:
 * - Fetch Nigerian states
 * - Fetch LGAs belonging to a selected State
 * - Fetch Wards belonging to a selected LGA
 * - Fetch Polling Units belonging to a selected Ward
 *
 * Security:
 * - Geography data is read-only for most users.
 * - Management/import operations will be restricted separately.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { State } from './entities/state.entity';
import { Lga } from './entities/lga.entity';
import { Ward } from './entities/ward.entity';
import { PollingUnit } from './entities/polling-unit.entity';

@Injectable()
export class GeographyService {
  constructor(
    @InjectRepository(State)
    private readonly stateRepository: Repository<State>,

    @InjectRepository(Lga)
    private readonly lgaRepository: Repository<Lga>,

    @InjectRepository(Ward)
    private readonly wardRepository: Repository<Ward>,

    @InjectRepository(PollingUnit)
    private readonly pollingUnitRepository: Repository<PollingUnit>,
  ) {}

  /**
   * Fetch all states.
   *
   * Returns:
   * - State ID
   * - State name
   * - State code
   *
   * The related LGAs are not loaded in this first implementation.
   */
  async findAllStates() {
    return this.stateRepository.find({
      order: {
        code: 'ASC',
      },
    });
  }

  /**
   * Fetch all LGAs belonging to a specific State.
   *
   * @param stateId UUID of the selected State.
   *
   * Returns:
   * - LGAs belonging to the selected State
   * - Ordered alphabetically by LGA name
   */
  async findLgasByState(stateId: string) {
    return this.lgaRepository.find({
      where: {
        stateId,
      },
      order: {
        name: 'ASC',
      },
    });
  }

  /**
   * Fetch all Wards belonging to a specific LGA.
   *
   * @param lgaId UUID of the selected LGA.
   *
   * Returns:
   * - Wards belonging to the selected LGA
   * - Ordered alphabetically by Ward name
   */
  async findWardsByLga(lgaId: string) {
    return this.wardRepository.find({
      where: {
        lgaId,
      },
      order: {
        name: 'ASC',
      },
    });
  }

  /**
   * Fetch all Polling Units belonging to a specific Ward.
   *
   * @param wardId UUID of the selected Ward.
   *
   * Returns:
   * - Polling Units belonging to the selected Ward
   * - Ordered alphabetically by Polling Unit name
   */
  async findPollingUnitsByWard(wardId: string) {
    return this.pollingUnitRepository.find({
      where: {
        wardId,
      },
      order: {
        name: 'ASC',
      },
    });
  }
}