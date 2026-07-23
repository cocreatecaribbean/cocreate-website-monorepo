'use client'

import { useRef } from 'react'
import * as fonts from '@/styles/fonts'
import AboutTestimonialsCarousel from '@/components/about/about-testimonials-carousel'
import { useAboutTestimonialsAnimation } from '@/hooks/use-about-testimonials-animation'
import { useAboutPageContent } from '@/components/about/about-cms-provider'

export default function AboutTestimonialsSection() {
  const sectionRef = useRef<HTMLElement>(null)
  useAboutTestimonialsAnimation({ scope: sectionRef })
  const about = useAboutPageContent()

  return (
    <section
      ref={sectionRef}
      aria-labelledby="about-testimonials-heading"
      className="
        about-testimonials-section relative
        w-[92svw] max-w-[1180px] min-[1500px]:max-w-[1280px] mx-auto
        mb-20 min-[1024px]:mb-32 min-[1500px]:mb-40
      "
    >
      <div className="relative z-10 mb-8 min-[1024px]:mb-10">
        <p
          className={`mb-3 text-center text-xs font-semibold uppercase tracking-[0.22em] text-gradient-chambray-diagonal ${fonts.bricolage_grot600.className}`}
        >
          {about.testimonialsEyebrow}
        </p>
        <h2
          id="about-testimonials-heading"
          data-about-testimonials-heading
          className={`
            philosophy-header opacity-0 text-gradient-chambray-diagonal
            text-center leading-none
            text-[clamp(1.85rem,4.5vw,2.75rem)] min-[1024px]:text-[clamp(2rem,3vw,3rem)]
            ${fonts.bricolage_grot600.className}
          `}
        >
          {about.testimonialsTitle}
        </h2>
      </div>

      <div data-about-testimonials-panel className="relative opacity-0">
        <AboutTestimonialsCarousel testimonials={about.testimonials} />
      </div>
    </section>
  )
}
