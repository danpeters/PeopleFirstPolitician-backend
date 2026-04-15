/**
 * File: src/modules/auth/auth.module.ts
 *
 * Purpose:
 * Wires authentication dependencies:
 * - AuthController
 * - AuthService
 * - JwtStrategy
 * - JwtModule
 * - UsersModule access for UsersService
 */

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type { SignOptions } from 'jsonwebtoken';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';

import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    /**
     * Gives AuthModule access to ConfigService.
     */
    ConfigModule,

    /**
     * Gives AuthService access to UsersService.
     */
    UsersModule,

    /**
     * Registers JwtService using configuration values.
     */
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret:
          configService.get<string>('auth.jwtSecret') ??
          'ChangeThisToAVeryStrongSecretKey123!',
        signOptions: {
          expiresIn:
            (configService.get<string>('auth.jwtExpiresIn') ?? '15m') as SignOptions['expiresIn'],
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}