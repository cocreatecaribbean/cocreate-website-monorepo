import type { ImpactCalloutSection } from '@cocreate/types'
import * as fonts from '@/styles/fonts'

export default function ImpactCalloutBlock({
  section,
}: {
  section: ImpactCalloutSection
}) {
  return (
    <section className="flex flex-col items-center px-2 py-6 text-center sm:py-10">
      <p
        className={`max-w-[18ch] text-balance uppercase leading-[1.05] text-[clamp(2.75rem,8vw,5.5rem)] ${fonts.bricolage_grot800.className}`}
      >
        <span className="bg-linear-to-r from-sanmarino via-chambray to-casablanca bg-clip-text text-transparent">
          {section.headline}
        </span>
      </p>
      <p
        className={`mt-4 max-w-xl text-sm uppercase tracking-[0.16em] text-sanmarino sm:text-base ${fonts.bricolage_grot600.className}`}
      >
        {section.subheadline}
      </p>
    </section>
  )
}
