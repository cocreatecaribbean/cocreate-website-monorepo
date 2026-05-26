import ClientWorkspace from '@/components/client-workspace'

type PageProps = {
  params: Promise<{ organizationId: string }>
  searchParams: Promise<{ tab?: string }>
}

export default async function ClientWorkspacePage({ params, searchParams }: PageProps) {
  const { organizationId } = await params
  const { tab } = await searchParams
  const initialTab =
    tab === 'inbox' || tab === 'overview' || tab === 'activity' || tab === 'projects'
      ? tab
      : 'projects'

  return <ClientWorkspace organizationId={organizationId} initialTab={initialTab} />
}
