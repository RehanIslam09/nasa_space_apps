# NASA Space Apps — Experience Platform

> Production-ready engineering foundation built for the NASA Space Apps Hackathon.

---

## Architecture Overview

This platform uses a strictly decoupled three-layer architecture:

1. **Presentation Layer**: Next.js 15 App Router, React 19, Tailwind CSS 4, GSAP 3 with ScrollTrigger, Lenis smooth scrolling, and Three.js with React Three Fiber v9.
2. **Application Services Layer**: Next.js Route Handlers, TanStack Query v5, Zustand v5, Zod runtime validation, and Supabase SSR authentication middleware.
3. **Data Infrastructure Layer**: Supabase PostgreSQL, Drizzle ORM, postgres-js with connection pooler support.

---

## Quickstart

### Prerequisites

- Node.js `v20+` or `v24+` (tested on `v24.20.0`)
- pnpm `v10+` or `v12+` (tested on `v12.8.1`)
- Git

### Installation

From the `workspace/nasa_experience/` directory:

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## Configuration

Copy `.env.example` to `.env.local` and populate credentials:

```bash
cp .env.example .env.local
```

Refer to `docs/supabase-setup-guide.md` for instructions on retrieving Supabase keys and database connection strings.

---

## Verification & Quality Assurance

Run the automated quality assurance suite:

```bash
# Type checking (TypeScript Strict Mode)
pnpm type-check

# Linting
pnpm lint

# Code formatting check
pnpm format:check

# Production build
pnpm build

# Database connectivity test
pnpm db:verify
```

---

## Project Structure

```
nasa_experience/
├── .agents/          # AI development workflows, rules, and skills
├── docs/             # Technical specifications, architecture, decisions, and tasks
├── public/           # Static 3D models, textures, audio, and sequences
├── src/
│   ├── app/          # Next.js App Router (pages, layouts, route handlers)
│   ├── components/   # UI components (shadcn/ui), layouts, navigation
│   ├── experiences/  # 3D WebGL scenes, shaders, GSAP cinematics
│   ├── features/     # Problem statement domain features
│   ├── hooks/        # Custom React hooks (useGSAP, useLenis)
│   ├── lib/          # Core libraries (Supabase, Drizzle, React Query, Zod)
│   ├── stores/       # Zustand client stores
│   └── styles/       # Styling tokens
└── drizzle.config.ts # Drizzle Kit configuration
```
