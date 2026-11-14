# Verification & Quality Assurance Policy

## 1. Mandatory Quality Gates

Before any task or phase is marked complete, the following commands must be executed in order:

1. **Type Checking**:

   ```bash
   pnpm type-check
   ```

   Must pass with zero TypeScript errors under strict mode (`tsc --noEmit`).

2. **Linting**:

   ```bash
   pnpm lint
   ```

   Must pass with zero warnings or errors.

3. **Formatting Verification**:

   ```bash
   pnpm format:check
   ```

   Must verify that all files conform to Prettier code formatting rules.

4. **Production Build**:

   ```bash
   pnpm build
   ```

   Next.js must successfully compile both static and dynamic routes with zero SSR or bundling errors.

5. **Database Verification (When Credentials Are Available)**:
   ```bash
   pnpm db:verify
   ```
   Must verify real host reachability, authentication, and SQL execution against Supabase PostgreSQL.

## 2. Zero Suppression Policy

- Never use `@ts-ignore` or `@ts-nocheck` to bypass type checks. Fix the underlying type signature or use proper narrowing/type guards.
- Never use `eslint-disable` without explicit authorization and documented justification.
- Never mock or fabricate test outputs. Always report real command exits and output logs.
