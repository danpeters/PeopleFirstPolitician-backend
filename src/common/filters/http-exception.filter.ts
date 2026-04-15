/**
 * File: src/common/filters/http-exception.filter.ts
 *
 * Purpose:
 * Provides a global HTTP exception filter that formats error responses
 * into a standard structure.
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
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
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