'use client'

import { useEffect, useRef, useState } from 'react'
import EmojiPicker, { Theme } from 'emoji-picker-react'
import { Smile } from 'lucide-react'
import { useTheme } from 'next-themes'

type EmojiPickerButtonProps = {
  variant: 'portal' | 'admin'
  onSelect: (emoji: string) => void
  disabled?: boolean
}

export default function EmojiPickerButton({
  variant,
  onSelect,
  disabled = false,
}: EmojiPickerButtonProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const { resolvedTheme } = useTheme()

  const btnClass =
    variant === 'admin'
      ? 'admin-btn-ghost inline-flex items-center justify-center p-2'
      : 'portal-btn-ghost inline-flex items-center justify-center p-2'

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        aria-label="Insert emoji"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className={`${btnClass} text-sm`}
      >
        <Smile className="h-4 w-4" aria-hidden />
      </button>
      {open ? (
        <div className="absolute bottom-full left-0 z-50 mb-2 shadow-lg">
          <EmojiPicker
            theme={resolvedTheme === 'dark' ? Theme.DARK : Theme.LIGHT}
            onEmojiClick={(data) => {
              onSelect(data.emoji)
              setOpen(false)
            }}
            width={320}
            height={360}
            previewConfig={{ showPreview: false }}
          />
        </div>
      ) : null}
    </div>
  )
}
