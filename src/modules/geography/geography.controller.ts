// File: C:\Projects\PeopleFirstPolitician\backend\src\modules\geography\geography.controller.ts

/**
 * File: C:\Projects\PeopleFirstPolitician\backend\src\modules\geography\geography.controller.ts
 *
 * Purpose:
 * Handles HTTP requests related to geographical data.
 *
 * Current responsibilities:
 * - Retrieve all states
 * - Retrieve LGAs belonging to a selected State
 * - Retrieve Wards belonging to a selected LGA
 * - Retrieve Polling Units belonging to a selected Ward
 *
 * Security:
 * - Authenticated users can read geography data.
 * - Management/import operations will be restricted separately.
 */

import {
  Controller,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { GeographyService } from './geography.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { buildSuccessResponse } from '../../common/utils/api-response.util';

@ApiTags('Geography')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard)
@Controller('geography')
export class GeographyController {
  constructor(
    private readonly geographyService: GeographyService,
  ) {}

  /**
   * GET /api/v1/geography/states
   *
   * Returns all states ordered alphabetically.
   */
  @ApiOperation({
    summary: 'Get all states',
  })
  @ApiResponse({
    status: 200,
    description: 'States retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized (No token)',
  })
  @Get('states')
  async findAllStates() {
    const states =
      await this.geographyService.findAllStates();

    return buildSuccessResponse(
      'States retrieved successfully',
      states,
    );
  }

  /**
   * GET /api/v1/geography/states/:stateId/lgas
   *
   * Returns all LGAs belonging to a selected State.
   */
  @ApiOperation({
    summary: 'Get LGAs by State',
  })
  @ApiResponse({
    status: 200,
    description: 'LGAs retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized (No token)',
  })
  @Get('states/:stateId/lgas')
  async findLgasByState(
    @Param('stateId') stateId: string,
  ) {
    const lgas =
      await this.geographyService.findLgasByState(
        stateId,
      );

    return buildSuccessResponse(
      'LGAs retrieved successfully',
      lgas,
    );
  }

  /**
   * GET /api/v1/geography/lgas/:lgaId/wards
   *
   * Returns all Wards belonging to a selected LGA.
   */
  @ApiOperation({
    summary: 'Get Wards by LGA',
  })
  @ApiResponse({
    status: 200,
    description: 'Wards retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized (No token)',
  })
  @Get('lgas/:lgaId/wards')
  async findWardsByLga(
    @Param('lgaId') lgaId: string,
  ) {
    const wards =
      await this.geographyService.findWardsByLga(
        lgaId,
      );

    return buildSuccessResponse(
      'Wards retrieved successfully',
      wards,
    );
  }

  /**
   * GET /api/v1/geography/wards/:wardId/polling-units
   *
   * Returns all Polling Units belonging to a selected Ward.
   */
  @ApiOperation({
    summary: 'Get Polling Units by Ward',
  })
  @ApiResponse({
    status: 200,
    description: 'Polling Units retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized (No token)',
  })
  @Get('wards/:wardId/polling-units')
  async findPollingUnitsByWard(
    @Param('wardId') wardId: string,
  ) {
    const pollingUnits =
      await this.geographyService.findPollingUnitsByWard(
        wardId,
      );

    return buildSuccessResponse(
      'Polling Units retrieved successfully',
      pollingUnits,
    );
  }
}