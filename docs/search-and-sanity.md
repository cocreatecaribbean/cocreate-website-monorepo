# Search & Sanity content

## Sanity Studio (`apps/cocreate-webapp-studio`)

Document types (ready for editors):

| Type | Purpose |
|------|---------|
| `client` | Client name, slug, logo, description |
| `workProject` | Project linked to a client — title, slug, **category**, cover, summary, tags |
| `original` | Studio originals — title, slug, cover, format, description |

Run studio: `pnpm dev` (includes studio) or from `apps/cocreate-webapp-studio`: `pnpm dev`.

GROQ query stubs live in `apps/web/sanity/lib/queries.ts` for when Work/Originals fetch from Sanity.

## Static search (current)

- Index: `apps/web/lib/search/static-search.ts` (work from `gallery-data.ts`, originals from `originals-data.ts`)
- API: `GET /api/search?q=...&limit=12`
- UI: search overlay with live results (categories, clients, work projects, originals)
- Project pages: `/work/[slug]` with sidebar headline layout

### Client filter on Work

- URL: `/work?client={clientSlug}` (e.g. `/work?client=proven`) or `/work?category=digital`
- Project URL: `/work/{projectSlug}` (e.g. `/work/proven`)
- Slug derived from client display name (`toClientSlug` in `apps/web/lib/client-slug.ts`)
- Clicking a **client** result in search opens all projects for that client

## Next step (Sanity-backed search)

1. Fetch work/originals with `WORK_PROJECTS_QUERY` / `ORIGINALS_QUERY`
2. Replace `searchSite()` body with GROQ or map Sanity payloads into `SearchResult`
3. Keep the same overlay UI and `/work?client=` behavior
