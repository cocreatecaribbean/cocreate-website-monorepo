import ProjectCenterList from '@/components/project-center-list'
import AdminPageHeader from '@/components/admin-page-header'

export default function ProjectCenterPage() {
  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <AdminPageHeader
        eyebrow="Workspace"
        title="Project Center"
        description="Track engagements, milestones, and deliverables across client work."
      />

      <div className="flex-1 overflow-y-auto overscroll-y-contain px-4 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-8 lg:px-8 lg:py-10 xl:px-10">
        <ProjectCenterList />
      </div>
    </main>
  )
}
