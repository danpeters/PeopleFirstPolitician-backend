/**
 * File: src/common/utils/api-response.util.ts
 *
 * Purpose:
 * Provides a helper for building standard success responses.
 */

import { ApiResponse } from '../interfaces/api-response.interface';

/**
 * Build a standard success response.
 *
 * @param message Human-readable success message
 * @param data Response payload
 * @returns Standard API success response object
 */
export function buildSuccessResponse<T>(
  message: string,
  data: T,
): ApiResponse<T> {
  return {
    success: true,
    message,
    data,
  };
}