# Frontend Developer Rules & Physical Ownership Boundary

This document defines the physical boundaries, prohibited actions, and implementation standards for the **Frontend Developer (Developer A)**.

---

## 1. Physical Ownership Scope

The Frontend Developer exclusively owns **`frontend/**`**:

- Next.js App Router pages and layouts (`frontend/src/app/**`).
- Reusable UI, layout, and navigation components (`frontend/src/components/**`).
- Cinematic GSAP animations and Three.js / R3F canvases (`frontend/src/experiences/**`).
- Custom hooks (`frontend/src/hooks/**`).
- Client UI state stores (`frontend/src/stores/**`).
- Frontend API Client and mock layer (`frontend/src/services/api/**`).
- Framework integrations: Edge session middleware (`frontend/middleware.ts`), OAuth callback (`frontend/src/app/api/auth/callback/route.ts`), and health route (`frontend/src/app/api/health/route.ts`).
- Public static assets (`frontend/public/**`).
- Frontend unit and integration tests (`frontend/tests/**`, `frontend/src/**/*.test.tsx`).

---

## 2. Strictly Prohibited Actions

The Frontend Developer must **NEVER**:

1. **Modify `backend/**`**:
   - Never edit Drizzle schemas, migrations, or database queries.
2. **Import Database Packages Directly into Client Components**:
   - Never import `drizzle-orm`, `postgres`, or database connection strings.
3. **Access Private Server Credentials**:
   - Never expose `DATABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` to client components.
4. **Construct Ad-hoc HTTP Calls in UI Components**:
   - Components must call domain services in `frontend/src/services/api/`.

---

## 3. Independent Development & Mock Mode

- Set `NEXT_PUBLIC_API_MOCK=true` in `.env.local` to develop UI completely offline.
- Frontend services return contract-compliant mock data conforming to `@nasa-experience/contracts`.

---

## 4. Frontend Verification Commands

```bash
# Run frontend unit and component tests
pnpm test:frontend

# Run Next.js production build
pnpm build

# Verify type safety
pnpm --filter @nasa-experience/frontend type-check

# Verify boundary rules
pnpm boundary:check
```
