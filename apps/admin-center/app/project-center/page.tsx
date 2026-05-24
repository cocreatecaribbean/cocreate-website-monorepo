import { FolderKanban, Plus } from 'lucide-react'
import AdminPageHeader from '@/components/admin-page-header'

const projects = [
  {
    name: 'Island Fresh Rebrand',
    client: 'Island Fresh Ltd.',
    status: 'In progress',
    phase: 'Design review',
  },
  {
    name: 'Caribbean Tourism Portal',
    client: 'CTB',
    status: 'Discovery',
    phase: 'Stakeholder workshops',
  },
  {
    name: 'CoCreate Intranet',
    client: 'Internal',
    status: 'Planning',
    phase: 'Information architecture',
  },
]

export default function ProjectCenterPage() {
  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <AdminPageHeader
        eyebrow="Workspace"
        title="Project Center"
        description="Track engagements, milestones, and deliverables across client work."
        action={
          <button
            type="button"
            className="inline-flex w-full min-h-11 items-center justify-center gap-2 rounded-full bg-chambray px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sanmarino sm:w-auto"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            New project
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto overscroll-y-contain px-4 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-8 lg:px-8 lg:py-10 xl:px-10">
        <section className="overflow-hidden rounded-2xl border border-white/80 bg-white shadow-[0_8px_30px_rgba(57,65,154,0.06)] sm:rounded-3xl">
          <div className="border-b border-chambray/8 px-4 py-3 sm:px-6 sm:py-4">
            <h2 className="font-semibold text-chambray">Active projects</h2>
          </div>
          <ul className="divide-y divide-chambray/8">
            {projects.map((project) => (
              <li
                key={project.name}
                className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5"
              >
                <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                  <div className="shrink-0 rounded-xl bg-sanmarino/10 p-2.5 text-sanmarino sm:p-3">
                    <FolderKanban className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium wrap-break-word text-slate-900">{project.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{project.client}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 pl-11 sm:justify-end sm:gap-3 sm:pl-0">
                  <span className="rounded-full bg-casablanca/15 px-3 py-1 text-xs font-semibold text-chambray">
                    {project.status}
                  </span>
                  <span className="text-sm text-slate-500">{project.phase}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  )
}
