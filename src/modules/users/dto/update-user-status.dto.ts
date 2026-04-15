/**
 * File: C:\Projects\PeopleFirstPolitician\backend\src\modules\users\dto\update-user-status.dto.ts
 *
 * Purpose:
 * - Defines the allowed payload for changing a user's account status.
 *
 * Security notes:
 * - Status changes are sensitive administrative actions.
 * - Later these endpoints must be protected by authentication and authorization guards.
 */

import { IsEnum } from 'class-validator';
import { UserStatusEnum } from '../../../common/enums/user-status.enum';

export class UpdateUserStatusDto {
  @IsEnum(UserStatusEnum)
  status!: UserStatusEnum;
}