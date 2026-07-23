'use client'

import { ChevronDown } from 'lucide-react'

export type NewMessagesJumpButtonProps = {
  count: number
  onClick: () => void
  variant?: 'portal' | 'admin'
  className?: string
}

export function NewMessagesJumpButton({
  count,
  onClick,
  variant = 'portal',
  className = '',
}: NewMessagesJumpButtonProps) {
  if (count <= 0) return null

  const label = count === 1 ? 'New message' : `${count} new messages`
  const tone =
    variant === 'admin'
      ? 'border-chambray/15 bg-white text-chambray shadow-md hover:bg-chambray/5 dark:border-white/15 dark:bg-slate-900 dark:text-white dark:hover:bg-white/10'
      : 'border-chambray/15 bg-white text-chambray shadow-md hover:bg-chambray/5 dark:border-white/15 dark:bg-slate-900 dark:text-white dark:hover:bg-white/10'

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${tone} ${className}`.trim()}
      aria-live="polite"
    >
      <ChevronDown className="h-3.5 w-3.5" aria-hidden />
      {label}
    </button>
  )
}
