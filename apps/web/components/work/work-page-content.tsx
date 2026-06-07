'use client'

import './work-tiles.css'
import { useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useWorkPageAnimation } from '@/hooks/use-work-page-animation'
import WorkMasonryGrid from '@/components/work/work-masonry-grid'
import WorkPageHeader from '@/components/work/work-page-header'
import type { ProjectPreview, WorkProjectCategory } from '@cocreate/types'

type WorkPageContentProps = {
  items: ProjectPreview[]
  clientName?: string | null
  categoryName?: WorkProjectCategory | null
  tagName?: string | null
}

export default function WorkPageContent({
  items,
  clientName = null,
  categoryName = null,
  tagName = null,
}: WorkPageContentProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const revealKey = `${pathname}?${searchParams.toString()}`
  useWorkPageAnimation({ scope: sectionRef, revealKey })

  const isFiltered = Boolean(clientName || categoryName || tagName)

  return (
    <section ref={sectionRef} className="work-page-content">
      <WorkPageHeader
        clientFilterName={clientName}
        categoryFilterName={categoryName}
        tagFilterName={tagName}
      />
      {isFiltered && items.length === 0 ? (
        <p className="mx-auto w-[88svw] max-w-[1320px] text-center text-lg text-slate-600">
          No projects found for this filter.
        </p>
      ) : (
        <WorkMasonryGrid items={items} />
      )}
    </section>
  )
}
