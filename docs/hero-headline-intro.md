# Home hero headline: blue letter pile under the nav

**Do not “fix” the intro by changing `gsap.from` math.** The pile was not caused by `y: -100`, stagger, or ease. Most speculative tweaks (defer, different `y`, skip-on-scroll, `overflow-hidden` masks) either failed or traded the pile for a worse intro.

Canonical intro (keep this):

```js
gsap.from(h1_text_split.words, {
  y: -100,
  opacity: 0,
  duration: 1.5,
  ease: "back.out",
  stagger: 0.07,
});
```

---

## Symptom

On `/`, a **blue gradient letter jumble** sat under the desktop nav / logo while (or instead of) the normal headline drop-in. Commenting out the headline `gsap.from` removed the pile (and the intro). About page was a red herring.

---

## Root causes (two layers + one bad safeguard)

### 1. Remount / dirty SplitText lifecycle (Presentation + home wiring)

Swapping tree branches when Presentation detection settled (cold SSR tree → live CMS tree) **remounted** `HomeHeroSection`. SplitText + `gsap.from` re-ran uncleanly; cleanup order mattered.

**Keep:**

- Always the same tree in [`home-landing.tsx`](../apps/web/components/home/home-landing.tsx): `LandingCmsProvider` → `HomeHeroFromCms` (no branch swap).
- Live merge stays inside [`landing-cms-provider.tsx`](../apps/web/components/home/landing-cms-provider.tsx) (`initial` when not Presentation; merge when it is). Stable query options + snapshot so identical data does not thrash consumers.
- On unmount: **kill tweens before** `SplitText.revert()`, then `ctx.revert()` (see cleanup in [`homeHeroSection.tsx`](../apps/web/components/homeHeroSection.tsx)).

### 2. Parent `h1` + word gradient = opacity hide fails in Chromium

The hero `h1` had `bg-clip-text` / `text-transparent` / `bg-linear-to-r` **and** [`splitTextGradient`](../apps/web/utils/util-funcs.ts) also styled SplitText words with clip + transparent fill.

Animating **opacity to 0** on those clipped/fill nodes does **not** reliably hide them. Words at `y: -100` (under the nav) stayed visible → blue pile.

**Keep:**

- No `bg-clip-text` / `text-transparent` / gradient utilities on the parent `h1`.
- Gradient only on an **inner** span per word; the outer SplitText word stays a normal opacity/`y` target.

Same class of footgun on **Contact** (`/contact`): parent `h1.contact-page-title` must **not** have `bg-clip-text` / `text-transparent` / gradient utilities. SplitText char wave in [`use-contact-headline-wave.ts`](../apps/web/hooks/use-contact-headline-wave.ts) paints gradient on **inner** spans only — otherwise iPhone SE shows a blue glyph scrap under the mobile nav.

### 3. Wrong safeguard: `overflow-hidden` on `.headline-text`

`className="headline-text relative overflow-hidden"` was added to “contain” the pile. It clipped words at `y: -100`, so the intro looked like a **mask / wipe** instead of a drop from above. Tween params were unchanged — the clip changed the feel.

**Fix:** `className="headline-text"` only. Do not re-add `overflow-hidden` here to “hide” offscreen words.

---

## What did *not* fix it (and burned time)

| Temptation | Why it failed |
|------------|----------------|
| Change `y`, duration, ease, stagger | Wrong layer; symptom moved or intro broken |
| Defer SplitText / wait on fonts / skip on any `lastScrollY` | Masked races; did not fix Chromium opacity + remount |
| `overflow-hidden` on `.headline-text` | Hid pile by clipping the real intro |
| Blame About / nav alone | Reproduce: kill headline `gsap.from` → pile gone |
| Put gradient back on the parent `h1` “for design parity” | Pile returns |

---

## Success criteria

- Words drop in from above (`y: -100`), **not** clipped/masked
- No blue jumble under the nav
- Presentation still live-merges via `LandingCmsProvider` without remounting the hero subtree

---

## Key files

| Role | Path |
|------|------|
| Intro + cleanup | `apps/web/components/homeHeroSection.tsx` |
| Stable tree | `apps/web/components/home/home-landing.tsx` |
| Presentation merge | `apps/web/components/home/landing-cms-provider.tsx` |
| Inner-span gradient | `apps/web/utils/util-funcs.ts` |

Related Presentation remount lessons: [sanity-presentation-lessons.md](./sanity-presentation-lessons.md).
