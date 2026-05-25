'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'

type AdminToastProps = {
  message: string
  variant: 'success' | 'error' | 'warn'
  onDismiss: () => void
  /** Auto-hide success/info toasts after ms (0 = never) */
  autoDismissMs?: number
}

const variantClass: Record<AdminToastProps['variant'], string> = {
  success: 'admin-alert-success',
  error: 'admin-alert-error',
  warn: 'admin-alert-warn',
}

export default function AdminToast({
  message,
  variant,
  onDismiss,
  autoDismissMs = variant === 'success' ? 5000 : 0,
}: AdminToastProps) {
  useEffect(() => {
    if (!autoDismissMs) return
    const timer = window.setTimeout(onDismiss, autoDismissMs)
    return () => window.clearTimeout(timer)
  }, [autoDismissMs, message, onDismiss])

  return (
    <div
      className="pointer-events-none fixed bottom-6 left-4 right-4 z-50 flex justify-center sm:left-auto sm:right-8 sm:max-w-md lg:left-[calc(18rem+1.5rem)] xl:left-[calc(18rem+2rem)]"
      role="status"
      aria-live="polite"
    >
      <div
        className={`pointer-events-auto flex w-full items-start gap-3 shadow-[0_12px_40px_rgba(57,65,154,0.18)] ${variantClass[variant]}`}
      >
        <p className="min-w-0 flex-1 leading-snug">{message}</p>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded-full p-1 opacity-70 transition hover:opacity-100"
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>
    </div>
  )
}
