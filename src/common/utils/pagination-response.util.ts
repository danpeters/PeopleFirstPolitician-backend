/**
 * File: src/common/utils/pagination-response.util.ts
 *
 * Purpose:
 * Provides a helper for building standard paginated responses.
 */

import { PaginatedResponse } from '../interfaces/paginated-response.interface';

/**
 * Build a standard paginated response object.
 *
 * @param items Current page items
 * @param page Current page number
 * @param limit Number of items per page
 * @param totalItems Total number of matching items
 * @returns Standard paginated response
 */
export function buildPaginatedResponse<T>(
  items: T[],
  page: number,
  limit: number,
  totalItems: number,
): PaginatedResponse<T> {
  const totalPages = Math.ceil(totalItems / limit);

  return {
    items,
    meta: {
      page,
      limit,
      totalItems,
      totalPages,
    },
  };
}