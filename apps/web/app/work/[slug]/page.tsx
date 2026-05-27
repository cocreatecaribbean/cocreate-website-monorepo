import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import WorkProjectPage from '@/components/work/work-project-page'
import { fetchWorkProjectBySlug, fetchWorkProjectSlugs } from '@/lib/cms/work-projects'

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
  const project = await fetchWorkProjectBySlug(slug)
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
  const project = await fetchWorkProjectBySlug(slug)
  if (!project) notFound()

  return <WorkProjectPage project={project} />
}
