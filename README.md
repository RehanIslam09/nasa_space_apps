# NASA Space Apps — Experience Platform

Cinematic, interactive space exploration platform built for the NASA Space Apps Hackathon.

---

## 1. Physical Monorepo Architecture

The platform is structured into three independent workspaces:

- **`frontend/`** (Developer A): Next.js 15 App Router, React 19, Tailwind CSS 4, GSAP, Three.js, React Three Fiber, Lenis, and TanStack Query.
- **`backend/`** (Developer B): Supabase PostgreSQL schemas, Drizzle ORM, database migrations, repositories, and backend domain services.
- **`packages/contracts/`** (Shared): Shared API contracts, Zod request/response schemas, and inferred TypeScript types.

---

## 2. Quick Start

### Prerequisites

- Node.js $\ge 20$
- pnpm $\ge 9$

### Install Dependencies

```bash
pnpm install
```

### Development Commands

```bash
# Start frontend application (Port 3000)
pnpm dev

# Run frontend tests
pnpm test:frontend

# Run backend tests
pnpm test:backend

# Verify live database connectivity
pnpm db:verify

# Run all tests across monorepo
pnpm test:all

# Next.js production build
pnpm build
```

---

## 3. Environment Variables

Root `.env.local` contains live Supabase configuration and database URLs.
It is loaded automatically by `frontend/next.config.ts` and `backend/config/env.ts`.
Never commit `.env.local`.
