# NASA Experience — Backend Architecture (Developer B)

This directory contains the Supabase backend infrastructure, Drizzle database schemas, SQL migrations, repositories, and backend domain services.

---

## 1. Directory Structure

- `database/client.ts` — Drizzle ORM singleton client configured for Supavisor transaction connection pooling on port 6543 (`prepare: false`).
- `database/schema/` — Drizzle relational schema tables and types.
- `database/migrations/` — Generated Drizzle and PostgreSQL migration SQL files.
- `database/repositories/` — Data access layer and query functions.
- `database/verify.ts` — Standalone PostgreSQL connectivity probe.
- `services/` — Business logic domain services.
- `supabase/config/` — Supabase project configuration, seed scripts, and RLS policies.
- `supabase/functions/` — Supabase Edge Functions.

---

## 2. Independent Development Runbook

```bash
# Run backend tests
pnpm --filter @nasa-experience/backend test

# Run database connectivity probe
pnpm --filter @nasa-experience/backend db:verify

# Generate Drizzle migrations
pnpm --filter @nasa-experience/backend db:generate

# Apply migrations
pnpm --filter @nasa-experience/backend db:migrate

# Type-check backend
pnpm --filter @nasa-experience/backend type-check
```
