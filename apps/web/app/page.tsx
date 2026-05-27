import HomeHeroSection from '@/components/homeHeroSection'
import LogoTickerWrapper from '@/components/logoTickerWrapper'
import ArcGallerySection from '@/components/arc-gallery-section'
import {
  fetchFeaturedHeroReelPlaybackId,
  fetchHomeGalleryPreviews,
} from '@/lib/cms/work-projects'

export default async function Home() {
  const [galleryItems, heroReelPlaybackId] = await Promise.all([
    fetchHomeGalleryPreviews(),
    fetchFeaturedHeroReelPlaybackId(),
  ])

  return (
    <main className="overflow-x-clip">
      <HomeHeroSection heroReelPlaybackId={heroReelPlaybackId} />

      <section className="pb-4 md:pb-6">
        <LogoTickerWrapper />
      </section>

      <ArcGallerySection items={galleryItems} />
    </main>
  )
}
