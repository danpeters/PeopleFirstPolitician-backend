# Bootstrap Notes

## Why global validation is enabled

Global validation is enabled so that every incoming request is checked before it reaches controllers and services.

The following settings are used:

- `whitelist: true`
  - removes properties that are not defined in DTOs
  - reduces accidental or malicious extra input

- `forbidNonWhitelisted: true`
  - rejects requests that contain unexpected properties
  - helps expose bad client behaviour early

- `transform: true`
  - converts payloads into DTO instances
  - improves consistency when handling typed input

These settings reduce unsafe input reaching the business layer.

## Why API prefix is used

A global API prefix such as `/api/v1` helps:

- keep route structure consistent
- support versioning
- separate API routes from other possible routes
- prepare for future versions such as `/api/v2`

Examples:
- `/api/v1/auth/login`
- `/api/v1/users`

## Allowed CORS origins

Only trusted frontend origins are allowed to make browser requests to the API.

Current allowed origins:
- `http://localhost:3001`
- `http://localhost:5173`

These are loaded from the `CORS_ORIGINS` environment variable.

## End-of-day output

The backend should boot with:
- centralised configuration
- global validation
- API prefix
- restricted CORS
- Swagger documentation