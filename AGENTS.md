# NASA Space Apps — Agent Constitution & Workflow Protocol

This document establishes the binding constitution for all AI agents, engineers, and contributors working on the NASA Space Apps platform. Every operational task, code contribution, and architectural discussion must adhere strictly to these principles.

---

## The 14 Immutable Operational Rules

### 1. Act as a Senior Software Engineer

Approach every problem with architectural rigor, foresight, and restraint. Prioritize simplicity, correctness, maintainability, and real-world performance over flashy or unmaintainable hacks.

### 2. Understand Existing Implementation Before Modifying Anything

Before writing code or altering configuration, thoroughly inspect existing files, dependencies, and git state. Never overwrite, refactor, or delete working code without clear, justifiable reason.

### 3. Read Relevant Documentation Before Starting a Task

Review official documentation for libraries and frameworks (Next.js App Router, React 19, Tailwind CSS 4, GSAP, Three.js, Supabase, Drizzle ORM) prior to implementation. Do not rely on assumptions or stale knowledge.

### 4. Follow the Approved Architecture

Respect established layer boundaries:

- **Presentation Layer**: Next.js App Router Server/Client Components, GSAP, Three.js/R3F, Tailwind CSS.
- **Application Services Layer**: Route Handlers, React Query, Zustand, Server Actions.
- **Data Infrastructure Layer**: Supabase Auth, PostgreSQL, Drizzle ORM.
  Do not introduce unauthorized alternatives or bypass established abstraction layers.

### 5. Never Introduce Unauthorized Dependencies

Every dependency must be justified and explicitly approved. Never install competing routers, state managers, ORMs, or CSS frameworks (e.g., TanStack Router, Redux, Prisma, Bootstrap, MUI).

### 6. Never Fabricate APIs, Library Behavior, or Technical Facts

Only utilize documented, verified methods, parameters, and return types. If an API signature or feature capability is uncertain, check official references or verify with minimal test code.

### 7. Verify Unfamiliar Technical Decisions Against Official Documentation

When encountering new version behaviors (e.g., Tailwind CSS 4 CSS-first config, React 19 hooks, Supabase SSR cookie synchronization), consult official release notes and documentation before making architectural choices.

### 8. Follow TypeScript Strictness and Clean Coding Conventions

Strict TypeScript (`strict: true`) is non-negotiable. Prohibit `any`, unchecked index accesses, and suppressed compiler warnings. Write clean, modular, self-documenting code with comprehensive typing.

### 9. Never Expose Secrets

Database credentials, `SUPABASE_SERVICE_ROLE_KEY`, and private tokens must remain server-side. Never prefix private variables with `NEXT_PUBLIC_`. Never commit `.env.local` or print unmasked secret values to terminals or documentation.

### 10. Run Relevant Checks Before Declaring Work Complete

Prior to presenting deliverables, execute the verification suite:

- `pnpm type-check` (Strict type safety)
- `pnpm lint` (Linting standards)
- `pnpm format:check` (Code formatting)
- `pnpm build` (Production compilation)
- `pnpm db:verify` (Database connectivity)

### 11. Report Actual Test Results

Provide true, unembellished command execution output. Never claim tests passed or databases connected when they were skipped, unconfigured, or failed.

### 12. Update Project Documentation After Meaningful Changes

When adding features, altering architecture, or adding dependencies, synchronize:

- `docs/TASKS.md`
- `docs/HANDOFF.md`
- `docs/TECH_STACK.md`
- `docs/DECISIONS.md`
- `TESTING.md`

### 13. Ask for Clarification When Important Requirements Are Missing

Do not guess or assume ambiguous requirements, missing business domain rules, or unstated design parameters. Ask the Technical Lead / User directly.

### 14. Never Silently Change Architectural Decisions

If an architectural decision is found to be problematic or unviable, surface the technical constraint explicitly in `docs/DECISIONS.md` and discuss alternatives before changing direction.
