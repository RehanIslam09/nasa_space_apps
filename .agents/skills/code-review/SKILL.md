---
name: code-review
description: Comprehensive quality, security, and performance review checklist.
---

# Code Review Skill Guide

## Purpose

Ensures that all code contributed to the NASA Space Apps platform satisfies strict standards for security, architectural integrity, and performance.

## Review Checklist

### 1. Architectural Integrity

- [ ] Are server/client component boundaries respected?
- [ ] Are heavy 3D and animation components isolated to client rendering?
- [ ] Does the implementation avoid introducing unauthorized libraries or competing frameworks?
- [ ] Are state responsibilities properly partitioned (React Query for server state, Zustand for client state)?

### 2. TypeScript & Type Safety

- [ ] Is TypeScript strict mode preserved without `@ts-ignore` or `any`?
- [ ] Are API route responses and request payloads typed and validated with Zod?
- [ ] Are database models inferred from Drizzle schemas rather than manually duplicated?

### 3. Security & Credentials

- [ ] Are database credentials, service role keys, and private tokens kept server-only?
- [ ] Is there zero exposure of private keys via `NEXT_PUBLIC_` variables?
- [ ] Are all external inputs sanitized and validated at boundaries?
- [ ] Is database client code protected by `import 'server-only'`?

### 4. Performance & Resource Management

- [ ] Are GSAP animations scoped using `useGSAP` to prevent memory leaks?
- [ ] Are Three.js textures, geometries, and animation frames cleaned up on unmount?
- [ ] Is Lenis smooth scroll ticker properly detached in `useEffect` cleanup?
- [ ] Does the change avoid causing unnecessary full-page client bundle inflation?

### 5. Verification & Testing

- [ ] Does `pnpm type-check` pass with zero errors?
- [ ] Does `pnpm lint` pass with zero warnings?
- [ ] Does `pnpm build` compile successfully?
- [ ] Are documentation files updated (`docs/TASKS.md`, `docs/HANDOFF.md`)?
