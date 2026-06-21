'use client'

import { useRef } from 'react'
import * as fonts from '@/styles/fonts'
import AboutTestimonialsCarousel from '@/components/about/about-testimonials-carousel'
import { useAboutTestimonialsAnimation } from '@/hooks/use-about-testimonials-animation'
import type { AboutTestimonialsContent } from '@/lib/cms/about-testimonials'

type AboutTestimonialsSectionProps = {
  content: AboutTestimonialsContent
}

export default function AboutTestimonialsSection({
  content,
}: AboutTestimonialsSectionProps) {
  const sectionRef = useRef<HTMLElement>(null)
  useAboutTestimonialsAnimation({ scope: sectionRef })

  const { section, testimonials } = content

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
          className={`mb-3 text-center text-xs font-semibold uppercase tracking-[0.22em] text-sanmarino ${fonts.bricolage_grot600.className}`}
        >
          {section.eyebrow}
        </p>
        <h2
          id="about-testimonials-heading"
          data-about-testimonials-heading
          className={`
            philosophy-header opacity-0
            text-center leading-none text-neutral-800
            text-[clamp(1.85rem,4.5vw,2.75rem)] min-[1024px]:text-[clamp(2rem,3vw,3rem)]
            ${fonts.bricolage_grot600.className}
          `}
        >
          {section.title}
        </h2>
        {/* <p
          data-about-testimonials-copy
          className={`
            mx-auto mt-4 max-w-2xl opacity-0 text-center text-neutral-600
            text-[clamp(0.95rem,2vw,1.125rem)] leading-relaxed
            ${fonts.bricolage_grot400.className}
          `}
        >
          {section.description}
        </p> */}
      </div>

      <div data-about-testimonials-panel className="relative opacity-0">
        <AboutTestimonialsCarousel testimonials={testimonials} />
      </div>
    </section>
  )
}
