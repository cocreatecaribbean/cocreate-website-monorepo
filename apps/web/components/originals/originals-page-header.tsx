import * as fonts from '@/styles/fonts'
import { originalsPageTitle } from '@/site-info/originals-page-data'

export default function OriginalsPageHeader() {
  return (
    <section className="originals-page-header mx-auto mb-8 flex w-[88svw] max-w-[1320px] flex-col text-black min-[1024px]:mb-12 min-[1500px]:mb-20">
      <h1
        className={`
          originals-page-title opacity-100
          leading-none uppercase w-fit
          mx-auto
          pt-[calc(9svh+4.25rem)] sm:pt-[calc(9svh+4.75rem)]
          min-[1024px]:pt-[calc(8svh+5rem)]
          min-[1500px]:pt-52
          landscape:pt-20 landscape:lg:pt-44 landscape:xl:pt-64
          overflow-hidden text-center bg-clip-text
          bg-linear-to-r from-sanmarino via-sanmarino to-casablanca text-transparent
        `}
      >
        <span
          className={`text-[clamp(1.85rem,6vw,3.5rem)] min-[1500px]:text-[clamp(3rem,4vw,6rem)] ${fonts.alkatra400.className}`}
        >
          {originalsPageTitle}
        </span>
      </h1>
    </section>
  )
}
