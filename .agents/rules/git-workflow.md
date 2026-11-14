# Git Workflow & Pull Request Governance

This document establishes the Git branching, synchronization, and Pull Request (PR) rules for parallel development.

---

## 1. Branch Naming Conventions

- **Main Branch**: `main` (Production-ready, stable, passing all quality gates).
- **Integration Branches**: `integration/cycle-<N>` (Explicit staging branch for synchronizing frontend and backend feature work).
- **Frontend Feature Branches**: `frontend/<feature-name>` (Branched from latest `integration` or `main`).
- **Backend Feature Branches**: `backend/<feature-name>` (Branched from latest `integration` or `main`).

---

## 2. The 3-Prompt Development Cycle

Work is planned in cycles consisting of three focused prompts per developer, followed by an integration phase:

### Cycle N: Independent Parallel Feature Work

- **Frontend Developer** (working on `frontend/<feature>`):
  - _Prompt 1_: Define or consume contract, build domain service mock, scaffold UI route/shell.
  - _Prompt 2_: Build interactive UI components and state integration.
  - _Prompt 3_: Add GSAP animations, 3D canvases, error states, and frontend unit tests.
- **Backend Developer** (working on `backend/<feature>`):
  - _Prompt 1_: Define Drizzle tables, generate migrations, test connection.
  - _Prompt 2_: Implement backend domain business logic service and unit tests.
  - _Prompt 3_: Implement Next.js Route Handler, input validation, and API tests.

> [!IMPORTANT]
> The three-prompt convention is a planning cadence to ensure bite-sized, verifiable increments. It is NEVER an excuse to bundle unrelated work, skip tests, or bypass code reviews.

---

## 3. Pull Request Standards

Every PR must satisfy:

1. **Strict File Scope**:
   - Frontend PRs touch ONLY frontend-owned files.
   - Backend PRs touch ONLY backend-owned files.
2. **Zero Credentials**: No secrets or private tokens in diffs.
3. **Passing Verification**:
   - `pnpm boundary:check` (Zero import boundary violations).
   - `pnpm type-check` (Zero TypeScript compiler errors).
   - `pnpm format:check` (100% Prettier compliant).
   - Respective test suites pass (`pnpm test:frontend` or `pnpm test:backend`).
4. **No Direct Commits to `main`**: All changes merge through PRs.

---

## 4. Integration & Merge Protocol

When both frontend and backend PRs for a cycle are ready:

1. Create branch `integration/cycle-<N>`.
2. Merge `frontend/<feature>` into `integration/cycle-<N>`.
3. Merge `backend/<feature>` into `integration/cycle-<N>`.
4. Switch frontend API client to real mode (`NEXT_PUBLIC_API_MOCK=false`).
5. Run full integration verification:
   ```bash
   pnpm test:all
   pnpm test:integration
   pnpm build
   pnpm db:verify
   ```
6. Open PR from `integration/cycle-<N>` into `main`.
7. Once merged into `main`, delete feature branches and tag the release.
