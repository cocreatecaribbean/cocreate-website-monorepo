'use client'

import { useRef } from 'react'
import * as fonts from '@/styles/fonts'
import { originalsPageTitle } from '@/site-info/originals-page-data'
import { pageNavClearanceClass } from '@/lib/page-layout'
import { usePageTitleReveal } from '@/hooks/use-page-title-reveal'
import { cn } from '@/utils/tailwind-helpers'

export default function OriginalsPageHeader() {
  const scopeRef = useRef<HTMLElement>(null)
  usePageTitleReveal({ scope: scopeRef })

  return (
    <section
      ref={scopeRef}
      className="originals-page-header mx-auto mb-8 flex w-[88svw] max-w-[1320px] flex-col text-black min-[1024px]:mb-12 min-[1500px]:mb-20"
    >
      <h1
        data-page-heading
        className={cn(
          'about-page-title w-fit overflow-hidden bg-clip-text text-center leading-none',
          'uppercase opacity-0',
          'bg-linear-to-r from-sanmarino via-sanmarino to-casablanca text-transparent',
          'mx-auto',
          pageNavClearanceClass,
        )}
      >
        <span
          className={`text-[clamp(2.75rem,8vw,5rem)] min-[1500px]:text-[clamp(4rem,5vw,7rem)] ${fonts.bricolage_grot800.className}`}
        >
          {originalsPageTitle.lineOne}
        </span>{' '}
        <br />
        <span
          className={`text-[clamp(1.85rem,6vw,3.5rem)] min-[1500px]:text-[clamp(3rem,4vw,6rem)] ${fonts.alkatra400.className}`}
        >
          {originalsPageTitle.lineTwo}
        </span>
      </h1>
    </section>
  )
}
