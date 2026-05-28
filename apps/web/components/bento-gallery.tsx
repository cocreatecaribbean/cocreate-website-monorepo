'use client'

import { useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import GalleryCarousel from '@/components/gallery-carousel'
import type { ProjectPreview } from '@cocreate/types'
import * as fonts from '@/styles/fonts'

type BentoGalleryProps = {
  items?: ProjectPreview[]
}

gsap.registerPlugin(useGSAP, ScrollTrigger)

export default function BentoGallery({ items = [] }: BentoGalleryProps) {
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

      const header = section.querySelector('[data-gallery-header]')

      if (prefersReducedMotion) {
        gsap.set([header, stage].filter(Boolean), { y: 0 })
        return
      }

      gsap.set(header, { y: 32 })
      gsap.set(stage, { y: 40 })

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
        mx-auto w-full max-w-8xl min-w-0 overflow-x-clip
        mt-20 mb-40 px-[2.5vw]
        md:mt-32 md:mb-48 md:px-2
        lg:mt-40 lg:mb-60
        xl:mt-48
      "
      aria-labelledby="gallery-heading"
    >
      <header
        data-gallery-header
        className="mb-8 flex flex-col gap-3 md:mb-10 md:flex-row md:items-end md:justify-between"
      >
        <div>
          <p
            className={`text-sm uppercase tracking-[0.22em] text-chambray/70 ${fonts.bricolage_grot400.className}`}
          >
            Selected work
          </p>
          <h2
            id="gallery-heading"
            className={`mt-2 text-[clamp(2rem,4vw,3.25rem)] leading-none text-chambray ${fonts.bricolage_grot600.className}`}
          >
            Ideas in motion
          </h2>
        </div>
        <p
          className={`max-w-md text-sm text-neutral-600 md:text-base ${fonts.bricolage_grot400.className}`}
        >
          Drag, use the arrows, or tap a side tile to explore — the gallery curves toward you
          in 3D, with the center project in full focus.
        </p>
      </header>

      <div
        ref={stageRef}
        className="relative w-full min-w-0"
      >
        <GalleryCarousel items={items} />
      </div>
    </section>
  )
}
