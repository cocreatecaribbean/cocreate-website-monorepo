import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import WorkProjectPage from '@/components/work/work-project-page'
import { toWorkProjectDetail } from '@/lib/work-project-detail'
import {
  getAllWorkProjectSlugs,
  getWorkProjectBySlug,
} from '@/lib/search/static-search'

type WorkProjectRouteProps = {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return getAllWorkProjectSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: WorkProjectRouteProps): Promise<Metadata> {
  const { slug } = await params
  const project = getWorkProjectBySlug(slug)
  if (!project) return { title: 'Project not found' }

  return {
    title: `${project.projectName} | ${project.clientName} | CoCreate Caribbean`,
    description: project.summary,
  }
}

export default async function WorkProjectRoute({ params }: WorkProjectRouteProps) {
  const { slug } = await params
  const project = getWorkProjectBySlug(slug)
  if (!project) notFound()

  return <WorkProjectPage project={toWorkProjectDetail(project)} />
}
