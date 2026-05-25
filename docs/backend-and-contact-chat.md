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
4. Admin Center: http://localhost:3002/login (sign-in required when Supabase is configured)
5. Additional admins: Admin Center → **Team** (or `POST /admin/admins/invite`)
6. Client invite: Admin Center → **Clients**

Admin APIs: `GET/POST /admin/admins`, `GET /auth/admin/me`, `POST /admin/clients/invite`, `GET /admin/clients`, `PATCH .../brand24-project`. See [supabase-database-setup.md](./supabase-database-setup.md).

### Admin Center: “Could not load clients/admins” (403)

Supabase sign-in alone is not enough — the email must exist in Prisma with `role: ADMIN` and `status` not `SUSPENDED` (seed with `seed:admin` or Team invite). Admin Center middleware calls `GET /auth/admin/me` on page loads (not `/api/*` BFF routes). Expired sessions redirect through `/auth/signout` (clears cookies) then `/login?error=session_expired` to avoid redirect loops. List pages show the API error message (e.g. `Admin access required`) instead of a generic failure.

### Local auth without email rate limits

Supabase caps auth emails (~4/hour per address, project-wide). For local dev, the API uses **`AUTH_DEV_LINKS=true`** (default in development): sign-in URLs are generated via the service role and shown in the UI / API logs — **no email is sent**.

- **Test real sign-in flow:** set `NEXT_PUBLIC_SUPABASE_*` in `apps/admin-center/.env.local`, seed an admin, open `/login`, use the **dev sign-in link** on the page (also logged in the `@cocreate/api` terminal).
- **Optional dev bypass (no login):** `ADMIN_DEV_SKIP_AUTH=true` with Supabase unset — uses `ADMIN_API_KEY` for BFF → API only. Not for production.
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

`Organization.isSocialListeningSubscriber` (set on invite or toggled per client in Admin → Clients roster) controls Social Listening access. The portal loads entitlements from `GET /client-portal/me` (Bearer JWT, server-side) — not from the UI alone. Paid subscriptions can flip the same flag via billing webhooks later (with optional expiry and renewal reminders).

The premium **Social Listening** tab loads data from **`GET /client-portal/social-listening/analytics`** (Bearer JWT, `ClientAuthGuard`). The API resolves **`organizationId` from the logged-in user only** — never from client-supplied org ids.

- **`Organization.brand24ProjectId`** — optional; set per client in Admin → Clients (for when Brand24 subscription is live).
- **Until live API:** `BRAND24_USE_LIVE_API` is unset/false → **org-scoped mock** analytics (each client sees different sample numbers). Set `BRAND24_API_KEY` and `BRAND24_USE_LIVE_API=true` when the subscription is ready.

## Newsletter (marketing site footer)

Double opt-in mailing list: footer → `POST /newsletter/subscribe` (via `apps/web/app/api/newsletter/subscribe`) → Prisma `NewsletterSubscriber` (`PENDING`) → Resend confirmation email → user clicks link → `GET /newsletter/confirm` → `CONFIRMED` + Resend contact in segment.

**API (`apps/api/.env`):**

```env
RESEND_API_KEY=re_…
RESEND_SEGMENT_ID=…           # Resend Dashboard → Segments
# RESEND_AUDIENCE_ID=…        # deprecated; legacy Audiences API only
WEB_URL=http://localhost:3000
AUTH_EMAIL_FROM=no-reply@mail.cocreatecaribbean.com   # or NEWSLETTER_FROM_EMAIL
```

**Web (`apps/web/.env.local`):** `API_URL=http://localhost:3001` (BFF to Nest).

**Pages:** `/newsletter/confirmed`, `/newsletter/confirm-error`. Confirm link in email: `{WEB_URL}/newsletter/confirm?token=…` (web route proxies to API redirect).

## Versions (catalog: `api` / `ai`)

- NestJS 11.1.x
- Prisma 7.8.x
- `ai` 6.x + `@ai-sdk/react` 3.x
