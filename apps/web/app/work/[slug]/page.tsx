import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { WorkProjectCmsProvider } from '@/components/work/work-project-cms-provider'
import WorkProjectPageLive from '@/components/work/work-project-page-live'
import { fetchWorkProjectBySlug, fetchWorkProjectSlugs } from '@/lib/cms/work-projects'
import { getSanityPreviewContext } from '@/lib/preview-context'

export const dynamic = 'force-dynamic'

type WorkProjectRouteProps = {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const slugs = await fetchWorkProjectSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: WorkProjectRouteProps): Promise<Metadata> {
  const { slug } = await params
  const preview = await getSanityPreviewContext()
  const project = await fetchWorkProjectBySlug(slug, preview)
  if (!project) return { title: 'Project not found' }

  const title =
    project.seo?.metaTitle ??
    `${project.projectName} | ${project.clientName} | CoCreate Caribbean`

  return {
    title,
    description: project.seo?.metaDescription ?? project.summary,
  }
}

export default async function WorkProjectRoute({ params }: WorkProjectRouteProps) {
  const { slug } = await params
  const preview = await getSanityPreviewContext()
  const project = await fetchWorkProjectBySlug(slug, preview)
  if (!project) notFound()

  return (
    <WorkProjectCmsProvider initial={project} slug={slug}>
      <WorkProjectPageLive />
    </WorkProjectCmsProvider>
  )
}
