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

Sign in at Admin Center `/login` — magic link email via Supabase.

## Redirect URLs (Supabase Dashboard)

- `http://localhost:3002/auth/callback`
- `http://localhost:3003/auth/callback`
- Production URLs when deployed
