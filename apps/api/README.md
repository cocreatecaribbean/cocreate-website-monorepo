# @cocreate/api

NestJS backend for CoCreate Caribbean.

## Setup

1. Copy env files:
   - `apps/api/.env` from `apps/api/.env.example`
   - `packages/database/.env` from `packages/database/.env.example` (same `DATABASE_URL`)

2. Generate Prisma client:

   ```bash
   pnpm --filter @cocreate/database db:generate
   ```

3. Apply schema (local Postgres):

   ```bash
   pnpm --filter @cocreate/database db:push
   ```

4. Run API:

   ```bash
   pnpm --filter @cocreate/api dev
   ```

- Root: http://localhost:3001
- Health: http://localhost:3001/health

## Stack

- NestJS 11
- Prisma 7 (`@cocreate/database` package)

Contact chat AI runs in Next.js (`apps/web`) via Vercel AI SDK; this API will persist conversations and power future features.
