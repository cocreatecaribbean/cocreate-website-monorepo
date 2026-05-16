'use client'

import { useRef } from 'react'
import Image from 'next/image'
import * as fonts from '@/styles/fonts'
import { useAboutHeroAnimation } from '@/hooks/use-about-hero-animation'
import { aboutHero } from '@/site-info/about-page-data'

export default function AboutHeroSection() {
  const rootRef = useRef<HTMLElement>(null)
  const { sectionRef, mediaRef, refreshScroll } = useAboutHeroAnimation({ scope: rootRef })

  return (
    <section ref={rootRef} aria-label="About CoCreate">
      <div
        ref={sectionRef}
        className="about-hero-section w-[90svw] 2xl:w-[85svw] mx-auto grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8 lg:gap-12 items-center mb-24 md:mb-48 opacity-0"
      >
        <div
          ref={mediaRef}
          className="z-10 w-full min-h-[42svh] sm:min-h-[50svh] max-h-[55svh] relative rounded-4xl 2xl:rounded-[4rem] overflow-hidden"
        >
          <Image
            src={aboutHero.imageSrc}
            alt={aboutHero.imageAlt}
            fill
            priority
            sizes="(max-width: 1024px) 90vw, 55vw"
            style={{ objectFit: 'cover' }}
            onLoad={refreshScroll}
          />
        </div>

        <div className="about-hero-text px-2 sm:px-4 lg:pl-24 lg:pr-10">
          <h2
            className={`philosophy-header h-fit leading-none text-center lg:text-left text-[clamp(2rem,3vw,4rem)] ${fonts.bricolage_grot500.className} mb-6`}
          >
            {aboutHero.heading}
          </h2>
          <p
            className={`${fonts.bricolage_grot400.className} text-[clamp(1rem,2.5vw,1.5rem)] leading-relaxed`}
          >
            {aboutHero.body}
          </p>
        </div>
      </div>
    </section>
  )
}
