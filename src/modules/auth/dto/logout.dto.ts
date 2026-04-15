/**
 * File: src/modules/auth/dto/logout.dto.ts
 *
 * Purpose:
 * DTO for logout requests.
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LogoutDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Refresh token to invalidate during logout',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}