'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useArcGalleryLayout } from '@/hooks/use-arc-gallery-layout'
import { useCarouselDrag } from '@/hooks/use-carousel-drag'
import { galleryProjectPreviews } from '@/site-info/gallery-data'
import type { ProjectPreview } from '@cocreate/types'
import { getArcTileStyle, getWrappedOffset } from '@/utils/arc-gallery-math'
import * as fonts from '@/styles/fonts'
import './arc-gallery.css'

const PREMIUM_EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'
const TRANSITION_MS_DESKTOP = 620
const TRANSITION_MS_MOBILE = 1150

function getArcTileTransition(isDragging: boolean, isMobile: boolean): string {
  if (isDragging) return 'none'
  const ms = isMobile ? TRANSITION_MS_MOBILE : TRANSITION_MS_DESKTOP
  return `transform ${ms}ms ${PREMIUM_EASE}, opacity ${ms}ms ${PREMIUM_EASE}, filter ${ms}ms ${PREMIUM_EASE}`
}

type ArcGalleryProps = {
  items?: ProjectPreview[]
}

export default function ArcGallery({
  items = galleryProjectPreviews,
}: ArcGalleryProps) {
  const stageRef = useRef<HTMLDivElement>(null)
  const layout = useArcGalleryLayout(stageRef)
  const router = useRouter()
  const [isMobile, setIsMobile] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  useLayoutEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const sync = () => setIsMobile(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])
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
        className="relative w-full min-w-0 py-4 max-md:py-6 md:py-6 lg:py-8"
        role="region"
        aria-roledescription="carousel"
        aria-label="Arc gallery preview"
      >
        <div
          ref={stageRef}
          className="
            relative mx-auto w-full min-w-0
            h-[min(50svh,400px)] min-[640px]:h-[min(44svh,400px)]
            max-md:overflow-visible
            py-6 max-md:py-6 md:h-[480px] md:overflow-hidden md:py-0
            lg:h-[540px] xl:h-[600px]
          "
        >
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_42%,rgba(246,176,63,0.08),transparent_70%)]"
            aria-hidden
          />
          <div className="absolute inset-0 overflow-x-clip overflow-y-visible max-md:overflow-x-clip md:overflow-visible">
            {items.map((item, index) => {
              const offset = getWrappedOffset(
                index,
                visualPosition,
                items.length,
              )
              return (
                <ArcTile
                  key={item.id}
                  item={item}
                  layout={layout}
                  offset={offset}
                  isActiveItem={index === activeIndex && !isDragging}
                  isDragging={isDragging}
                  isMobile={isMobile}
                />
              )
            })}
          </div>

          <div
            className="absolute inset-0 z-30 touch-pan-y cursor-grab select-none active:cursor-grabbing"
            aria-hidden
            onPointerDown={onPointerDown}
          />

          {/* Desktop / tablet: arrows flanking the arc */}
          <div className="pointer-events-none absolute inset-x-0 top-[40%] z-40 hidden -translate-y-1/2 justify-between px-2 min-[640px]:flex lg:px-4">
            <ArcNavButton label="Previous" onClick={() => step(-1)} />
            <ArcNavButton
              label="Next"
              onClick={() => step(1)}
              direction="right"
            />
          </div>

          <ArcGalleryPagination
            items={items}
            activeIndex={activeIndex}
            onSelect={goTo}
            className="absolute inset-x-0 bottom-[9%] z-40 hidden min-[640px]:flex md:bottom-[10%]"
          />
        </div>

        {/* Mobile only — arrows below the stage */}
        <div className="mt-1 flex items-center justify-center gap-5 max-[639px]:-mt-1 min-[640px]:hidden">
          <ArcNavButton label="Previous" onClick={() => step(-1)} />
          <ArcNavButton
            label="Next"
            onClick={() => step(1)}
            direction="right"
          />
        </div>

        <ArcGalleryPagination
          items={items}
          activeIndex={activeIndex}
          onSelect={goTo}
          className="arc-gallery-pagination relative z-40 mt-3 py-2 min-[640px]:hidden"
        />
      </div>
    </div>
  )
}

function ArcGalleryPagination({
  items,
  activeIndex,
  onSelect,
  className = '',
}: {
  items: ProjectPreview[]
  activeIndex: number
  onSelect: (index: number) => void
  className?: string
}) {
  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      {items.map((item, i) => {
        const isActive = i === activeIndex
        return (
          <button
            key={item.id}
            type="button"
            aria-label={`Show ${item.projectName}`}
            aria-current={isActive ? 'true' : undefined}
            onClick={() => onSelect(i)}
            className="arc-gallery-pagination__btn pointer-events-auto"
          >
            <span
              className={`arc-gallery-pagination__pill ${isActive ? 'is-active' : ''}`}
            />
          </button>
        )
      })}
    </div>
  )
}

function ArcTile({
  item,
  layout,
  offset,
  isActiveItem,
  isDragging,
  isMobile,
}: {
  item: ProjectPreview
  layout: ReturnType<typeof useArcGalleryLayout>
  offset: number
  isActiveItem: boolean
  isDragging: boolean
  isMobile: boolean
}) {
  const style = getArcTileStyle(offset, layout, isMobile)
  const isVisualCenter = Math.abs(offset) < 0.5

  const transition = getArcTileTransition(isDragging, isMobile)

  return (
    <article
      className={`
        pointer-events-none absolute left-1/2 overflow-hidden
        aspect-4/5 md:aspect-square
        rounded-4xl
        ring-1 ring-chambray/10
        top-1/2 max-md:top-1/2
        md:top-[38%]
        ${isVisualCenter ? 'shadow-[0_24px_48px_rgba(57,65,154,0.22)]' : 'shadow-md'}
      `}
      style={{
        width: layout.tileWidth,
        transform: style.transform,
        opacity: style.opacity,
        zIndex: style.zIndex,
        filter: style.filter,
        transition,
        willChange: isDragging ? 'transform, opacity' : 'auto',
      }}
      aria-hidden={!isActiveItem}
    >
      <div className="relative h-full w-full">
        <Image
          src={item.coverImageSrc}
          alt=""
          fill
          sizes={`(max-width: 639px) ${Math.round(layout.tileWidth)}px, (max-width: 1023px) 240px, 300px`}
          className="object-cover"
          draggable={false}
        />
        <div className="absolute inset-0 bg-linear-to-t from-chambray/90 via-chambray/30 to-transparent" />
        <div
          className="
            absolute right-3 bottom-9 z-10 max-w-[90%] text-right
            max-md:right-4 max-md:bottom-11
            md:right-5 md:bottom-8 md:max-w-[82%]
          "
        >
          <p
            className={`text-xs uppercase tracking-[0.14em] text-casablanca md:text-sm ${fonts.bricolage_grot400.className}`}
          >
            {item.clientName}
          </p>
          <h3
            className={`mt-1 text-base leading-snug text-white max-md:line-clamp-2 md:mt-1.5 md:text-xl md:leading-tight ${fonts.bricolage_grot600.className}`}
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

function ArcNavButton({
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
      className="pointer-events-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-chambray/15 bg-white/90 text-xl text-chambray shadow-sm transition hover:border-chambray/30 hover:bg-white md:h-12 md:w-12 lg:h-14 lg:w-14"
    >
      {direction === 'left' ? '‹' : '›'}
    </button>
  )
}
