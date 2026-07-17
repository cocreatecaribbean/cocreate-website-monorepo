'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import BrandGuidelinesSection from '@/components/brand-guidelines-section'
import ClientAdminSettingsPanel from '@/components/client-admin-settings-panel'
import AdminOrganizationLogoEditor from '@/components/organization-logo-editor'
import ProjectStatusAttribution from '@/components/project-status-attribution'
import AdminToast from '@/components/admin-toast'
import ClientTeamPanel from '@/components/client-team-panel'
import AdminClientMessagesView from '@/components/admin-client-messages-view'
import CreateProjectModal from '@/components/create-project-modal'
import { tabForThreadType } from '@/components/project-workspace-shared'
import {
  adminFetchErrorHint,
  AdminApiFetchError,
  fetchAdminBff,
} from '@/lib/admin-api-fetch'
import { useApproveClientProjectMutation } from '@/lib/api/mutations/projects'
import { adminQueryKeys } from '@/lib/api/query-keys'
import {
  useClientActivityQuery,
  useClientDetailQuery,
  useClientProjectsQuery,
} from '@/lib/api/queries/clients'
import { prefetchAdminProjectOverview } from '@/lib/api/queries/projects'
import { bricolage_grot600, bricolage_grot700 } from '@/styles/fonts'
import WorkspaceSectionNav from '@cocreate/app-ui/workspace-section-nav'
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  FolderKanban,
  LayoutGrid,
  MessageSquare,
  Users,
} from 'lucide-react'

type TabId = 'overview' | 'projects' | 'files' | 'messages' | 'activity' | 'team'

type ClientWorkspaceProps = {
  organizationId: string
  initialTab?: TabId
}

export default function ClientWorkspace({ organizationId, initialTab = 'projects' }: ClientWorkspaceProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()

  const [tab, setTab] = useState<TabId>(initialTab)

  const clientQuery = useClientDetailQuery(organizationId)
  const projectsQuery = useClientProjectsQuery(organizationId)
  const activityQuery = useClientActivityQuery(organizationId, tab === 'activity')
  const approveProjectMutation = useApproveClientProjectMutation(organizationId)

  const client = clientQuery.data
  const projects = projectsQuery.data ?? []
  const activity = activityQuery.data ?? []
  const loading =
    clientQuery.isLoading ||
    projectsQuery.isLoading ||
    (tab === 'activity' && activityQuery.isLoading)
  const tabContentLoading = tab === 'activity' && activityQuery.isLoading

  const queryError =
    clientQuery.error ??
    projectsQuery.error ??
    (tab === 'activity' ? activityQuery.error : null)
  const loadError = queryError
    ? queryError instanceof AdminApiFetchError
      ? `${queryError.message} — ${adminFetchErrorHint(queryError.code)}`
      : queryError instanceof Error
        ? queryError.message
        : 'Could not load client workspace.'
    : null

  const messagesThreadOpen =
    tab === 'messages' && Boolean(searchParams.get('conversationId'))
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [completingId, setCompletingId] = useState<string | null>(null)
  const [highlightInviteRequestId, setHighlightInviteRequestId] = useState<string | null>(null)
  const [createProjectOpen, setCreateProjectOpen] = useState(false)
  const deepLinkAppliedRef = useRef(false)

  const workspaceSections = useMemo(
    () =>
      [
        { id: 'overview' as const, label: 'Overview', description: 'Client snapshot, account health, and quick links', icon: LayoutGrid },
        { id: 'projects' as const, label: 'Projects', description: 'All projects for this client organization', icon: FolderKanban },
        {
          id: 'files' as const,
          label: 'Brand & files',
          description: 'Brand guidelines, logos, and company reference files',
          icon: FileText,
        },
        { id: 'team' as const, label: 'Team', description: 'Client-side contacts and access', icon: Users },
        { id: 'messages' as const, label: 'Messages', description: 'Conversations with this client', icon: MessageSquare },
        { id: 'activity' as const, label: 'Activity', description: 'Recent updates across this client workspace', icon: CheckCircle2 },
      ] as const,
    [],
  )

  const selectTab = (itemId: TabId) => {
    setTab(itemId)
    const params = new URLSearchParams(window.location.search)
    params.set('tab', itemId)
    if (itemId !== 'messages') {
      params.delete('conversationId')
    }
    router.replace(`/clients/${organizationId}?${params.toString()}`, {
      scroll: false,
    })
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const t = params.get('tab')
    if (
      t === 'overview' ||
      t === 'activity' ||
      t === 'projects' ||
      t === 'team' ||
      t === 'files' ||
      t === 'messages'
    ) {
      setTab(t)
    }
    const inviteRequestId = params.get('inviteRequestId')
    if (inviteRequestId) {
      setHighlightInviteRequestId(inviteRequestId)
      setTab('team')
    }
  }, [])

  useEffect(() => {
    if (loading || deepLinkAppliedRef.current) return

    const params = new URLSearchParams(window.location.search)
    const threadId = params.get('thread')
    const projectId = params.get('projectId')
    if (!threadId && !projectId) return

    deepLinkAppliedRef.current = true

    if (projectId) {
      const project = projects.find((p) => p.id === projectId)
      const thread = threadId
        ? project?.requests?.find((r) => r.id === threadId)
        : undefined
      const tab = thread ? tabForThreadType(thread.type) : 'overview'
      const query = threadId
        ? `?tab=${tab}&thread=${encodeURIComponent(threadId)}`
        : ''
      router.replace(`/clients/${organizationId}/projects/${projectId}${query}`)
      return
    }

    if (threadId) {
      const project = projects.find((p) => p.requests?.some((r) => r.id === threadId))
      if (project) {
        const thread = project.requests?.find((r) => r.id === threadId)
        const tab = thread ? tabForThreadType(thread.type) : 'overview'
        router.replace(
          `/clients/${organizationId}/projects/${project.id}?tab=${tab}&thread=${encodeURIComponent(threadId)}`,
        )
      }
    }
  }, [loading, organizationId, projects, router])

  const markProjectComplete = async (projectId: string) => {
    setCompletingId(projectId)
    setError(null)
    try {
      await fetchAdminBff(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' }),
      })
      setSuccess('Project marked complete. Client has been notified.')
      void queryClient.invalidateQueries({
        queryKey: adminQueryKeys.projects.byOrganization(organizationId),
      })
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.projects.detail(projectId) })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not complete project')
    } finally {
      setCompletingId(null)
    }
  }

  const approveProject = async (projectId: string) => {
    setApprovingId(projectId)
    setError(null)
    try {
      await approveProjectMutation.mutateAsync(projectId)
      setSuccess('Project approved and client notified.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Approve failed')
    } finally {
      setApprovingId(null)
    }
  }

  const clientName = client?.name ?? 'Client'

  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-chambray/8 px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href="/clients"
          className={`inline-flex items-center gap-2 text-sm text-sanmarino hover:text-chambray ${bricolage_grot600.className}`}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          All clients
        </Link>
        <h1 className={`mt-3 text-xl text-chambray sm:text-2xl ${bricolage_grot700.className}`}>
          {clientName}
        </h1>
        {client?.primaryContact ? (
          <p className="mt-1 text-sm text-app-muted">{client.primaryContact.email}</p>
        ) : null}
        <WorkspaceSectionNav
          items={[...workspaceSections]}
          activeId={tab}
          onSelect={selectTab}
          ariaLabel="Client workspace sections"
          inputClassName="admin-input"
          pillClassName={bricolage_grot600.className}
        />
      </div>

      <div
        className={
          tab === 'messages' && messagesThreadOpen
            ? 'flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-6 lg:px-8'
            : 'flex-1 overflow-y-auto px-4 py-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-6 lg:px-8'
        }
      >
        {error ?? loadError ? (
          <p className="admin-alert-error mb-4">
            {error ?? loadError}
          </p>
        ) : null}
        {success ? (
          <AdminToast message={success} variant="success" onDismiss={() => setSuccess(null)} />
        ) : null}
        {loading && tabContentLoading ? (
          <p className="text-sm text-app-muted">Loading workspace…</p>
        ) : tab === 'overview' ? (
          <div className="space-y-6">
            <section className="admin-glass-card max-w-2xl p-6">
              <p className={`text-chambray ${bricolage_grot600.className}`}>Workspace summary</p>
              <ul className="mt-4 space-y-2 text-sm text-app-muted">
                <li>
                  <span className="font-medium text-chambray">{projects.length}</span> projects
                </li>
                <li>
                  <span className="font-medium text-chambray">
                    {projects.filter((p) => p.status === 'SUBMITTED').length}
                  </span>{' '}
                  awaiting approval
                </li>
              </ul>
            </section>
            {client ? (
              <ClientAdminSettingsPanel
                client={client}
                onSuccess={setSuccess}
                onError={setError}
              />
            ) : null}
          </div>
        ) : tab === 'team' ? (
          <ClientTeamPanel
            organizationId={organizationId}
            highlightInviteRequestId={highlightInviteRequestId}
          />
        ) : tab === 'files' ? (
          <div className="space-y-6">
            <AdminOrganizationLogoEditor
              organizationId={organizationId}
              organizationName={clientName}
              logoUrl={client?.logoUrl}
              onUpdated={() => {
                void queryClient.invalidateQueries({
                  queryKey: adminQueryKeys.clients.detail(organizationId),
                })
                void queryClient.invalidateQueries({ queryKey: adminQueryKeys.clients.all })
              }}
            />
            <BrandGuidelinesSection organizationId={organizationId} />
          </div>
        ) : tab === 'projects' ? (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-app-muted">
                {projects.length === 0
                  ? 'No projects yet — create one to start collaboration.'
                  : `${projects.length} project${projects.length === 1 ? '' : 's'}`}
              </p>
              <button
                type="button"
                onClick={() => setCreateProjectOpen(true)}
                className="admin-btn-primary text-sm"
              >
                Create project
              </button>
            </div>
            {projects.length === 0 ? null : (
              projects.map((project) => (
                <section key={project.id} className="admin-glass-card overflow-hidden">
                  <div className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-6">
                    <div>
                      <p className={`text-chambray ${bricolage_grot600.className}`}>
                        <Link
                          href={`/clients/${organizationId}/projects/${project.id}`}
                          className="underline-offset-4 hover:text-sanmarino hover:underline"
                          onMouseEnter={() =>
                            void prefetchAdminProjectOverview(queryClient, project.id)
                          }
                          onFocus={() =>
                            void prefetchAdminProjectOverview(queryClient, project.id)
                          }
                        >
                          {project.title}
                        </Link>
                      </p>
                      <p className="mt-1 line-clamp-2 text-sm text-app-muted">
                        {project.description}
                      </p>
                      <div className="mt-2">
                        <ProjectStatusAttribution project={project} />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/clients/${organizationId}/projects/${project.id}`}
                        className="admin-btn-primary text-sm"
                        onMouseEnter={() =>
                          void prefetchAdminProjectOverview(queryClient, project.id)
                        }
                        onFocus={() =>
                          void prefetchAdminProjectOverview(queryClient, project.id)
                        }
                      >
                        Open project
                      </Link>
                      <Link
                        href={`/clients/${organizationId}/projects/${project.id}?tab=team-review`}
                        className="admin-btn-ghost text-sm"
                      >
                        Team review
                      </Link>
                      {project.status === 'SUBMITTED' ? (
                        <button
                          type="button"
                          disabled={approvingId === project.id}
                          onClick={() => void approveProject(project.id)}
                          className="admin-btn-ghost text-sm"
                        >
                          {approvingId === project.id ? 'Onboarding…' : 'Onboard'}
                        </button>
                      ) : null}
                      {project.status === 'ACTIVE' ? (
                        <button
                          type="button"
                          disabled={completingId === project.id}
                          onClick={() => void markProjectComplete(project.id)}
                          className="admin-btn-ghost text-sm"
                        >
                          {completingId === project.id ? 'Saving…' : 'Mark complete'}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </section>
              ))
            )}
          </div>
        ) : tab === 'messages' ? (
          <Suspense fallback={<p className="text-sm text-app-muted">Loading messages…</p>}>
            <div
              className={
                messagesThreadOpen
                  ? 'flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden'
                  : ''
              }
            >
              <AdminClientMessagesView organizationId={organizationId} />
            </div>
          </Suspense>
        ) : (
          <ul className="admin-glass-card divide-y divide-chambray/6 overflow-hidden">
            {activity.length === 0 ? (
              <li className="px-6 py-8 text-sm text-app-muted">No activity yet.</li>
            ) : (
              activity.map((item) => (
                <li key={item.id} className="px-5 py-3 sm:px-6">
                  <p className={`text-sm text-chambray ${bricolage_grot600.className}`}>
                    {item.projectTitle}
                  </p>
                  <p className="text-xs text-app-muted">
                    {item.summary ?? item.action}
                  </p>
                  <p className="mt-0.5 text-xs text-app-muted">
                    {item.actorName ?? item.actorEmail} ·{' '}
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      <CreateProjectModal
        open={createProjectOpen}
        organizationId={organizationId}
        onClose={() => setCreateProjectOpen(false)}
        onCreated={(summary) => {
          setSuccess(summary)
        }}
      />
    </main>
  )
}
