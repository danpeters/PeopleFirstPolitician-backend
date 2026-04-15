/**
 * File: src/modules/auth/dto/refresh-token.dto.ts
 *
 * Purpose:
 * DTO for refresh token requests.
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Refresh token issued at login',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}