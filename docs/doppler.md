# Doppler (local secrets)

Secrets live in [Doppler](https://www.doppler.com/), not in per-app `.env` / `.env.local` files. Committed `.env.example` files are reference only.

## One-time setup

```bash
doppler login
doppler setup   # in repo root — uses doppler.yaml (project: cocreate-web-platform, config: dev)
```

## Daily workflow

```bash
pnpm db:generate          # Prisma client (wraps doppler run)
pnpm db:push              # optional — apply schema
pnpm db:seed:admin you@agency.com   # first super admin
pnpm dev                  # all apps + API + studio (wraps doppler run)
```

Per-app shortcuts: `pnpm dev:web`, `pnpm dev:api`, `pnpm dev:admin`, `pnpm dev:portal`, `pnpm dev:studio`.

Root scripts inject env via `doppler run`. Turbo configuration in [`turbo.json`](../turbo.json):

- `globalEnv: ["NEXT_PUBLIC_*"]` — hashes front-end public vars into all task caches (Sanity IDs, `NEXT_PUBLIC_API_URL`, etc.)
- `@cocreate/api#build.env` — hashes NestJS server-side vars for API build cache invalidation (synced via `pnpm sync:turbo-env`)
- `globalPassThroughEnv: ["*"]` — forwards Doppler secrets to child processes at runtime without adding them to cache hashes

Re-run `pnpm sync:turbo-env` after adding new `process.env` / `config.get` keys in `apps/api` or `packages/ai-core`.

## Required Doppler keys (checklist)

Use root [`.env.example`](../.env.example) and per-app `*.env.example` for descriptions. Minimum for full local dev:

| Area | Keys |
|------|------|
| Database | `DATABASE_URL`, `DIRECT_URL` (Supabase migrations) |
| API | `PORT`, `CORS_ORIGIN`, `CLIENT_PORTAL_URL`, `ADMIN_CENTER_URL`, `ADMIN_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `AUTH_DEV_LINKS`, `RESEND_API_KEY`, `AUTH_EMAIL_FROM`, `AUTH_EMAIL_FROM_NAME`, `WEB_URL`, `RESEND_SEGMENT_ID`, newsletter + project-update sender vars, `OPENAI_API_KEY` or `AI_GATEWAY_API_KEY` (thread summaries) |
| Admin / portal | `API_URL`, `API_VERSION`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_API_VERSION`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Web | `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `NEXT_PUBLIC_SANITY_API_VERSION`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `API_URL`, `OPENAI_API_KEY` or `AI_GATEWAY_API_KEY` (contact chat) |

Social listening, Brand24, and demo snapshot toggles are documented in [`apps/api/.env.example`](../apps/api/.env.example).

## Production

Sync Doppler → Vercel per app (manual for now). Each Vercel project needs the subset of keys that app reads at build/runtime.

## Troubleshooting

- **Missing env at runtime:** run via `pnpm dev` (not raw `turbo dev`) so Doppler injects vars.
- **Prisma CLI:** `pnpm db:push` / `pnpm db:generate` wrap `doppler run`; `DIRECT_URL` must be set in Doppler for Supabase migrations.
- **Admin / portal auth errors:** confirm `NEXT_PUBLIC_SUPABASE_*` in Doppler and run `pnpm db:seed:admin`.

See also [backend-and-contact-chat.md](./backend-and-contact-chat.md).
