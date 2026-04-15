/**
 * File: src/modules/auth/jwt-auth.guard.ts
 *
 * Purpose:
 * Protects routes by requiring a valid JWT bearer token.
 *
 * Usage:
 *   @UseGuards(JwtAuthGuard)
 */

import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}