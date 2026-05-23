import type { Metadata } from 'next'
import { Suspense } from 'react'
import WorkPageContent from '@/components/work/work-page-content'
import { formatWorkPageTitle, getWorkPageTitle } from '@/site-info/work-page-data'
import {
  getCategoryDisplayName,
  getClientDisplayName,
} from '@/lib/search/static-search'

type WorkPageProps = {
  searchParams: Promise<{ client?: string; category?: string }>
}

export async function generateMetadata({
  searchParams,
}: WorkPageProps): Promise<Metadata> {
  const { client, category } = await searchParams
  const clientSlug = client?.trim().toLowerCase()
  const categorySlug = category?.trim().toLowerCase()
  const clientName = clientSlug ? getClientDisplayName(clientSlug) : null
  const categoryName = categorySlug ? getCategoryDisplayName(categorySlug) : null
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

  return (
    <main className="min-h-svh overflow-x-clip pb-20 md:pb-28">
      <Suspense fallback={null}>
        <WorkPageContent clientSlug={clientSlug} categorySlug={categorySlug} />
      </Suspense>
    </main>
  )
}
