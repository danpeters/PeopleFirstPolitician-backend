/**
 * File: src/common/logger/app.logger.ts
 *
 * Purpose:
 * Provides a central application logger service.
 *
 * Why this exists:
 * - keeps logging consistent
 * - makes future replacement with Winston or Pino easier
 * - avoids scattered console.log usage
 */

import { Injectable, LoggerService } from '@nestjs/common';

@Injectable()
export class AppLogger implements LoggerService {
  log(message: string, context?: string) {
    console.log(this.format('LOG', message, context));
  }

  error(message: string, trace?: string, context?: string) {
    console.error(this.format('ERROR', message, context));
    if (trace) {
      console.error(trace);
    }
  }

  warn(message: string, context?: string) {
    console.warn(this.format('WARN', message, context));
  }

  debug(message: string, context?: string) {
    console.debug(this.format('DEBUG', message, context));
  }

  verbose(message: string, context?: string) {
    console.info(this.format('VERBOSE', message, context));
  }

  /**
   * Builds a consistent log line.
   */
  private format(
    level: 'LOG' | 'ERROR' | 'WARN' | 'DEBUG' | 'VERBOSE',
    message: string,
    context?: string,
  ) {
    const timestamp = new Date().toISOString();
    const safeContext = context ?? 'Application';

    return `[${timestamp}] [${level}] [${safeContext}] ${message}`;
  }
}