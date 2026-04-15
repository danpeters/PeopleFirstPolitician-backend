/**
 * File: src/common/interceptors/logging.interceptor.ts
 *
 * Purpose:
 * Logs basic request/response information for monitoring and debugging.
 *
 * Logged values:
 * - HTTP method
 * - Request URL
 * - Response status code
 * - Processing time in milliseconds
 */

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const method = request.method;
    const url = request.originalUrl ?? request.url;
    const startedAt = Date.now();

    return next.handle().pipe(
      tap(() => {
        const statusCode = response.statusCode;
        const durationMs = Date.now() - startedAt;

        console.log(
          `[RequestLog] ${method} ${url} ${statusCode} - ${durationMs}ms`,
        );
      }),
    );
  }
}