# Backend Developer Rules & Physical Ownership Boundary

This document defines the physical boundaries, prohibited actions, and implementation standards for the **Backend Developer (Developer B)**.

---

## 1. Physical Ownership Scope

The Backend Developer exclusively owns **`backend/**`**:

- Drizzle ORM schema registry (`backend/database/schema/index.ts`).
- Drizzle migrations and SQL files (`backend/database/migrations/**`).
- Database query repositories (`backend/database/repositories/**`).
- Singleton Drizzle client (`backend/database/client.ts`).
- Standalone database connectivity probe (`backend/database/verify.ts`).
- Backend domain services (`backend/services/**`).
- Supabase configuration, seed scripts, and RLS policies (`backend/supabase/config/**`).
- Supabase Edge Functions (`backend/supabase/functions/**`).
- Backend unit and database tests (`backend/tests/**`, `backend/services/**/*.test.ts`).

---

## 2. Strictly Prohibited Actions

The Backend Developer must **NEVER**:

1. **Modify `frontend/**`**:
   - Never edit React components, JSX layouts, CSS, GSAP timelines, or UI stores.
2. **Introduce Standalone HTTP Server Frameworks**:
   - Do NOT introduce Express, Fastify, Hono, or custom Node servers. Supabase is our sole backend infrastructure.
3. **Silently Alter Database Contracts**:
   - Schema modifications must conform to agreed contracts in `@nasa-experience/contracts`.
4. **Expose Sensitive Credentials**:
   - Keep `DATABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` strictly inside server/database modules.

---

## 3. Independent Development & Testing

- Develop database schemas and repositories completely independent of Next.js.
- Test domain services via Vitest (`pnpm test:backend`).
- Verify live PostgreSQL reachability via `pnpm db:verify`.
- Generate and verify migrations via `pnpm db:generate`.

---

## 4. Backend Verification Commands

```bash
# Run backend tests
pnpm test:backend

# Verify live PostgreSQL connectivity
pnpm db:verify

# Verify type safety
pnpm --filter @nasa-experience/backend type-check
```
