'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { ChevronDown } from 'lucide-react'
import type { OriginalEpisode, OriginalPodcastDetail } from '@cocreate/types'
import OriginalVideoPlayer from '@/components/originals/original-video-player'
import {
  ORIGINAL_DEFAULT_PLAYLIST_SELECTED,
  ORIGINAL_DEFAULT_PLAYLIST_SIDEBAR,
  ORIGINAL_DEFAULT_VIDEO_TITLE,
} from '@/components/originals/original-brand-defaults'
import { surfaceFillStyle } from '@/components/originals/surface-fill-style'
import { headlineFillStyle } from '@/components/work/sections/headline-fill-style'
import * as fonts from '@/styles/fonts'

type PodcastEpisodePlayerProps = {
  original: OriginalPodcastDetail
}

const SCROLL_BOTTOM_THRESHOLD_PX = 12

function episodePrimaryLabel(episode: OriginalEpisode) {
  if (typeof episode.episodeNumber === 'number') {
    return `Episode ${episode.episodeNumber}`
  }
  return episode.title
}

function canScrollFurther(el: HTMLElement) {
  const { scrollTop, clientHeight, scrollHeight } = el
  const overflows = scrollHeight > clientHeight + 1
  if (!overflows) return false
  return scrollTop + clientHeight < scrollHeight - SCROLL_BOTTOM_THRESHOLD_PX
}

export default function PodcastEpisodePlayer({ original }: PodcastEpisodePlayerProps) {
  const episodes = original.episodes
  const [activeId, setActiveId] = useState(episodes[0]?.id ?? '')
  const active = episodes.find((ep) => ep.id === activeId) ?? episodes[0]
  const playlistRef = useRef<HTMLElement>(null)
  const [showScrollHint, setShowScrollHint] = useState(false)

  const updateScrollHint = useCallback(() => {
    const el = playlistRef.current
    if (!el) {
      setShowScrollHint(false)
      return
    }
    setShowScrollHint(canScrollFurther(el))
  }, [])

  useEffect(() => {
    const el = playlistRef.current
    if (!el) return

    updateScrollHint()

    el.addEventListener('scroll', updateScrollHint, { passive: true })
    const ro = new ResizeObserver(updateScrollHint)
    ro.observe(el)

    return () => {
      el.removeEventListener('scroll', updateScrollHint)
      ro.disconnect()
    }
  }, [episodes.length, updateScrollHint])

  if (!active) {
    return (
      <p
        className={`mx-auto w-[88svw] max-w-[1100px] text-lg text-slate-600 ${fonts.bricolage_grot400.className}`}
      >
        Episodes coming soon.
      </p>
    )
  }

  const sidebarStyle = surfaceFillStyle(
    original.playlistSidebarFill,
    ORIGINAL_DEFAULT_PLAYLIST_SIDEBAR,
  )
  const titleFill = headlineFillStyle(original.videoTitleFill, '')
  const titleStyle =
    original.videoTitleFill == null
      ? { color: ORIGINAL_DEFAULT_VIDEO_TITLE }
      : titleFill.style

  return (
    <div className="mx-auto w-[88svw] max-w-[1200px] space-y-10">
      <div className="grid overflow-hidden rounded-3xl shadow-[0_12px_40px_rgba(30,45,90,0.12)] ring-1 ring-chambray/10 min-[960px]:grid-cols-[minmax(0,1fr)_minmax(240px,0.32fr)]">
        <div className="relative aspect-video min-w-0 bg-black">
          <OriginalVideoPlayer
            key={active.id}
            media={active.media}
            title={active.title}
            className="absolute inset-0 h-full w-full overflow-hidden"
          />
        </div>

        <div className="relative max-h-[280px] min-h-0 min-[960px]:h-0 min-[960px]:max-h-none min-[960px]:min-h-full">
          <aside
            ref={playlistRef}
            className="h-full max-h-[280px] min-h-0 overflow-y-auto min-[960px]:max-h-none"
            style={sidebarStyle}
          >
            <ul className="flex flex-col">
              {episodes.map((episode) => {
                const selected = episode.id === active.id
                return (
                  <li key={episode.id}>
                    <button
                      type="button"
                      onClick={() => setActiveId(episode.id)}
                      className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-opacity hover:opacity-95"
                      style={
                        selected
                          ? surfaceFillStyle(
                              original.playlistSelectedFill,
                              ORIGINAL_DEFAULT_PLAYLIST_SELECTED,
                            )
                          : undefined
                      }
                      aria-current={selected ? 'true' : undefined}
                    >
                      {selected ? (
                        <span className="shrink-0 text-white" aria-hidden>
                          <svg viewBox="0 0 12 12" className="h-3.5 w-3.5 fill-current">
                            <path d="M3 1.5v9l7.5-4.5L3 1.5z" />
                          </svg>
                        </span>
                      ) : (
                        <span className="w-3.5 shrink-0" aria-hidden />
                      )}
                      <span className="relative h-11 w-14 shrink-0 overflow-hidden rounded-md bg-black/20">
                        {episode.thumbnailSrc || original.coverImageSrc ? (
                          <Image
                            src={episode.thumbnailSrc || original.coverImageSrc}
                            alt=""
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        ) : null}
                      </span>
                      <span className="min-w-0">
                        <span
                          className={`block truncate text-sm text-white ${fonts.bricolage_grot600.className}`}
                        >
                          {episodePrimaryLabel(episode)}
                        </span>
                        <span
                          className={`mt-0.5 block truncate text-xs text-white/70 ${fonts.bricolage_grot400.className}`}
                        >
                          {original.title}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </aside>

          {showScrollHint ? (
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center bg-linear-to-t from-black/45 via-black/20 to-transparent pb-2 pt-8"
              aria-hidden
            >
              <ChevronDown
                className="animate-float-soft h-6 w-6 text-white drop-shadow-md"
                strokeWidth={2.5}
              />
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 min-[900px]:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] min-[900px]:gap-12">
        <h2
          className={`text-3xl leading-tight min-[900px]:text-4xl ${fonts.bricolage_grot700.className} ${titleFill.className}`}
          style={titleStyle}
        >
          {active.title}
        </h2>
        {active.description ? (
          <p
            className={`whitespace-pre-wrap text-base leading-relaxed text-slate-800 min-[900px]:text-lg ${fonts.bricolage_grot400.className}`}
          >
            {active.description}
          </p>
        ) : null}
      </div>
    </div>
  )
}
