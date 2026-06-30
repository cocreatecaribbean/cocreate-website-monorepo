# API versioning

CoCreate’s Nest REST API uses **URI versioning**. Product routes live under `/v1/...`.

## Routes

| Surface | Example | Versioned? |
|---------|---------|------------|
| Product REST | `GET /v1/admin/admins` | Yes |
| Client portal | `GET /v1/client-portal/me` | Yes |
| Health | `GET /health` | No |
| Webhooks | `POST /webhooks/fygaro` | No |
| API root | `GET /` | No |
| OpenAPI docs | `GET /docs` | No |

## Environment

```
API_URL=http://localhost:3001
API_VERSION=1
NEXT_PUBLIC_API_VERSION=1   # client-portal browser calls
```

## Callers

Use `@cocreate/api-client`:

```ts
import { nestApiUrl } from '@cocreate/api-client'

fetch(nestApiUrl('/admin/admins'))
// → http://localhost:3001/v1/admin/admins
```

- **Admin Center** browser → Next `/api/*` BFF (unversioned) → Nest `/v1/*` via `proxyAdminApi` / `nestApiUrl`
- **Client portal** browser → Nest `/v1/*` directly via `nestApiUrl`
- **Marketing web** BFF → Nest `/v1/*` for newsletter and client-portal login

## Shared contracts

`@cocreate/api-contracts` holds v1 TypeScript wire shapes for Nest JSON responses.

| Subpath | Use for |
|---------|---------|
| `v1/client-portal` | Client portal projects, dashboard, notifications |
| `v1/admin-portal` | Admin roster, project superset, dashboard, SL admin |
| `v1/social-listening` | Analytics/compare/report HTTP payloads |
| `v1/shared/projects` | Shared project primitives |

See [Types and contracts](./types-and-contracts.md) for the full package map and import cheat sheet.

## Breaking change policy

1. **Within v1:** additive fields only (new optional properties). Do not rename or remove fields.
2. **Breaking changes:** introduce `/v2` controllers; keep `/v1` until all callers migrate.
3. **Deprecations:** mark with `@deprecated` in code and `Deprecation` response header when sunsetting.
4. **Framework upgrades:** pin Nest in `pnpm-workspace.yaml`; run `pnpm --filter @cocreate/api test` before merging major bumps.

## Smoke checklist (after versioning changes)

- `GET /health` → 200
- `GET /v1/auth/admin/me` without token → 401
- `GET /admin/admins` (unversioned) → 404
- Admin Center login + roster
- Client portal login + projects list
- Newsletter subscribe (web BFF)
