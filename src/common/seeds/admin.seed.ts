/**
 * File: src/common/seeds/admin.seed.ts
 *
 * Purpose:
 * Creates a known super admin account for development/testing.
 *
 * Warning:
 * This is for development only.
 * Do not leave this active in production without proper control.
 */

import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from '../../modules/users/entities/user.entity';
import { Role } from '../../modules/roles/entities/role.entity';
import { UserStatusEnum } from '../enums/user-status.enum';

export async function seedAdmin(dataSource: DataSource): Promise<void> {
  const userRepository = dataSource.getRepository(User);
  const roleRepository = dataSource.getRepository(Role);

  const existingUser = await userRepository.findOne({
    where: { email: 'admin@example.com' },
  });

  if (existingUser) {
    console.log('Seed admin already exists.');
    return;
  }

  const superAdminRole = await roleRepository.findOne({
    where: { name: 'super_admin' },
  });

  if (!superAdminRole) {
    console.log('Seed admin skipped: super_admin role not found.');
    return;
  }

  const passwordHash = await bcrypt.hash('NewStrongPassword@123', 10);

  const adminUser = userRepository.create({
    fullName: 'System Admin',
    email: 'admin@example.com',
    phone: '08011111111',
    passwordHash,
    role: superAdminRole,
    status: UserStatusEnum.ACTIVE,
  });

  await userRepository.save(adminUser);

  console.log('Seed admin created: admin@example.com / NewStrongPassword@123');
}