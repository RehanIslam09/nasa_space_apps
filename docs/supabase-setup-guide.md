# Supabase & PostgreSQL Configuration Guide

This guide walks through configuring your Supabase project to work with the NASA Space Apps platform.

---

## 1. Project Creation

1. Navigate to the [Supabase Dashboard](https://supabase.com/dashboard).
2. Click **New Project** and select your organization.
3. Name your project (e.g. `nasa-space-apps-2026`).
4. Generate or enter a secure database password. **Save this password securely**.
5. Select a region closest to your primary target audience.

---

## 2. Retrieve Client API Credentials

1. Go to **Project Settings** > **API**.
2. Copy the **Project URL** (`https://<project-ref>.supabase.co`).
3. Copy the **anon / public** key.
4. Set these in `.env.local`:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
   ```

---

## 3. Retrieve Database Connection Strings

### A. Runtime Connection (Supavisor Transaction Pooler — Port 6543)

1. Go to **Database** > **Connection Pooling**.
2. Select **Connection string** > **URI**.
3. Choose **Mode**: `Transaction` (Port `6543`).
4. Replace `[YOUR-PASSWORD]` with your database password.
5. Set as `DATABASE_URL` in `.env.local`:
   ```bash
   DATABASE_URL=postgresql://postgres.<project-ref>:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```
   _Note: Our Drizzle client automatically configures `prepare: false` to ensure seamless compatibility with Supavisor transaction pooling._

### B. Migration Connection (Direct / Session Mode — Port 5432)

1. In the same view, switch **Mode** to `Session` or select **Direct connection** (Port `5432`).
2. Set as `DIRECT_URL` in `.env.local`:
   ```bash
   DIRECT_URL=postgresql://postgres:[PASSWORD]@db.<project-ref>.supabase.co:5432/postgres
   ```

---

## 4. Run Connectivity Verification

Once configured, execute:

```bash
pnpm db:verify
```

The script will establish a connection, execute a query probe, and report roundtrip latency and server engine details.
