import * as fonts from '@/styles/fonts'
import { originalsPageTitle } from '@/site-info/originals-page-data'
import { pageNavClearanceClass } from '@/lib/page-layout'
import { cn } from '@/utils/tailwind-helpers'

export default function OriginalsPageHeader() {
  return (
    <section className="originals-page-header mx-auto mb-8 flex w-[88svw] max-w-[1320px] flex-col text-black min-[1024px]:mb-12 min-[1500px]:mb-20">
      <h1
        className={cn(
          'about-page-title opacity-100 leading-none uppercase w-fit mx-auto',
          'overflow-hidden text-center bg-clip-text',
          'bg-linear-to-r from-sanmarino via-sanmarino to-casablanca text-transparent',
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
