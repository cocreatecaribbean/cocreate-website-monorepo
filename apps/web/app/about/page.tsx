import AboutPageHeader from '@/components/about/about-page-header'
import AboutHeroSection from '@/components/about/about-hero-section'
import AboutServicesSection from '@/components/about/about-services-section'
import AboutTestimonialsSection from '@/components/about/about-testimonials-section'
import AboutScrollTune from '@/components/about/about-scroll-tune'
import { AboutCmsProvider } from '@/components/about/about-cms-provider'
import { fetchAboutPage } from '@/lib/cms/about-page'
import { getSanityPreviewContext } from '@/lib/preview-context'

export default async function AboutPage() {
  const preview = await getSanityPreviewContext()
  const about = await fetchAboutPage(preview)

  return (
    <main className="overflow-x-clip min-h-svh">
      <AboutCmsProvider initial={about}>
        <AboutScrollTune />
        <AboutPageHeader />
        <AboutHeroSection />
        <AboutServicesSection />
        <AboutTestimonialsSection />
      </AboutCmsProvider>
    </main>
  )
}
