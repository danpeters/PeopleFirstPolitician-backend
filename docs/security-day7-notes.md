# Day 7 — Security & Monitoring Notes

## Overview
This phase focuses on improving backend security, monitoring, and resilience against abuse.

---

## 1. Helmet (Security Headers)

Helmet is enabled globally in `main.ts`.

### Purpose
Adds HTTP headers to protect against:
- Cross-site scripting (XSS)
- Clickjacking
- MIME sniffing
- Information leakage

### Example headers
- X-Content-Type-Options
- X-Frame-Options
- X-DNS-Prefetch-Control

---

## 2. Global Rate Limiting

Configured via:
