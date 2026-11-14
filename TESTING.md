# NASA Space Apps — Verification & Testing Protocol

This document outlines the testing strategy, performance targets, and verification runbooks for the NASA Space Apps platform.

---

## 1. Performance Foundation Targets

The platform is designed to achieve the following performance targets:

- **Frame Rate**: Stable 60 FPS target for all GSAP and 3D WebGL scenes.
- **Largest Contentful Paint (LCP)**: $\le 2.5\text{s}$.
- **Interaction to Next Paint (INP)**: $\le 200\text{ms}$.
- **Cumulative Layout Shift (CLS)**: $\le 0.1$.
- **Initial Shared JavaScript**: Minimal footprint (measured at 102 kB on base build).
- **WebGL Lazy Loading**: 3D canvases must not be initialized until required in viewport.

---

## 2. Verification Suite Commands

Execute all checks sequentially before submitting or reviewing any changes:

### A. TypeScript Type Check

```bash
pnpm type-check
```

- **Tool**: TypeScript Compiler (`tsc --noEmit`).
- **Standard**: Zero errors under `strict: true`, `noImplicitAny: true`, and `noUnusedLocals: true`.

### B. Unit & Integration Tests

```bash
pnpm test
```

- **Tool**: Vitest runner with React Testing Library and JSDOM.
- **Standard**: 100% passing across utility functions, environment validation, API response schemas, and accessible UI components.

### C. Linting

```bash
pnpm lint
```

- **Tool**: ESLint with Next.js Core Web Vitals plugin.
- **Standard**: Zero warnings, zero errors.

### D. Formatting Check

```bash
pnpm format:check
```

- **Tool**: Prettier with `prettier-plugin-tailwindcss`.
- **Remediation**: Run `pnpm format` to auto-format if formatting check fails.

### E. Production Build

```bash
pnpm build
```

- **Tool**: Next.js Production Compiler.
- **Standard**: Generates static pages and dynamic route handlers without runtime SSR errors or bundle warnings.

### F. Database Connectivity Check

```bash
pnpm db:verify
```

- **Tool**: Custom standalone probe using `tsx` and `postgres-js`.
- **Behavior**:
  - If `DATABASE_URL` is configured: Executes real SQL query against PostgreSQL instance and verifies Drizzle ORM communication.
  - If `DATABASE_URL` is unconfigured: Safely logs missing configuration instructions without crashing.
