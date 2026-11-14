# Backend Boundary Specification & Developer Guide

This document establishes the physical implementation boundaries, database patterns, and testing runbook for the Backend Developer (Developer B).

---

## 1. Physical Ownership Scope

The Backend Developer exclusively owns **`backend/**`**:

- Drizzle ORM schema registry (`backend/database/schema/index.ts`).
- Drizzle migrations and SQL definitions (`backend/database/migrations/**`).
- Data access repositories (`backend/database/repositories/**`).
- Singleton Drizzle client (`backend/database/client.ts`).
- Live database verification probe (`backend/database/verify.ts`).
- Backend domain services (`backend/services/**`).
- Supabase configuration, seed scripts, and RLS policies (`backend/supabase/config/**`).
- Supabase Edge Functions (`backend/supabase/functions/**`).
- Backend unit and query tests (`backend/tests/**`, `backend/services/**/*.test.ts`).

---

## 2. Inviolable Restrictions

Backend code must **NEVER**:

- Modify files inside `frontend/**` (components, pages, styling, GSAP timelines).
- Introduce a standalone Express, Fastify, or custom Node server. Supabase is our sole backend infrastructure.
- Alter database schema without updating shared contracts in `@nasa-experience/contracts`.

---

## 3. Independent Development & Database Testing

The backend developer works completely independently of Next.js:

```bash
# Run backend tests
pnpm test:backend

# Verify live database connectivity on port 6543
pnpm db:verify

# Generate migrations
pnpm db:generate

# Apply migrations
pnpm db:migrate

# Type-check backend
pnpm --filter @nasa-experience/backend type-check
```
