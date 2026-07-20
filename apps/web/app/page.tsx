import { HomeLanding } from '@/components/home/home-landing'
import LogoTickerWrapper from '@/components/logoTickerWrapper'
import ArcGallerySection from '@/components/arc-gallery-section'
import { fetchLandingPage } from '@/lib/cms/landing-page'
import { fetchHomeGalleryPreviews } from '@/lib/cms/work-projects'
import { HERO_SEQUENCE_FRAME1 } from '@/lib/home-hero-sequence'
import { getSanityPreviewContext } from '@/lib/preview-context'

export default async function Home() {
  const preview = await getSanityPreviewContext()
  const [galleryItems, landing] = await Promise.all([
    fetchHomeGalleryPreviews(preview),
    fetchLandingPage(preview),
  ])

  return (
    <>
      {/* Kick off the critical first frame before client hydration. */}
      <link
        rel="preload"
        as="image"
        href={HERO_SEQUENCE_FRAME1.landscape}
        media="(orientation: landscape)"
      />
      <link
        rel="preload"
        as="image"
        href={HERO_SEQUENCE_FRAME1.portrait}
        media="(orientation: portrait)"
      />

      <main className="overflow-x-clip">
        <HomeLanding initial={landing} />

        <section className="pb-4 md:pb-6">
          <LogoTickerWrapper />
        </section>

        <ArcGallerySection items={galleryItems} />
      </main>
    </>
  )
}
