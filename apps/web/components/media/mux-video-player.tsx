'use client'

import MuxPlayer from '@mux/mux-player-react'

import cocreateTheme, { ensureCocreateMuxTheme } from '@/components/media/mux-player-theme-cocreate'

type MuxVideoPlayerProps = {
  playbackId: string
  title?: string
  poster?: string
  className?: string
  autoPlay?: boolean
  muted?: boolean
  loop?: boolean
}

export default function MuxVideoPlayer({
  playbackId,
  title,
  poster,
  className = 'w-full h-full',
  autoPlay = false,
  muted = false,
  loop = false,
}: MuxVideoPlayerProps) {
  ensureCocreateMuxTheme()

  return (
    <MuxPlayer
      playbackId={playbackId}
      metadata={{ video_title: title }}
      poster={poster}
      className={className}
      autoPlay={autoPlay}
      muted={muted}
      loop={loop}
      streamType="on-demand"
      theme={cocreateTheme}
    />
  )
}
