'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import AdminFilesSection from '@/components/admin-files-section'
import RequestMessageThread from '@/components/request-message-thread'
import ProjectStatusAttribution from '@/components/project-status-attribution'
import AdminToast from '@/components/admin-toast'
import MarkInboxReadOnView from '@/components/mark-inbox-read-on-view'
import ClientTeamPanel from '@/components/client-team-panel'
import CreateProjectModal from '@/components/create-project-modal'
import { CancellationResolveForm } from '@/components/project-workspace-shared'
import { useAdminSession } from '@/components/admin-session-provider'
import { isCoreTeamSession } from '@/lib/admin-session'
import {
  adminFetchErrorHint,
  AdminApiFetchError,
  fetchAdminBff,
} from '@/lib/admin-api-fetch'
import { useApproveClientProjectMutation } from '@/lib/api/mutations/projects'
import { useMarkInboxReadMutation } from '@/lib/api/mutations/clients'
import { adminQueryKeys } from '@/lib/api/query-keys'
import {
  useClientActivityQuery,
  useClientDetailQuery,
  useClientInboxQuery,
  useClientProjectsQuery,
  useInboxUnreadCountQuery,
} from '@/lib/api/queries/clients'
import { prefetchAdminProjectOverview } from '@/lib/api/queries/projects'
import { bricolage_grot600, bricolage_grot700 } from '@/styles/fonts'
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  FolderKanban,
  Inbox,
  LayoutGrid,
  Users,
} from 'lucide-react'

type TabId = 'overview' | 'projects' | 'files' | 'inbox' | 'activity' | 'team'

const requestTypeLabel: Record<string, string> = {
  ONBOARDING: 'Onboarding',
  PROGRESS: 'Progress',
  CANCELLATION: 'Cancellation request',
  INTERNAL: 'Team review',
}

type ClientWorkspaceProps = {
  organizationId: string
  initialTab?: TabId
}

export default function ClientWorkspace({ organizationId, initialTab = 'projects' }: ClientWorkspaceProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { session } = useAdminSession()
  const currentUserId = session?.mode === 'user' ? session.userId : null
  const isCoreTeam =
    session?.mode === 'user' && isCoreTeamSession(session.role)
  const canTrackUnread = session?.mode === 'user' && isCoreTeam

  const clientQuery = useClientDetailQuery(organizationId)
  const projectsQuery = useClientProjectsQuery(organizationId)
  const inboxQuery = useClientInboxQuery(organizationId)
  const activityQuery = useClientActivityQuery(organizationId)
  const unreadQuery = useInboxUnreadCountQuery(organizationId, canTrackUnread)
  const markInboxReadMutation = useMarkInboxReadMutation(organizationId)
  const approveProjectMutation = useApproveClientProjectMutation(organizationId)

  const client = clientQuery.data
  const projects = projectsQuery.data ?? []
  const inbox = inboxQuery.data ?? []
  const activity = activityQuery.data ?? []
  const unreadCount = unreadQuery.data ?? 0
  const loading =
    clientQuery.isLoading ||
    projectsQuery.isLoading ||
    inboxQuery.isLoading ||
    activityQuery.isLoading

  const queryError =
    clientQuery.error ??
    projectsQuery.error ??
    inboxQuery.error ??
    activityQuery.error
  const loadError = queryError
    ? queryError instanceof AdminApiFetchError
      ? `${queryError.message} — ${adminFetchErrorHint(queryError.code)}`
      : queryError instanceof Error
        ? queryError.message
        : 'Could not load client workspace.'
    : null

  const [tab, setTab] = useState<TabId>(initialTab)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [completingId, setCompletingId] = useState<string | null>(null)
  const [highlightInviteRequestId, setHighlightInviteRequestId] = useState<string | null>(null)
  const [createProjectOpen, setCreateProjectOpen] = useState(false)
  const deepLinkAppliedRef = useRef(false)

  useEffect(() => {
    if (tab !== 'inbox' || loading || !canTrackUnread) return
    void markInboxReadMutation.mutateAsync(undefined).catch(() => {
      /* non-blocking */
    })
  }, [tab, loading, canTrackUnread, markInboxReadMutation])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const t = params.get('tab')
    if (
      t === 'inbox' ||
      t === 'overview' ||
      t === 'activity' ||
      t === 'projects' ||
      t === 'team' ||
      t === 'files'
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
      const query = threadId
        ? `?tab=threads&thread=${encodeURIComponent(threadId)}`
        : ''
      router.replace(`/clients/${organizationId}/projects/${projectId}${query}`)
      return
    }

    if (threadId) {
      const project = projects.find((p) => p.requests?.some((r) => r.id === threadId))
      if (project) {
        router.replace(
          `/clients/${organizationId}/projects/${project.id}?tab=threads&thread=${encodeURIComponent(threadId)}`,
        )
      }
    }
  }, [loading, organizationId, projects, router])

  const refreshThread = async (requestId: string) => {
    await queryClient.invalidateQueries({
      queryKey: adminQueryKeys.requests.detail(requestId),
    })
    await queryClient.invalidateQueries({
      queryKey: adminQueryKeys.projects.byOrganization(organizationId),
    })
    await queryClient.invalidateQueries({
      queryKey: adminQueryKeys.inbox.list(organizationId),
    })
  }

  const sendAdminMessage = async (
    requestId: string,
    body: string,
    attachmentIds?: string[],
  ) => {
    try {
      await fetchAdminBff(`/api/project-requests/${requestId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body,
          attachmentIds: attachmentIds?.length ? attachmentIds : undefined,
        }),
      })
      await refreshThread(requestId)
      return { ok: true }
    } catch (err) {
      return {
        ok: false,
        message: err instanceof Error ? err.message : 'Send failed',
      }
    }
  }

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

  const resolveRequest = async (requestId: string, status: 'RESOLVED' | 'REJECTED') => {
    setError(null)
    try {
      await fetchAdminBff(`/api/project-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      setSuccess(status === 'RESOLVED' ? 'Request resolved.' : 'Request rejected.')
      await refreshThread(requestId)
      void queryClient.invalidateQueries({
        queryKey: adminQueryKeys.clients.activity(organizationId),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed')
    }
  }

  const resolveCancellation = async (
    requestId: string,
    payload: {
      outcome: string
      feeAmount?: number
      feeNotes?: string
      message?: string
    },
  ) => {
    setError(null)
    try {
      await fetchAdminBff(`/api/project-requests/${requestId}/resolve-cancellation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      setSuccess('Cancellation resolved and client notified.')
      await refreshThread(requestId)
      void queryClient.invalidateQueries({
        queryKey: adminQueryKeys.clients.activity(organizationId),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resolve cancellation')
    }
  }

  const clientName = client?.name ?? 'Client'

  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-chambray/8 px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href="/client-access"
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
        <nav className="mt-4 flex flex-wrap gap-2">
          {(
            [
              { id: 'overview' as const, label: 'Overview', icon: LayoutGrid },
              { id: 'projects' as const, label: 'Projects', icon: FolderKanban },
              { id: 'files' as const, label: 'Files', icon: FileText },
              { id: 'team' as const, label: 'Team', icon: Users },
              { id: 'inbox' as const, label: 'Inbox', icon: Inbox },
              { id: 'activity' as const, label: 'Activity', icon: CheckCircle2 },
            ] as const
          ).map((item) => {
            const Icon = item.icon
            const active = tab === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                aria-label={
                  item.id === 'inbox' && unreadCount > 0
                    ? `Inbox (${unreadCount} unread)`
                    : item.label
                }
                className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm transition ${bricolage_grot600.className} ${
                  active
                    ? 'bg-chambray text-white'
                    : 'bg-chambray/8 text-chambray hover:bg-chambray/12'
                }`}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden />
                {item.label}
                {item.id === 'inbox' && unreadCount > 0 ? (
                  <span className="rounded-full bg-casablanca/30 px-1.5 text-xs tabular-nums">
                    {unreadCount}
                  </span>
                ) : null}
              </button>
            )
          })}
        </nav>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
        {error ?? loadError ? (
          <p className="admin-alert-error mb-4">
            {error ?? loadError}
          </p>
        ) : null}
        {success ? (
          <AdminToast message={success} variant="success" onDismiss={() => setSuccess(null)} />
        ) : null}
        {loading ? (
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
                <li>
                  <span className="font-medium text-chambray">{inbox.length}</span> open inbox
                  items
                  {unreadCount > 0 ? (
                    <span className="text-app-muted"> · {unreadCount} unread</span>
                  ) : null}
                </li>
              </ul>
            </section>
          </div>
        ) : tab === 'team' ? (
          <ClientTeamPanel
            organizationId={organizationId}
            highlightInviteRequestId={highlightInviteRequestId}
          />
        ) : tab === 'files' ? (
          <AdminFilesSection organizationId={organizationId} projects={projects} />
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
                  <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <div>
                      <p className={`text-chambray ${bricolage_grot600.className}`}>
                        {project.title}
                        {project.hasPendingCheckpoint ? (
                          <span className="ml-2 rounded-full bg-casablanca/25 px-2 py-0.5 text-xs">
                            Awaiting client approval
                          </span>
                        ) : null}
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
        ) : tab === 'inbox' ? (
          <div className="space-y-4">
            {inbox.length === 0 ? (
              <p className="text-sm text-app-muted">Inbox is clear.</p>
            ) : (
              inbox.map((item) => (
                <section key={item.id} className="admin-glass-card p-5">
                  <p className="text-xs font-semibold tracking-wide text-sanmarino uppercase">
                    {requestTypeLabel[item.type] ?? item.type}
                  </p>
                  <p className={`mt-1 text-chambray ${bricolage_grot600.className}`}>{item.title}</p>
                  <p className="text-sm text-app-muted">{item.projectTitle}</p>
                  <div className="mt-4">
                    {canTrackUnread ? (
                      <MarkInboxReadOnView
                        organizationId={organizationId}
                        requestId={item.id}
                        enabled
                        onMarked={() => {
                          void unreadQuery.refetch()
                        }}
                      />
                    ) : null}
                    <RequestMessageThread
                      request={item}
                      viewerRole="ADMIN"
                      currentUserId={currentUserId}
                      showResolveActions={item.type !== 'CANCELLATION'}
                      onSendMessage={(body, attachmentIds) =>
                        sendAdminMessage(item.id, body, attachmentIds)
                      }
                      onThreadUpdate={() => void refreshThread(item.id)}
                      onResolve={
                        item.type !== 'CANCELLATION'
                          ? async (status) => {
                              await resolveRequest(item.id, status)
                            }
                          : undefined
                      }
                    />
                    {item.type === 'CANCELLATION' &&
                    !['RESOLVED', 'REJECTED'].includes(item.status) ? (
                      <CancellationResolveForm
                        onResolve={(payload) => resolveCancellation(item.id, payload)}
                      />
                    ) : null}
                  </div>
                </section>
              ))
            )}
          </div>
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
