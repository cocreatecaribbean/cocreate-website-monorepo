import {
  DEFAULT_AGENCY_INTRO,
  DEFAULT_HERO_REEL_FALLBACK_SRC,
} from '@/site-info/landing-page-defaults'

export type LandingPageContent = {
  heroReelPlaybackId: string | null
  agencyIntro: string
  fallbackVideoSrc: string
}

export type SanityLandingPageRow = {
  heroReelPlaybackId?: string | null
  agencyIntro?: string | null
}

export function withLandingPageDefaults(
  row: SanityLandingPageRow | null | undefined,
): LandingPageContent {
  const intro = row?.agencyIntro?.trim()
  const playbackId = row?.heroReelPlaybackId?.trim() || null

  return {
    heroReelPlaybackId: playbackId,
    agencyIntro: intro || DEFAULT_AGENCY_INTRO,
    fallbackVideoSrc: DEFAULT_HERO_REEL_FALLBACK_SRC,
  }
}

/** Merge live Presentation row over server initial (empty fields keep defaults via withLandingPageDefaults). */
export function mergeLandingPageContent(
  initial: LandingPageContent,
  live: SanityLandingPageRow | null | undefined,
): LandingPageContent {
  if (!live) return initial
  return withLandingPageDefaults({
    heroReelPlaybackId:
      live.heroReelPlaybackId !== undefined
        ? live.heroReelPlaybackId
        : initial.heroReelPlaybackId,
    agencyIntro:
      live.agencyIntro !== undefined ? live.agencyIntro : initial.agencyIntro,
  })
}
