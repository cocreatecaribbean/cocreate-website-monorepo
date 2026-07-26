import { notFound } from 'next/navigation'
import { draftMode } from 'next/headers'
import type { Metadata } from 'next'
import { OriginalCmsProvider } from '@/components/originals/original-cms-provider'
import OriginalDetailLive from '@/components/originals/original-detail-live'
import { fetchOriginalBySlug, fetchOriginalSlugs } from '@/lib/cms/originals'
import { getSanityPreviewContext } from '@/lib/preview-context'

export const dynamic = 'force-dynamic'

type OriginalRouteProps = {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const slugs = await fetchOriginalSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: OriginalRouteProps): Promise<Metadata> {
  const { slug } = await params
  const preview = await getSanityPreviewContext()
  const original = await fetchOriginalBySlug(slug, preview)
  if (!original) return { title: 'Original not found' }

  return {
    title: `${original.title} | Originals | CoCreate Caribbean`,
    description: original.description ?? 'CoCreate studio-led original.',
  }
}

export default async function OriginalDetailRoute({ params }: OriginalRouteProps) {
  const { slug } = await params
  const preview = await getSanityPreviewContext()
  const original = await fetchOriginalBySlug(slug, preview)

  if (!original) {
    const { isEnabled: isDraftMode } = await draftMode()
    // Soft RSC refresh drops embedded → published miss. Keep a shell in draft
    // mode so Presentation can recover via usePresentationQuery (no 404 flash).
    if (!isDraftMode) notFound()
  }

  return (
    <OriginalCmsProvider initial={original} slug={slug}>
      <OriginalDetailLive />
    </OriginalCmsProvider>
  )
}
