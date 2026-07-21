# Windows laptop scroll lock (ScrollSmoother)

## Symptom

On **many Windows laptops**, the marketing site loads but **nothing scrolls** — home, about, work, contact, and project pages. Only the first viewport is usable.

It often works fine on:

- Mac
- Windows **desktop** (mouse)
- Phones

That combination is the clue: not “Windows is broken,” but a **hybrid touchpad** detection mismatch.

## Root cause

The app wraps all pages in `ScrollSmoothWrapper` (`apps/web/components/scrollsmoother-wrapper.tsx`).

There are two modes:

| Mode | When | How scrolling works |
|------|------|---------------------|
| **ScrollSmoother** | Desktop / fine pointer | `#smooth-wrapper` is `fixed inset-0 overflow-hidden`. Document scroll is disabled on purpose; GSAP ScrollSmoother moves `#smooth-content`. |
| **Native scroll** | Phones (`pointer: coarse`) or reduced motion | Wrapper is normal document flow (`min-h-svh`). Browser/`window` scroll works. |

### What went wrong

GSAP’s `ScrollTrigger.isTouch` is **not** a simple boolean:

| Value | Meaning |
|-------|---------|
| `0` | No touch capability (typical Mac / many desktop mice) |
| `1` | Touch-primary device (phones — usually also `pointer: coarse`) |
| `2` | Hybrid: “has touch points” but not touch-primary |

Many Windows **laptops** with Precision Touchpads report `navigator.maxTouchPoints > 0`, so GSAP sets **`isTouch === 2`**, even though the primary pointer is still **`(pointer: fine)`**.

The old code did roughly:

```ts
const useNative = prefersNativeScroll() || Boolean(ScrollTrigger.isTouch)
```

So on those laptops:

1. `Boolean(isTouch)` was **true** → **ScrollSmoother never started**
2. `prefersNativeScroll()` was **false** (`pointer: fine`) → wrapper CSS stayed **`fixed` + `overflow: hidden`**
3. Result: content visible, **nothing can scroll**

Phones still worked because `pointer: coarse` switched the CSS to the native shell. Desktops/Macs still worked because smoother ran (`isTouch === 0`).

```
Windows laptop (Precision Touchpad)
  → isTouch === 2
  → skip ScrollSmoother
  → wrapper still fixed + overflow:hidden
  → DEAD SCROLL
```

## Solution (shipped)

Commit / change in `scrollsmoother-wrapper.tsx` + note in `lib/scroll/native-scroll.ts`.

### 1. One shared rule for native vs smoother

```ts
function shouldUseNativeScroll() {
  return prefersNativeScroll() || ScrollTrigger.isTouch === 1
}
```

- Drive **both** wrapper CSS and create/skip smoother from this idea.
- **Do not** use `Boolean(ScrollTrigger.isTouch)` — that traps `isTouch === 2` hybrids.

Hybrids (`isTouch === 2`) get **ScrollSmoother** again (same shell as desktop).

### 2. Gate `normalizeScroll`

`normalizeScroll` is only enabled for real touch / coarse pointer, not for every smoother session. That avoids Observer eating wheel/trackpad input on Windows Chrome/Edge hybrids.

### 3. Do not key native mode off `maxTouchPoints` alone

Same false positive as `isTouch === 2`. Keep `prefersNativeScroll()` as:

- `(pointer: coarse)`, or
- `(prefers-reduced-motion: reduce)`

## How to verify on a “broken” Windows laptop

Hard-refresh the site, open DevTools console:

```js
navigator.maxTouchPoints
ScrollTrigger.isTouch
matchMedia('(pointer: coarse)').matches
getComputedStyle(document.querySelector('#smooth-wrapper')).position
!!ScrollSmoother.get()
```

| | Before (broken) | After (fixed) |
|--|-----------------|---------------|
| `maxTouchPoints` | often `> 0` | same |
| `ScrollTrigger.isTouch` | `2` | `2` (still fine) |
| `pointer: coarse` | `false` | `false` |
| `#smooth-wrapper` position | `fixed` | `fixed` |
| `ScrollSmoother.get()` | **`null`** | **truthy** |
| Trackpad / wheel | dead | scrolls |

Also smoke-test: Mac, Windows desktop, iPhone (native scroll), and reduced-motion preference.

## Key files

| File | Role |
|------|------|
| `apps/web/components/scrollsmoother-wrapper.tsx` | Mode switch + ScrollSmoother create |
| `apps/web/lib/scroll/native-scroll.ts` | `prefersNativeScroll()` |
| `apps/web/app/globals.css` | Extra `#smooth-wrapper` overrides under `@media (pointer: coarse)` |
| `apps/web/app/layout.tsx` | Wraps the app in `ScrollSmoothWrapper` |

## Regression guard

If scroll dies again on Windows laptops:

1. Check whether someone reintroduced `Boolean(ScrollTrigger.isTouch)` or keyed native mode off `maxTouchPoints`.
2. Confirm CSS and smoother still use the **same** native predicate (fixed shell without a running smoother = lock).

## Related: landscape “rotate phone” overlay

[`LandscapeWarning`](../apps/web/components/landscapeWarning.tsx) used to treat `min(screen.width, screen.height) < 600` as “phone.” On Windows, `screen` sizes are CSS pixels **after display scaling**, so a small/high-DPI laptop in landscape (always landscape) could get the full-screen rotate blocker.

It now requires landscape **and** `(pointer: coarse)` + `(hover: none)` **and** `min(innerWidth, innerHeight) < 530`. That keeps real phones (short edge ~430–440 max), excludes iPads/tablets, and still avoids `screen.*` / `maxTouchPoints` for device class.
