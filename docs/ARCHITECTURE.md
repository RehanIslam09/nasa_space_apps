# NASA Space Apps — System Architecture

```mermaid
flowchart TD
    subgraph Layer1["1. Presentation Layer (Browser & SSR)"]
        RSC["React Server Components (Next.js App Router)"]
        RCC["Client Components ('use client')"]
        GSAPEngine["GSAP + ScrollTrigger + Lenis"]
        ThreeCanvas["React Three Fiber (CanvasContainer) + Drei"]
        TailwindTheme["Tailwind CSS 4 + shadcn/ui"]

        RSC --> RCC
        RCC --> GSAPEngine
        RCC --> ThreeCanvas
        RCC --> TailwindTheme
    end

    subgraph Layer2["2. Backend & Application Services Layer"]
        RouteHandlers["Next.js Route Handlers (/api/*)"]
        AuthMiddleware["Session Middleware (middleware.ts)"]
        QueryCache["TanStack Query (Client-side Cache)"]
        AppState["Zustand Store (useAppStore)"]
        Validation["Zod Validation (env.ts & api schemas)"]

        RCC --> QueryCache
        RCC --> AppState
        QueryCache --> RouteHandlers
        AuthMiddleware --> RouteHandlers
        RouteHandlers --> Validation
    end

    subgraph Layer3["3. Data & Persistence Infrastructure"]
        SupabaseAuth["Supabase Auth / GoTrue"]
        SupabaseSSR["Supabase SSR Client (@supabase/ssr)"]
        Drizzle["Drizzle ORM (drizzle-orm/postgres-js)"]
        PgPooler["Supavisor Transaction Pooler (Port 6543)"]
        PostgresDB["Supabase Managed PostgreSQL Instance"]

        RouteHandlers --> SupabaseSSR
        SupabaseSSR --> SupabaseAuth
        RouteHandlers --> Drizzle
        Drizzle -->|prepare: false| PgPooler
        PgPooler --> PostgresDB
    end
```

---

## Layer 1: Presentation Layer

- **Framework**: Next.js 15 App Router running React 19.
- **Rendering Strategy**: Server Components by default for zero client JavaScript overhead; selective Client Components (`'use client'`) for interactive controls, state subscriptions, and WebGL rendering.
- **Styling**: Tailwind CSS 4 utilizing CSS-first `@theme inline` variables with OKLCH color spaces.
- **Cinematic Engine**: GSAP timelines synchronized with Lenis smooth scrolling and ScrollTrigger pinning/scrubbing.
- **3D Graphics**: Three.js and `@react-three/fiber@^9.0` with lazy-loaded dynamic imports (`ssr: false`) to safeguard server rendering.

## Layer 2: Application Services Layer

- **API Routing**: Next.js Route Handlers (`src/app/api/`) providing RESTful endpoints.
- **Session Middleware**: Edge/Node middleware (`middleware.ts`) proxying cookies and updating Supabase authentication sessions seamlessly.
- **Server State Management**: `@tanstack/react-query` managing caching, deduplication, and stale-while-revalidate lifecycle.
- **Client State Management**: `zustand` managing lightweight UI controls (audio mute, graphics fidelity, active sections).
- **Validation**: `zod` validating environment variables, API payloads, and query parameters at boundaries.

## Layer 3: Data Infrastructure Layer

- **Authentication**: Supabase Auth handling user sign-up, sign-in, token refresh, and Row Level Security context.
- **Relational Storage**: PostgreSQL hosted on Supabase.
- **ORM & Migrations**: Drizzle ORM (`drizzle-orm` + `drizzle-kit`).
- **Connection Strategy**:
  - _Runtime Queries_: postgres-js connecting to Supavisor Transaction Pooler on port 6543 with `{ prepare: false }`.
  - _Schema Migrations_: Direct / Session connection on port 5432 (`DIRECT_URL`).
  - _Server Isolation_: Database modules protected with `import 'server-only'`.
