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

## Site search (current)

- Index: `apps/web/lib/search/site-search.ts` (work and originals from Sanity via `fetchWorkProjectPreviews` / `fetchOriginalPreviews`; empty when Sanity is unavailable or has no published documents)
- API: `GET /api/search?q=...&limit=12`
- UI: search overlay with live results (categories, clients, work projects, originals)
- Project pages: `/work/[slug]` with sidebar headline layout

### Client filter on Work

- URL: `/work?client={clientSlug}` (e.g. `/work?client=proven`) or `/work?category=digital`
- Project URL: `/work/{projectSlug}` (e.g. `/work/proven`)
- Slug derived from client display name (`toClientSlug` in `apps/web/lib/client-slug.ts`)
- Clicking a **client** result in search opens all projects for that client

## Content sources

- **Work** (`/work`, `/work/[slug]`, homepage arc gallery): `WORK_PROJECTS_QUERY` and related queries in `apps/web/lib/cms/work-projects.ts`
- **Originals** (`/originals`): `ORIGINALS_QUERY` in `apps/web/lib/cms/originals.ts`
- Search maps the same preview payloads into `SearchResult`; overlay UI and `/work?client=` behavior unchanged
