'use client'

import HomeHeroSection from '@/components/homeHeroSection'
import {
  LandingCmsProvider,
  useLandingPageContent,
} from '@/components/home/landing-cms-provider'
import type { LandingPageContent } from '@/lib/cms/landing-page-content'

function HomeHeroFromCms() {
  const landing = useLandingPageContent()
  return (
    <HomeHeroSection
      heroReelPlaybackId={landing.heroReelPlaybackId}
      fallbackVideoSrc={landing.fallbackVideoSrc}
      agencyIntro={landing.agencyIntro}
    />
  )
}

/** Always the same tree — do not swap branches when Presentation detection settles (that remounts SplitText). */
export function HomeLanding({ initial }: { initial: LandingPageContent }) {
  return (
    <LandingCmsProvider initial={initial}>
      <HomeHeroFromCms />
    </LandingCmsProvider>
  )
}
