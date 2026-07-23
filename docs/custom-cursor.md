# Marketing site custom cursor

Canonical approach for the CoCreate mark as the site cursor. **Use native CSS `cursor: url(...)` only.** Do not reintroduce a JS follower, `cursor: none`, or transparent hide-cursor hacks — those burned days and still failed in Chrome.

## What ships

| Piece | Location |
|-------|----------|
| Cursor CSS | [`apps/web/app/globals.css`](../apps/web/app/globals.css) — `@media (hover: hover) and (pointer: fine)` block |
| Runtime asset | [`apps/web/public/cocreate-cursor-32.png`](../apps/web/public/cocreate-cursor-32.png) — **32×32 RGBA PNG** |
| Source art | [`apps/web/public/cocreate-cursor.svg`](../apps/web/public/cocreate-cursor.svg) (and optional 64×64 source PNG) |

Hotspot is `1 1` (near top-left tip of the mark). Text fields keep `cursor: text` so the I-beam stays for typing.

```css
@media (hover: hover) and (pointer: fine) {
  html,
  body,
  *,
  *::before,
  *::after {
    cursor: url('/cocreate-cursor-32.png') 1 1, auto !important;
  }

  input:not([type='checkbox']):not([type='radio']):not([type='range']):not([type='file']),
  textarea,
  select,
  [contenteditable='true'] {
    cursor: text !important;
  }
}
```

`!important` is required so Tailwind `cursor-pointer` / `hover:cursor-pointer` utilities do not win.

## Asset rules (non-negotiable)

Chrome (Blink) **silently rejects** a custom cursor image and falls back to the system arrow when any of these fail. Safari is pickier about size too.

| Requirement | Why |
|-------------|-----|
| **≤ 128×128 px** (prefer **32×32**) | Browser max; Safari is unreliable above ~32 |
| **RGBA truecolor PNG** (`8-bit/color RGBA`) | Indexed-color / colormap PNGs are often rejected |
| **Transparent background** | Opaque backgrounds show as a box behind the mark |
| **Same-origin file under `/public`** | Path like `/cocreate-cursor-32.png` |
| **Hotspot in bounds** | `url(...) X Y` — tip of the mark is near `1 1` |

The design PNG at `cocreate-cursor.png` (64×64 **colormap**) is **not** safe to use as-is in `cursor: url()`. Always serve the 32×32 RGBA export.

### Regenerate from SVG

```bash
cd apps/web
magick -background none -density 256 public/cocreate-cursor.svg \
  -resize 32x32 -strip PNG32:public/cocreate-cursor-32.png
file public/cocreate-cursor-32.png
# expect: PNG image data, 32 x 32, 8-bit/color RGBA, non-interlaced
```

## Scope

- **In:** marketing site (`apps/web`) for fine pointers only (mouse / trackpad).
- **Out:** phones/tablets (`pointer: coarse` / no hover), client portal, admin, OS-level cursor.

Site CSS **cannot** change the macOS/Windows system cursor outside the browser tab. If the OS pointer looks broken after cursor experiments, quit Chrome fully (`Cmd+Q`) or restart — that is a compositor glitch, not leftover CSS.

## Verify the *served* CSS (do this every time)

Turbopack can keep serving a **stale CSS chunk** while `globals.css` on disk looks correct. That was the real Chrome failure mode: source said brand PNG, browser still got an old transparent 1×1 / hide rule → default arrow only.

After changing cursor CSS:

1. Hard-refresh the page (`Cmd+Shift+R`).
2. Confirm the asset loads: `curl -sI http://localhost:3000/cocreate-cursor-32.png` → `200`, `Content-Type: image/png`.
3. Confirm the live stylesheet contains the rule (not an old one):

```bash
# pull homepage, find main CSS chunk, grep for the cursor file name
curl -s http://localhost:3000/ | rg -o '/_next/static/chunks/[^"]+\.css'
# then:
curl -s "http://localhost:3000/<that-chunk>" | rg -n 'cocreate-cursor'
```

You want `url("/cocreate-cursor-32.png") 1 1`. If you still see an old `data:image/png;base64,...` 1×1, `cursor: none`, or no match at all: delete `apps/web/.next` and restart `pnpm dev`, then re-check.

In DevTools: hover an element → Computed → `cursor` → expand the arrow. The winning rule must point at `/cocreate-cursor-32.png`. If Computed shows only `auto` / `pointer` with no `url(...)`, the image was rejected or the CSS never reached the browser.

## What not to do (failed approaches)

| Approach | Why it failed |
|----------|----------------|
| SVG in `cursor: url(...)` | Unreliable across browsers, especially Safari |
| 64×64 indexed-color PNG as cursor | Chrome rejects → silent fallback to default arrow |
| `cursor: none` + JS image follower | Chrome often still paints the system arrow → dual cursor; fighting `none` is a known Blink mess |
| Transparent 1×1 PNG / data-URI “hide” cursor | Different Blink path; often still shows the OS arrow, or invalidates the whole declaration |
| JS-toggled `html.has-cocreate-cursor` class | Too late / easy to lose the race; paint-time static CSS is enough |
| Stamping `cursor` on every hit-target via JS | Fragile, leaves inline styles, still loses to Chrome hide bugs |
| Assuming disk CSS === served CSS | Turbopack stale chunks made “fixes” look like they did nothing |

If you only see the default arrow: first check **served** CSS and **asset format**, not more hide/follower hacks.

## Checklist for a future change

1. Export / regenerate **32×32 RGBA** PNG; confirm with `file`.
2. Point CSS at `/that-file.png` with hotspot + `auto` fallback + `!important`.
3. Keep text-field exception.
4. Keep `@media (hover: hover) and (pointer: fine)`.
5. Verify **served** CSS chunk and Computed `cursor` in Chrome and Safari.
6. Do not add a JS cursor layer unless product explicitly accepts dual-cursor risk on Chrome.
