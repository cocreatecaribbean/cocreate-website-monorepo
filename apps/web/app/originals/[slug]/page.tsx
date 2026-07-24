import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import OriginalDetailView from '@/components/originals/original-detail-view'
import { fetchOriginalBySlug, fetchOriginalSlugs } from '@/lib/cms/originals'

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
  const original = await fetchOriginalBySlug(slug)
  if (!original) return { title: 'Original not found' }

  return {
    title: `${original.title} | Originals | CoCreate Caribbean`,
    description: original.description ?? 'CoCreate studio-led original.',
  }
}

export default async function OriginalDetailRoute({ params }: OriginalRouteProps) {
  const { slug } = await params
  const original = await fetchOriginalBySlug(slug)
  if (!original) notFound()

  return <OriginalDetailView original={original} />
}
