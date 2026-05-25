import { FolderKanban, Plus } from 'lucide-react'
import AdminPageHeader from '@/components/admin-page-header'
import { bricolage_grot600 } from '@/styles/fonts'

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
          <button type="button" className="admin-btn-primary w-full sm:w-auto">
            <Plus className="h-4 w-4" strokeWidth={2} />
            New project
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto overscroll-y-contain px-4 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-8 lg:px-8 lg:py-10 xl:px-10">
        <section className="admin-glass-card admin-animate-in overflow-hidden">
          <div className="border-b border-white/50 bg-linear-to-r from-sanmarino/10 via-transparent to-casablanca/10 px-5 py-4 sm:px-6">
            <h2 className={`text-chambray ${bricolage_grot600.className}`}>Active projects</h2>
          </div>
          <ul className="divide-y divide-chambray/6">
            {projects.map((project) => (
              <li
                key={project.name}
                className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5"
              >
                <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                  <div className="shrink-0 rounded-xl bg-linear-to-br from-sanmarino/15 to-chambray/5 p-2.5 text-sanmarino ring-1 ring-sanmarino/10 sm:p-3">
                    <FolderKanban className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0">
                    <p className={`wrap-break-word text-slate-900 ${bricolage_grot600.className}`}>
                      {project.name}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">{project.client}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 pl-11 sm:justify-end sm:gap-3 sm:pl-0">
                  <span className="rounded-full bg-linear-to-r from-casablanca/25 to-casablanca/10 px-3 py-1 text-xs font-semibold text-chambray ring-1 ring-casablanca/25">
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
