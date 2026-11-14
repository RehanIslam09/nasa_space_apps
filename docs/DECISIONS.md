# NASA Space Apps — Architectural Decision Records (ADRs)

---

## ADR 001: Next.js App Router as the Exclusive Routing Framework

- **Status**: Accepted
- **Context**: Need a full-stack framework with React 19 support, server rendering, streaming, and server actions.
- **Decision**: Next.js 15 App Router is the sole routing and full-stack framework. Competing solutions like TanStack Router or Pages Router are strictly prohibited.
- **Consequences**: Enables zero-bundle-size React Server Components by default, seamless nested layouts, and co-located route handlers.

---

## ADR 002: Tailwind CSS 4 as Primary Styling System

- **Status**: Accepted
- **Context**: High-performance, modern styling is required without runtime CSS-in-JS overhead.
- **Decision**: Adopt Tailwind CSS 4 with `@tailwindcss/postcss` and CSS-first configuration via `@theme inline`.
- **Consequences**: Streamlined styling without legacy `tailwind.config.ts`. Full OKLCH color gamut support and seamless shadcn/ui integration.

---

## ADR 003: Supabase PostgreSQL for Relational Storage

- **Status**: Accepted
- **Context**: Need scalable, enterprise-grade relational database hosting with built-in authentication and connection pooling.
- **Decision**: Use Supabase-hosted PostgreSQL as the platform database.
- **Consequences**: Supabase Auth manages sessions and tokens; PostgreSQL stores structured data; Supavisor handles transaction pooling.

---

## ADR 004: Drizzle ORM for Data Layer & Migrations

- **Status**: Accepted
- **Context**: Need type-safe SQL query generation without heavyweight ORM runtime overhead or fragile code generation steps.
- **Decision**: Use Drizzle ORM (`drizzle-orm`) paired with `postgres-js` and `drizzle-kit` for schema management and migrations.
- **Consequences**: Near-zero runtime overhead, full TypeScript inference from schema definitions, and support for Supabase connection poolers via `{ prepare: false }`.

---

## ADR 005: TanStack Query for Server State Management

- **Status**: Accepted
- **Context**: Client components require dynamic data synchronization, caching, and cache invalidation.
- **Decision**: Adopt `@tanstack/react-query` v5 for all client-side server-state management.
- **Consequences**: Standardized caching, deduplication of concurrent requests, and clean separation between server data and local UI state.

---

## ADR 006: Zustand for Global Client UI State

- **Status**: Accepted
- **Context**: Need a lightweight, hook-based client store for transient UI state (audio mute, graphics quality, modal states).
- **Decision**: Use `zustand` v5 as the exclusive client-side state store. Competing solutions like Redux are prohibited.
- **Consequences**: Ultra-minimal bundle footprint (< 1kB), zero boilerplate, and simple hook-based consumption.

---

## ADR 007: GSAP & ScrollTrigger for Animation Timelines

- **Status**: Accepted
- **Context**: Need complex, orchestratable animation choreographies, pinned scroll sequences, and scrubbed playback.
- **Decision**: Use GSAP 3 with ScrollTrigger and `@gsap/react` `useGSAP` hook.
- **Consequences**: Precise timeline control, hardware-accelerated animations, and automatic lifecycle cleanup in React 19.

---

## ADR 008: Three.js & React Three Fiber for 3D Experiences

- **Status**: Accepted
- **Context**: Hackathon platform requires rich interactive 3D visualizations (celestial bodies, orbits, space probes).
- **Decision**: Adopt Three.js paired with `@react-three/fiber` v9 and `@react-three/drei` v10.
- **Consequences**: Declarative 3D scene graphs in React with full React 19 reconciler support. All 3D modules are lazily imported with `{ ssr: false }` to protect initial page loads.

---

## ADR 009: Vitest and Testing Library for Unit & Integration Testing

- **Status**: Accepted
- **Context**: Need a fast, native Vite-powered test runner compatible with React 19, TypeScript strict mode, and jsdom environment.
- **Decision**: Adopt Vitest with `@testing-library/react` and `@testing-library/jest-dom` for component and unit testing.
- **Consequences**: Native ESM support, fast in-memory execution, zero Jest configuration complexity, and automated test coverage across UI, utilities, and API helpers.

---

## ADR 010: Standardized Error Boundaries and Loading Regions

- **Status**: Accepted
- **Context**: Application failures must fail gracefully without exposing sensitive credentials, stack traces, or breaking accessibility.
- **Decision**: Implement a two-tiered error boundary architecture: `global-error.tsx` (with full `<html>`/`<body>` fallback) for critical app failures, and `error.tsx` for nested route segment recoveries. Provide accessible `loading.tsx` status indicators with ARIA live regions.
- **Consequences**: High fault tolerance, WCAG accessibility compliance, sanitized error presentations, and seamless retry/reload triggers.
