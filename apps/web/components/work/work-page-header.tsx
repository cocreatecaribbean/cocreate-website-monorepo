import * as fonts from '@/styles/fonts'
import { workPageTitle } from '@/site-info/work-page-data'

export default function WorkPageHeader() {
  return (
    <section className="work-page-header mx-auto mb-8 flex w-[88svw] max-w-[1320px] flex-col text-black min-[1024px]:mb-12 min-[1500px]:mb-16">
      <h1
        data-work-page-heading
        className="
          work-page-title w-fit overflow-hidden bg-clip-text text-center leading-none
          uppercase opacity-0
          bg-linear-to-r from-sanmarino via-sanmarino to-casablanca text-transparent
          mx-auto
          pt-[calc(9svh+4.25rem)] sm:pt-[calc(9svh+4.75rem)]
          min-[1024px]:pt-[calc(8svh+5rem)]
          min-[1500px]:pt-52
          landscape:pt-20 landscape:lg:pt-44 landscape:xl:pt-64
        "
      >
        <span
          className={`text-[clamp(2.75rem,8vw,5rem)] min-[1500px]:text-[clamp(4rem,5vw,7rem)] ${fonts.bricolage_grot800.className}`}
        >
          {workPageTitle.lineOne}
        </span>{' '}
        <br />
        <span
          className={`text-[clamp(1.85rem,6vw,3.5rem)] min-[1500px]:text-[clamp(3rem,4vw,6rem)] ${fonts.alkatra400.className}`}
        >
          {workPageTitle.lineTwo}
        </span>
      </h1>
    </section>
  )
}
