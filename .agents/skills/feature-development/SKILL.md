---
name: feature-development
description: Standard operational procedure for building and delivering features in the NASA Space Apps platform.
---

# Feature Development Skill Guide

## Purpose

Establishes a systematic, quality-first process for implementing new features from requirements to verified integration.

## Workflow Procedure

### Step 1: Requirements & Scope Analysis

1. Read the feature request and verify against `docs/PRODUCT_SPEC.md` and `docs/ARCHITECTURE.md`.
2. Identify which layer the feature belongs to:
   - Presentation (UI component, 3D experience, GSAP timeline)
   - Application Services (Route Handler, Server Action, Zustand store, React Query hook)
   - Data Infrastructure (Drizzle schema, Supabase table/migration)
3. If requirements are ambiguous, clarify before writing code.

### Step 2: Schema & Data Modeling (If Applicable)

1. Define the PostgreSQL table schema in `src/lib/db/schema.ts` using Drizzle ORM.
2. Generate migration files using `pnpm db:generate`.
3. Verify type inference of insert and select models:
   ```typescript
   export type InsertMission = typeof missions.$inferInsert;
   export type SelectMission = typeof missions.$inferSelect;
   ```

### Step 3: Service & Logic Implementation

1. Create validation schemas in `src/lib/validation/` using Zod.
2. Implement backend route handlers under `src/app/api/[domain]/route.ts`.
3. Implement query hooks in `src/hooks/` or `src/features/[domain]/`.

### Step 4: UI & Experience Implementation

1. Build atomic UI components in `src/components/ui/` or domain components in `src/features/[domain]/`.
2. Isolate client-only modules (GSAP animations, 3D Three.js canvas) using `'use client'`.
3. Connect UI components to Zustand or React Query hooks.

### Step 5: Verification & Documentation

1. Run full verification: `pnpm type-check && pnpm lint && pnpm build`.
2. Update `docs/TASKS.md` with completed deliverables.
3. Document any new architectural decisions in `docs/DECISIONS.md`.
