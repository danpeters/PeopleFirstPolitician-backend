/**
 * File: src/modules/geography/geography.module.ts
 * 
 * Purpose:
 * - Groups geography entities
 * - Exports for use by other modules
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { State } from './entities/state.entity';
import { Lga } from './entities/lga.entity';
import { Ward } from './entities/ward.entity';
import { PollingUnit } from './entities/polling-unit.entity';
import { GeographyService } from './geography.service';
import { GeographyController } from './geography.controller';

@Module({
  imports: [TypeOrmModule.forFeature([State, Lga, Ward, PollingUnit])],
  controllers: [GeographyController],
  providers: [GeographyService],
  exports: [TypeOrmModule, GeographyService],
})
export class GeographyModule {}