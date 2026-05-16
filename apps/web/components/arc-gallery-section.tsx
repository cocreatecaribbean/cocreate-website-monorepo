'use client'

import { useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import ArcGallery from '@/components/arc-gallery'
import { galleryProjectPreviews } from '@/site-info/gallery-data'
import type { ProjectPreview } from '@cocreate/types'
import * as fonts from '@/styles/fonts'

type ArcGallerySectionProps = {
  items?: ProjectPreview[]
}

gsap.registerPlugin(useGSAP, ScrollTrigger)

export default function ArcGallerySection({
  items = galleryProjectPreviews,
}: ArcGallerySectionProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const section = sectionRef.current
      const stage = stageRef.current
      if (!section || !stage) return

      const prefersReducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches

      const header = section.querySelector('[data-arc-gallery-header]')

      if (prefersReducedMotion) {
        gsap.set([header, stage].filter(Boolean), { y: 0 })
        return
      }

      gsap.set(header, { y: 28 })
      gsap.set(stage, { y: 36 })

      gsap
        .timeline({
          scrollTrigger: {
            trigger: section,
            start: 'top 88%',
            once: true,
          },
        })
        .to(header, { y: 0, duration: 0.8, ease: 'power3.out' })
        .to(stage, { y: 0, duration: 0.9, ease: 'power3.out' }, '-=0.55')
    },
    { scope: sectionRef },
  )

  return (
    <section
      ref={sectionRef}
      className="
        mx-auto w-[95svw] max-w-8xl
        mt-16 mb-40 px-2
        md:mt-24 md:mb-48
        lg:mt-28
      "
      aria-labelledby="arc-gallery-heading"
    >
      <header
        data-arc-gallery-header
        className="mb-8 flex flex-col gap-3 md:mb-10 md:flex-row md:items-end md:justify-between"
      >
        <div>
          <p
            className={`text-sm uppercase tracking-[0.22em] text-chambray/70 ${fonts.bricolage_grot400.className}`}
          >
            Client Work
          </p>
          <h2
            id="arc-gallery-heading"
            className={`mt-2 text-[clamp(1.75rem,3.5vw,2.75rem)] leading-none text-chambray ${fonts.bricolage_grot600.className}`}
          >
            Browse the Catalogue.
          </h2>
        </div>
        <p
          className={`max-w-md text-sm text-neutral-600 md:text-base ${fonts.bricolage_grot400.className}`}
        >
          A curated selection of our client work that spans across industries and disciplines.
        </p>
      </header>

      <div ref={stageRef} className="min-w-0">
        <ArcGallery items={items} />
      </div>
    </section>
  )
}
