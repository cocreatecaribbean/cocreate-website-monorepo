# @cocreate/api

NestJS backend for CoCreate Caribbean.

## Setup

1. [Doppler setup](../../docs/doppler.md): `doppler login`, `doppler setup` (repo root).

2. Generate Prisma client:

   ```bash
   pnpm db:generate
   ```

3. Apply schema (local Postgres):

   ```bash
   pnpm db:push
   ```

4. Run API:

   ```bash
   pnpm dev:api
   ```

- Root: http://localhost:3001
- Health: http://localhost:3001/health

Env keys are documented in [`apps/api/.env.example`](./.env.example) and injected by Doppler — do not create `apps/api/.env`.

## Stack

- NestJS 11
- Prisma 7 (`@cocreate/database` package)

Contact chat AI runs in Next.js (`apps/web`) via Vercel AI SDK; this API will persist conversations and power future features.
