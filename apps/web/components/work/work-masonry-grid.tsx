'use client'

import { useRef } from 'react'
import Image from 'next/image'
import type { ProjectPreview } from '@cocreate/types'
import * as fonts from '@/styles/fonts'
import { useWorkMasonryPagination } from '@/hooks/use-work-masonry-pagination'
import { useWorkTileBatchReveal } from '@/hooks/use-work-tile-batch-reveal'
import WorkTileShell from '@/components/work/work-tile-shell'
import './work-tiles.css'

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

const CARD_CLASS = 'work-tile-card relative block w-full overflow-hidden'

function WorkMasonryTile({
  item,
  heightClass,
}: {
  item: ProjectPreview
  heightClass: string
}) {
  const coverSrc = item.coverImageSrc?.trim() || null
  const hasCover = Boolean(coverSrc)
  const blurDataURL = item.coverImageBlurDataURL?.trim() || undefined

  const media = (
    <div className={`work-tile-card__frame relative w-full ${heightClass}`}>
      <div className="work-tile-card__clip absolute inset-0 overflow-hidden bg-chambray">
        {hasCover && coverSrc ? (
          <Image
            src={coverSrc}
            alt=""
            fill
            sizes="(max-width: 767px) 88vw, (max-width: 1023px) 44vw, 440px"
            className="object-cover object-center"
            {...(blurDataURL
              ? { placeholder: 'blur' as const, blurDataURL }
              : {})}
          />
        ) : (
          <div
            aria-hidden
            className="absolute inset-0 bg-chambray"
          />
        )}
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-chambray/90 via-chambray/30 to-transparent" />
        <div
          aria-hidden
          className="work-tile-card__veil pointer-events-none absolute inset-0 bg-chambray/25"
        />
        <div
          className="
            work-tile-card__caption pointer-events-none absolute right-3 bottom-9 z-10
            max-w-[90%] text-right max-md:right-7 max-md:bottom-11 max-md:max-w-[78%]
            md:right-5 md:bottom-8 md:max-w-[82%]
          "
        >
          <p
            className={`text-xs uppercase tracking-[0.14em] text-casablanca max-md:text-base md:text-sm ${fonts.bricolage_grot400.className}`}
          >
            {item.clientName || 'Client'}
          </p>
          <h2
            className={`mt-1 text-base leading-snug text-white max-md:mt-1.5 max-md:text-xl max-md:leading-tight max-md:line-clamp-2 md:mt-1.5 md:text-xl md:leading-tight ${fonts.bricolage_grot600.className}`}
          >
            {item.projectName}
          </h2>
        </div>
      </div>
    </div>
  )

  return (
    <WorkTileShell href={item.href} className={CARD_CLASS}>
      {media}
      {item.href ? (
        <span className="sr-only">View {item.projectName}</span>
      ) : null}
    </WorkTileShell>
  )
}

export default function WorkMasonryGrid({
  items = [],
}: WorkMasonryGridProps) {
  const gridRef = useRef<HTMLElement>(null)
  const { sentinelRef, visibleItems, visibleCount, totalCount, hasMore } =
    useWorkMasonryPagination({ items })

  useWorkTileBatchReveal({ scope: gridRef, visibleCount })

  return (
    <section
      ref={gridRef}
      className="work-masonry mx-auto w-[88svw] max-w-[1320px] pb-8"
      aria-label="Project gallery"
    >
      <p className="sr-only" aria-live="polite">
        Showing {visibleItems.length} of {totalCount} projects
      </p>
      <div className="work-masonry-columns columns-1 min-[640px]:columns-2 min-[1024px]:columns-3">
        {visibleItems.map((item, index) => (
          <div key={item.id} data-work-tile className="work-tile-reveal">
            <WorkMasonryTile
              item={item}
              heightClass={getTileHeightClass(index)}
            />
          </div>
        ))}
      </div>
      {hasMore ? (
        <div
          ref={sentinelRef}
          className="work-masonry-sentinel h-px w-full shrink-0"
          aria-hidden
        />
      ) : null}
    </section>
  )
}
