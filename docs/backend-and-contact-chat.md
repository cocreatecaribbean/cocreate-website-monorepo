# Backend & contact chat

## Monorepo layout

| Package / app | Purpose |
|---------------|---------|
| `apps/web` | Next.js marketing site |
| `apps/api` | NestJS 11 REST API |
| `packages/database` | Prisma 7 schema + generated client |

## Local development

1. Copy env files (see root `.env.example`).
2. Generate Prisma client: `pnpm db:generate`
3. Optional DB: `pnpm db:push` (requires Postgres on `DATABASE_URL`)
4. Run everything: `pnpm dev` (Turbo runs web + api + studio)
   - Web: http://localhost:3000
   - API: http://localhost:3001
   - API health: http://localhost:3001/health

### Prisma build scripts (pnpm)

If `prisma generate` fails, approve package builds once:

```bash
pnpm approve-builds
# allow @prisma/engines and prisma
```

## Contact page chat (Vercel AI SDK)

- UI: `apps/web/components/contact/contact-chat.tsx` (placeholder — swap in your design)
- Route: `apps/web/app/api/chat/route.ts` (`streamText` + OpenAI provider)
- Env: `OPENAI_API_KEY` or `AI_GATEWAY_API_KEY` in `apps/web/.env.local`

[Vercel AI SDK](https://sdk.vercel.ai/) · [AI Gateway](https://vercel.com/docs/ai-gateway) · [Chat template](https://github.com/vercel/ai-chatbot)

### Next steps (when design is ready)

1. Restyle `ContactChat` — keep `useChat` + `sendMessage({ text })`.
2. Persist threads via Nest: POST `/conversations` from `/api/chat` or a dedicated route using `ContactConversation` / `ContactMessage` in Prisma.
3. On Vercel deploy: add env vars in project settings; Gateway auth can use OIDC on Vercel.

## Admin auth + client onboarding

1. Seed first admin: `pnpm --filter @cocreate/database seed:admin you@agency.com`
2. Set Supabase keys in `apps/api/.env`, `apps/admin-center/.env.local`, `apps/client-portal/.env.local`
3. In Supabase Dashboard → Authentication → URL Configuration, add redirect URLs:
   - `http://localhost:3002/auth/callback` (admin)
   - `http://localhost:3003/auth/callback` (client portal)
4. Admin Center: http://localhost:3002/login
5. Client invite: Admin Center → Clients

Admin client APIs: `POST /admin/clients/invite`, `GET /admin/clients`. See [supabase-database-setup.md](./supabase-database-setup.md).

### Local auth without email rate limits

Supabase caps auth emails (~4/hour per address, project-wide). For local dev, the API uses **`AUTH_DEV_LINKS=true`** (default in development): sign-in URLs are generated via the service role and shown in the UI / API logs — **no email is sent**.

- **Admin dashboard (skip login):** comment out `NEXT_PUBLIC_SUPABASE_*` in `apps/admin-center/.env.local` — middleware bypasses auth in dev; API uses `ADMIN_API_KEY`.
- **Test real sign-in flow:** keep Supabase keys in the app, request a link on `/login`, click the yellow **dev sign-in link** on the page (also logged in the `@cocreate/api` terminal).
- **Production:** set `AUTH_DEV_LINKS=false` (or deploy with `NODE_ENV=production`) — emails send normally.

### Auth emails via Resend (recommended)

The API sends invite and magic-link emails through **Resend’s API** (not Supabase SMTP) when these are set in `apps/api/.env`:

```env
AUTH_DEV_LINKS=false
RESEND_API_KEY=re_…
AUTH_EMAIL_FROM=no-reply@mail.cocreatecaribbean.com
AUTH_EMAIL_FROM_NAME=CoCreate Caribbean
```

`mail.cocreatecaribbean.com` must be **verified** in Resend. Restart the API after changing env. Logs show: `[invite] Sent invite email via Resend from CoCreate Caribbean <no-reply@mail.cocreatecaribbean.com> …`

Optional fallback: Supabase → Authentication → SMTP (only used if `RESEND_API_KEY` is unset and `AUTH_USE_RESEND_API=false`).

Also add `http://localhost:3003/auth/callback` under Authentication → URL Configuration.

### Client portal entitlements

`Organization.isSocialListeningSubscriber` (set when inviting from Admin → Clients) controls access to Social Listening. The portal loads entitlements from `GET /client-portal/me` (Bearer JWT, server-side) — not from the UI alone.

## Versions (catalog: `api` / `ai`)

- NestJS 11.1.x
- Prisma 7.8.x
- `ai` 6.x + `@ai-sdk/react` 3.x
