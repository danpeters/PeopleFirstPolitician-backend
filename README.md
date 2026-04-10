
# PeopleFirst Politician Backend

## Purpose
Backend API for a political engagement and campaign operations platform.

## Day 1 Scope
- project bootstrap
- base dependency installation
- environment config
- secure application startup settings
- folder structure
- common enums, decorators, interfaces, and guards
- initial project documentation

## Stack
- NestJS
- PostgreSQL
- TypeORM
- JWT Authentication
- Swagger/OpenAPI
- Helmet

## Local Setup
1. Copy `.env.example` to `.env`
2. Install dependencies with `npm install`
3. Run `npm run start:dev`

## Security Principles
- no secrets in source code
- backend validation enabled globally
- role-based access control will be enforced on backend
- passwords will be stored only as hashes
- restricted CORS
- secure HTTP headers via Helmet
