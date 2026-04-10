# Security Baseline

## Core Rules
1. Never commit `.env`
2. Never hardcode secrets
3. Protect routes on the backend
4. Validate every DTO
5. Strip unknown input fields
6. Restrict CORS
7. Use secure password hashing
8. Avoid exposing internal error details
9. Keep database access private
10. Log sensitive actions in later phases

## Day 1 Measures
- Config loaded from environment variables
- Helmet enabled
- Restricted CORS enabled
- Global validation enabled
- Role and auth placeholders prepared

## Risks to Avoid
- open CORS
- plaintext passwords
- public database ports
- secrets committed to Git
- trusting frontend-only authorization
