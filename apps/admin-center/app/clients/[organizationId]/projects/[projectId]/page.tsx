import { Suspense } from 'react'
import AdminProjectWorkspace, {
  type ProjectWorkspaceTabId,
} from '@/components/admin-project-workspace'

type PageProps = {
  params: Promise<{ organizationId: string; projectId: string }>
  searchParams: Promise<{ tab?: string; thread?: string }>
}

function parseTab(value: string | undefined): ProjectWorkspaceTabId {
  if (
    value === 'overview' ||
    value === 'threads' ||
    value === 'team-review' ||
    value === 'collaborators'
  ) {
    return value
  }
  return 'overview'
}

export default async function AdminProjectPage({ params, searchParams }: PageProps) {
  const { organizationId, projectId } = await params
  const { tab } = await searchParams

  return (
    <Suspense fallback={<p className="p-6 text-sm text-app-muted">Loading project…</p>}>
      <AdminProjectWorkspace
        organizationId={organizationId}
        projectId={projectId}
        initialTab={parseTab(tab)}
      />
    </Suspense>
  )
}
