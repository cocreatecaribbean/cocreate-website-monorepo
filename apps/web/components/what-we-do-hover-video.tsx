'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const CURSOR_OFFSET = 20
const VIEWPORT_PADDING = 12

// 2×2 in at 96 CSS px/in
const PREVIEW_WIDTH_PX = 192
const PREVIEW_HEIGHT_PX = 192

type PreviewState = {
  visible: boolean
  x: number
  y: number
  videoSrc: string | null
}

const initialState: PreviewState = {
  visible: false,
  x: 0,
  y: 0,
  videoSrc: null,
}

function clampToViewport(x: number, y: number) {
  if (typeof window === 'undefined') return { x, y }

  const maxX = window.innerWidth - PREVIEW_WIDTH_PX - VIEWPORT_PADDING
  const maxY = window.innerHeight - PREVIEW_HEIGHT_PX - VIEWPORT_PADDING

  return {
    x: Math.min(Math.max(VIEWPORT_PADDING, x), maxX),
    y: Math.min(Math.max(VIEWPORT_PADDING, y), maxY),
  }
}

export function useWhatWeDoHoverVideo() {
  const [preview, setPreview] = useState<PreviewState>(initialState)

  const show = useCallback((clientX: number, clientY: number, videoSrc: string) => {
    const { x, y } = clampToViewport(
      clientX + CURSOR_OFFSET,
      clientY + CURSOR_OFFSET,
    )
    setPreview((prev) => ({
      visible: true,
      x,
      y,
      videoSrc,
    }))
  }, [])

  const move = useCallback((clientX: number, clientY: number) => {
    const { x, y } = clampToViewport(
      clientX + CURSOR_OFFSET,
      clientY + CURSOR_OFFSET,
    )
    setPreview((prev) => (prev.visible ? { ...prev, x, y } : prev))
  }, [])

  const hide = useCallback(() => {
    setPreview((prev) => ({ ...prev, visible: false, videoSrc: null }))
  }, [])

  return { preview, show, move, hide }
}

export function WhatWeDoHoverVideoPreview({
  preview,
}: {
  preview: PreviewState
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (preview.visible && preview.videoSrc) {
      void video.play().catch(() => {})
    } else {
      video.pause()
    }
  }, [preview.visible, preview.videoSrc])

  const videoSrc = preview.videoSrc
  if (!mounted || !preview.visible || !videoSrc) return null

  return createPortal(
    <div
      aria-hidden={!preview.visible}
      className={`
        fixed z-100 overflow-hidden rounded-xl border border-white/20
        bg-chambray shadow-[0_12px_40px_rgba(0,0,0,0.35)]
        pointer-events-none select-none
        transition-opacity duration-200 ease-out
        ${preview.visible ? 'opacity-100' : 'opacity-0'}
      `}
      style={{
        width: `${PREVIEW_WIDTH_PX}px`,
        height: `${PREVIEW_HEIGHT_PX}px`,
        left: preview.x,
        top: preview.y,
      }}
    >
      <video
        ref={videoRef}
        key={videoSrc}
        src={videoSrc}
        muted
        loop
        playsInline
        preload="metadata"
        className="h-full w-full object-cover"
      />
    </div>,
    document.body,
  )
}
