'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useArcGalleryLayout } from '@/hooks/use-arc-gallery-layout'
import { useCarouselDrag } from '@/hooks/use-carousel-drag'
import { galleryProjectPreviews } from '@/site-info/gallery-data'
import type { ProjectPreview } from '@cocreate/types'
import { getArcTileStyle, getWrappedOffset } from '@/utils/arc-gallery-math'
import * as fonts from '@/styles/fonts'

const TRANSITION_MS = 550

type ArcGalleryProps = {
  items?: ProjectPreview[]
}

export default function ArcGallery({
  items = galleryProjectPreviews,
}: ArcGalleryProps) {
  const stageRef = useRef<HTMLDivElement>(null)
  const layout = useArcGalleryLayout(stageRef)
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
        className="relative w-full min-w-0 py-2 md:py-6 lg:py-8"
        role="region"
        aria-roledescription="carousel"
        aria-label="Arc gallery preview"
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_42%,rgba(246,176,63,0.08),transparent_70%)]"
          aria-hidden
        />

        <div
          ref={stageRef}
          className="
            relative mx-auto w-full min-w-0 overflow-hidden
            h-[min(38svh,264px)] md:h-[480px] lg:h-[540px] xl:h-[600px]
          "
        >
          <div className="absolute inset-0">
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
          <div className="pointer-events-none absolute inset-x-0 top-[40%] z-40 hidden -translate-y-1/2 justify-between px-2 md:flex lg:px-4">
            <ArcNavButton label="Previous" onClick={() => step(-1)} />
            <ArcNavButton
              label="Next"
              onClick={() => step(1)}
              direction="right"
            />
          </div>
        </div>

        {/* Mobile only — desktop arrows stay inside the stage */}
        <div className="mt-1 flex items-center justify-center gap-5 max-md:-mt-1 md:hidden">
          <ArcNavButton label="Previous" onClick={() => step(-1)} />
          <ArcNavButton
            label="Next"
            onClick={() => step(1)}
            direction="right"
          />
        </div>

        <div className="relative z-40 mt-2 flex justify-center gap-2.5 md:mt-6">
          {items.map((item, i) => (
            <button
              key={item.id}
              type="button"
              aria-label={`Show ${item.projectName}`}
              aria-current={i === activeIndex ? 'true' : undefined}
              onClick={() => goTo(i)}
              className={`
                flex h-11 w-11 items-center justify-center p-0
                md:h-2 md:w-2 md:min-w-0
                ${i === activeIndex
                  ? 'md:w-8'
                  : ''
                }
              `}
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
    </div>
  )
}

function ArcTile({
  item,
  layout,
  offset,
  isActiveItem,
  isDragging,
}: {
  item: ProjectPreview
  layout: ReturnType<typeof useArcGalleryLayout>
  offset: number
  isActiveItem: boolean
  isDragging: boolean
}) {
  const style = getArcTileStyle(offset, layout)
  const isVisualCenter = Math.abs(offset) < 0.5

  const transition = isDragging
    ? 'none'
    : `transform ${TRANSITION_MS}ms cubic-bezier(0.22, 1, 0.36, 1), opacity ${TRANSITION_MS}ms ease, filter ${TRANSITION_MS}ms ease`

  return (
    <article
      className={`
        pointer-events-none absolute left-1/2 aspect-square overflow-hidden
        rounded-2xl md:rounded-3xl
        ring-1 ring-chambray/10
        top-[40%] max-md:top-[38%]
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
          sizes={`(max-width: 768px) ${Math.round(layout.tileWidth)}px, (max-width: 1024px) 248px, 300px`}
          className="object-cover"
          draggable={false}
        />
        <div className="absolute inset-0 bg-linear-to-t from-chambray/90 via-chambray/25 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-2.5 max-md:p-3 md:p-5">
          <p
            className={`text-[9px] uppercase tracking-[0.12em] text-casablanca md:text-xs ${fonts.bricolage_grot400.className}`}
          >
            {item.clientName}
          </p>
          <h3
            className={`mt-0.5 text-[11px] leading-tight text-white max-md:line-clamp-2 md:text-base ${fonts.bricolage_grot600.className}`}
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
