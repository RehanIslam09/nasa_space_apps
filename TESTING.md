# NASA Space Apps — Verification & Testing Protocol

This document outlines the testing strategy, performance targets, independent test runners, and verification runbooks for the physical monorepo structure.

---

## 1. Performance Foundation Targets

The platform is designed to achieve the following performance targets:

- **Frame Rate**: Stable 60 FPS target for all GSAP and 3D WebGL scenes.
- **Largest Contentful Paint (LCP)**: $\le 2.5\text{s}$.
- **Interaction to Next Paint (INP)**: $\le 200\text{ms}$.
- **Cumulative Layout Shift (CLS)**: $\le 0.1$.
- **Initial Shared JavaScript**: Minimal footprint (102 kB on production build).
- **WebGL Lazy Loading**: 3D canvases must not be initialized until required in viewport.

---

## 2. Independent Test Commands by Workspace

### A. Shared Contract Suite (`packages/contracts/`)

Validates that all contract schemas parse valid payloads and reject invalid shapes:

```bash
pnpm test:contract
```

### B. Backend Developer Suite (`backend/`)

Executes domain services, repository queries, and database verification:

```bash
# Run backend tests
pnpm test:backend

# Verify live PostgreSQL connectivity
pnpm db:verify
```

### C. Frontend Developer Suite (`frontend/`)

Executes UI components, hooks, stores, and frontend mock client services:

```bash
pnpm test:frontend
```

---

## 3. Mandatory Quality Gate Runbook

Before submitting or reviewing any Pull Request, execute the full quality suite:

```bash
# 1. Architectural Boundary Enforcement
pnpm boundary:check

# 2. Strict TypeScript Type Check across all packages
pnpm type-check

# 3. Code Formatting Verification
pnpm format:check

# 4. Comprehensive Test Suite
pnpm test:all

# 5. Next.js Production Build Compilation
pnpm build

# 6. Database Connectivity Check
pnpm db:verify
```
