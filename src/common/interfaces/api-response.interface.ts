/**
 * File: src/common/interfaces/api-response.interface.ts
 *
 * Purpose:
 * Defines a standard success response shape for the API.
 */

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}