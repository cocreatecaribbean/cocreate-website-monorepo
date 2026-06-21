import AboutPageHeader from '@/components/about/about-page-header'
import AboutHeroSection from '@/components/about/about-hero-section'
import AboutServicesSection from '@/components/about/about-services-section'
import AboutTestimonialsSection from '@/components/about/about-testimonials-section'
import AboutScrollTune from '@/components/about/about-scroll-tune'
import { fetchAboutTestimonials } from '@/lib/cms/about-testimonials'

export default async function AboutPage() {
  const testimonialsContent = await fetchAboutTestimonials()

  return (
    <main className="overflow-x-clip min-h-svh">
      <AboutScrollTune />
      <AboutPageHeader />
      <AboutHeroSection />
      <AboutServicesSection />
      <AboutTestimonialsSection content={testimonialsContent} />
    </main>
  )
}
