import AboutPageHeader from '@/components/about/about-page-header'
import AboutHeroSection from '@/components/about/about-hero-section'
import AboutServicesSection from '@/components/about/about-services-section'
import AboutScrollTune from '@/components/about/about-scroll-tune'

export default function AboutPage() {
  return (
    <main className="overflow-x-clip min-h-svh">
      <AboutScrollTune />
      <AboutPageHeader />
      <AboutHeroSection />
      <AboutServicesSection />
    </main>
  )
}
