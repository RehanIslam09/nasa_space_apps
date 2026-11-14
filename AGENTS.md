# NASA Space Apps — Agent Constitution & Workflow Protocol

This document establishes the binding constitution for all AI agents, engineers, and contributors working on the NASA Space Apps platform. Every operational task, code contribution, and architectural discussion must adhere strictly to these principles.

---

## Physical Ownership Model: Frontend, Backend & Contracts

The repository is physically partitioned into three independent top-level workspaces:

- **`frontend/` (Developer A — Frontend Lead)**:
  - Exclusive ownership of the Next.js 15 application (`frontend/src/**`).
  - Next.js App Router, React 19 Server/Client Components, GSAP cinematics, Three.js / React Three Fiber canvases, Lenis smooth scrolling, Zustand client stores, and frontend API client services (`frontend/src/services/api/`).
  - Strict prohibition: Must NEVER modify `backend/**`, Drizzle schemas, migrations, or database queries.
- **`backend/` (Developer B — Backend Lead)**:
  - Exclusive ownership of Supabase backend assets (`backend/**`).
  - Drizzle ORM schema registry (`backend/database/schema/`), migrations (`backend/database/migrations/`), database repositories (`backend/database/repositories/`), singleton Drizzle client (`backend/database/client.ts`), verification probes (`backend/database/verify.ts`), and backend domain services (`backend/services/`).
  - Supabase remains our sole backend infrastructure (PostgreSQL, Auth, RLS, Storage).
  - Strict prohibition: Must NEVER modify frontend UI components, layouts, GSAP timelines, or styling in `frontend/**`.
- **`packages/contracts/` (Collaborative — Shared API Contracts)**:
  - Single source of truth for all API schemas, Zod request/response models, and type definitions.
  - Changes require a documented RFC in `docs/API_CONTRACT.md` approved by both developers.
- **`docs/` and `.agents/`**: Shared project documentation and agent governance.

---

## The 14 Immutable Operational Rules

### 1. Act as a Senior Software Engineer

Approach every problem with architectural rigor, foresight, and restraint. Prioritize simplicity, correctness, maintainability, and real-world performance over flashy hacks.

### 2. Understand Existing Implementation Before Modifying Anything

Before writing code or altering configuration, thoroughly inspect existing files, dependencies, and git state. Never overwrite or delete working code without clear justification.

### 3. Respect Physical File Ownership Boundaries

- A FRONTEND task must not touch files in `backend/**`.
- A BACKEND task must not touch files in `frontend/**`.
- An INTEGRATION task is the only authorized phase in which cross-boundary coordination occurs.

### 4. Read Relevant Documentation Before Starting a Task

Review official documentation for libraries and frameworks (Next.js App Router, React 19, Tailwind CSS 4, GSAP, Three.js, Supabase, Drizzle ORM) prior to implementation.

### 5. Follow the Approved Physical Architecture

Respect workspace boundaries:

- `frontend/` contains all presentation code and client services.
- `backend/` contains all database and Supabase backend logic.
- `packages/contracts/` contains shared Zod contracts.

### 6. Never Introduce Unauthorized Dependencies

No separate Express, Fastify, Hono, or competing backend frameworks. Supabase is our sole backend infrastructure.

### 7. Never Fabricate APIs, Library Behavior, or Technical Facts

Only utilize documented, verified methods, parameters, and return types. Verify uncertain signatures against official references.

### 8. Verify Technical Decisions Against Official Documentation

Consult release notes and official documentation before making architectural choices (React 19 hooks, Tailwind 4 CSS-first theme, Supabase SSR cookie synchronization).

### 9. Follow TypeScript Strictness and Clean Coding Conventions

Strict TypeScript (`strict: true`) is non-negotiable across all workspace packages. Prohibit `any`, unchecked index accesses, and suppressed compiler warnings.

### 10. Never Expose Secrets

Database credentials, `DATABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY` must remain server-side. Never prefix private variables with `NEXT_PUBLIC_`. Never commit `.env.local` or print unmasked secret values to logs or documentation.

### 11. Run Relevant Checks Before Declaring Work Complete

Prior to presenting deliverables, execute the verification suite:

- `pnpm boundary:check` (ESLint import boundary rules)
- `pnpm type-check` (Strict TypeScript across all workspaces)
- `pnpm format:check` (Code formatting)
- `pnpm test:all` (Contract, backend, and frontend tests)
- `pnpm build` (Production compilation)
- `pnpm db:verify` (Database connectivity probe)

### 12. Report Actual Test Results

Provide true, unembellished command execution output. Never claim tests passed when they were skipped or failed.

### 13. Update Project Documentation After Meaningful Changes

When adding features or changing architecture, synchronize:

- `docs/API_CONTRACT.md`
- `docs/FRONTEND_BOUNDARY.md`
- `docs/BACKEND_BOUNDARY.md`
- `docs/INTEGRATION_WORKFLOW.md`
- `docs/DEVELOPMENT_WORKFLOW.md`
- `docs/TASKS.md`
- `docs/HANDOFF.md`
- `TESTING.md`

### 14. Never Silently Change Architectural Decisions or Shared Contracts

If an architectural or contract change is necessary, stop, document an RFC in `docs/API_CONTRACT.md` or an ADR in `docs/DECISIONS.md`, and obtain explicit approval before implementation.
