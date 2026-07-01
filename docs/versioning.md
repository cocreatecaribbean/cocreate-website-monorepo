# Versioning policy

CoCreate uses **layered versioning**: product semver for releases, URI paths for HTTP API contracts, and Prisma migrations for the database. Internal `@cocreate/*` packages stay at `0.0.0` in `package.json` — they are not published to npm.

## Layers

| Layer | Mechanism | When it changes |
|-------|-----------|-----------------|
| **Product** | Root `package.json` `version` + git tag `vX.Y.Z` + [CHANGELOG.md](../CHANGELOG.md) | Each production release from `main` |
| **HTTP API** | URI prefix `/v1/...` ([api-versioning.md](./api-versioning.md)) | Breaking REST contract → `/v2` (or coordinated same-PR deploy) |
| **Wire types** | `@cocreate/api-contracts` `./v1/*` exports + Zod schemas | Same rules as HTTP API |
| **Database** | Prisma migrations + `pnpm db:migrate` | Schema changes; prefer backward-compatible migrations on `main` |
| **Deploy identity** | Git commit SHA (Vercel/Railway) | Every deploy |

## Product semver (repository)

- **Format:** `MAJOR.MINOR.PATCH` (SemVer).
- **Bump on prod release only** — not every merge to `dev`.
- **PATCH:** bug fixes, performance, non-breaking tweaks.
- **MINOR:** new features, additive API/DB changes on `/v1`.
- **MAJOR:** breaking product/API migration completed (often aligns with `/v2` or a flagged breaking release).

### Release checklist

1. Merge `dev` → `main` when ready for production.
2. Run `pnpm db:migrate` against the production database (if migrations shipped).
3. Deploy all apps (API, admin-center, client-portal, web) from the same `main` commit.
4. Update [CHANGELOG.md](../CHANGELOG.md): move `Unreleased` items into `[X.Y.Z] - YYYY-MM-DD`.
5. Bump `version` in root [package.json](../package.json).
6. Commit, tag, and push:

```bash
git tag -a v0.2.0 -m "Release v0.2.0"
git push origin main --follow-tags
# or: git push origin v0.2.0
```

7. Verify `GET /health` returns the expected `version` (and `gitSha` when env is set).

### Runtime version metadata

`GET /health` (unversioned) includes:

- `version` — from `APP_VERSION` env or root `package.json`
- `gitSha` — from `GIT_SHA`, `RAILWAY_GIT_COMMIT_SHA`, `VERCEL_GIT_COMMIT_SHA`, or `GITHUB_SHA` when present

Set `APP_VERSION` in production if the deploy layout cannot read the monorepo root `package.json`.

Optional automation: [Release Please](https://github.com/googleapis/release-please) runs on pushes to `main` (see `.github/workflows/release-please.yml`) and opens version-bump PRs from conventional commits. Until `main` exists, use the manual checklist above.

## HTTP API (`/v1`)

See [api-versioning.md](./api-versioning.md). Summary:

| Change type | Action |
|-------------|--------|
| New optional JSON field, new endpoint | Ship on `/v1`; minor product bump |
| Rename/remove field, stricter validation, enum removal | New `/v2` **or** update API + all portal consumers in one PR |
| BFF (`apps/admin-center/app/api/*`) | Proxies to `/v1`; no separate BFF version |

## Shared contracts

When a PR touches [packages/api-contracts](../packages/api-contracts/):

1. Update Zod schemas and TypeScript types under `v1/`.
2. Update Nest serializers/controllers and portal fetch/parse code in the **same PR**.
3. Run `pnpm typecheck` and API tests.

The meaningful contract label is the export path (`./v1/client-portal`), not the npm `0.0.0` package version.

## Database migrations

| Rule | Detail |
|------|--------|
| Dev apply | `pnpm db:migrate` (`prisma migrate deploy`) |
| Create migration | `doppler run -- pnpm --filter @cocreate/database db:migrate` (`migrate dev`) |
| Avoid drift | Do not use `db:push` after migrations exist on a shared DB |
| Failed migration | `prisma migrate resolve` when DB already matches migration SQL (see team runbooks) |
| Breaking schema | Expand → migrate data → contract → drop (never drop in use on `main` without dual-write period) |

## What we do not version (yet)

- Per-package semver via Changesets (no external npm consumers).
- Independent semver on `apps/admin-center`, `apps/client-portal`, etc.
- Replacing git-SHA deploy pins with package versions on Vercel/Railway.

Revisit Changesets if you publish `@cocreate/api-contracts` or ship mobile/third-party clients on long-lived API versions.

## Related docs

- [API versioning](./api-versioning.md)
- [Types and contracts](./types-and-contracts.md)
- [Doppler env](./doppler.md)
