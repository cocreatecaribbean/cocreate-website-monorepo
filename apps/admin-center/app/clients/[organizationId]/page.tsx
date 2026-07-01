import { Suspense } from 'react'
import ClientWorkspace from '@/components/client-workspace'

type PageProps = {
  params: Promise<{ organizationId: string }>
  searchParams: Promise<{ tab?: string }>
}

export default async function ClientWorkspacePage({ params, searchParams }: PageProps) {
  const { organizationId } = await params
  const { tab } = await searchParams
  const initialTab =
    tab === 'inbox' ||
    tab === 'overview' ||
    tab === 'activity' ||
    tab === 'projects' ||
    tab === 'files' ||
    tab === 'team' ||
    tab === 'messages'
      ? tab
      : 'projects'

  return (
    <Suspense fallback={<p className="p-8 text-sm text-app-muted">Loading client workspace…</p>}>
      <ClientWorkspace organizationId={organizationId} initialTab={initialTab} />
    </Suspense>
  )
}
