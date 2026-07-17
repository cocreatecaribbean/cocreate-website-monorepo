'use client'

import { useEffect, useRef, useState } from 'react'
import { Heart, ChevronDown, SmilePlus } from 'lucide-react'
import {
  clearAttachmentReaction,
  setAttachmentReaction,
} from '@/lib/projects/fetch-top-picks'
import { REACTION_EMOJI } from '@/lib/projects/file-reaction-display'
import type {
  ProjectAttachmentWithReactions,
  ProjectFileReactionKind,
} from '@/lib/projects/types'

const REACTION_OPTIONS: Array<{
  kind: ProjectFileReactionKind
  label: string
  isPositive: boolean
}> = [
  { kind: 'LOVE_THIS', label: 'Love this', isPositive: true },
  { kind: 'SHIP_IT', label: 'Ship it', isPositive: true },
  { kind: 'GREAT_DIRECTION', label: 'Great direction', isPositive: true },
  { kind: 'ANOTHER_VERSION', label: 'Another version', isPositive: false },
  { kind: 'NEEDS_A_TWEAK', label: 'Needs a tweak', isPositive: false },
]

function labelFor(kind: ProjectFileReactionKind | null): string {
  if (!kind) return 'React'
  return REACTION_OPTIONS.find((option) => option.kind === kind)?.label ?? 'React'
}

export default function FileReactionMenu({
  attachmentId,
  initialReaction = null,
  compact = false,
  onChange,
}: {
  attachmentId: string
  initialReaction?: ProjectFileReactionKind | null
  /** Icon-only trigger for message attachments (WhatsApp-style). */
  compact?: boolean
  onChange?: (result: ProjectAttachmentWithReactions) => void
}) {
  const [reaction, setReaction] = useState<ProjectFileReactionKind | null>(
    initialReaction,
  )
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setReaction(initialReaction)
  }, [initialReaction])

  useEffect(() => {
    if (!open) return
    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const applyReaction = async (kind: ProjectFileReactionKind) => {
    setOpen(false)
    if (kind === reaction) return
    setSaving(true)
    const previous = reaction
    setReaction(kind)
    const result = await setAttachmentReaction(attachmentId, kind)
    setSaving(false)
    if (result) {
      setReaction(result.myReaction)
      onChange?.(result)
    } else {
      setReaction(previous)
    }
  }

  const removeReaction = async () => {
    setOpen(false)
    if (!reaction) return
    setSaving(true)
    const previous = reaction
    setReaction(null)
    const result = await clearAttachmentReaction(attachmentId)
    setSaving(false)
    if (result) {
      setReaction(result.myReaction)
      onChange?.(result)
    } else {
      setReaction(previous)
    }
  }

  const active = reaction !== null

  return (
    <div ref={containerRef} className="relative">
      {compact ? (
        <button
          type="button"
          disabled={saving}
          onClick={(event) => {
            event.stopPropagation()
            setOpen((prev) => !prev)
          }}
          className={`inline-flex h-8 w-8 items-center justify-center rounded-full border shadow-sm transition ${
            active
              ? 'border-sanmarino/30 bg-white text-base dark:bg-slate-900'
              : 'border-chambray/15 bg-white text-app-muted hover:border-sanmarino/30 hover:text-chambray dark:bg-slate-900 dark:hover:text-casablanca'
          }`}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={active ? `Reaction: ${labelFor(reaction)}` : 'Add reaction'}
        >
          {active && reaction ? (
            <span aria-hidden>{REACTION_EMOJI[reaction]}</span>
          ) : (
            <SmilePlus className="h-4 w-4" aria-hidden />
          )}
        </button>
      ) : (
        <button
          type="button"
          disabled={saving}
          onClick={(event) => {
            event.stopPropagation()
            setOpen((prev) => !prev)
          }}
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition ${
            active
              ? 'bg-sanmarino/15 text-chambray ring-1 ring-sanmarino/30'
              : 'text-app-muted hover:bg-chambray/5'
          }`}
          aria-haspopup="menu"
          aria-expanded={open}
        >
          <Heart
            className={`h-3.5 w-3.5 ${active ? 'fill-sanmarino text-sanmarino' : ''}`}
            aria-hidden
          />
          {labelFor(reaction)}
          <ChevronDown className="h-3 w-3" aria-hidden />
        </button>
      )}

      {open ? (
        <div
          role="menu"
          className={`absolute z-30 mt-1 w-44 overflow-hidden rounded-xl border border-chambray/10 bg-white py-1 shadow-lg dark:bg-slate-900 ${
            compact ? 'right-0 top-full' : 'right-0'
          }`}
          onClick={(event) => event.stopPropagation()}
        >
          {REACTION_OPTIONS.map((option) => (
            <button
              key={option.kind}
              type="button"
              role="menuitemradio"
              aria-checked={reaction === option.kind}
              onClick={(event) => {
                event.stopPropagation()
                void applyReaction(option.kind)
              }}
              className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-xs transition hover:bg-chambray/5 ${
                reaction === option.kind ? 'text-chambray' : 'text-app-muted'
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <span aria-hidden>{REACTION_EMOJI[option.kind]}</span>
                {option.label}
              </span>
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  option.isPositive ? 'bg-emerald-500' : 'bg-casablanca'
                }`}
                aria-hidden
              />
            </button>
          ))}
          {reaction ? (
            <button
              type="button"
              role="menuitem"
              onClick={(event) => {
                event.stopPropagation()
                void removeReaction()
              }}
              className="mt-1 flex w-full items-center border-t border-chambray/8 px-3 py-1.5 text-left text-xs text-app-muted transition hover:bg-chambray/5"
            >
              Clear reaction
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
