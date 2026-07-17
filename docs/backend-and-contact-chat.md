# Backend & contact chat

## Monorepo layout

| Package / app | Purpose |
|---------------|---------|
| `apps/web` | Next.js marketing site |
| `apps/api` | NestJS 11 REST API |
| `packages/database` | Prisma 7 schema + generated client |

## Local development

1. [Doppler setup](./doppler.md): `doppler login`, `doppler setup` (once per machine).
2. Generate Prisma client: `pnpm db:generate`
3. Optional DB: `pnpm db:push` (requires Postgres on `DATABASE_URL` in Doppler)
4. Run everything: `pnpm dev` (injects secrets via `doppler run`, then Turbo runs web + api + studio)
   - Web: http://localhost:3000
   - API: http://localhost:3001
   - API health: http://localhost:3001/health
   - API docs: http://localhost:3001/docs
   - Versioned routes: `/v1/...` (see [api-versioning.md](./api-versioning.md))

### Prisma build scripts (pnpm)

If `prisma generate` fails, approve package builds once:

```bash
pnpm approve-builds
# allow @prisma/engines and prisma
```

## Contact page chat (Vercel AI SDK)

- UI: `apps/web/components/contact/contact-chat.tsx` (placeholder — swap in your design)
- Route: `apps/web/app/api/chat/route.ts` (`streamText` + OpenAI provider)
- Env: `OPENAI_API_KEY` or `AI_GATEWAY_API_KEY` in Doppler

[Vercel AI SDK](https://sdk.vercel.ai/) · [AI Gateway](https://vercel.com/docs/ai-gateway) · [Chat template](https://github.com/vercel/ai-chatbot)

### Next steps (when design is ready)

1. Restyle `ContactChat` — keep `useChat` + `sendMessage({ text })`.
2. Persist threads via Nest: POST `/conversations` from `/api/chat` or a dedicated route using `ContactConversation` / `ContactMessage` in Prisma.
3. On Vercel deploy: add env vars in project settings; Gateway auth can use OIDC on Vercel.

## Admin auth + client onboarding

1. Seed first super admin: `pnpm db:seed:admin you@agency.com` (creates `SUPER_ADMIN`)
2. Set Supabase keys in Doppler (`NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`)
3. In Supabase Dashboard → Authentication → URL Configuration, add redirect URLs:
   - `http://localhost:3002/auth/callback` (admin)
   - `http://localhost:3003/auth/callback` (client portal)
4. Admin Center: http://localhost:3002/login (sign-in required when Supabase is configured)
5. Additional admins: **Super admin** only — Admin Center → **Team** (or `POST /admin/admins/invite`)
6. Client invite: Admin Center → **Clients** (any admin)

Admin APIs: `GET/POST /admin/admins`, `GET /auth/admin/me`, `POST /admin/clients/invite`, `GET /admin/clients`, `PATCH .../brand24-project`. See [supabase-database-setup.md](./supabase-database-setup.md).

### Agency roles: `SUPER_ADMIN` vs `ADMIN`

| Role | Powers |
|------|--------|
| **SUPER_ADMIN** | Manage agency job-title list; invite/suspend admins; promote/demote between `SUPER_ADMIN` and `ADMIN` |
| **ADMIN** | Day-to-day work (clients, projects, reviews); edit own profile (pick title/dept from lists) |

Both roles pass `requireAdmin` (Nest) and can use most Admin Center APIs. Restricted routes use `SuperAdminGuard`.

**Promotion rules**

- Cannot suspend or demote the **last** `SUPER_ADMIN`.
- Cannot demote yourself if you are the only super admin.
- Regular `ADMIN` receives `403` on invite, suspend, role change, and profile-option CRUD.

**Existing installs:** Re-run `seed:admin` for the primary email (updates role to `SUPER_ADMIN`), or:

```bash
pnpm --filter @cocreate/database promote-super-admin you@agency.com
```

### Profile option lists (`AgencyProfileOption`)

Super admins maintain the agency job-title list (Admin Center → **Profile options**, or API below). All admins read active titles for their profile (multi-select).

| Method | Path | Who |
|--------|------|-----|
| GET | `/auth/admin/profile-options` | `SUPER_ADMIN` or `ADMIN` |
| GET/POST/PATCH/DELETE | `/admin/settings/profile-options` | `SUPER_ADMIN` only |

Defaults (Project Manager, Account Lead, Account Manager, etc.) are inserted on first read if the table is empty.

### Admin profiles (project attribution)

Each admin sets **display name**, one or more **job titles** (from the agency list), and an optional **avatar** under Admin Center → **Profile**. Clients see **name + job titles** (comma-separated) on onboarded/completed lines, timelines, and message threads. Until a profile is saved, the API falls back to a formatted email local-part.

| Method | Path | Auth |
|--------|------|------|
| GET | `/auth/admin/profile` | Admin JWT |
| PATCH | `/auth/admin/profile` | Admin — body: `displayName`, `jobTitleOptionIds` (array) |
| POST | `/auth/admin/profile/avatar/upload-url` | Admin — signed Supabase upload |
| PATCH | `/auth/admin/profile/avatar` | Admin — register `storagePath` after upload |

`PATCH` validates all IDs against **active** `AgencyProfileOption` rows; selections are stored in `UserProfileJobTitle` with a denormalized comma-separated `jobTitle` on `UserProfile` for serializers.

`GET /auth/admin/me` returns `role` (`SUPER_ADMIN` \| `ADMIN`) plus nested `profile` (and `profileComplete`). Prisma: `UserProfile` (1:1 with `User`). Storage bucket: `admin-avatars` (see [supabase-database-setup.md](./supabase-database-setup.md)).

### Team roster (super admin only for mutations)

| Method | Path | Who |
|--------|------|-----|
| GET | `/admin/admins` | All admins (read roster + roles) |
| POST | `/admin/admins/invite` | `SUPER_ADMIN` |
| POST | `/admin/admins/:id/suspend` | `SUPER_ADMIN` |
| PATCH | `/admin/admins/:id/role` | `SUPER_ADMIN` — body `{ "role": "SUPER_ADMIN" \| "ADMIN" }` |

### Admin Center: “Could not load clients/admins” (403)

Supabase sign-in alone is not enough — the email must exist in Prisma with `role: SUPER_ADMIN` or `ADMIN` and `status` not `SUSPENDED` (seed with `seed:admin` or super-admin Team invite). Admin Center proxy (`apps/admin-center/proxy.ts`) calls `GET /auth/admin/me` on page loads (not `/api/*` BFF routes). Expired sessions redirect through `/auth/signout` (clears cookies) then `/login?error=session_expired` to avoid redirect loops. List pages show the API error message (e.g. `Admin access required`) instead of a generic failure.

**Admin vs Client Portal sessions:** Both apps share one Supabase project but use **separate auth cookies** (`sb-<ref>-admin-auth-token` vs `sb-<ref>-client-auth-token`) so localhost ports 3002/3003 do not overwrite each other. Client proxy also calls `GET /client-portal/me` and signs out non-client roles. After this change, sign in again on each portal once.

**Client portal roles (`clientOrgRole`):**

| Role | Team hub | Invite teammates | Projects | Messaging / uploads | Social Listening |
|------|----------|------------------|----------|---------------------|------------------|
| `ADMIN` | Yes | Immediate (Supabase) | All org projects; can create | Yes | Yes when org subscribed |
| `CONTRIBUTOR` | No | — | Assigned projects only | Yes | Yes when org subscribed |
| `VIEWER` | No | — | Assigned projects (read-only) | No | No |
| `SOCIAL_ANALYST` | No | — | None | No | Yes when org subscribed (landing) |

**Org admin:** The first email on **Admin → Clients → Invite** becomes an Admin **membership** on the new org (`ClientOrganizationMembership`). The same email can hold memberships in multiple client orgs (one login). Role/status for portal access come from the **active org membership**, not a global “one org per user” field. Promoting someone to Admin grants access to all projects in **that** org and invite rights (UI confirms this).

**Email uniqueness:** Login identity (`User.email`) is global. Inviting someone already on another client org **adds a membership** to this org (“Already on this team” only if they’re already on *this* org). Agency accounts cannot be invited as clients.

- **Brand-new email:** membership `INVITED` + Supabase/Resend **Auth invite** email (sign-in link).
- **Existing client** (already has Auth / Active on another org): membership `ACTIVE` + in-app notification + transactional **“You’ve been added to {org}”** email (not a new Auth invite). Portal UI says “Added … to the team” rather than “Invitation sent”.

**Client portal Team hub:** Admins open **Control Center → Team** (`/?ccView=team`). Admins invite teammates immediately. Social Listening visibility for non-Admin/Contributor roles can still be toggled when the company subscription is active (Admins and Contributors get SL with the org subscription). Project owners (Admin who owns the project) assign Contributors and Viewers on each project. Users with multiple org memberships get an org switcher in the portal header.

**API (client portal, bearer token):**

| Method | Path | Who |
|--------|------|-----|
| GET | `/client-portal/team/hub` | Admin |
| GET | `/client-portal/team` | Admin |
| PATCH | `/client-portal/team/:userId` | Admin |
| DELETE | `/client-portal/team/:userId` | Admin (removes membership; can re-invite later) |
| POST | `/client-portal/team/invite` | Admin |

**API (admin):** `GET/POST …/organizations/:id/team/*` and project member routes `…/projects/:projectId/members` plus `PATCH …/projects/:projectId/owner`.

### Local auth without email rate limits

Supabase caps auth emails (~4/hour per address, project-wide). For local dev, the API uses **`AUTH_DEV_LINKS=true`** (default in development): sign-in URLs are generated via the service role and shown in the UI / API logs — **no email is sent**.

- **Test real sign-in flow:** set `NEXT_PUBLIC_SUPABASE_*` in Doppler, seed an admin (`pnpm db:seed:admin`), open `/login`, use the **dev sign-in link** on the page (also logged in the `@cocreate/api` terminal).
- **Optional dev bypass (no login):** `ADMIN_DEV_SKIP_AUTH=true` with Supabase unset — uses `ADMIN_API_KEY` for BFF → API only. Not for production.
- **Production:** set `AUTH_DEV_LINKS=false` (or deploy with `NODE_ENV=production`) — emails send normally.

### Auth emails via Resend (recommended)

The API sends invite, magic-link, and **membership-added** emails through **Resend’s API** (not Supabase SMTP) when these are set in Doppler:

```env
AUTH_DEV_LINKS=false
RESEND_API_KEY=re_…
AUTH_EMAIL_FROM=no-reply@mail.cocreatecaribbean.com
AUTH_EMAIL_FROM_NAME=CoCreate Caribbean
```

`mail.cocreatecaribbean.com` must be **verified** in Resend. Restart the API after changing env. Logs show: `[invite] Sent invite email via Resend from CoCreate Caribbean <no-reply@mail.cocreatecaribbean.com> …`

Optional fallback: Supabase → Authentication → SMTP (only used if `RESEND_API_KEY` is unset and `AUTH_USE_RESEND_API=false`).

Also add `http://localhost:3003/auth/callback` under Authentication → URL Configuration.

### Email senders (Resend)

All use `RESEND_API_KEY` and a verified `mail.cocreatecaribbean.com` domain. Each flow uses its own `From` address (no cross-fallback).

| Flow | From address | Env |
|------|----------------|-----|
| Auth invites, magic links & membership-added | `no-reply@mail.cocreatecaribbean.com` | `AUTH_EMAIL_FROM`, `AUTH_EMAIL_FROM_NAME` |
| Newsletter double opt-in | `signup@mail.cocreatecaribbean.com` | `NEWSLETTER_FROM_EMAIL`, `NEWSLETTER_FROM_NAME` |
| Social Listening billing | `billingupdates@mail.cocreatecaribbean.com` | `BILLING_FROM_EMAIL`, `BILLING_FROM_NAME` |
| Project workspace (client + admin) | `updates@mail.cocreatecaribbean.com` | `PROJECT_UPDATES_FROM_EMAIL`, `PROJECT_UPDATES_FROM_NAME` |

### Client portal entitlements

**Social Listening access** uses org subscription, role, and per-member flags (enforced in `ClientAccessService` and Social Listening services):

| Layer | Field | Who sets it | Effect |
|-------|--------|-------------|--------|
| Company subscription | `SocialListeningSubscription` (+ synced `Organization.isSocialListeningSubscriber`) | Fygaro webhook, client subscribe flow, or Admin → **Social Listening Center** | Org is entitled when `status = ACTIVE` and `currentPeriodEnd > now` |
| Role + membership flag | `ClientOrganizationMembership.clientOrgRole` + `canAccessSocialListening` | Admin invite / Team On/Off toggle | `ADMIN` and `SOCIAL_ANALYST`: full SL when org subscribed. `CONTRIBUTOR`: view analytics + export PDFs only when `canAccessSocialListening` is on; **never** create listening setups. `VIEWER`: never |

| Capability | Admin | Social Analyst | Contributor (flag on) | Contributor (flag off) |
|------------|-------|----------------|----------------------|------------------------|
| View analytics | Yes | Yes | Yes | No |
| Export PDF reports | Yes | Yes | Yes | No |
| Create listening setup | Yes | Yes | No | No |

**Admin → Social Listening Center** (`/social-listening`): subscription roster, grant comp/manual plans, cancel/extend, create listening setups for clients, **view the same analytics dashboard as clients** (`/social-listening/subscriptions/:organizationId/analytics`), payment event log, billing email log.

CoCreate admins can view org-scoped analytics for any active subscription (admin- or client-created setups). Disclose this in client-facing terms/privacy policy.

When a subscription activates (Fygaro webhook or admin grant), `Organization.isSocialListeningSubscriber` is synced.

`GET /client-portal/me` exposes `permissions.canUseSocialListening`, `canViewSocialListening`, and `canManageSocialListeningSetup` (Bearer JWT, server-side). Social Analysts land on Social Listening only (Control Center hidden).

**Billing (Fygaro + Resend):**

| Endpoint | Purpose |
|----------|---------|
| `POST /client-portal/social-listening/subscribe` | Start Fygaro checkout for Pulse/Growth/Scale |
| `GET /client-portal/social-listening/subscription` | Plan, renewal date, auto-renew, masked card |
| `PATCH /client-portal/social-listening/subscription/auto-renew` | Toggle auto-renew (admin) |
| `POST /client-portal/social-listening/subscription/cancel` | Cancel at period end |
| `POST /client-portal/social-listening/subscription/renew` | Manual renewal checkout URL |
| `POST /webhooks/fygaro` | Payment + renewal webhooks (signature verified) |
| `GET /admin/social-listening/subscriptions` | Admin subscription roster |
| `POST /admin/social-listening/setups` | Admin create listening setup for client |
| `GET /admin/social-listening/organizations/:organizationId/analytics` | Admin analytics (same data as client portal) |
| `GET /admin/social-listening/organizations/:organizationId/analytics/snapshots` | Snapshot dates for admin analytics |
| `GET /admin/social-listening/organizations/:organizationId/analytics/compare` | Compare snapshots (admin) |
| `GET /admin/social-listening/organizations/:organizationId/reports/templates` | PDF report templates (admin) |
| `POST /admin/social-listening/organizations/:organizationId/reports/generate` | Generate PDF report (admin) |

Billing lifecycle emails send from **`billingupdates@mail.cocreatecaribbean.com`** (`BILLING_FROM_EMAIL`). Renewal reminders run on a daily cron (7d/3d auto-renew upcoming; 7d/3d/1d manual renew + enable auto-renew nudge).

Paid Fygaro checkouts flip subscription state via **`POST /webhooks/fygaro`** (never store raw card data — only masked last4 from webhook).

The premium **Social Listening** tab loads data from **`GET /client-portal/social-listening/analytics`** (Bearer JWT, `ClientAuthGuard`). The API resolves **`organizationId` from the logged-in user only** — never from client-supplied org ids.

- **`Organization.brand24ProjectId`** — optional; set per client in Admin → Clients (for when Brand24 subscription is live).
- **Until live API:** `BRAND24_USE_LIVE_API` is unset/false → **org-scoped mock** analytics (each client sees different sample numbers). Set `BRAND24_API_KEY` and `BRAND24_USE_LIVE_API=true` when the subscription is ready.

**Historical snapshots** — chart payloads are stored in Postgres as `SocialListeningSnapshot` (one row per org per UTC calendar day). A daily cron captures all subscriber orgs. Analytics GET **without** `asOf` returns the **newest stored snapshot** by `snapshotDate` (portal “Latest”); a snapshot is only created on that path when none exist yet.

| Endpoint | Purpose |
|----------|---------|
| `GET /client-portal/social-listening/analytics?asOf=YYYY-MM-DD` | View a saved snapshot (404 if missing) |
| `GET /client-portal/social-listening/analytics/snapshots` | List available snapshot dates for the date picker |
| `GET /client-portal/social-listening/analytics/compare?baseline=YYYY-MM-DD&current=YYYY-MM-DD` | Compare two snapshots; `current` defaults to latest |

**API env (Doppler):**

```env
SOCIAL_LISTENING_SNAPSHOT_ENABLED=true
SOCIAL_LISTENING_SNAPSHOT_MAX_AGE_HOURS=24
SOCIAL_LISTENING_SNAPSHOT_RETENTION_DAYS=548
```

Retention pruning runs daily (same scheduler as capture). Brand24 fetches use a rolling **30-day** window ending on the snapshot date when capturing; live default window remains 7 days when snapshots are disabled.

**Local demo (two dates):** set `SOCIAL_LISTENING_DEMO_SNAPSHOTS=true` (see `apps/api/.env.example`). On the first Social Listening API call per org, the API creates missing snapshots for **today** and **~90 days ago** (`SOCIAL_LISTENING_DEMO_SNAPSHOT_DAYS_AGO`, default 90) using org-scoped mock data (different chart numbers per date). Restart the API after changing Doppler config, then open Social Listening — the date dropdown and compare mode should show both dates.

**PDF reports** — multi-page branded decks from saved snapshots (not live streaming). Templates are **code-first** React layouts in [`packages/social-listening-reports`](../packages/social-listening-reports) using `@react-pdf/renderer`. Add or change a design by adding a file under `src/templates/` and registering it in `registry.ts`.

| Endpoint | Purpose |
|----------|---------|
| `GET /client-portal/social-listening/reports/templates` | List available templates (id, label, description, `supportsCompare`) |
| `POST /client-portal/social-listening/reports/generate?templateId=…&asOf=…&baseline=…&current=…` | Returns `application/pdf` attachment |

Built-in templates: `executive-summary` (2 pages), `full-dashboard` (4 pages), `period-compare` (requires `baseline`, optional `current` / `asOf`). Client portal **Reports** tab: pick template, snapshot date, then **Download PDF**. Rebuild the reports package after template changes: `pnpm --filter @cocreate/social-listening-reports build`, then restart the API.

## Newsletter (marketing site footer)

Double opt-in mailing list: footer → `POST /newsletter/subscribe` (via `apps/web/app/api/newsletter/subscribe`) → Prisma `NewsletterSubscriber` (`PENDING`) → Resend confirmation email → user clicks link → `GET /newsletter/confirm` → `CONFIRMED` + Resend contact in segment.

**API (Doppler):**

```env
RESEND_API_KEY=re_…
RESEND_SEGMENT_ID=…           # Resend Dashboard → Segments
# RESEND_AUDIENCE_ID=…        # deprecated; legacy Audiences API only
WEB_URL=http://localhost:3000
NEWSLETTER_FROM_EMAIL=signup@mail.cocreatecaribbean.com
NEWSLETTER_FROM_NAME=CoCreate Caribbean
AUTH_EMAIL_FROM=no-reply@mail.cocreatecaribbean.com   # auth / invites only
```

**Web (Doppler):** `API_URL=http://localhost:3001` (BFF to Nest).

**Pages:** `/newsletter/confirmed`, `/newsletter/confirm-error`. Confirm link in email: `{WEB_URL}/newsletter/confirm?token=…` (web route proxies to API redirect).

## Client project workspace

Multi-tenant projects with **three durable conversation threads** per project (`ProjectRequest` types `ONBOARDING`, `PROGRESS`, `CANCELLATION`). Progress work uses admin **checkpoints** (`messageKind=CHECKPOINT`) that the client can approve or reply to; approvals are recorded in `ClientApprovalRecord`. Data in Postgres (`ClientProject`, `ProjectRequest`, `ProjectRequestMessage`, `ClientApprovalRecord`, `ProjectAttachment`, `ProjectActivity`, `PortalNotification`).

### Thread lifecycle

| Phase | Thread | Behaviour |
|-------|--------|-----------|
| Client submits project | `ONBOARDING` opened | First message from project description |
| Admin onboards (`SUBMITTED` → `ACTIVE`) | `ONBOARDING` resolved; `PROGRESS` opened | Onboarding archived (read-only in UI) |
| Active work | `PROGRESS` | Admin sends checkpoints; client approves latest pending or replies with changes |
| Client requests cancel | `CANCELLATION` | Admin resolves with outcome + optional fee; project → `CANCELLED` when approved |

At most one pending checkpoint per progress thread (new admin checkpoint supersedes older pending ones). Change requests and phase gates are folded into the progress thread (client replies; admin sends a new checkpoint when ready).

### Client portal (`apps/client-portal`)

| Method | Path | Auth |
|--------|------|------|
| GET | `/client-portal/projects` | Client JWT |
| POST | `/client-portal/projects` | Client — creates `SUBMITTED` project + onboarding thread |
| GET | `/client-portal/projects/:id` | Client |
| POST | `/client-portal/projects/:id/cancellation-request` | Client — active/on-hold projects |
| POST | `/client-portal/projects/:id/attachments/upload-url` | Client |
| POST | `/client-portal/projects/:id/attachments` | Client |
| GET | `/client-portal/projects/requests/open` | Client — pending progress checkpoints |
| GET | `/client-portal/approvals/history` | Client — `ClientApprovalRecord` list |
| POST | `/client-portal/project-requests/:requestId/messages/:messageId/approve` | Client — approve latest checkpoint |
| GET | `/client-portal/notifications` | Client |
| PATCH | `/client-portal/notifications/:id/read` | Client |
| GET | `/client-portal/project-requests/:id` | Client — thread + messages |
| POST | `/client-portal/project-requests/:id/messages` | Client — reply in conversation |

Legacy paths (`change-requests`, `phase-approvals`) append messages on the progress thread.

UI: Control Center → **Projects** (three thread sections per project), **Approvals** (active checkpoints + history); `/attention` for unread notifications (`CHECKPOINT_*`, `CANCELLATION_*` types).

### Admin Center (`apps/admin-center`)

Per-client workspace: `/clients/{organizationId}` (Projects, Inbox, Activity). Global list: **Project Center**.

| Method | Path | Auth |
|--------|------|------|
| GET | `/admin/projects` | Admin |
| POST | `/admin/clients/:orgId/projects/:projectId/approve` | Admin — `SUBMITTED` → `ACTIVE`; closes onboarding, opens progress |
| POST | `/admin/projects/:id/checkpoints` | Admin — progress checkpoint (supersedes prior pending) |
| POST | `/admin/projects/:id/review-requests` | Admin — alias for checkpoints (deprecated) |
| POST | `/admin/project-requests/:id/resolve-cancellation` | Admin — fee outcome + message |
| GET | `/admin/clients/:orgId/inbox` | Admin — open requests (checkpoints, cancellations, onboarding) |
| PATCH | `/admin/project-requests/:id` | Admin |
| GET | `/admin/project-requests/:id` | Admin — thread + messages |
| POST | `/admin/project-requests/:id/messages` | Admin — follow-up message |

### File storage (Supabase)

Create **private** buckets in Supabase Storage:

- `project-attachments` — client project files (`organizationId/projectId/{uuid}-filename`)
- `admin-avatars` — admin profile photos (`admin/{userId}/{uuid}-filename`)

The API uses the service role to issue signed upload/download URLs.

Optional env:

```env
ADMIN_CENTER_URL=http://localhost:3002
CLIENT_PORTAL_URL=http://localhost:3003
ADMIN_NOTIFY_EMAIL=ops@agency.com   # comma-separated; else all ACTIVE admins
PROJECT_UPDATES_FROM_EMAIL=updates@mail.cocreatecaribbean.com
PROJECT_UPDATES_FROM_NAME=CoCreate Caribbean
```

Project notification emails use `RESEND_API_KEY` and **`PROJECT_UPDATES_FROM_EMAIL`** (not `AUTH_EMAIL_FROM` or `NEWSLETTER_FROM_EMAIL`). With `AUTH_DEV_LINKS=true`, action links are logged instead of sent (`[project-email]` in API logs).

## Versions (catalog: `api` / `ai`)

- NestJS 11.1.x
- Prisma 7.8.x
- `ai` 6.x + `@ai-sdk/react` 3.x
