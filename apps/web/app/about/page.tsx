import AboutPageHeader from '@/components/about/about-page-header'
import AboutHeroSection from '@/components/about/about-hero-section'

export default function AboutPage() {
  return (
    <main className="overflow-x-clip">
      <AboutPageHeader />

      {/*
        Client sections (GSAP / interactivity) live under components/about/.
        Add more server sections here as the Figma page grows.
      */}
      <AboutHeroSection />
    </main>
  )
}
