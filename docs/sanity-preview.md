# Sanity Presentation preview

Editors preview Home and Work content from Sanity Studio in an embedded iframe on the marketing site. Draft mode, live content updates, and visual editing follow the [joh-webapp](https://github.com/) pattern.

**Read first if wiring Presentation on another app:** [sanity-presentation-lessons.md](./sanity-presentation-lessons.md) — problems we hit (draft leaks, 10s load, 404s, empty back-nav, tile rounding) and the final joh-aligned fixes. Do not invent new draft cookies or soft-nav exceptions.

## Architecture

| App | Reads dataset via | Preview role |
|-----|-------------------|--------------|
| **Marketing** (`apps/web`) | `NEXT_PUBLIC_SANITY_DATASET` | Presentation iframe target; `/api/draft` enables draft mode |
| **Studio** (`apps/cocreate-webapp-studio`) | `SANITY_STUDIO_DATASET` (Vite — not `NEXT_PUBLIC_*`) | Opens Presentation; writes CMS |

**Rule:** Studio dataset and web dataset must match for a preview session (preview URL secrets are per dataset).

### Hostnames (staging / production)

| Host | App |
|------|-----|
| `https://hq-preview.cocreatecaribbean.com` | **Studio** (sandbox) |
| `https://preview.cocreatecaribbean.com` | **Marketing** preview — Presentation iframe + `/api/revalidate` |
| `https://hq.cocreatecaribbean.com` | **Marketing** production |
| `http://localhost:3333` / `http://localhost:3000` | Local Studio / marketing |

`SANITY_STUDIO_PREVIEW_URL` must be the **marketing** origin (`preview…` or localhost:3000), never the Studio host (`hq-preview…`).

## Environment tiers

| Tier | Sanity | Who |
|------|--------|-----|
| **Sandbox** | `dev` | Local `pnpm dev`, Studio at `hq-preview`, marketing at `preview` |
| **Live** | `production` | `hq.cocreatecaribbean.com`, production marketing site |

See also [doppler.md](./doppler.md) for portal/API/Supabase tiers (separate from CMS).

## Doppler keys

### `dev` (local only — `doppler.yaml`)

| Key | Example |
|-----|---------|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | `5ix7h4ht` |
| `NEXT_PUBLIC_SANITY_DATASET` | `dev` |
| `SANITY_STUDIO_DATASET` | `dev` |
| `SANITY_API_TOKEN` | dev token (Viewer or Editor) |
| `SANITY_STUDIO_PREVIEW_URL` | `http://localhost:3000` |
| `NEXT_PUBLIC_SANITY_STUDIO_URL` | `http://localhost:3333` |
| `SANITY_REVALIDATE_SECRET` | random (`openssl rand -base64 32`) |

### `stg_sanity_studio` (hosted Studio on Vercel — staging)

Sync this config to the Studio Vercel project (not root `dev`).

| Key | Example |
|-----|---------|
| `SANITY_STUDIO_DATASET` | `dev` |
| `SANITY_STUDIO_PREVIEW_URL` | `https://preview.cocreatecaribbean.com` |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | `5ix7h4ht` |
| `NEXT_PUBLIC_SANITY_DATASET` | `dev` |

**`SANITY_STUDIO_PREVIEW_URL` is the marketing site** Presentation iframes into (`preview.cocreatecaribbean.com`). It is **not** the Studio hostname (`hq-preview.cocreatecaribbean.com`). Baked at **build time** — redeploy Studio after changing it. Local `dev` keeps localhost; do not sync `dev` to Vercel Studio.

**First Vercel deploy:** Studio builds with **no env** (code defaults: dataset `dev`, preview `https://preview.cocreatecaribbean.com`). Then sync Doppler → `stg_sanity_studio` and **redeploy** so secrets bake in.

### Hosted Studio: stale chunk / “Failed to fetch dynamically imported module”

After a Studio redeploy, an open tab can still request old hashed files under `/static/` (for example `refractor-….js` from Vision). If that file is gone, a catch-all SPA rewrite that maps everything to `index.html` makes the browser treat HTML as a JS module → `TypeError: Failed to fetch dynamically imported module`.

**Recovery:** hard-refresh Studio (`Cmd+Shift+R`) or open a private window on `hq-preview`. If it still fails on a fresh load, redeploy the Studio Vercel project.

**Deploy config:** [`apps/cocreate-webapp-studio/vercel.json`](../apps/cocreate-webapp-studio/vercel.json) rewrites SPA routes but **excludes** `/static/*`, so missing hashed assets return **404** instead of the HTML shell. This is unrelated to image/Mux uploads or About schema — those use Sanity’s asset API once Studio JS loads.

## Local workflow

```bash
doppler setup   # config: dev
pnpm dev        # web :3000 + studio :3333
pnpm dev:studio # studio only
```

1. Open Studio → **Presentation** tab (or edit Home / Work / About).
2. Preview opens `/` (Home / `landingPage`) by default, or `/work` / `/work/[slug]` / `/about` when editing those pages.
3. Navbar shows **Dataset: dev** (red badge on production).

**Document pane:** Presentation only lists real Sanity documents mapped in [`presentation/resolve.ts`](../apps/cocreate-webapp-studio/presentation/resolve.ts).

| Route | Documents in the pane |
|-------|------------------------|
| `/` | `landingPage` singleton |
| `/work` | `workPage` singleton (titles + embedded projects) |
| `/about` | `aboutPage` singleton (hero + embedded testimonials) |

Home, Work, and About page singletons are **auto-created** when Studio loads (`ensure-page-singletons` via `createIfNotExists`) with default copy. Existing docs are never overwritten.

On first Studio load after the Work model change, any legacy standalone `workProject` **documents** are migrated once into `workPage.projects`, then deleted. Legacy standalone `testimonial` documents are migrated once into `aboutPage.testimonials`, then deleted.

### Adding and editing Work projects (joh currency pattern)

Same idea as joh FX **currency rows**: one document in the right pane, projects are an **array of objects**, and **Add item** at the bottom of the form creates a new project section.

**Clients are shared documents** (one Client = source of truth). Inside each project section, the Client field lets you pick an existing client, create a new one, or edit name/logo **inline**. Renaming a client updates every project that references it.

1. Open Presentation → navigate to **Work** (`/work`) in the iframe (or Structure → Work page).
2. Right pane shows the **Work page**: title lines + **Projects** array.
3. Expand a project section to edit it, or scroll to the bottom and click **Add item** to create a new project.
4. Drag projects in the array to reorder the Work grid (array order = display order).
5. Set **Published at** (and add a cover) when a project should go live on the public site.
6. `/work/[slug]` URLs still work — they resolve the matching project inside `workPage.projects`.

Home ↔ Work in the iframe switches Presentation between `landingPage` and `workPage` via stock `mainDocuments` (no custom header buttons). There is **no** All projects / Add project header.

Structure → **Work page** + **Clients** for bulk management. Global Create (+) does not create standalone projects (they only exist on the Work page array).

### About page (hero + testimonials)

Same embedded-array pattern as Work projects:

1. Open Presentation → navigate to **About** (`/about`) in the iframe (or Structure → About page).
2. Right pane shows the **About page**: hero media type (image **or** Mux video), hero heading/body, testimonials section title, and **Testimonials** array.
3. Expand a testimonial section to edit it, or scroll to the bottom and click **Add item**. Array order = carousel order.
4. Page title lines and the services section stay **code-only** for this pass.

About hero + testimonials **live-update** via `usePresentationQuery` on `aboutPage`. Live `/about` stays published-only (same joh dual gate as Home/Work).

Structure → **About page** for bulk management. Global Create (+) does not create standalone testimonials.

**Mocks vs CMS:** Gallery / About testimonial mocks are **code-only** fallbacks when Sanity is **not** configured. When Sanity is configured (including Presentation), empty CMS means empty content — never a flash of mock tiles while live data loads. Presentation paints **SSR draft tiles first** (lean index query — no full Mux video joins), then upgrades via `usePresentationQuery`. Home’s arc gallery skips draft projects with no cover; covers are optional until publish.

**Public vs draft (same as joh):** Unpublished projects must never appear on the live site. Public fetches use `perspective: published` plus `publishedAt <= now`.

- **Sanity Live / Visual Editing** mount when Next draft mode is on; Visual Editing only renders inside an iframe.
- **Draft SSR content** only when `draftMode()` is on **and** proxy sets `x-preview-context: embedded` — that header is set only for draft cookie + (`sec-fetch-dest: iframe` **or** Studio referer). A leftover `__prerender_bypass` cookie alone stays published.
- Exit via `/api/draft/disable`.

Work project tiles **live-update** via `usePresentationQuery` reading `workPage.projects`. Page titles live-update too.

`next-sanity@12.4.5` is patched (`patches/next-sanity@12.4.5.patch`) so the first Presentation query listen fires immediately instead of waiting for the default 10s heartbeat interval.

Hard-reload Studio after schema / Presentation resolver changes.

### Home publish checklist (live site not updating)

1. **Dataset badge** in Studio must match the site you are checking (`dev` → local/preview, `production` → `hq…`). Publishing to `dev` never updates production.
2. Hard-refresh the **public** URL (not Presentation draft mode).
3. Marketing published fetches use Sanity **API** (`useCdn: false`) so Publish is not stuck behind CDN TTL.
4. Deployed hosts also need the Sanity **webhook** → `/api/revalidate` (see below) so Next ISR busts; local `pnpm dev` does not need the webhook.

### Common mistakes

| Symptom | Fix |
|---------|-----|
| 401 on `/api/draft` | Studio and web use different datasets — align `SANITY_STUDIO_DATASET` and `NEXT_PUBLIC_SANITY_DATASET` |
| Local Studio hits production | Set `SANITY_STUDIO_DATASET=dev` in Doppler (Studio ignores `NEXT_PUBLIC_*` alone) |
| Hosted Studio previews localhost / CLI config cannot be loaded | First deploy needs no env (code defaults). Then sync `stg_sanity_studio` and redeploy — do not sync root `dev` |

## Sanity.io dashboard

Three different Manage settings — do not conflate them:

| Setting | What it does |
|---------|----------------|
| **CORS origins** | Lets the browser call Sanity APIs from Studio / marketing origins |
| **Register studio / development host** | Allowlists the **Studio hostname** so a hosted Studio can load (the “Connect this studio” screen) |
| **Webhooks** | Server-to-server: on **Publish**, Sanity POSTs the marketing site to bust Next.js cache |

### CORS origins

Add to project `5ix7h4ht` (Allow credentials as needed):

- `http://localhost:3000` — local marketing
- `http://localhost:3333` — local Studio
- `https://preview.cocreatecaribbean.com` — marketing **preview** (Presentation iframe / `SANITY_STUDIO_PREVIEW_URL`)
- `https://hq-preview.cocreatecaribbean.com` — **Studio** sandbox
- `https://hq.cocreatecaribbean.com` — marketing **production**

### Studio host registration

If Studio at `https://hq-preview.cocreatecaribbean.com` shows **“Connect this studio to your project”**, the Studio URL is not allowlisted yet. In that screen:

- **Register this studio** — stable editor-facing Studio (recommended for `hq-preview`)
- **Add development host** — localhost / throwaway preview URLs only

Registering Studio does not change `SANITY_STUDIO_PREVIEW_URL` or webhook URLs — those still target **marketing** (`preview…` / `hq…`).

### Publish webhooks (cache revalidation)

#### What they do

When an editor **Publishes** (or deletes) a Work-related document, Sanity can notify the marketing Next.js app so cached pages refresh without waiting for a full rebuild.

Flow:

1. Sanity → `POST /api/revalidate` on **marketing** (`apps/web`) — not Studio, not the Nest API
2. Handler checks `Authorization: Bearer` against that deployment’s `SANITY_REVALIDATE_SECRET`
3. Calls `revalidatePath('/')` for `landingPage`, `/about` for `aboutPage`, `/work` (+ slug) for work docs ([`apps/web/app/api/revalidate/route.ts`](../apps/web/app/api/revalidate/route.ts))

This is **not** how Presentation draft preview works. Draft preview uses `/api/draft` + live content in the iframe.

#### Preview vs production — create two webhooks

In Sanity Manage → project `5ix7h4ht` → **API** → **Webhooks** → **Create webhook**. Create **separate** hooks (one per dataset / marketing host). Do not point a `production` dataset hook at the preview host, or vice versa. Studio (`hq-preview`) never serves `/api/revalidate`.

| Webhook name (example) | Dataset | URL |
|------------------------|---------|-----|
| Marketing preview revalidate | `dev` | `https://preview.cocreatecaribbean.com/api/revalidate` |
| Marketing production revalidate | `production` | `https://hq.cocreatecaribbean.com/api/revalidate` |

Use the `SANITY_REVALIDATE_SECRET` from that same marketing site’s Doppler / Vercel env as the Bearer token (preview secret for preview URL, production secret for production URL).

#### Field-by-field (Sanity webhook form)

Paste values **exactly** as shown — no surrounding backticks (backticks in this doc are markdown only).

##### Name

Any label you will recognize later, e.g. `Marketing preview revalidate` or `Marketing production revalidate`.

##### URL

Full path to the marketing app’s revalidate route (include `https://` and `/api/revalidate`):

| Webhook | Paste this |
|---------|------------|
| Preview | `https://preview.cocreatecaribbean.com/api/revalidate` |
| Production | `https://hq.cocreatecaribbean.com/api/revalidate` |

Wrong: Studio host (`hq-preview…`), missing path, or `http://`.

##### Dataset

Which Sanity dataset can fire this hook:

| Webhook | Dataset |
|---------|---------|
| Preview | `dev` |
| Production | `production` |

##### Trigger on

Check all three:

- **Create**
- **Update**
- **Delete**

Meaning: publish a new doc, publish edits, or delete a published doc all refresh the site. Unchecking one of these means that event will not revalidate.

##### Filter

GROQ that decides **which documents** trigger the hook. Paste this (one line, no backticks):

```
(_type == "client" || _type == "landingPage" || _type == "workPage" || _type == "aboutPage") && !(_id in path("drafts.**"))
```

| Piece | Meaning |
|-------|---------|
| `_type == "client" \|\| _type == "landingPage" \|\| _type == "workPage" \|\| _type == "aboutPage"` | Clients, Home, Work, and About singletons (matches what `/api/revalidate` handles) |
| `!(_id in path("drafts.**"))` | Ignore draft documents so **Save** does not hit the public site — **Publish** does |

Omit any of those types and that content will not revalidate on publish.

##### Projection

Shapes the JSON **body** Sanity POSTs to your URL.

**Recommended for this app** (minimal; paste exactly):

```
{_type, "slug": slug}
```

| Field | Meaning |
|-------|---------|
| `_type` | Document type — handler skips unknown types |
| `"slug": slug` | Sends the slug object so the handler can call `revalidatePath('/work/' + slug.current)` |

**Also OK:** leave Projection **empty**. Sanity then sends the full document after the change. The route still works; the payload is larger.

Do **not** put markdown backticks in the Projection box.

##### Enable webhook

Checked = live. Unchecked = saved but never fires.

##### HTTP method (Advanced)

`POST` — required. The Next.js route only implements `POST`.

##### HTTP headers (Advanced)

Add **one** header so the marketing app accepts the request:

| Name (exact) | Value (exact pattern) |
|--------------|------------------------|
| `Authorization` | `Bearer ` + your site’s `SANITY_REVALIDATE_SECRET` (space after `Bearer`) |

Examples of shape (use your real secret, not these placeholders):

```
Authorization
Bearer abc123YourSecretFromDoppler
```

| Correct | Wrong |
|---------|--------|
| Name `Authorization` | Name `Bearer` or `Auth` |
| Value starts with `Bearer ` then the secret | Secret alone with no `Bearer ` |
| Same secret as that marketing deployment | Studio env secret, or production secret on the preview webhook |

Leave the second empty header row blank.

##### API version (Advanced)

Leave Sanity’s default (e.g. `v2021-03-25`) unless you have a reason to change it. Filters/projections use that GROQ API version.

##### Drafts / Versions (Advanced)

- **Trigger webhook when drafts are modified** — **unchecked**. Draft saves must not revalidate the public site (filter also excludes drafts).
- **Trigger webhook when versions are modified** — **unchecked** unless you use Content Releases / versions and want those to revalidate too (we do not for this setup).

##### Secret (Advanced)

Leave **empty** for this project.

Sanity’s “Secret” field is a separate HMAC signing mechanism. Our handler does **not** verify that; it only checks the `Authorization: Bearer …` header. Putting a value here does nothing useful for `/api/revalidate` and can confuse setup. Auth = HTTP header only.

#### Local development

Day-to-day local editing (`pnpm dev` web + studio) needs **no** Sanity webhook. Presentation talks to `http://localhost:3000` via draft mode; `next dev` is not relying on production ISR the way Vercel does.

Optional — smoke-test the handler with Doppler `dev` loaded:

```bash
curl -X POST http://localhost:3000/api/revalidate \
  -H "Authorization: Bearer $SANITY_REVALIDATE_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"_type":"workProject","slug":{"current":"example"}}'
```

Optional — receive real Sanity deliveries against localhost: tunnel (ngrok / Cloudflare) + a temporary Manage webhook. Not required for normal Studio work.

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
| Presentation routes + Used on | `apps/cocreate-webapp-studio/presentation/resolve.ts` |
| Work page schema (titles + projects array) | `apps/cocreate-webapp-studio/schemaTypes/workPage.ts` |
| Project object schema | `apps/cocreate-webapp-studio/schemaTypes/workProject.ts` |
| About page schema (hero + testimonials array) | `apps/cocreate-webapp-studio/schemaTypes/aboutPage.ts` |
| Testimonial object schema | `apps/cocreate-webapp-studio/schemaTypes/aboutTestimonial.ts` |
| Singleton + legacy project/testimonial migration | `apps/cocreate-webapp-studio/plugins/ensure-page-singletons.tsx` |
| Draft enable/disable | `apps/web/app/api/draft/` |
| Preview fetch | `apps/web/lib/server/sanity.ts` |
| Work live Presentation query | `apps/web/lib/sanity/work-presentation-query.ts` |
| About live Presentation query | `apps/web/lib/sanity/about-presentation-query.ts` |
| Embedded gate | `apps/web/proxy.ts` |
| Page GROQ queries | `apps/web/sanity/lib/queries.ts` |
| Revalidate webhook | `apps/web/app/api/revalidate/route.ts` |
