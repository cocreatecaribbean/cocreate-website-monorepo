'use client'

import './work-tiles.css'
import {useMemo, useRef} from 'react'
import {usePathname, useSearchParams} from 'next/navigation'
import {useWorkPageAnimation} from '@/hooks/use-work-page-animation'
import WorkMasonryGrid from '@/components/work/work-masonry-grid'
import WorkPageHeader from '@/components/work/work-page-header'
import {
  WorkCmsProvider,
  useWorkProjectsLive,
} from '@/components/work/work-cms-provider'
import type {WorkPageContent as WorkPageCmsContent} from '@/lib/cms/work-page-content'
import type {ProjectPreview, WorkProjectCategory} from '@cocreate/types'
import {
  getWorkProjectsForCategoryFromData,
  getWorkProjectsForClientFromData,
  getWorkProjectsForTagFromData,
} from '@/lib/search/search-site'

type WorkPageContentProps = {
  items: ProjectPreview[]
  clientName?: string | null
  categoryName?: WorkProjectCategory | null
  tagName?: string | null
  clientSlug?: string | null
  categorySlug?: string | null
  tagSlug?: string | null
  workPage: WorkPageCmsContent
}

function WorkPageBody({
  items,
  clientName = null,
  categoryName = null,
  tagName = null,
  clientSlug = null,
  categorySlug = null,
  tagSlug = null,
}: Omit<WorkPageContentProps, 'workPage'>) {
  const sectionRef = useRef<HTMLElement>(null)
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const revealKey = `${pathname}?${searchParams.toString()}`
  useWorkPageAnimation({scope: sectionRef, revealKey})

  const liveProjects = useWorkProjectsLive()

  const gridItems = useMemo(() => {
    const source = liveProjects ?? items
    if (clientSlug) {
      return getWorkProjectsForClientFromData(source, clientSlug)
    }
    if (tagSlug) {
      return getWorkProjectsForTagFromData(source, tagSlug)
    }
    if (categorySlug) {
      return getWorkProjectsForCategoryFromData(source, categorySlug)
    }
    return source
  }, [liveProjects, items, clientSlug, categorySlug, tagSlug])

  const isFiltered = Boolean(clientName || categoryName || tagName)

  return (
    <section ref={sectionRef} className="work-page-content">
      <WorkPageHeader
        clientFilterName={clientName}
        categoryFilterName={categoryName}
        tagFilterName={tagName}
      />
      {isFiltered && gridItems.length === 0 ? (
        <p className="mx-auto w-[88svw] max-w-[1320px] text-center text-lg text-slate-600">
          No projects found for this filter.
        </p>
      ) : (
        <WorkMasonryGrid items={gridItems} />
      )}
    </section>
  )
}

export default function WorkPageContent({
  items,
  clientName = null,
  categoryName = null,
  tagName = null,
  clientSlug = null,
  categorySlug = null,
  tagSlug = null,
  workPage,
}: WorkPageContentProps) {
  return (
    <WorkCmsProvider initial={workPage} initialProjects={items}>
      <WorkPageBody
        items={items}
        clientName={clientName}
        categoryName={categoryName}
        tagName={tagName}
        clientSlug={clientSlug}
        categorySlug={categorySlug}
        tagSlug={tagSlug}
      />
    </WorkCmsProvider>
  )
}
