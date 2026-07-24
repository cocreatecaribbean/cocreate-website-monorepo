import type { BrandTextFill, ProjectMedia } from '@cocreate/types'
import * as fonts from '@/styles/fonts'
import { headlineFillStyle } from '@/components/work/sections/headline-fill-style'
import ProjectMediaFrame from '@/components/work/sections/project-media-frame'
import { workMediaFullBleedClass } from '@/components/work/sections/work-media-full-bleed'

const DEFAULT_CLIENT_CLASS = 'text-sanmarino/70'

type ProjectHeaderProps = {
  projectName: string
  clientName: string
  clientHref: string
  titleFill?: BrandTextFill
  clientFill?: BrandTextFill
  hero?: ProjectMedia | null
  coverFallbackSrc?: string
  coverFallbackBlurDataURL?: string
}

export default function ProjectHeader({
  projectName,
  clientName,
  clientHref,
  titleFill,
  clientFill,
  hero,
  coverFallbackSrc,
  coverFallbackBlurDataURL,
}: ProjectHeaderProps) {
  const media: ProjectMedia | null =
    hero ??
    (coverFallbackSrc?.trim()
      ? {
          mediaType: 'image',
          imageSrc: coverFallbackSrc.trim(),
          alt: projectName,
          blurDataURL: coverFallbackBlurDataURL?.trim() || undefined,
        }
      : null)

  const {className: fillClassName, style: fillStyle} = headlineFillStyle(titleFill)
  const {className: clientClassName, style: clientStyle} = headlineFillStyle(
    clientFill,
    DEFAULT_CLIENT_CLASS,
  )

  return (
    <header className="flex w-full flex-col">
      <div className="flex flex-col items-center text-center">
        <h1
          className={`
            max-w-[18ch] text-balance capitalize leading-[1.05]
            text-[clamp(2.5rem,7vw,4.75rem)]
            ${fonts.bricolage_grot800.className}
          `}
        >
          <span className={fillClassName} style={fillStyle}>
            {projectName}
          </span>
        </h1>
        <p
          className={`mt-4 text-sm uppercase tracking-[0.18em] sm:text-base ${fonts.bricolage_grot500.className}`}
        >
          <a
            href={clientHref}
            className={`transition-opacity hover:opacity-80 ${clientClassName}`}
            style={clientStyle}
          >
            {clientName}
          </a>
        </p>
      </div>

      {media ? (
        <div className={`mt-10 w-full self-stretch sm:mt-12 ${workMediaFullBleedClass}`}>
          <ProjectMediaFrame
            media={media}
            priority
            showPlayOverlay
            className="relative aspect-[32/15] w-full overflow-hidden"
            sizes="100vw"
          />
        </div>
      ) : null}
    </header>
  )
}
