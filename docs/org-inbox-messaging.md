# Org inbox messaging

Project request threads use the same Socket.io stack via `@cocreate/messaging`; see [project-thread-messaging.md](./project-thread-messaging.md) for the 2026 receive-path postmortem (why transport migrations alone did not fix slow delivery).

For a plain-English tour of every key messaging file (no code), see [messaging-files-guide.md](./messaging-files-guide.md).

General WhatsApp-style chat between a client organization and the CoCreate account team (billing, timelines, topics not tied to a project request).

Distinct from **Approvals / Inbox** (project checkpoint threads).

## Access policy (client portal)

| Role | Get Help access |
|------|-----------------|
| `ADMIN` | Always |
| `CONTRIBUTOR` | Per-member `ClientOrganizationMembership.canAccessGetHelp` (default `true`) |
| `VIEWER` / `SOCIAL_ANALYST` | Never |

Org Admins manage the flag per teammate in Client Portal → Team (invite checkbox and On/Off toggle in the members table), same pattern as Social Listening. Updates use `PATCH /client-portal/team/:userId` with `{ canAccessGetHelp: boolean }`. The computed permission is exposed as `permissions.canAccessGetHelp` on `/client-portal/me` (membership flags are re-read on every authenticated request so toggles apply immediately).

## Conversation model

| Visibility | Who can see | Who can create |
|------------|-------------|----------------|
| `ORG_WIDE` | All org client users + CoCreate admins | Auto-created on first access |
| `RESTRICTED` | Selected participants + CoCreate admins | Org admins (`canManageOrgTeam` / `ADMIN`) |

One org-wide conversation per organization; optional additional restricted threads with explicit participants.

## Realtime

- **Channel:** `org-inbox:{conversationId}`
- **Event:** `inbox:update`
- **Pattern:** Nest persists message → publishes Supabase Realtime **broadcast** (with full `message` in payload) → clients append to React Query cache immediately; non-message events debounce 50ms then invalidate
- Same approach as project request threads (`ProjectRealtimeService.publishOrgInboxUpdate`)

**Required env (API):** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

**Required env (portals):** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## API routes (Nest `/v1`)

| Client | Admin |
|--------|-------|
| `GET /client-portal/inbox/conversations` | `GET /admin/inbox/conversations` |
| `GET /client-portal/inbox/unread-count` | `GET /admin/inbox/unread-count` |
| `GET /client-portal/inbox/conversations/:id/messages` | `GET /admin/inbox/conversations/:id/messages` |
| `POST /client-portal/inbox/conversations/:id/messages` | `POST /admin/inbox/conversations/:id/messages` |
| `POST /client-portal/inbox/conversations/:id/mark-read` | `POST /admin/inbox/conversations/:id/mark-read` |
| `GET /client-portal/inbox/conversations/:id/realtime` | `GET /admin/inbox/conversations/:id/realtime` |
| `POST /client-portal/inbox/conversations` (restricted) | `GET /admin/inbox/clients/:organizationId/conversations` |
| `POST …/summary` · `GET …/summary/export` | Same under `/admin/inbox/conversations/:id/…` |
| `GET …/transcript/export?from=&to=&timeZone=` (local calendar days) | Same under `/admin/…` |

## Retention and exports

Project threads and Get Help (org inbox) messages are stored durably in Postgres for the life of the engagement/account (no automatic TTL purge). Client-facing retention/access language lives on the marketing site `/privacy`.

Exports (admin + client):

- **AI Summary PDF** — digest via existing Summary UI (`…/summary` + `…/summary/export`)
- **Transcript PDF** — full chronological messages via **Transcript** UI (`…/transcript/export`), optional `from`/`to` date range (calendar days in the viewer’s timezone via `timeZone` query); empty = entire thread; hard-capped at 2000 messages with a truncation note in the PDF. Image attachments are embedded inline under their messages (up to 40 images per export); other files are listed by filename. PDF timestamps use the browser `timeZone` (fallback `America/Jamaica`).

## Contracts

Schemas live in `@cocreate/api-contracts/v1/shared/org-inbox` and are re-exported from `v1/client-portal` and `v1/admin-portal`.

## UI entry points

- **Client portal:** Control Center → Messages (`/?ccView=messages&conversationId=…`)
- **Admin center:** Sidebar → Messages (`/messages` client picker → `/messages?organizationId=…` per-org inbox); client workspace → Messages tab

## Notifications

`PortalNotificationType.ORG_INBOX_MESSAGE` — client href `/?ccView=messages&conversationId=…`; admin href `/messages?organizationId=…&conversationId=…`
