# Security & Credential Management Policy

## 1. Zero Secret Exposure

- **Never Prefix Secrets with `NEXT_PUBLIC_`**:
  - `DATABASE_URL`, `DIRECT_URL`, and `SUPABASE_SERVICE_ROLE_KEY` must NEVER carry the `NEXT_PUBLIC_` prefix.
  - Prefixing with `NEXT_PUBLIC_` bakes the value directly into the public client JavaScript bundle delivered to browsers.
- **Server-Only Enforcement**:
  - All database client code (`src/lib/db/client.ts`) must import `'server-only'` to cause a compile-time build failure if inadvertently imported into a client component.
- **Git Protection**:
  - Never commit `.env`, `.env.local`, or any `.env*.local` file.
  - The `.gitignore` must strictly exclude all environment files except `.env.example`.

## 2. Supabase Authentication & RLS

- **Row Level Security (RLS)**:
  - Every PostgreSQL table created in Supabase must have RLS enabled (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`).
  - Access policies must restrict read/write access based on `auth.uid()`.
- **Session Verification in Next.js**:
  - Do not rely on unverified client-side session state for protected route access.
  - Always verify the user on the server using `supabase.auth.getUser()` in server components, route handlers, or middleware.

## 3. Sanitized Logging & Diagnostics

- When printing connection strings or diagnosing database failures, always mask passwords and sensitive URI components (e.g., `postgres://user:********@host:6543/db`).
- Never log full JWT tokens, session keys, or personal identifiable information (PII) to stdout or client consoles.
