/**
 * File: src/modules/auth/dto/refresh-token.dto.ts
 *
 * Purpose:
 * Defines the request body used to refresh an access token.
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  /**
   * Refresh token previously issued during successful login.
   */
  @ApiProperty({
    description:
      'Refresh token issued during successful login',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}