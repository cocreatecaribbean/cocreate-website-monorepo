import type { WorkProjectDetail } from '@cocreate/types'
import { workClientFilterHref } from '@/lib/client-slug'
import { workPageTopOffsetClass } from '@/lib/work-page-layout'
import { workProjectPath } from '@/lib/work-project-path'
import CoCreateButton from '@/components/ui/cocreate-button'
import ViewAllWorkLink from '@/components/work/view-all-work-link'
import ProjectHeader from '@/components/work/sections/project-header'
import ProjectSections from '@/components/work/sections/project-sections'

type WorkProjectPageProps = {
  project: WorkProjectDetail
}

export default function WorkProjectPage({ project }: WorkProjectPageProps) {
  const clientHref = workClientFilterHref(project.clientSlug!)
  const sharePath = workProjectPath(project.slug)

  return (
    <main className="min-h-svh pb-20 md:pb-28">
      <article
        className={`mx-auto flex w-[88svw] max-w-[1200px] flex-col gap-24 md:gap-28 lg:gap-32 ${workPageTopOffsetClass}`}
      >
        <ProjectHeader
          projectName={project.projectName}
          clientName={project.clientName}
          clientHref={clientHref}
          hero={project.hero}
          coverFallbackSrc={project.coverImageSrc}
          coverFallbackBlurDataURL={project.coverImageBlurDataURL}
        />

        <ProjectSections
          sections={project.sections}
          pageUrl={sharePath}
          pageTitle={project.projectName}
        />

        <footer className="flex flex-col items-start gap-6 border-t border-chambray/10 pt-10 sm:flex-row sm:items-center sm:justify-between">
          <ViewAllWorkLink />
          <CoCreateButton href={clientHref} size="md">
            More from {project.clientName}
          </CoCreateButton>
        </footer>
      </article>
    </main>
  )
}
