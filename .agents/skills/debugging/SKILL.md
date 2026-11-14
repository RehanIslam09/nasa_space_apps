---
name: debugging
description: Systematic root-cause diagnosis and resolution procedure for errors across the stack.
---

# Debugging Skill Guide

## Purpose

Provides a disciplined, reproducible framework to identify, isolate, and resolve bugs across Next.js App Router, React 19, Three.js, Supabase, and PostgreSQL.

## Workflow Procedure

### Phase 1: Problem Characterization

1. **Capture Exact Error**: Record the full stack trace, error code, and context (browser console, server log, terminal build trace).
2. **Reproduce Reliably**: Identify minimal reproduction steps (specific route, user action, viewport size, missing env var).
3. **Classify Origin**:
   - Build-time (TypeScript compile error, Tailwind CSS syntax, missing module)
   - Server-side runtime (Database pooler timeout, invalid cookies, Server Action failure)
   - Client-side runtime (WebGL context loss, hydration mismatch, GSAP target not found)

### Phase 2: Diagnostic Checklist by Layer

- **Hydration Mismatches**:
  - Check for browser-only APIs (`window`, `localStorage`, `navigator`) executed during Server Component rendering.
  - Check for non-deterministic values (`Date.now()`, `Math.random()`) rendered into server HTML.
  - Solution: Move logic into `useEffect` or dynamically import with `ssr: false`.
- **Supabase / PostgreSQL Issues**:
  - Check if `DATABASE_URL` is configured in `.env.local`.
  - Check connection pooling port: Port 6543 requires `prepare: false` in postgres-js.
  - Check if SSL is required (`ssl: 'require'`).
  - Run `pnpm db:verify` to isolate network/auth issues from application query issues.
- **Three.js / WebGL Crashes**:
  - Check whether Canvas is wrapped with Suspense fallback.
  - Inspect texture dimensions (powers of 2 preferred) and model loader paths (`/models/...`).
  - Verify WebGL context cleanup in `useEffect` returns.

### Phase 3: Resolution & Regression Prevention

1. Apply the minimal effective fix.
2. Verify with `pnpm type-check` and `pnpm build`.
3. Test edge cases (e.g. empty states, network disconnection, unauthenticated state).
