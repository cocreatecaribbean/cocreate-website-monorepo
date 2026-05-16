'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useCarouselDrag } from '@/hooks/use-carousel-drag'
import { useCarouselLayout } from '@/hooks/use-carousel-layout'
import { galleryProjectPreviews } from '@/site-info/gallery-data'
import type { ProjectPreview } from '@cocreate/types'
import {
  getCylinderTileStyle,
  getWrappedOffset,
} from '@/utils/carousel-cylinder-math'
import * as fonts from '@/styles/fonts'

const TRANSITION_MS = 550

type GalleryCarouselProps = {
  items?: ProjectPreview[]
}

export default function GalleryCarousel({
  items = galleryProjectPreviews,
}: GalleryCarouselProps) {
  const stageRef = useRef<HTMLDivElement>(null)
  const layout = useCarouselLayout(stageRef)
  const router = useRouter()
  const [activeIndex, setActiveIndex] = useState(0)
  const activeIndexRef = useRef(0)
  activeIndexRef.current = activeIndex

  const centerHref = items[activeIndex]?.href

  const { dragProgress, isDragging, onPointerDown } = useCarouselDrag({
    activeIndexRef,
    itemCount: items.length,
    spacing: layout.spacing,
    tileWidth: layout.tileWidth,
    onCommitIndex: setActiveIndex,
    onTapCenter: centerHref ? () => router.push(centerHref) : undefined,
  })

  const step = useCallback(
    (dir: -1 | 1) => {
      setActiveIndex((current) => {
        const len = items.length
        return (current + dir + len) % len
      })
    },
    [items.length],
  )

  const goTo = useCallback((index: number) => {
    setActiveIndex(index)
  }, [])

  const visualPosition = activeIndex - dragProgress

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        step(-1)
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        step(1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [step])

  return (
    <div className="relative w-full min-w-0">
      <div
        ref={stageRef}
        className="
          relative mx-auto h-[min(50svh,360px)] w-full min-w-0 overflow-hidden
          md:h-[580px]
          lg:h-[640px]
        "
        style={{ perspective: `${layout.perspective}px` }}
        role="region"
        aria-roledescription="carousel"
        aria-label="Selected work gallery"
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,rgba(246,176,63,0.08),transparent_70%)]"
          aria-hidden
        />

        <div
          className="absolute inset-0"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {items.map((item, index) => {
            const offset = getWrappedOffset(
              index,
              visualPosition,
              items.length,
            )
            const isActiveItem = index === activeIndex && !isDragging

            return (
              <CarouselTile
                key={item.id}
                item={item}
                layout={layout}
                offset={offset}
                isActiveItem={isActiveItem}
                isDragging={isDragging}
              />
            )
          })}
        </div>

        <div
          className="absolute inset-0 z-30 touch-pan-y cursor-grab select-none active:cursor-grabbing"
          aria-hidden
          onPointerDown={onPointerDown}
        />

        <div className="pointer-events-none absolute inset-x-0 top-1/2 z-40 hidden -translate-y-1/2 justify-between px-2 md:flex lg:px-4">
          <NavButton label="Previous slide" onClick={() => step(-1)} />
          <NavButton
            label="Next slide"
            onClick={() => step(1)}
            direction="right"
          />
        </div>

        <div className="pointer-events-auto absolute inset-x-0 bottom-2 z-40 hidden justify-center gap-2 md:bottom-5 md:flex">
          {items.map((item, i) => (
            <button
              key={item.id}
              type="button"
              aria-label={`Show ${item.projectName}`}
              aria-current={i === activeIndex ? 'true' : undefined}
              onClick={() => goTo(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === activeIndex
                  ? 'w-8 bg-casablanca'
                  : 'w-2 bg-chambray/25 hover:bg-chambray/45'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-center gap-6 md:hidden">
        <NavButton label="Previous slide" onClick={() => step(-1)} />
        <NavButton
          label="Next slide"
          onClick={() => step(1)}
          direction="right"
        />
      </div>

      <div className="relative z-40 mt-4 flex justify-center gap-2.5 md:hidden">
        {items.map((item, i) => (
          <button
            key={item.id}
            type="button"
            aria-label={`Show ${item.projectName}`}
            aria-current={i === activeIndex ? 'true' : undefined}
            onClick={() => goTo(i)}
            className="flex h-11 w-11 items-center justify-center"
          >
            <span
              className={`block rounded-full transition-all duration-300 ${
                i === activeIndex
                  ? 'h-2 w-8 bg-casablanca'
                  : 'h-2 w-2 bg-chambray/25'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  )
}

function CarouselTile({
  item,
  layout,
  offset,
  isActiveItem,
  isDragging,
}: {
  item: ProjectPreview
  layout: ReturnType<typeof useCarouselLayout>
  offset: number
  isActiveItem: boolean
  isDragging: boolean
}) {
  const style = getCylinderTileStyle(offset, layout)
  const isVisualCenter = Math.abs(offset) < 0.5

  const transition = isDragging
    ? 'none'
    : `transform ${TRANSITION_MS}ms cubic-bezier(0.22, 1, 0.36, 1), opacity ${TRANSITION_MS}ms ease, filter ${TRANSITION_MS}ms ease`

  return (
    <article
      data-carousel-tile
      aria-hidden={!isActiveItem}
      className={`
        pointer-events-none absolute left-1/2 top-1/2 aspect-square overflow-hidden
        rounded-2xl md:rounded-3xl
        ring-1 ring-white/30
        ${isVisualCenter ? 'shadow-[0_28px_56px_rgba(57,65,154,0.28)]' : 'shadow-md'}
      `}
      style={{
        width: layout.tileWidth,
        transform: style.transform,
        opacity: style.opacity,
        zIndex: style.zIndex,
        filter: style.filter,
        transformStyle: 'preserve-3d',
        transition,
        willChange: isDragging ? 'transform, opacity' : 'auto',
      }}
    >
      <div className="relative h-full w-full">
        <Image
          src={item.coverImageSrc}
          alt=""
          fill
          sizes={`(max-width: 768px) ${Math.round(layout.tileWidth)}px, (max-width: 1024px) 300px, 360px`}
          className="object-cover"
          draggable={false}
        />
        <div className="absolute inset-0 bg-linear-to-t from-chambray/90 via-chambray/25 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-3 max-md:p-3.5 md:p-5">
          <p
            className={`text-[10px] uppercase tracking-[0.14em] text-casablanca md:text-xs ${fonts.bricolage_grot400.className}`}
          >
            {item.clientName}
          </p>
          <h3
            className={`mt-0.5 text-xs leading-tight text-white max-md:line-clamp-2 md:text-lg ${fonts.bricolage_grot600.className}`}
          >
            {item.projectName}
          </h3>
        </div>
        {isActiveItem && item.href ? (
          <span className="sr-only">Open {item.projectName}</span>
        ) : null}
      </div>
    </article>
  )
}

function NavButton({
  label,
  onClick,
  direction = 'left',
}: {
  label: string
  onClick: () => void
  direction?: 'left' | 'right'
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="pointer-events-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-chambray/15 bg-white/90 text-xl text-chambray shadow-sm transition hover:border-chambray/30 hover:bg-white md:h-12 md:w-12 md:text-2xl lg:h-14 lg:w-14"
    >
      {direction === 'left' ? '‹' : '›'}
    </button>
  )
}
