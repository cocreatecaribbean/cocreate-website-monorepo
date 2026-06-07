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
- Suggestions API: `GET /api/search/suggestions?limit=8` (clients + tags when the overlay opens)
- UI: search overlay with live results (categories, tags, clients, work projects, originals)
- Project pages: `/work/[slug]` with sidebar headline layout and tag chips

### Filters on Work

- URL: `/work?client={clientSlug}` (e.g. `/work?client=proven`), `/work?category=digital`, or `/work?tag={tagSlug}`
- Project URL: `/work/{projectSlug}` (e.g. `/work/proven`)
- Client slug: `toClientSlug` in `apps/web/lib/client-slug.ts`
- Tag slug: `toTagSlug` in `apps/web/lib/tag-slug.ts`
- Clicking a **client** or **tag** in search opens the matching filtered work index

### Tags

- Sanity field: `workProject.tags` (string array)
- Project detail sidebar: linked tag chips (`ProjectTags`)
- Search matches tag names on projects and surfaces dedicated tag results
- Empty search overlay shows client and tag suggestions from published projects

## Content sources

- **Work** (`/work`, `/work/[slug]`, homepage arc gallery): `WORK_PROJECTS_QUERY` and related queries in `apps/web/lib/cms/work-projects.ts`
- **Originals** (`/originals`): `ORIGINALS_QUERY` in `apps/web/lib/cms/originals.ts`
- Search maps the same preview payloads into `SearchResult`; overlay UI and `/work?client=` behavior unchanged
