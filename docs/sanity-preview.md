# Sanity Presentation preview (Work / Projects)

Editors preview Work content from Sanity Studio in an embedded iframe on the marketing site. Draft mode, live content updates, and visual editing follow the [joh-webapp](https://github.com/) pattern.

## Architecture

| App | Reads dataset via | Preview role |
|-----|-------------------|--------------|
| **Marketing** (`apps/web`) | `NEXT_PUBLIC_SANITY_DATASET` | Presentation iframe target; `/api/draft` enables draft mode |
| **Studio** (`apps/cocreate-webapp-studio`) | `SANITY_STUDIO_DATASET` (Vite — not `NEXT_PUBLIC_*`) | Opens Presentation; writes CMS |

**Rule:** Studio dataset and web dataset must match for a preview session (preview URL secrets are per dataset).

## Environment tiers

| Tier | Sanity | Who |
|------|--------|-----|
| **Sandbox** | `dev` | Local `pnpm dev`, `hq-dev`, marketing preview site |
| **Live** | `production` | `hq.cocreatecaribbean.com`, production marketing site |

See also [doppler.md](./doppler.md) for portal/API/Supabase tiers (separate from CMS).

## Doppler keys

### `dev` (local + sandbox deploys)

| Key | Example |
|-----|---------|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | `5ix7h4ht` |
| `NEXT_PUBLIC_SANITY_DATASET` | `dev` |
| `SANITY_STUDIO_DATASET` | `dev` |
| `SANITY_API_TOKEN` | dev token (Viewer or Editor) |
| `SANITY_STUDIO_PREVIEW_URL` | `http://localhost:3000` |
| `NEXT_PUBLIC_SANITY_STUDIO_URL` | `http://localhost:3333` |
| `SANITY_REVALIDATE_SECRET` | random (`openssl rand -base64 32`) |

### `prd` (production Vercel)

| Key | Marketing Vercel | Studio Vercel (`hq`) |
|-----|------------------|----------------------|
| `NEXT_PUBLIC_SANITY_DATASET` | `production` | — |
| `SANITY_STUDIO_DATASET` | — | `production` |
| `SANITY_API_TOKEN` | prod token | optional |
| `SANITY_STUDIO_PREVIEW_URL` | — | `https://cocreatecaribbean.com` |
| `NEXT_PUBLIC_SANITY_STUDIO_URL` | `https://hq.cocreatecaribbean.com` | — |
| `SANITY_REVALIDATE_SECRET` | same secret | — |

**Hosted Studio:** `SANITY_STUDIO_PREVIEW_URL` is the **marketing site** origin (iframe target), not the Studio URL. It is baked at **build time** — redeploy after changing it.

## Local workflow

```bash
doppler setup   # config: dev
pnpm dev        # web :3000 + studio :3333
pnpm dev:studio # studio only
```

1. Open Studio → **Presentation** tab (or edit a Work project).
2. Preview opens `/work` or `/work/[slug]` with draft content in the iframe.
3. Navbar shows **Dataset: dev** (red badge on production).

### Common mistakes

| Symptom | Fix |
|---------|-----|
| 401 on `/api/draft` | Studio and web use different datasets — align `SANITY_STUDIO_DATASET` and `NEXT_PUBLIC_SANITY_DATASET` |
| Local Studio hits production | Set `SANITY_STUDIO_DATASET=dev` in Doppler (Studio ignores `NEXT_PUBLIC_*` alone) |
| Hosted Studio previews localhost | Set `SANITY_STUDIO_PREVIEW_URL` on the **Studio** Vercel project to the public marketing URL and redeploy |

## Sanity.io dashboard

### CORS origins

Add to project `5ix7h4ht`:

- `http://localhost:3000`
- `http://localhost:3333`
- `https://hq.cocreatecaribbean.com`
- `https://hq-dev.cocreatecaribbean.com` (sandbox Studio)
- Marketing preview / production URLs

### Publish webhook

**API → Webhooks → Create:**

- URL: `POST https://<marketing-domain>/api/revalidate`
- Header: `Authorization: Bearer <SANITY_REVALIDATE_SECRET>`
- Filter: `(_type == "workProject" || _type == "client") && !(_id in path("drafts.**"))`
- Triggers: create, update, delete

Draft **Save** does not revalidate the live site — only **Publish** does.

## Promoting content dev → production

| Method | When |
|--------|------|
| Recreate on `hq` | First few projects, learning phase |
| `sanity dataset export dev …` + `import … production` | Any plan; full or partial |
| `sanity datasets copy dev production` | Business+; replaces entire production dataset |

```bash
cd apps/cocreate-webapp-studio
sanity dataset export dev dev-backup.tar.gz
sanity dataset import dev-backup.tar.gz production --replace
```

## Code map

| Piece | Path |
|-------|------|
| Studio env + guards | `apps/cocreate-webapp-studio/env.ts` |
| Presentation routes | `apps/cocreate-webapp-studio/presentation/resolve.ts` |
| Draft enable/disable | `apps/web/app/api/draft/` |
| Preview fetch | `apps/web/lib/server/sanity.ts` |
| Embedded gate | `apps/web/proxy.ts` |
| Work preview queries | `apps/web/sanity/lib/queries.ts` |
| Revalidate webhook | `apps/web/app/api/revalidate/route.ts` |
