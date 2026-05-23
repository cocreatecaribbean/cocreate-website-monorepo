'use client'

import { useRef } from 'react'
import * as fonts from '@/styles/fonts'
import { contactPageTitle } from '@/site-info/contact-page-data'
import { useContactHeadlineWave } from '@/hooks/use-contact-headline-wave'

export default function ContactPageHeader() {
  const sectionRef = useRef<HTMLElement>(null)
  useContactHeadlineWave({ scope: sectionRef })

  return (
    <section
      ref={sectionRef}
      className="contact-page-header mx-auto mb-16 flex w-[88svw] max-w-[1320px] flex-col text-black min-[1024px]:mb-20 min-[1500px]:mb-24"
    >
      <h1
        className="
          contact-page-title w-fit overflow-visible bg-clip-text text-center leading-none
          uppercase opacity-100
          bg-linear-to-r from-sanmarino via-sanmarino to-casablanca text-transparent
          mx-auto
          pt-[calc(9svh+4.25rem)] sm:pt-[calc(9svh+4.75rem)]
          min-[1024px]:pt-[calc(8svh+5rem)]
          min-[1500px]:pt-52
          landscape:pt-20 landscape:lg:pt-44 landscape:xl:pt-64
        "
      >
        <span
          className={`text-[clamp(1.85rem,6vw,3.5rem)] min-[1500px]:text-[clamp(3rem,4vw,6rem)] ${fonts.alkatra400.className}`}
        >
          {contactPageTitle.lineOne}
        </span>
        <span
          aria-hidden
          className="contact-page-title-space inline-block min-w-[0.45em] w-[0.45em]"
        >
          {'\u00A0'}
        </span>
        <span
          className={`text-[clamp(2.75rem,8vw,5rem)] min-[1500px]:text-[clamp(4rem,5vw,7rem)] ${fonts.bricolage_grot800.className}`}
        >
          {contactPageTitle.lineTwo}
        </span>
      </h1>
    </section>
  )
}
