import type { Metadata } from 'next'
import { Suspense } from 'react'
import WorkPageContent from '@/components/work/work-page-content'
import { formatWorkPageTitle, getWorkPageTitle } from '@/site-info/work-page-data'
import {
  getCategoryDisplayName,
  getClientDisplayName,
  getWorkProjects,
} from '@/lib/search/site-search'
import {
  getCategoryDisplayNameFromData,
  getClientDisplayNameFromData,
  getWorkProjectsForCategoryFromData,
  getWorkProjectsForClientFromData,
} from '@/lib/search/search-site'

type WorkPageProps = {
  searchParams: Promise<{ client?: string; category?: string }>
}

export async function generateMetadata({
  searchParams,
}: WorkPageProps): Promise<Metadata> {
  const { client, category } = await searchParams
  const clientSlug = client?.trim().toLowerCase()
  const categorySlug = category?.trim().toLowerCase()
  const clientName = clientSlug ? await getClientDisplayName(clientSlug) : null
  const categoryName = categorySlug ? await getCategoryDisplayName(categorySlug) : null
  const title = getWorkPageTitle({
    clientName,
    categoryName,
  })

  if (clientName || categoryName) {
    return {
      title: `${formatWorkPageTitle(title)} | CoCreate Caribbean`,
    }
  }

  return {
    title: 'Our Work | CoCreate Caribbean',
  }
}

export default async function WorkPage({ searchParams }: WorkPageProps) {
  const { client, category } = await searchParams
  const clientSlug = client?.trim().toLowerCase() || undefined
  const categorySlug = category?.trim().toLowerCase() || undefined
  const allProjects = await getWorkProjects()

  let items = allProjects
  let clientName: string | null = null
  let categoryName = null

  if (clientSlug) {
    items = getWorkProjectsForClientFromData(allProjects, clientSlug)
    clientName = getClientDisplayNameFromData(allProjects, clientSlug)
  } else if (categorySlug) {
    items = getWorkProjectsForCategoryFromData(allProjects, categorySlug)
    categoryName = getCategoryDisplayNameFromData(allProjects, categorySlug)
  }

  return (
    <main className="min-h-svh overflow-x-clip pb-20 md:pb-28">
      <Suspense fallback={null}>
        <WorkPageContent
          items={items}
          clientName={clientName}
          categoryName={categoryName}
        />
      </Suspense>
    </main>
  )
}
