/**
 * File: C:\Projects\PeopleFirstPolitician\backend\src\modules\audit\audit.service.spec.ts
 *
 * Purpose:
 * Unit tests for AuditService audit-detail sanitisation.
 *
 * Security objectives:
 * - Sensitive authentication fields must not be persisted.
 * - Sanitisation must be case-insensitive.
 * - Nested objects must also be sanitised.
 * - Nested arrays must also be sanitised.
 * - Non-sensitive audit information must remain intact.
 *
 * Test isolation:
 * - The TypeORM repository is mocked.
 * - No PostgreSQL database is accessed.
 */

import { AuditService } from './audit.service';
import { AuditLog } from './entities/audit-log.entity';

describe('AuditService', () => {
  let service: AuditService;

  const repository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    service = new AuditService(
      repository as unknown as any,
    );

    repository.create.mockImplementation(
      (value: Partial<AuditLog>) => value,
    );

    repository.save.mockImplementation(
      async (value: Partial<AuditLog>) => value,
    );
  });

  describe('audit-detail sanitisation', () => {
    it('should remove sensitive authentication fields', async () => {
      await service.log({
        action: 'USER_UPDATED',
        module: 'users',
        actorId: 'actor-001',
        targetId: 'target-001',
        details: {
          fullName: 'Test User',
          password: 'SecretPassword123',
          passwordHash: 'hashed-password',
          refreshToken: 'refresh-token-secret',
          refreshTokenHash: 'hashed-refresh-token',
          passwordResetToken: 'reset-token-secret',
          passwordResetTokenHash: 'hashed-reset-token',
          accessToken: 'access-token-secret',
          token: 'generic-token-secret',
          status: 'active',
        },
      });

      expect(repository.create).toHaveBeenCalledTimes(1);

      const savedAudit = repository.create.mock.calls[0][0];

      expect(savedAudit.details).toEqual({
        fullName: 'Test User',
        status: 'active',
      });

      expect(savedAudit.details).not.toHaveProperty('password');
      expect(savedAudit.details).not.toHaveProperty('passwordHash');
      expect(savedAudit.details).not.toHaveProperty('refreshToken');
      expect(savedAudit.details).not.toHaveProperty('refreshTokenHash');
      expect(savedAudit.details).not.toHaveProperty('passwordResetToken');
      expect(savedAudit.details).not.toHaveProperty('passwordResetTokenHash');
      expect(savedAudit.details).not.toHaveProperty('accessToken');
      expect(savedAudit.details).not.toHaveProperty('token');
    });

    it('should remove sensitive fields case-insensitively', async () => {
      await service.log({
        action: 'TEST_SECURITY',
        module: 'auth',
        details: {
          Password: 'secret-1',
          PASSWORDHASH: 'secret-2',
          RefreshToken: 'secret-3',
          REFRESHTOKENHASH: 'secret-4',
          AccessToken: 'secret-5',
          ToKeN: 'secret-6',
          description: 'Safe audit information',
        },
      });

      const savedAudit = repository.create.mock.calls[0][0];

      expect(savedAudit.details).toEqual({
        description: 'Safe audit information',
      });
    });

    it('should remove sensitive fields from nested objects', async () => {
      await service.log({
        action: 'TEST_NESTED_SECURITY',
        module: 'auth',
        details: {
          user: {
            id: 'user-001',
            profile: {
              name: 'Test User',
              password: 'nested-password',
              refreshToken: 'nested-refresh-token',
            },
          },
          status: 'active',
        },
      });

      const savedAudit = repository.create.mock.calls[0][0];

      expect(savedAudit.details).toEqual({
        user: {
          id: 'user-001',
          profile: {
            name: 'Test User',
          },
        },
        status: 'active',
      });
    });

    it('should remove sensitive fields from nested arrays', async () => {
      await service.log({
        action: 'TEST_ARRAY_SECURITY',
        module: 'auth',
        details: {
          events: [
            {
              action: 'LOGIN',
              token: 'secret-token',
              ip: '127.0.0.1',
            },
            {
              action: 'PASSWORD_CHANGE',
              password: 'secret-password',
              ip: '127.0.0.2',
            },
          ],
        },
      });

      const savedAudit = repository.create.mock.calls[0][0];

      expect(savedAudit.details).toEqual({
        events: [
          {
            action: 'LOGIN',
            ip: '127.0.0.1',
          },
          {
            action: 'PASSWORD_CHANGE',
            ip: '127.0.0.2',
          },
        ],
      });
    });

    it('should preserve non-sensitive audit details', async () => {
      await service.log({
        action: 'USER_STATUS_UPDATED',
        module: 'users',
        actorId: 'actor-001',
        targetId: 'target-001',
        details: {
          previousStatus: 'active',
          newStatus: 'inactive',
          reason: 'Administrative action',
          timestamp: '2026-09-26T12:00:00.000Z',
        },
      });

      const savedAudit = repository.create.mock.calls[0][0];

      expect(savedAudit.details).toEqual({
        previousStatus: 'active',
        newStatus: 'inactive',
        reason: 'Administrative action',
        timestamp: '2026-09-26T12:00:00.000Z',
      });
    });

    it('should store null when audit details are omitted', async () => {
      await service.log({
        action: 'TEST_NO_DETAILS',
        module: 'system',
      });

      const savedAudit = repository.create.mock.calls[0][0];

      expect(savedAudit.details).toBeNull();
    });
  });
});