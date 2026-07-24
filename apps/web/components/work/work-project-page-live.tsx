'use client'

import WorkProjectPage from '@/components/work/work-project-page'
import { useWorkProjectLive } from '@/components/work/work-project-cms-provider'
import * as fonts from '@/styles/fonts'

/** Presentation-aware detail page — reads live project from WorkProjectCmsProvider. */
export default function WorkProjectPageLive() {
  const project = useWorkProjectLive()

  if (!project) {
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

  return <WorkProjectPage project={project} />
}
