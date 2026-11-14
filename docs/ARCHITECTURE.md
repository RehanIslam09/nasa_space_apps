# NASA Space Apps — System Architecture (Physical Separation)

```mermaid
flowchart TD
    subgraph FrontendApp["1. Frontend Workspace: frontend/ (Developer A Owned)"]
        RSC["React Server Components (Next.js 15 App Router)"]
        RCC["Client Components ('use client')"]
        GSAPEngine["GSAP + ScrollTrigger + Lenis"]
        ThreeCanvas["React Three Fiber (CanvasContainer) + Drei"]
        TailwindTheme["Tailwind CSS 4 + shadcn/ui"]
        FrontendServices["Frontend Domain Services (frontend/src/services/api/)"]
        MockEngine["Mock Fixtures & Latency Simulator"]
        FrameworkRoutes["Next.js Route Handlers (/api/health, /api/auth/callback)"]
        EdgeMiddleware["Next.js Edge Middleware (middleware.ts)"]

        RSC --> RCC
        RCC --> GSAPEngine
        RCC --> ThreeCanvas
        RCC --> TailwindTheme
        RCC --> FrontendServices
        FrontendServices -.->|Mock Mode: NEXT_PUBLIC_API_MOCK=true| MockEngine
        FrontendServices -.->|Real Mode: HTTP/Fetch| FrameworkRoutes
        EdgeMiddleware --> FrameworkRoutes
    end

    subgraph ContractPkg["2. Shared Contracts Workspace: packages/contracts/ (RFC Governed)"]
        ContractSchemas["Zod Schemas & Inferred Types (@nasa-experience/contracts)"]
        ResponseEnvelopes["Standardized Envelope (ApiResponse<T>)"]
        ErrorCatalog["Standard Error Codes & Status Mappings"]

        FrontendServices --> ContractSchemas
        FrameworkRoutes --> ContractSchemas
    end

    subgraph BackendPkg["3. Backend Workspace: backend/ (Developer B Owned)"]
        BackendServices["Backend Domain Services (backend/services/)"]
        Repositories["Drizzle Data Access Repositories (backend/database/repositories/)"]
        DrizzleClient["Drizzle Singleton Client (backend/database/client.ts)"]
        VerifyProbe["Live Database Probe (backend/database/verify.ts)"]
        SupabaseConfig["Supabase RLS & Storage Config (backend/supabase/config/)"]

        FrameworkRoutes -.->|Server-Only Workspace Import| BackendServices
        BackendServices --> Repositories
        Repositories --> DrizzleClient
    end

    subgraph DataInfra["4. Supabase Infrastructure Layer (Managed Cloud)"]
        SupabaseAuth["Supabase Auth / GoTrue"]
        PgPooler["Supavisor Transaction Pooler (Port 6543)"]
        PostgresDB["Supabase Managed PostgreSQL 17.11"]

        EdgeMiddleware --> SupabaseAuth
        DrizzleClient -->|prepare: false| PgPooler
        PgPooler --> PostgresDB
    end
```

---

## 1. Physical Workspace Structure

1. **`frontend/`** (Developer A):
   - Standalone Next.js 15 application.
   - Runs on port 3000 (`pnpm dev`).
   - Completely functional with offline mock data (`NEXT_PUBLIC_API_MOCK=true`).
2. **`backend/`** (Developer B):
   - Supabase database schemas, Drizzle migrations, and backend services.
   - Verified live database probe (`pnpm db:verify`).
   - No Express or custom HTTP server required; Supabase handles backend infrastructure.
3. **`packages/contracts/`** (Shared):
   - Published as workspace package `@nasa-experience/contracts`.
   - Zod schemas and TypeScript types consumed by both `frontend/` and `backend/`.

---

## 2. Environment Variables & Credentials

- Root `.env` and `.env.local` are preserved byte-for-byte at the root.
- `frontend/next.config.ts` and `backend/config/env.ts` safely load root environment files via `dotenv` with `.env.local` taking precedence.
- Sensitive credentials (`DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) are never exposed to browser bundles.
