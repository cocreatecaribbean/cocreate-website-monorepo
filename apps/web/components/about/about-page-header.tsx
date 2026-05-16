import * as fonts from '@/styles/fonts'
import { aboutPageTitle } from '@/site-info/about-page-data'

export default function AboutPageHeader() {
  return (
    <section className="about-page-header w-[88svw] max-w-[1320px] flex flex-col text-black mx-auto mb-8 min-[1024px]:mb-12 min-[1500px]:mb-20">
      <h1
        className={`
          about-page-title opacity-100
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
          className={`text-[clamp(2.75rem,8vw,5rem)] min-[1500px]:text-[clamp(4rem,5vw,7rem)] ${fonts.bricolage_grot800.className}`}
        >
          {aboutPageTitle.lineOne}
        </span>{' '}
        <br />
        <span
          className={`text-[clamp(1.85rem,6vw,3.5rem)] min-[1500px]:text-[clamp(3rem,4vw,6rem)] ${fonts.alkatra400.className}`}
        >
          {aboutPageTitle.lineTwo}
        </span>
      </h1>
    </section>
  )
}
