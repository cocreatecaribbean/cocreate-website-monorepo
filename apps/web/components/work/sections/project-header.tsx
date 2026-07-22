import type { ProjectMedia } from '@cocreate/types'
import * as fonts from '@/styles/fonts'
import ProjectMediaFrame from '@/components/work/sections/project-media-frame'
import { workMediaFullBleedClass } from '@/components/work/sections/work-media-full-bleed'

type ProjectHeaderProps = {
  projectName: string
  clientName: string
  clientHref: string
  hero?: ProjectMedia | null
  coverFallbackSrc?: string
  coverFallbackBlurDataURL?: string
}

export default function ProjectHeader({
  projectName,
  clientName,
  clientHref,
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
          <span className="bg-linear-to-r from-sanmarino via-chambray to-casablanca bg-clip-text text-transparent">
            {projectName}
          </span>
        </h1>
        <p
          className={`mt-4 text-sm uppercase tracking-[0.18em] text-sanmarino/70 sm:text-base ${fonts.bricolage_grot500.className}`}
        >
          <a href={clientHref} className="transition-opacity hover:text-sanmarino">
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
