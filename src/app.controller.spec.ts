/**
 * File: C:\Projects\PeopleFirstPolitician\backend\src\app.controller.spec.ts
 *
 * Purpose:
 * Unit tests for the root AppController.
 *
 * These tests verify that the controller returns the expected
 * People First Politician API status information provided by
 * AppService.
 */

import { Test, TestingModule } from '@nestjs/testing';

import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('getStatus', () => {
    it('should return the People First Politician API status', () => {
      const response = appController.getStatus();

      expect(response).toEqual({
        name: 'People First Politician API',
        status: 'running',
        version: '1.0.0',
        api: '/api/v1',
        documentation: '/api/docs',
      });
    });

    it('should report the API as running', () => {
      const response = appController.getStatus();

      expect(response.status).toBe('running');
    });

    it('should expose the API base path', () => {
      const response = appController.getStatus();

      expect(response.api).toBe('/api/v1');
    });

    it('should expose the API documentation path', () => {
      const response = appController.getStatus();

      expect(response.documentation).toBe('/api/docs');
    });
  });
});