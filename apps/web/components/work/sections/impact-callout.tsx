import type { ImpactCalloutSection } from '@cocreate/types'
import { headlineFillStyle } from '@/components/work/sections/headline-fill-style'
import * as fonts from '@/styles/fonts'

const DEFAULT_SUBHEADLINE_CLASS = 'text-sanmarino'

export default function ImpactCalloutBlock({
  section,
}: {
  section: ImpactCalloutSection
}) {
  const {className: fillClassName, style: fillStyle} = headlineFillStyle(section.fill)
  const {className: subClassName, style: subStyle} = headlineFillStyle(
    section.subFill,
    DEFAULT_SUBHEADLINE_CLASS,
  )

  return (
    <section className="flex flex-col items-center px-2 py-6 text-center sm:py-10">
      <p
        className={`max-w-[18ch] text-balance uppercase leading-[1.05] text-[clamp(2.75rem,8vw,5.5rem)] ${fonts.bricolage_grot800.className}`}
      >
        <span className={fillClassName} style={fillStyle}>
          {section.headline}
        </span>
      </p>
      <p
        className={`mt-4 max-w-xl text-sm uppercase tracking-[0.16em] sm:text-base ${fonts.bricolage_grot600.className}`}
      >
        <span className={subClassName} style={subStyle}>
          {section.subheadline}
        </span>
      </p>
    </section>
  )
}
