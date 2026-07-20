/** Shared hero frame-sequence paths (safe for server + client). */

export const HERO_SEQUENCES = {
  landscape: {
    frameCount: 240,
    width: 1920 * 2,
    height: 1080 * 2,
    path: (i: number) =>
      `/cocreate-logo-shapes-anim-web-desktop/cocreate-logo-shapes-anim-web-desktop_${i}.webp`,
  },
  portrait: {
    frameCount: 200,
    width: 1080,
    height: 1920,
    path: (i: number) =>
      `/cocreate-logo-shapes-anim-web-mobile/cocreate-logo-shapes-anim-web-mobile_${i}.webp`,
  },
} as const

export type HeroSequenceKey = keyof typeof HERO_SEQUENCES

/** First-frame URLs for `<link rel="preload">` on the home route. */
export const HERO_SEQUENCE_FRAME1 = {
  landscape: HERO_SEQUENCES.landscape.path(1),
  portrait: HERO_SEQUENCES.portrait.path(1),
} as const
