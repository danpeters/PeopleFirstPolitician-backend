import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT authentication guard.
 *
 * Purpose:
 * - Protects routes using Passport's JWT strategy.
 *
 * Security notes:
 * - This guard should be applied to all protected endpoints.
 * - Authorization checks may still be needed after authentication succeeds.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
