'use client'

import { useState } from 'react'
import AdminPageHeader from '@/components/admin-page-header'
import AdminToast from '@/components/admin-toast'
import CreateProjectModal from '@/components/create-project-modal'
import ProjectCenterList from '@/components/project-center-list'

export default function ProjectCenterView() {
  const [createOpen, setCreateOpen] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState(0)

  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <AdminPageHeader
        eyebrow="Workspace"
        title="Project Center"
        description="Track engagements, milestones, and deliverables across client work."
        action={
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="admin-btn-primary text-sm"
          >
            Create project
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto overscroll-y-contain px-4 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-8 lg:px-8 lg:py-10 xl:px-10">
        {success ? (
          <AdminToast
            message={success}
            variant="success"
            onDismiss={() => setSuccess(null)}
          />
        ) : null}
        <ProjectCenterList refreshToken={refreshToken} />
      </div>

      <CreateProjectModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(summary) => {
          setSuccess(summary)
          setRefreshToken((n) => n + 1)
        }}
      />
    </main>
  )
}
