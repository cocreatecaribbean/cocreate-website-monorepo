# Supabase + Prisma database setup

Co-Create uses **Supabase** (PostgreSQL) with **Prisma 7** and **Supavisor** connection pooling.

## Where to verify pooling in Supabase

1. Open your project in the [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to **Project Settings → Database**.
3. Under **Connection string**, choose:
   - **URI** tab for the direct (non-pooling) string — port **5432**
   - **Connection pooling** tab for Supavisor — port **6543**
4. Go to **Project Settings → Database → Connection pooling** to confirm:
   - Pool mode: **Transaction** (recommended for Prisma + NestJS)
   - **Pool size** — align NestJS `pg` pool `max` with Supabase limits
5. In **Reports → Database**, watch active connections during load tests.

Supavisor terminates idle connections; keep `pg.Pool` `max` conservative (e.g. `10`) per API instance.

---

## Environment variables

| Variable | Purpose | Supabase source |
|----------|---------|-----------------|
| `DATABASE_URL` | **Runtime** — NestJS API | Pooling URI (port **6543**, `?pgbouncer=true`) |
| `DIRECT_URL` | **Migrations** — `db:push` / `db:migrate` | Direct URI (port **5432**) |

### Example `.env` (Supabase)

```bash
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10"
DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
SUPABASE_URL="https://[PROJECT-REF].supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJ..."
```

### Storage: project attachments

Create a **private** bucket named `project-attachments` in **Storage** (Supabase Dashboard). The API uploads via signed URLs using `SUPABASE_SERVICE_ROLE_KEY`. No public RLS policies are required for v1 — access is mediated by the Nest API.

### Storage: admin avatars

Create a **private** bucket named `admin-avatars` for profile photos (Admin Center and Client Portal). Paths:

- `admin/{userId}/{uuid}-filename` — agency admins
- `client/{userId}/{uuid}-filename` — client portal users

Upload and display are mediated by the Nest API (`POST/PATCH/DELETE /auth/admin/profile/avatar/*` and `/client-portal/profile/avatar/*`).

### Storage: client logos

Create a **public** bucket named `client-logos` for organization logos. Paths: `logos/{uuid}-filename`. Upload is via signed URL; the API stores the public URL on `Organization.logoUrl` (`POST/PATCH/DELETE /admin/clients/:organizationId/logo/*` and `/client-portal/organization/logo/*`).

### Local Docker

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/cocreate?schema=public"
```

---

## Workflow

```bash
pnpm db:generate
pnpm db:push
pnpm --filter @cocreate/api dev
```

Admin client APIs: `POST /admin/clients/invite`, `GET /admin/clients`.

### Soft delete and tenant scoping

Core tenant entities (`Organization`, `User`, `ClientProject`) include optional `deletedAt`. The Nest API Prisma client extension excludes soft-deleted rows from read queries by default.

Client-portal requests set an AsyncLocalStorage tenant context; Prisma auto-scopes `organizationId` on tenant-scoped models during those requests as a defense-in-depth guard (see `apps/api/src/prisma/`).

## Supabase Auth env (all apps)

| App | Variables |
|-----|-----------|
| `apps/api` | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_CENTER_URL` |
| `apps/admin-center` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_URL` |
| `apps/client-portal` | Same public Supabase + API URL vars |

## First admin user

```bash
pnpm --filter @cocreate/database seed:admin admin@yourdomain.com
```

Creates or updates the user as **`SUPER_ADMIN`** (main agency admin). Sign in at Admin Center `/login` — magic link email via Supabase.

To promote an existing `ADMIN` account:

```bash
pnpm --filter @cocreate/database promote-super-admin admin@yourdomain.com
```

## Redirect URLs (Supabase Dashboard)

- `http://localhost:3002/auth/callback`
- `http://localhost:3003/auth/callback`
- Production URLs when deployed
