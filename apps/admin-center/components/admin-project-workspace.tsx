'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import AdminToast from '@/components/admin-toast'
import ProjectCollaboratorsPanel from '@/components/project-collaborators-panel'
import ProjectStatusAttribution, { ProjectTimeline } from '@/components/project-status-attribution'
import TeamReviewPanel from '@/components/team-review-panel'
import { useAdminSession } from '@/components/admin-session-provider'
import { isCoreTeamSession } from '@/lib/admin-session'
import {
  adminFetchErrorHint,
  AdminApiFetchError,
  fetchAdminBff,
} from '@/lib/admin-api-fetch'
import CollaborateProjectFiles from '@/components/collaborate-project-files'
import { useApproveClientProjectMutation, useUpdateAdminProjectMutation } from '@/lib/api/mutations/projects'
import { adminQueryKeys } from '@/lib/api/query-keys'
import type { ProjectRequestMessage } from '@/lib/projects/types'
import { useAdminProjectWorkspaceQuery } from '@/lib/api/queries/projects'
import WorkspaceSectionNav from '@cocreate/app-ui/workspace-section-nav'
import {
  findProjectThread,
  formatPhaseLabel,
  ProjectThreadPanel,
  tabForThreadType,
} from '@/components/project-workspace-shared'
import { useAdminThreadLive } from '@/lib/messaging/use-admin-thread-live'
import { bricolage_grot600, bricolage_grot700 } from '@/styles/fonts'
import {
  ArrowLeft,
  Bell,
  FileText,
  FolderKanban,
  LayoutGrid,
  Shield,
  Sparkles,
  Star,
  UserRound,
  Users,
} from 'lucide-react'
import AdminTopPicksPanel from '@/components/admin-top-picks-panel'
import ClientProjectTeamPanel from '@/components/client-project-team-panel'
import ProjectTitleRename from '@/components/project-title-rename'

import {
  parseProjectWorkspaceTab,
  type ProjectWorkspaceTabId,
} from '@/lib/project-workspace-tabs'

export type { ProjectWorkspaceTabId } from '@/lib/project-workspace-tabs'

type AdminProjectWorkspaceProps = {
  organizationId: string
  projectId: string
  initialTab?: ProjectWorkspaceTabId
  clientName?: string
}

export default function AdminProjectWorkspace({
  organizationId,
  projectId,
  initialTab = 'overview',
  clientName: clientNameProp,
}: AdminProjectWorkspaceProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const { session } = useAdminSession()
  const isCoreTeam =
    session?.mode === 'user' && isCoreTeamSession(session.role)
  const canTrackUnread = session?.mode === 'user' && isCoreTeam

  const workspaceQuery = useAdminProjectWorkspaceQuery(organizationId, projectId)
  const approveProjectMutation = useApproveClientProjectMutation(organizationId)
  const updateProjectMutation = useUpdateAdminProjectMutation(projectId, organizationId)

  const project = workspaceQuery.data?.project ?? null
  const loading = workspaceQuery.isLoading
  const loadError = workspaceQuery.isError
    ? workspaceQuery.error instanceof AdminApiFetchError
      ? `${workspaceQuery.error.message} — ${adminFetchErrorHint(workspaceQuery.error.code)}`
      : workspaceQuery.error instanceof Error
        ? workspaceQuery.error.message
        : 'Could not load project.'
    : null

  const clientName = clientNameProp ?? workspaceQuery.data?.clientName ?? 'Client'

  const [tab, setTab] = useState<ProjectWorkspaceTabId>(initialTab)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [approving, setApproving] = useState(false)
  const [completing, setCompleting] = useState(false)
  const threadScrollAppliedRef = useRef(false)

  const setTabWithUrl = useCallback(
    (next: ProjectWorkspaceTabId) => {
      setTab(next)
      const params = new URLSearchParams(searchParams.toString())
      params.set('tab', next)
      params.delete('thread')
      router.replace(
        `/clients/${organizationId}/projects/${projectId}?${params.toString()}`,
        { scroll: false },
      )
    },
    [organizationId, projectId, router, searchParams],
  )

  useEffect(() => {
    if (loading) return
    const isOnboarded = project ? project.status !== 'SUBMITTED' : false
    const raw = searchParams.get('tab') ?? initialTab
    const next = parseProjectWorkspaceTab(raw, isOnboarded)
    setTab(next)
    if (raw === 'threads' && project) {
      const params = new URLSearchParams(searchParams.toString())
      params.set('tab', next)
      router.replace(
        `/clients/${organizationId}/projects/${projectId}?${params.toString()}`,
        { scroll: false },
      )
    }
  }, [searchParams, initialTab, project, loading, organizationId, projectId, router])

  useEffect(() => {
    if (loading || !project || threadScrollAppliedRef.current) return
    const threadId = searchParams.get('thread')
    if (!threadId) return

    const request = project.requests?.find((r) => r.id === threadId)
    if (request) {
      const targetTab = tabForThreadType(request.type)
      if (tab !== targetTab) {
        setTabWithUrl(targetTab)
        return
      }
    }

    threadScrollAppliedRef.current = true
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    requestAnimationFrame(() => {
      document.getElementById(`thread-panel-${threadId}`)?.scrollIntoView({
        behavior: reducedMotion ? 'auto' : 'smooth',
        block: 'nearest',
      })
    })
  }, [loading, project, searchParams, tab, setTabWithUrl])

  const refreshUnreadCount = useCallback(async () => {
    if (!canTrackUnread) return
    await queryClient.invalidateQueries({
      queryKey: adminQueryKeys.projects.workspace(organizationId, projectId),
    })
  }, [canTrackUnread, organizationId, projectId, queryClient])

  const refreshThread = useCallback(
    async (requestId: string) => {
      await queryClient.invalidateQueries({
        queryKey: adminQueryKeys.projects.workspace(organizationId, projectId),
      })
      await queryClient.invalidateQueries({
        queryKey: adminQueryKeys.requests.messages(requestId),
      })
    },
    [organizationId, projectId, queryClient],
  )

  const sendAdminMessage = useCallback(
    async (requestId: string, body: string, attachmentIds?: string[]) => {
      try {
        const message = await fetchAdminBff<ProjectRequestMessage>(
          `/api/project-requests/${requestId}/messages`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              body,
              attachmentIds: attachmentIds?.length ? attachmentIds : undefined,
            }),
          },
        )
        await queryClient.invalidateQueries({
          queryKey: adminQueryKeys.projects.workspace(organizationId, projectId),
        })
        return { ok: true as const, data: message }
      } catch (err) {
        return {
          ok: false as const,
          message: err instanceof Error ? err.message : 'Send failed',
        }
      }
    },
    [organizationId, projectId, queryClient],
  )

  const approveProject = async () => {
    setApproving(true)
    setError(null)
    try {
      await approveProjectMutation.mutateAsync(projectId)
      setSuccess('Project approved and client notified.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Approve failed')
    } finally {
      setApproving(false)
    }
  }

  const markProjectComplete = async () => {
    setCompleting(true)
    setError(null)
    try {
      await fetchAdminBff(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' }),
      })
      setSuccess('Project marked complete. Client has been notified.')
      void queryClient.invalidateQueries({
        queryKey: adminQueryKeys.projects.workspace(organizationId, projectId),
      })
      void queryClient.invalidateQueries({
        queryKey: adminQueryKeys.projects.byOrganization(organizationId),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not complete project')
    } finally {
      setCompleting(false)
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resolve cancellation')
    }
  }

  const internal = project ? findProjectThread(project, 'INTERNAL') : null
  const onboarding = project ? findProjectThread(project, 'ONBOARDING') : null
  const progress = project ? findProjectThread(project, 'PROGRESS') : null
  const cancellation = project ? findProjectThread(project, 'CANCELLATION') : null
  const onboardingClosed = onboarding
    ? ['RESOLVED', 'REJECTED', 'CANCELLED'].includes(onboarding.status)
    : false

  const isOnboarded = project ? project.status !== 'SUBMITTED' : false
  const showProgressThread = Boolean(progress && isOnboarded)

  const progressLive = useAdminThreadLive(
    showProgressThread && progress ? progress.id : undefined,
    {
      onThreadUpdate: progress ? () => void refreshThread(progress.id) : undefined,
      onAttachmentUpdate: project
        ? () => {
            void queryClient.invalidateQueries({
              queryKey: adminQueryKeys.fileReactions.project(project.id),
            })
            void queryClient.invalidateQueries({
              queryKey: adminQueryKeys.topPicks.all,
            })
          }
        : undefined,
    },
  )

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development' || !progress?.id) return
    console.info('[admin-progress] messages length', progressLive.messages?.length ?? 0)
  }, [progress?.id, progressLive.messages?.length])

  useEffect(() => {
    if (loading || !project) return
    if (!isOnboarded && tab === 'progress') {
      setTabWithUrl('overview')
    }
  }, [isOnboarded, tab, setTabWithUrl, loading, project])

  const tabs = useMemo(
    () =>
      [
        { id: 'overview' as const, label: 'Overview', description: 'Project snapshot, status, and context', icon: LayoutGrid },
        { id: 'onboarding' as const, label: 'Onboarding', description: 'Client intake, requirements, and kickoff progress', icon: Sparkles },
        ...(isOnboarded
          ? [
              { id: 'progress' as const, label: 'Progress', description: 'Day-to-day messages and deliverables with your client', icon: Bell },
              { id: 'files' as const, label: 'Files', description: 'Project uploads and attachments from message threads', icon: FileText },
              { id: 'top-picks' as const, label: 'Top Picks', description: 'Files the client reacted to, grouped by reaction', icon: Star },
            ]
          : [
              { id: 'files' as const, label: 'Files', description: 'Project uploads and attachments from message threads', icon: FileText },
            ]),
        { id: 'team-review' as const, label: 'Team review', description: 'Internal team review and QC before client-facing work', icon: Shield },
        { id: 'client-team' as const, label: 'Client team', description: 'Assign Contributors and Viewers, transfer ownership between Admins', icon: UserRound },
        ...(isCoreTeam
          ? [{ id: 'collaborators' as const, label: 'Collaborators', description: 'External collaborators and limited-access contributors', icon: Users }]
          : []),
      ],
    [isCoreTeam, isOnboarded],
  )

  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-chambray/8 px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href="/project-center"
          className={`inline-flex items-center gap-2 text-sm text-sanmarino hover:text-chambray ${bricolage_grot600.className}`}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Project Center
        </Link>
        {loading ? (
          <p className="mt-3 text-sm text-app-muted">Loading project…</p>
        ) : project ? (
          <>
            <div className="mt-3 flex flex-wrap items-start gap-3">
              <div className="rounded-xl bg-linear-to-br from-sanmarino/15 to-chambray/5 p-2.5 text-sanmarino ring-1 ring-sanmarino/10">
                <FolderKanban className="h-6 w-6" strokeWidth={1.75} aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                {isCoreTeam ? (
                  <ProjectTitleRename
                    title={project.title}
                    headingClassName={`text-xl text-chambray sm:text-2xl ${bricolage_grot700.className}`}
                    inputClassName="admin-input"
                    onSave={async (title) => {
                      try {
                        await updateProjectMutation.mutateAsync({ title })
                        setSuccess('Project renamed.')
                        void queryClient.invalidateQueries({
                          queryKey: adminQueryKeys.projects.workspace(
                            organizationId,
                            projectId,
                          ),
                        })
                      } catch (err) {
                        const message =
                          err instanceof AdminApiFetchError
                            ? `${err.message} — ${adminFetchErrorHint(err.code)}`
                            : err instanceof Error
                              ? err.message
                              : 'Could not rename project'
                        throw new Error(message)
                      }
                    }}
                  />
                ) : (
                  <h1
                    className={`text-xl text-chambray sm:text-2xl ${bricolage_grot700.className}`}
                  >
                    {project.title}
                  </h1>
                )}
                <p className="mt-1 text-sm text-app-muted">{clientName}</p>
                {project.description ? (
                  <p className="mt-1 line-clamp-3 text-sm text-app-muted">
                    {project.description}
                  </p>
                ) : null}
                <div className="mt-2">
                  <ProjectStatusAttribution project={project} />
                </div>
              </div>
            </div>
            <WorkspaceSectionNav
              items={tabs}
              activeId={tab}
              onSelect={setTabWithUrl}
              ariaLabel="Project workspace sections"
              inputClassName="admin-input"
              pillClassName={bricolage_grot600.className}
            />
          </>
        ) : null}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-6 lg:px-8">
        {error ?? loadError ? (
          <p className="admin-alert-error mb-4">
            {error ?? loadError}
          </p>
        ) : null}
        {success ? (
          <AdminToast message={success} variant="success" onDismiss={() => setSuccess(null)} />
        ) : null}

        {loading ? (
          <p className="text-sm text-app-muted">Loading…</p>
        ) : !project ? (
          <p className="text-sm text-app-muted">Project not found.</p>
        ) : (
          <>
        {tab === 'overview' ? (
          <div className="space-y-6">
            <section className="admin-glass-card p-5 sm:p-6">
              <p className={`text-chambray ${bricolage_grot600.className}`}>Project actions</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {project.status === 'SUBMITTED' ? (
                  <button
                    type="button"
                    disabled={approving}
                    onClick={() => void approveProject()}
                    className="admin-btn-primary text-sm"
                  >
                    {approving ? 'Onboarding…' : 'Onboard project'}
                  </button>
                ) : null}
                {project.status === 'ACTIVE' ? (
                  <button
                    type="button"
                    disabled={completing}
                    onClick={() => void markProjectComplete()}
                    className="admin-btn-primary text-sm"
                  >
                    {completing ? 'Saving…' : 'Mark complete'}
                  </button>
                ) : null}
              </div>
              <p className="mt-3 text-sm text-app-muted">
                Phase: {formatPhaseLabel(project.phase)}
              </p>
            </section>

            {project.activities && project.activities.length > 0 ? (
              <ProjectTimeline
                activities={project.activities}
                title="Project timeline (all actions)"
              />
            ) : null}

            {cancellation ? (
              <ProjectThreadPanel
                key={cancellation.id}
                title="Cancellation"
                subtitle={cancellation.cancellationOutcome ?? 'Open'}
                request={cancellation}
                organizationId={organizationId}
                loadMessages={tab === 'overview'}
                markReadEnabled={canTrackUnread}
                onInboxMarked={() => void refreshUnreadCount()}
                onSendMessage={(body, attachmentIds) =>
                  sendAdminMessage(cancellation.id, body, attachmentIds)
                }
                onThreadUpdate={() => void refreshThread(cancellation.id)}
                cancellationResolve={(payload) =>
                  resolveCancellation(cancellation.id, payload)
                }
              />
            ) : null}
          </div>
        ) : tab === 'onboarding' ? (
          onboarding ? (
            <ProjectThreadPanel
              key={onboarding.id}
              title="Onboarding conversation"
              subtitle={
                onboardingClosed
                  ? 'Closed after project was onboarded — kept for your records.'
                  : 'Discussion before the project is accepted.'
              }
              request={onboarding}
              readOnly={onboardingClosed}
              organizationId={organizationId}
              loadMessages={tab === 'onboarding'}
              markReadEnabled={canTrackUnread}
              onInboxMarked={() => void refreshUnreadCount()}
              onSendMessage={(body, attachmentIds) =>
                sendAdminMessage(onboarding.id, body, attachmentIds)
              }
              onThreadUpdate={() => void refreshThread(onboarding.id)}
            />
          ) : (
            <p className="text-sm text-app-muted">No onboarding conversation yet.</p>
          )
        ) : tab === 'progress' ? (
          showProgressThread && progress ? (
            <ProjectThreadPanel
              key={progress.id}
              title="Project progress"
              subtitle="Updates and replies with the client."
              request={progress}
              organizationId={organizationId}
              parentOwnsMessages
              liveMessages={progressLive.messages}
              liveMessagesLoading={progressLive.isLoading}
              markReadEnabled={canTrackUnread}
              onInboxMarked={() => void refreshUnreadCount()}
              onSendMessage={(body, attachmentIds) =>
                sendAdminMessage(progress.id, body, attachmentIds)
              }
              onThreadUpdate={() => void refreshThread(progress.id)}
            />
          ) : (
            <p className="text-sm text-app-muted">No progress conversation yet.</p>
          )
        ) : tab === 'files' ? (
          <CollaborateProjectFiles projectId={project.id} projectTitle={project.title} />
        ) : tab === 'top-picks' ? (
          <AdminTopPicksPanel projectId={project.id} />
        ) : tab === 'team-review' ? (
          internal ? (
            <TeamReviewPanel
              projectId={project.id}
              internalRequest={internal}
              onThreadUpdate={() => void refreshThread(internal.id)}
            />
          ) : (
            <p className="text-sm text-app-muted">Loading team review…</p>
          )
        ) : tab === 'client-team' ? (
          <ClientProjectTeamPanel
            organizationId={organizationId}
            projectId={project.id}
          />
        ) : tab === 'collaborators' && isCoreTeam ? (
          <ProjectCollaboratorsPanel projectId={project.id} />
        ) : null}
          </>
        )}
      </div>
    </main>
  )
}
