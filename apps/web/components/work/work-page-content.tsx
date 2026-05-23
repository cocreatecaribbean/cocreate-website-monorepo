'use client'

import './work-tiles.css'
import { useMemo, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useWorkPageAnimation } from '@/hooks/use-work-page-animation'
import WorkMasonryGrid from '@/components/work/work-masonry-grid'
import WorkPageHeader from '@/components/work/work-page-header'
import {
  getCategoryDisplayName,
  getClientDisplayName,
  getWorkProjectsForCategory,
  getWorkProjectsForClient,
  workProjects,
} from '@/lib/search/static-search'

type WorkPageContentProps = {
  clientSlug?: string
  categorySlug?: string
}

export default function WorkPageContent({
  clientSlug,
  categorySlug,
}: WorkPageContentProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const revealKey = `${pathname}?${searchParams.toString()}`
  useWorkPageAnimation({ scope: sectionRef, revealKey })

  const { items, clientName, categoryName } = useMemo(() => {
    if (clientSlug) {
      return {
        items: getWorkProjectsForClient(clientSlug),
        clientName: getClientDisplayName(clientSlug),
        categoryName: null as string | null,
      }
    }
    if (categorySlug) {
      const category = getCategoryDisplayName(categorySlug)
      return {
        items: getWorkProjectsForCategory(categorySlug),
        clientName: null as string | null,
        categoryName: category,
      }
    }
    return {
      items: workProjects,
      clientName: null as string | null,
      categoryName: null as string | null,
    }
  }, [clientSlug, categorySlug])

  const isFiltered = Boolean(clientSlug || categorySlug)

  return (
    <section ref={sectionRef} className="work-page-content">
      <WorkPageHeader
        clientFilterName={clientName}
        categoryFilterName={categoryName}
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
