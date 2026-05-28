'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

type ImageLightboxProps = {
  open: boolean
  src: string
  alt: string
  onClose: () => void
}

export default function ImageLightbox({ open, src, alt, onClose }: ImageLightboxProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  if (!mounted || !open) return null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8">
      <button
        type="button"
        aria-label="Close image preview"
        className="absolute inset-0 bg-chambray/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={alt}
        className="relative z-10 flex max-h-[90vh] max-w-[90vw] flex-col items-center gap-3"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute -right-2 -top-2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white text-chambray shadow-md hover:bg-white/95 sm:-right-3 sm:-top-3"
          aria-label="Close"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="max-h-[85vh] max-w-full rounded-lg object-contain shadow-2xl"
        />
        <p className="max-w-full truncate text-center text-sm text-white/90">{alt}</p>
      </div>
    </div>,
    document.body,
  )
}
