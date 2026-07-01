'use client'

import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Cropper, { type Area } from 'react-easy-crop'
import 'react-easy-crop/react-easy-crop.css'
import { X } from 'lucide-react'
import { getCroppedImageBlob } from '@/lib/crop-image'
import { bricolage_grot600 } from '@/styles/fonts'

type AvatarCropModalProps = {
  open: boolean
  imageSrc: string | null
  onClose: () => void
  onConfirm: (blob: Blob) => void | Promise<void>
}

export default function AvatarCropModal({
  open,
  imageSrc,
  onClose,
  onConfirm,
}: AvatarCropModalProps) {
  const [mounted, setMounted] = useState(false)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCroppedAreaPixels(null)
    setError(null)
    setSubmitting(false)
  }, [open, imageSrc])

  const onCropComplete = useCallback((_area: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels)
  }, [])

  const handleConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels) return
    setSubmitting(true)
    setError(null)
    try {
      const blob = await getCroppedImageBlob(imageSrc, croppedAreaPixels)
      await onConfirm(blob)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not crop image')
    } finally {
      setSubmitting(false)
    }
  }

  if (!mounted || !open || !imageSrc) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-chambray/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="avatar-crop-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close dialog"
        onClick={() => {
          if (!submitting) onClose()
        }}
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-chambray/10 bg-white p-6 shadow-xl dark:bg-chambray">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="admin-eyebrow">Profile photo</p>
            <h2
              id="avatar-crop-title"
              className={`mt-1 text-xl text-chambray ${bricolage_grot600.className}`}
            >
              Position your photo
            </h2>
            <p className="mt-1 text-sm text-app-muted">
              Drag to reposition and zoom so your face fits the circle.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg p-1 text-app-muted hover:bg-chambray/8"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative mt-5 h-[280px] w-full overflow-hidden rounded-2xl bg-chambray/5">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <label className="mt-4 block text-sm text-chambray">
          <span className="font-medium">Zoom</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="mt-2 w-full accent-chambray"
            disabled={submitting}
          />
        </label>

        {error ? (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="admin-btn-ghost text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={submitting || !croppedAreaPixels}
            className="admin-btn-primary text-sm"
          >
            {submitting ? 'Saving…' : 'Use photo'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
