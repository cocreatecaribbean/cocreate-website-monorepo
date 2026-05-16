import * as fonts from '@/styles/fonts'
import { aboutPageTitle } from '@/site-info/about-page-data'

export default function AboutPageHeader() {
  return (
    <section className="w-[80svw] flex flex-col text-black mx-auto mb-16 md:mb-30">
      <h1
        className={`
          leading-none uppercase w-fit
          mx-auto pt-40 md:pt-60 landscape:pt-20 landscape:lg:pt-48 landscape:xl:pt-72 overflow-hidden
          text-center bg-clip-text
          bg-linear-to-r from-sanmarino via-sanmarino to-casablanca text-transparent
        `}
      >
        <span
          className={`text-[clamp(3rem,5vw,7rem)] md:text-[clamp(4rem,5vw,7rem)] ${fonts.bricolage_grot800.className}`}
        >
          {aboutPageTitle.lineOne}
        </span>{' '}
        <br />
        <span
          className={`text-[clamp(2rem,4vw,6rem)] md:text-[clamp(3rem,4vw,6rem)] ${fonts.alkatra400.className}`}
        >
          {aboutPageTitle.lineTwo}
        </span>
      </h1>
    </section>
  )
}
