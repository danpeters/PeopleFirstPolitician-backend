# Day 10 — Audit Logging, Soft Delete, and Admin Activity Tracking

## Overview
Day 10 improves backend accountability and safety by adding:

- audit logging
- soft delete support
- restore capability
- admin activity traceability

This makes the system more production-ready and safer for real administrative operations.

---

## 1. Audit Logging

A new `AuditLog` entity was introduced to store important backend actions.

### Purpose
Audit logs help answer:
- who performed an action
- what action was performed
- which record was affected
- when it happened
- extra contextual details

### Example audit actions
- `USER_CREATED`
- `USER_UPDATED`
- `USER_STATUS_UPDATED`
- `USER_DELETED`
- `USER_RESTORED`

### Audit log structure
Audit records store:
- `action`
- `module`
- `actorId`
- `targetId`
- `details`
- `createdAt`

---

## 2. Audit Service

A reusable `AuditService` was added.

### Purpose
It provides a simple method:

```ts
auditService.log(...)