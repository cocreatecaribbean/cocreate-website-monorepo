'use client'

import MuxPlayer from '@mux/mux-player-react'

type MuxBackgroundVideoProps = {
  playbackId: string
  poster?: string
}

export default function MuxBackgroundVideo({ playbackId, poster }: MuxBackgroundVideoProps) {
  return (
    <MuxPlayer
      playbackId={playbackId}
      poster={poster}
      autoPlay
      muted
      loop
      playsInline
      streamType="on-demand"
      className="pointer-events-none h-dvh w-dvw select-none object-cover opacity-100 [--controls:none]"
    />
  )
}
