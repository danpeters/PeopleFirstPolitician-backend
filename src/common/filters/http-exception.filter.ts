/**
 * File: src/common/filters/http-exception.filter.ts
 *
 * Purpose:
 * Provides a global HTTP exception filter that formats error responses
 * into a standard structure while logging unexpected server errors.
 *
 * Output shape:
 * {
 *   success: false,
 *   statusCode: number,
 *   message: string | string[],
 *   path: string,
 *   timestamp: string
 * }
 */

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    /**
     * Default values for unexpected errors.
     */
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';

    /**
     * Handle known NestJS / HTTP exceptions.
     */
    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();

      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const responseBody = exceptionResponse as {
          message?: string | string[];
        };

        message = responseBody.message ?? exception.message;
      } else {
        message = exception.message;
      }
    } else {
      /**
       * Log unexpected exceptions for server-side diagnostics.
       *
       * The actual exception is deliberately not returned to the client.
       */
      this.logger.error(
        `Unhandled exception: ${request.method} ${request.originalUrl ?? request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(statusCode).json({
      success: false,
      statusCode,
      message,
      path: request.originalUrl ?? request.url,
      timestamp: new Date().toISOString(),
    });
  }
}