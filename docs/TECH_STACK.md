# NASA Space Apps — Technology Stack Manifest

This document records every approved dependency, its verified installed version, architectural responsibility, and technical rationale.

---

## 1. Application Framework & Core Runtime

| Package          | Installed Version | Primary Responsibility            | Technical Justification                                                          |
| :--------------- | :---------------- | :-------------------------------- | :------------------------------------------------------------------------------- |
| **`next`**       | `15.5.29`         | Full-stack framework & App Router | React Server Components, high performance SSR, streaming, and Route Handlers.    |
| **`react`**      | `19.3.1`          | Core UI library                   | Modern concurrent rendering, actions, and seamless RSC integration.              |
| **`react-dom`**  | `19.3.1`          | DOM renderer for React            | Required DOM bindings for React 19.                                              |
| **`typescript`** | `5.9.3`           | Type system                       | Strict type-checking, preventing runtime type errors across complex data models. |

---

## 2. Styling & UI Design System

| Package                        | Installed Version | Primary Responsibility             | Technical Justification                                                                      |
| :----------------------------- | :---------------- | :--------------------------------- | :------------------------------------------------------------------------------------------- |
| **`tailwindcss`**              | `4.3.5`           | Utility-first styling framework    | Modern CSS-first architecture (`@theme inline`), OKLCH color support, zero-runtime overhead. |
| **`@tailwindcss/postcss`**     | `4.3.5`           | PostCSS plugin for Tailwind 4      | Required build-time CSS compilation for Tailwind v4 in Next.js.                              |
| **`postcss`**                  | `8.5.32`          | CSS transformer                    | Required build tool for modern CSS pipelines.                                                |
| **`clsx`**                     | `2.1.1`           | Conditional className utility      | Fast class string construction.                                                              |
| **`tailwind-merge`**           | `3.7.0`           | Tailwind class conflict resolution | Prevents specificity collisions when overriding shadcn component classes.                    |
| **`class-variance-authority`** | `0.7.1`           | Component variant management       | Type-safe variant prop mappings for design system components (buttons, badges).              |
| **`lucide-react`**             | `1.72.0`          | Icon system                        | Clean, lightweight SVG iconography with tree-shaking support.                                |

---

## 3. Animation, Cinematics & 3D WebGL

| Package                  | Installed Version | Primary Responsibility           | Technical Justification                                                                |
| :----------------------- | :---------------- | :------------------------------- | :------------------------------------------------------------------------------------- |
| **`gsap`**               | `3.15.1`          | Animation timelines & sequencing | Industry-standard timeline engine for complex storytelling choreographies.             |
| **`@gsap/react`**        | `2.1.2`           | React integration for GSAP       | Provides `useGSAP` hook for automatic scoping, context cleanup, and React 19 safety.   |
| **`lenis`**              | `1.3.27`          | Smooth scroll infrastructure     | Modern momentum scrolling engine integrated with GSAP ScrollTrigger ticker.            |
| **`three`**              | `0.173.0`         | 3D WebGL graphics library        | Hardware-accelerated 3D rendering for planets, space probes, and trajectories.         |
| **`@react-three/fiber`** | `9.8.2`           | React reconciler for Three.js    | Declarative, component-based Three.js scene graphs fully compatible with React 19.     |
| **`@react-three/drei`**  | `10.7.9`          | Three.js helper abstractions     | Camera controls, environment maps, loaders, and shader helpers compatible with R3F v9. |

---

## 4. State Management & Data Fetching

| Package                     | Installed Version | Primary Responsibility       | Technical Justification                                                                |
| :-------------------------- | :---------------- | :--------------------------- | :------------------------------------------------------------------------------------- |
| **`@tanstack/react-query`** | `5.107.1`         | Server state synchronization | Caching, deduplication, background refetching, and optimistic updates.                 |
| **`zustand`**               | `5.1.0`           | Global client UI state       | Minimalist, unopinionated client store with zero boilerplate and hook-based selectors. |
| **`zod`**                   | `3.25.76`         | Runtime validation           | Type-safe schema validation for environment variables, API inputs, and outputs.        |

---

## 5. Backend, Authentication & Database

| Package                     | Installed Version | Primary Responsibility            | Technical Justification                                                                           |
| :-------------------------- | :---------------- | :-------------------------------- | :------------------------------------------------------------------------------------------------ |
| **`@supabase/supabase-js`** | `2.119.0`         | Official Supabase SDK             | Authentication, user management, and Supabase client access.                                      |
| **`@supabase/ssr`**         | `0.12.7`          | Next.js App Router SSR adapter    | Cookie-based session handling, token rotation, and middleware integration.                        |
| **`drizzle-orm`**           | `0.45.4`          | TypeScript ORM                    | Zero-overhead, lightweight SQL builder with full type inference and automated migrations.         |
| **`postgres`**              | `3.4.9`           | PostgreSQL client (`postgres-js`) | High-performance PostgreSQL driver supporting Supavisor transaction poolers via `prepare: false`. |
| **`server-only`**           | `0.0.1`           | Build-time module barrier         | Prevents server-only database code from leaking into client bundles.                              |

---

## 6. Developer Tooling & Quality Assurance

| Package                           | Installed Version | Primary Responsibility         | Technical Justification                                                                      |
| :-------------------------------- | :---------------- | :----------------------------- | :------------------------------------------------------------------------------------------- |
| **`vitest`**                      | `5.1.0`           | Unit and integration runner    | High-performance Vite-native test runner with ESM and React 19 support.                      |
| **`@testing-library/react`**      | `16.3.3`          | React component testing        | User-centric testing primitives for accessible UI behaviors.                                  |
| **`@testing-library/jest-dom`**   | `7.0.1`           | Custom DOM matchers            | Declarative DOM assertions (`toBeInTheDocument`, `toHaveAttribute`).                         |
| **`jsdom`**                       | `31.0.0`          | Headless browser environment   | In-memory DOM emulation for fast unit testing execution.                                      |
| **`@vitejs/plugin-react`**        | `6.3.0`           | React Fast Refresh & JSX plugin| Compiles JSX and React components inside Vitest runner.                                       |
| **`drizzle-kit`**                 | `0.30.6`          | Schema migration CLI           | Automated SQL migration generation, schema push, and database studio.                        |
| **`eslint`**                      | `9.39.5`          | Code quality linter            | Enforces code quality and catches runtime anti-patterns.                                     |
| **`eslint-config-next`**          | `15.5.29`         | Next.js specific linting rules | Validates App Router conventions, Core Web Vitals, and React hook rules.                     |
| **`prettier`**                    | `3.10.1`          | Opinionated code formatter     | Consistent formatting across all files.                                                      |
| **`prettier-plugin-tailwindcss`** | `0.6.14`          | Tailwind class sorter          | Automatically sorts Tailwind utility classes into standard order.                            |
| **`tsx`**                         | `4.23.15`         | TypeScript execution runtime   | Executes standalone verification scripts (e.g. `pnpm db:verify`) without manual compilation. |
| **`dotenv`**                      | `16.6.1`          | Environment loader             | Loads `.env.local` for standalone tooling scripts and Drizzle Kit.                           |
