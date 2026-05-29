import CollaborateProjectView from '@/components/collaborate-project-view'

type PageProps = {
  params: Promise<{ projectId: string }>
}

export default async function CollaborateProjectPage({ params }: PageProps) {
  const { projectId } = await params
  return <CollaborateProjectView projectId={projectId} />
}
