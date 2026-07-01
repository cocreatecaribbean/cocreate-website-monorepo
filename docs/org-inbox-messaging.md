# Org inbox messaging

General WhatsApp-style chat between a client organization and the CoCreate account team (billing, timelines, topics not tied to a project request).

Distinct from **Approvals / Inbox** (project checkpoint threads).

## Conversation model

| Visibility | Who can see | Who can create |
|------------|-------------|----------------|
| `ORG_WIDE` | All org client users + CoCreate admins | Auto-created on first access |
| `RESTRICTED` | Selected participants + CoCreate admins | Org admins (`canManageOrgTeam`, `OWNER`, `PROJECT_MANAGER`) |

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

## Contracts

Schemas live in `@cocreate/api-contracts/v1/shared/org-inbox` and are re-exported from `v1/client-portal` and `v1/admin-portal`.

## UI entry points

- **Client portal:** Control Center → Messages (`/?ccView=messages&conversationId=…`)
- **Admin center:** Sidebar → Messages (`/messages` client picker → `/messages?organizationId=…` per-org inbox); client workspace → Messages tab

## Notifications

`PortalNotificationType.ORG_INBOX_MESSAGE` — client href `/?ccView=messages&conversationId=…`; admin href `/messages?organizationId=…&conversationId=…`
