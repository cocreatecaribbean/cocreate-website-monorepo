import Image from 'next/image'
import Link from 'next/link'
import { galleryProjectPreviews } from '@/site-info/gallery-data'
import type { ProjectPreview } from '@cocreate/types'
import * as fonts from '@/styles/fonts'

/**
 * Varied padding-bottom heights for column masonry (pb % of width).
 * Order is tuned for 3-column flow: tall / short / medium per column band.
 */
const TILE_HEIGHT_PATTERN = [
  'pb-[108%]',
  'pb-[66%]',
  'pb-[92%]',
  'pb-[72%]',
  'pb-[102%]',
  'pb-[84%]',
] as const

function getTileHeightClass(index: number): string {
  return TILE_HEIGHT_PATTERN[index % TILE_HEIGHT_PATTERN.length]
}

type WorkMasonryGridProps = {
  items?: ProjectPreview[]
}

function WorkMasonryTile({
  item,
  heightClass,
}: {
  item: ProjectPreview
  heightClass: string
}) {
  const inner = (
    <>
      <div className={`work-tile-card__ratio ${heightClass}`}>
        <div className="work-tile-card__media">
          <Image
            src={item.coverImageSrc}
            alt=""
            fill
            sizes="(max-width: 639px) 88vw, (max-width: 1023px) 44vw, 440px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-t from-chambray/90 via-chambray/32 to-transparent" />
          <div
            aria-hidden
            className="work-tile-card__veil absolute inset-0 bg-chambray/25"
          />
          <div className="work-tile-card__caption absolute inset-x-0 bottom-0 p-3 md:p-4">
            <p
              className={`text-[10px] uppercase tracking-[0.14em] text-casablanca md:text-xs ${fonts.bricolage_grot400.className}`}
            >
              {item.clientName}
            </p>
            <h2
              className={`mt-0.5 text-sm leading-tight text-white md:text-lg ${fonts.bricolage_grot600.className}`}
            >
              {item.projectName}
            </h2>
          </div>
        </div>
      </div>
      {item.href ? (
        <span className="sr-only">View {item.projectName}</span>
      ) : null}
    </>
  )

  const cardClass = 'work-tile-card relative block w-full overflow-hidden'

  if (item.href) {
    return (
      <Link href={item.href} className={cardClass}>
        {inner}
      </Link>
    )
  }

  return <article className={cardClass}>{inner}</article>
}

export default function WorkMasonryGrid({
  items = galleryProjectPreviews,
}: WorkMasonryGridProps) {
  return (
    <section
      className="work-masonry mx-auto w-[88svw] max-w-[1320px] pb-8"
      aria-label="Project gallery"
    >
      <div
        className="
          work-masonry-columns
          columns-1 min-[640px]:columns-2 min-[1024px]:columns-3
        "
      >
        {items.map((item, index) => (
          <div key={item.id} data-work-tile className="work-tile-reveal">
            <WorkMasonryTile item={item} heightClass={getTileHeightClass(index)} />
          </div>
        ))}
      </div>
    </section>
  )
}
