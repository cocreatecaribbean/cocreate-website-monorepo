'use client'

import Image from 'next/image'
import { useState } from 'react'
import type { ProjectMedia } from '@cocreate/types'
import MuxVideoPlayer from '@/components/media/mux-video-player'
import * as fonts from '@/styles/fonts'

type ProjectMediaFrameProps = {
  media: ProjectMedia
  /** Aspect / sizing classes for the outer frame */
  className?: string
  sizes?: string
  priority?: boolean
  /** Show custom Play overlay for Mux videos until interaction */
  showPlayOverlay?: boolean
}

export default function ProjectMediaFrame({
  media,
  className = 'relative aspect-[16/10] w-full overflow-hidden rounded-4xl',
  sizes = '(max-width: 1023px) 88vw, 900px',
  priority = false,
  showPlayOverlay = true,
}: ProjectMediaFrameProps) {
  const [playing, setPlaying] = useState(!showPlayOverlay)

  if (media.mediaType === 'loopVideo' && media.loopVideoSrc) {
    const poster = media.posterUrl?.trim() || undefined
    return (
      <div className={`ring-1 ring-chambray/10 ${className}`}>
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={poster}
          disablePictureInPicture
          aria-label={media.alt || undefined}
          className="absolute inset-0 h-full w-full object-cover pointer-events-none select-none"
        >
          <source src={media.loopVideoSrc} />
        </video>
      </div>
    )
  }

  if (media.mediaType === 'muxVideo' && media.playbackId) {
    const poster = media.posterUrl?.trim() || undefined

    if (!playing && showPlayOverlay) {
      return (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className={`group relative block cursor-pointer ring-1 ring-chambray/10 ${className}`}
          aria-label={media.alt ? `Play video: ${media.alt}` : 'Play video'}
        >
          {poster ? (
            <Image
              src={poster}
              alt={media.alt ?? ''}
              fill
              priority={priority}
              sizes={sizes}
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-chambray" aria-hidden />
          )}
          <span
            className={`absolute inset-0 flex items-center justify-center bg-black/15 transition group-hover:bg-black/25 ${fonts.bricolage_grot600.className}`}
          >
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-black/55 text-base text-white shadow-lg backdrop-blur-sm sm:h-24 sm:w-24 sm:text-lg">
              Play
            </span>
          </span>
        </button>
      )
    }

    return (
      <div className={`ring-1 ring-chambray/10 ${className}`}>
        <MuxVideoPlayer
          playbackId={media.playbackId}
          title={media.alt}
          poster={poster}
          autoPlay={showPlayOverlay}
          className="h-full w-full"
        />
      </div>
    )
  }

  if (media.mediaType === 'image' && media.imageSrc) {
    return (
      <div className={`ring-1 ring-chambray/10 ${className}`}>
        <Image
          src={media.imageSrc}
          alt={media.alt ?? ''}
          fill
          priority={priority}
          sizes={sizes}
          className="object-cover"
        />
      </div>
    )
  }

  return <div aria-hidden className={`bg-chambray/10 ring-1 ring-chambray/10 ${className}`} />
}
