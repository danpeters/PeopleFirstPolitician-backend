# Day 12 — Production Hardening and Deployment Preparation

## Overview
Day 12 focused on making the backend safer, cleaner, and more deployable by improving:

- logging structure
- bootstrap security
- environment-based configuration
- production safety settings

---

## 1. Centralised Application Logger

A reusable logger service was added:

- `src/common/logger/app.logger.ts`

### Purpose
It provides:
- structured log format
- consistent startup logs
- a cleaner path toward future logging upgrades such as Winston or cloud logging

### Benefit
This reduces scattered console usage and improves maintainability.

---

## 2. Logger Integrated into Bootstrap

The custom logger was connected in:

- `src/main.ts`

### Purpose
Nest now uses a central logger instead of relying only on default console output.

### Benefit
- cleaner startup messages
- consistent formatting
- better observability for production use

---

## 3. Security-Focused Bootstrap Review

The bootstrap process now clearly applies:

- Helmet
- restricted CORS
- global validation
- API version prefix
- Swagger setup

### Validation settings
The global validation pipe uses:

- `whitelist: true`
- `forbidNonWhitelisted: true`
- `transform: true`

### Benefit
These settings help prevent unexpected or malicious input from reaching business logic.

---

## 4. Restricted CORS

CORS was configured with explicit allowed local frontend origins rather than leaving it fully open.

### Benefit
This is safer than wildcard access and is closer to how production APIs should be configured.

---

## 5. Environment-Based Configuration

The root module now loads environment variables from files based on runtime mode:

- `.env` for development
- `.env.production` for production

### Benefit
This separates local development settings from live deployment settings.

---

## 6. Production Safety for TypeORM

TypeORM configuration now uses:

```ts
synchronize: process.env.NODE_ENV !== 'production'