/**
 * File: src/modules/auth/jwt.strategy.ts
 *
 * Purpose:
 * Validates JWT bearer tokens from incoming requests.
 *
 * Header format:
 *   Authorization: Bearer <token>
 *
 * Important:
 * - The secret here must match the secret used in AuthModule
 * - The returned object becomes request.user
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      /**
       * Extract the JWT from:
       * Authorization: Bearer <token>
       */
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      /**
       * Expired tokens should be rejected automatically.
       */
      ignoreExpiration: false,

      /**
       * Must match the JWT signing secret used in AuthModule.
       * A fallback is provided to satisfy TypeScript and keep development moving.
       */
      secretOrKey:
        configService.get<string>('auth.jwtSecret') ??
        'ChangeThisToAVeryStrongSecretKey123!',
    });
  }

  /**
   * This runs after token verification succeeds.
   * The returned object is attached to request.user.
   */
  async validate(payload: JwtPayload) {
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}