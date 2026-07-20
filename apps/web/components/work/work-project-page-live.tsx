'use client'

import WorkProjectPage from '@/components/work/work-project-page'
import { useWorkProjectLive } from '@/components/work/work-project-cms-provider'

/** Presentation-aware detail page — reads live project from WorkProjectCmsProvider. */
export default function WorkProjectPageLive() {
  const project = useWorkProjectLive()
  return <WorkProjectPage project={project} />
}
