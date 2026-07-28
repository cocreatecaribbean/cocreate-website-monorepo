'use client'

import { type RefObject } from 'react'
import { usePageTitleReveal } from '@/hooks/use-page-title-reveal'

type UseWorkPageAnimationOptions = {
  scope: RefObject<HTMLElement | null>
  /** Re-run when filter or route identity changes (client nav). */
  revealKey: string
}

/** @deprecated Prefer usePageTitleReveal — kept as a thin alias for Work. */
export function useWorkPageAnimation({
  scope,
  revealKey,
}: UseWorkPageAnimationOptions) {
  usePageTitleReveal({ scope, revealKey })
}
