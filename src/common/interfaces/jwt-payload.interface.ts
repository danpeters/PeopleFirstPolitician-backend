/**
 * JWT payload interface.
 *
 * Purpose:
 * - Standardises the shape of authentication token payloads.
 *
 * Security notes:
 * - Do not put sensitive data such as password hashes in JWT payloads.
 * - Keep payloads minimal: only what is needed for request authorization.
 */
export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}
