// File: C:\Projects\PeopleFirstPolitician\backend\src\app.service.ts

import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello() {
    return {
      name: 'People First Politician API',
      status: 'running',
      version: '1.0.0',
      api: '/api/v1',
      documentation: '/api/docs',
    };
  }
}