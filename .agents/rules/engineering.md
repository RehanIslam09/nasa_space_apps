# Engineering Conventions & Standards

## 1. Code Quality & Architecture

- **Single Responsibility Principle**: Each module, function, and component must have a single, well-defined purpose.
- **Strict TypeScript**: Never use `any`. Explicitly type function parameters, return signatures, and generic types. Use discriminated unions for complex states.
- **Fail-Fast Error Handling**: Validate inputs at boundary layers using Zod schemas. Throw clear, descriptive errors with actionable remedies.
- **Modular Directory Organization**:
  - `src/features/`: Domain-specific business logic and multi-component features.
  - `src/components/ui/`: Reusable, atomic UI components (shadcn/ui style).
  - `src/components/layouts/`: Structural scaffolding and page shells.
  - `src/lib/`: Low-level integrations, third-party adapters, and utility helpers.
  - `src/stores/`: Zustand client state stores.
  - `src/hooks/`: Reusable custom React hooks.
  - `src/experiences/`: 3D WebGL, GSAP timelines, and shader rendering.

## 2. File & Naming Conventions

- **Files & Folders**: `kebab-case` for all directories and files (e.g., `canvas-container.tsx`, `use-lenis.ts`).
- **Components**: `PascalCase` for React component functions (e.g., `CanvasContainer`).
- **Hooks**: `camelCase` starting with `use` (e.g., `useGSAPTimeline`).
- **Constants**: `UPPER_SNAKE_CASE` for global immutable constants.

## 3. Asynchronous Code & Error Boundaries

- Always wrap external API calls, database operations, and Supabase requests in `try/catch` blocks.
- Ensure resources (event listeners, WebGL contexts, GSAP tickers, database connections) are reliably cleaned up in `finally` blocks or `useEffect` return functions.
- Never swallow errors silently or return empty fallback data without logging.
