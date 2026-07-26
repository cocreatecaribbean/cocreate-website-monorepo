'use client'

import OriginalDetailView from '@/components/originals/original-detail-view'
import { useOriginalLive } from '@/components/originals/original-cms-provider'
import * as fonts from '@/styles/fonts'

/** Presentation-aware detail — reads live original from OriginalCmsProvider. */
export default function OriginalDetailLive() {
  const original = useOriginalLive()

  if (!original) {
    return (
      <div
        className={`flex min-h-[70svh] w-full items-center justify-center px-6 text-center text-chambray/70 ${fonts.bricolage_grot500.className}`}
        role="status"
        aria-live="polite"
      >
        Loading preview…
      </div>
    )
  }

  return <OriginalDetailView original={original} />
}
