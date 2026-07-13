import type { Metadata } from 'next'
import { Suspense } from 'react'
import WorkPageContent from '@/components/work/work-page-content'
import { formatWorkPageTitle, getWorkPageTitle } from '@/site-info/work-page-data'
import { fetchWorkPage } from '@/lib/cms/work-page'
import { getSanityPreviewContext } from '@/lib/preview-context'
import {
  getCategoryDisplayName,
  getClientDisplayName,
  getTagDisplayName,
  getWorkProjects,
} from '@/lib/search/site-search'
import {
  getCategoryDisplayNameFromData,
  getClientDisplayNameFromData,
  getTagDisplayNameFromData,
  getWorkProjectsForCategoryFromData,
  getWorkProjectsForClientFromData,
  getWorkProjectsForTagFromData,
} from '@/lib/search/search-site'

type WorkPageProps = {
  searchParams: Promise<{ client?: string; category?: string; tag?: string }>
}

export async function generateMetadata({
  searchParams,
}: WorkPageProps): Promise<Metadata> {
  const preview = await getSanityPreviewContext()
  const workPage = await fetchWorkPage(preview)
  const { client, category, tag } = await searchParams
  const clientSlug = client?.trim().toLowerCase()
  const categorySlug = category?.trim().toLowerCase()
  const tagSlug = tag?.trim().toLowerCase()
  const clientName = clientSlug ? await getClientDisplayName(clientSlug) : null
  const categoryName = categorySlug ? await getCategoryDisplayName(categorySlug) : null
  const tagName = tagSlug ? await getTagDisplayName(tagSlug) : null
  const title = getWorkPageTitle({
    clientName,
    categoryName,
    tagName,
    titleLineOne: workPage.titleLineOne,
    titleLineTwo: workPage.titleLineTwo,
  })

  if (clientName || categoryName || tagName) {
    return {
      title: `${formatWorkPageTitle(title)} | CoCreate Caribbean`,
    }
  }

  return {
    title: `${formatWorkPageTitle(title)} | CoCreate Caribbean`,
  }
}

export default async function WorkPage({ searchParams }: WorkPageProps) {
  const preview = await getSanityPreviewContext()
  const { client, category, tag } = await searchParams
  const clientSlug = client?.trim().toLowerCase() || undefined
  const categorySlug = category?.trim().toLowerCase() || undefined
  const tagSlug = tag?.trim().toLowerCase() || undefined
  const [allProjects, workPage] = await Promise.all([
    getWorkProjects(preview),
    fetchWorkPage(preview),
  ])

  let items = allProjects
  let clientName: string | null = null
  let categoryName = null
  let tagName: string | null = null

  if (clientSlug) {
    items = getWorkProjectsForClientFromData(allProjects, clientSlug)
    clientName = getClientDisplayNameFromData(allProjects, clientSlug)
  } else if (tagSlug) {
    items = getWorkProjectsForTagFromData(allProjects, tagSlug)
    tagName = getTagDisplayNameFromData(allProjects, tagSlug)
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
          tagName={tagName}
          clientSlug={clientSlug}
          categorySlug={categorySlug}
          tagSlug={tagSlug}
          workPage={workPage}
        />
      </Suspense>
    </main>
  )
}
