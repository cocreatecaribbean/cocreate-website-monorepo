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

export function HomeLanding({ initial }: { initial: LandingPageContent }) {
  return (
    <LandingCmsProvider initial={initial}>
      <HomeHeroFromCms />
    </LandingCmsProvider>
  )
}
