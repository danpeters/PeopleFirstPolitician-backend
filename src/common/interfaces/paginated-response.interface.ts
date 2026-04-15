/**
 * File: src/common/interfaces/paginated-response.interface.ts
 *
 * Purpose:
 * Defines a standard paginated response shape.
 */

export interface PaginatedResponse<T> {
  items: T[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}