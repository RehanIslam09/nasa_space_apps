# Frontend Boundary Specification & Developer Guide

This document establishes the physical implementation boundaries, mock architecture, and testing runbook for the Frontend Developer (Developer A).

---

## 1. Physical Ownership Scope

The Frontend Developer exclusively owns **`frontend/**`**:

- Next.js App Router pages and layouts (`frontend/src/app/**`).
- Reusable UI and navigation components (`frontend/src/components/**`).
- Cinematics and 3D scenes (`frontend/src/experiences/**`).
- Custom hooks (`frontend/src/hooks/**`).
- Zustand UI stores (`frontend/src/stores/**`).
- Frontend API Client and mock fixtures (`frontend/src/services/api/**`).
- Static assets (`frontend/public/**`).
- Next.js Edge middleware (`frontend/middleware.ts`) and OAuth callback (`frontend/src/app/api/auth/callback/route.ts`).
- Frontend unit and integration tests (`frontend/tests/**`, `frontend/src/**/*.test.tsx`).

---

## 2. Inviolable Restrictions

Frontend code must **NEVER**:

- Modify files inside `backend/**`.
- Import `drizzle-orm` or `postgres` directly into client components.
- Expose server secrets (`DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) to client code.
- Construct direct fetch requests in UI components (must consume domain services).

Enforcement is verified via:

```bash
pnpm boundary:check
```

---

## 3. Developing with Mock Data

Set `NEXT_PUBLIC_API_MOCK=true` in `.env.local` to develop without database or network dependencies:

```typescript
import { frontendHealthService } from '@/services/api';

export async function checkStatus() {
  const response = await frontendHealthService.getHealth();
  if (response.success) {
    console.log('Status:', response.data.status);
  }
}
```

---

## 4. Verification Commands

```bash
# Run frontend tests
pnpm test:frontend

# Run Next.js production build
pnpm build

# Verify type safety
pnpm --filter @nasa-experience/frontend type-check

# Verify boundary rules
pnpm boundary:check
```
