/**
 * File: src/modules/auth/guards/jwt-auth.guard.ts
 *
 * Purpose:
 * Protects routes using Passport's JWT strategy.
 *
 * Usage:
 *   @UseGuards(JwtAuthGuard)
 */

import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}