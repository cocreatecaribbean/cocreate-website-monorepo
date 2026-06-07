'use client'

import MuxPlayer from '@mux/mux-player-react'

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
    />
  )
}
