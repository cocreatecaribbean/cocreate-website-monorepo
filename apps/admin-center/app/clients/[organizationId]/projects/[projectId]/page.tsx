import { Suspense } from 'react'
import AdminProjectWorkspace from '@/components/admin-project-workspace'
import { parseProjectWorkspaceTab } from '@/lib/project-workspace-tabs'

type PageProps = {
  params: Promise<{ organizationId: string; projectId: string }>
  searchParams: Promise<{ tab?: string; thread?: string }>
}

export default async function AdminProjectPage({ params, searchParams }: PageProps) {
  const { organizationId, projectId } = await params
  const { tab } = await searchParams

  return (
    <Suspense fallback={<p className="p-6 text-sm text-app-muted">Loading project…</p>}>
      <AdminProjectWorkspace
        organizationId={organizationId}
        projectId={projectId}
        initialTab={parseProjectWorkspaceTab(tab)}
      />
    </Suspense>
  )
}
