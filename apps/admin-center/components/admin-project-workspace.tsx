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
import { stageProjectFiles } from '@/lib/projects/fetch-project-files'
import { submitApprovalFiles } from '@/lib/projects/submit-approval-files'
import { submitProgressCheckpoint } from '@/lib/projects/submit-progress-checkpoint'
import AdminProjectApprovalsPanel from '@/components/admin-project-approvals-panel'
import { useApproveClientProjectMutation } from '@/lib/api/mutations/projects'
import { adminQueryKeys } from '@/lib/api/query-keys'
import { appendRequestMessageToCache } from '@/lib/projects/append-request-message-cache'
import type { ProjectRequestMessage } from '@/lib/projects/types'
import { useAdminProjectWorkspaceQuery } from '@/lib/api/queries/projects'
import { useProjectApprovalItemsQuery } from '@/lib/api/queries/approvals'
import {
  patchProjectApprovalCommentsCache,
  patchProjectApprovalRevisionCache,
  replacePendingProjectApprovalCommentCache,
} from '@/lib/projects/approval-comment-cache'
import { sendApprovalComment } from '@/lib/projects/send-approval-comment'
import { submitApprovalRevision } from '@/lib/projects/submit-approval-revision'
import type { ThreadApprovalItem } from '@/lib/projects/thread-approval-items'
import { createOptimisticApprovalComment } from '@cocreate/app-ui/approval-comment-cache'
import WorkspaceSectionNav from '@cocreate/app-ui/workspace-section-nav'
import {
  findProjectThread,
  formatPhaseLabel,
  ProgressCheckPanel,
  ProjectThreadPanel,
  tabForThreadType,
} from '@/components/project-workspace-shared'
import { bricolage_grot600, bricolage_grot700 } from '@/styles/fonts'
import {
  ArrowLeft,
  Bell,
  CheckSquare,
  FolderKanban,
  LayoutGrid,
  Shield,
  Sparkles,
  Users,
} from 'lucide-react'

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
  const [checkpointError, setCheckpointError] = useState<string | null>(null)
  const [approving, setApproving] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [showProgressCheck, setShowProgressCheck] = useState(false)
  const [checkpointTitle, setCheckpointTitle] = useState('')
  const [checkpointBody, setCheckpointBody] = useState('')
  const [checkpointReviewUrl, setCheckpointReviewUrl] = useState('')
  const [checkpointFiles, setCheckpointFiles] = useState<FileList | null>(null)
  const [checkpointPhase, setCheckpointPhase] = useState('')
  const [submittingCheckpoint, setSubmittingCheckpoint] = useState(false)
  const [threadCheckpointApproval, setThreadCheckpointApproval] = useState(false)
  const [threadCheckpointTitle, setThreadCheckpointTitle] = useState('')
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
        queryKey: adminQueryKeys.requests.detail(requestId),
      })
      await queryClient.invalidateQueries({
        queryKey: adminQueryKeys.projects.workspace(organizationId, projectId),
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
        appendRequestMessageToCache(queryClient, requestId, message)
        await queryClient.invalidateQueries({
          queryKey: adminQueryKeys.projects.workspace(organizationId, projectId),
        })
        return { ok: true as const }
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

  const submitCheckpoint = async () => {
    if (!project || !checkpointTitle.trim()) return
    const progressThread = findProjectThread(project, 'PROGRESS')
    if (!progressThread) return
    const hasContent =
      checkpointBody.trim().length > 0 ||
      (checkpointFiles && checkpointFiles.length > 0)
    if (!hasContent) return

    setSubmittingCheckpoint(true)
    setCheckpointError(null)
    try {
      const stagedAttachments =
        checkpointFiles && checkpointFiles.length > 0
          ? await stageProjectFiles(projectId, Array.from(checkpointFiles))
          : undefined

      if (stagedAttachments?.length) {
        await submitApprovalFiles(queryClient, {
          organizationId,
          projectId,
          progressRequestId: progressThread.id,
          title: checkpointTitle.trim(),
          note: checkpointBody.trim(),
          stagedAttachments,
        })
        setSuccess('Files sent for approval — each file stays open until the client decides.')
      } else {
        await submitProgressCheckpoint(queryClient, {
          organizationId,
          projectId,
          progressRequestId: progressThread.id,
          title: checkpointTitle.trim(),
          body: checkpointBody.trim(),
          ...(checkpointReviewUrl.trim() ? { reviewUrl: checkpointReviewUrl.trim() } : {}),
        })
        setSuccess('Progress update sent.')
      }
      setCheckpointTitle('')
      setCheckpointBody('')
      setCheckpointReviewUrl('')
      setCheckpointFiles(null)
      setCheckpointPhase('')
      setShowProgressCheck(false)
      setTabWithUrl('progress')
    } catch (err) {
      const message =
        err instanceof AdminApiFetchError
          ? err.status === 400
            ? err.message
            : `${err.message} — ${adminFetchErrorHint(err.code)}`
          : err instanceof Error
            ? err.message
            : 'Could not send progress check'
      setCheckpointError(message)
    } finally {
      setSubmittingCheckpoint(false)
    }
  }

  const submitThreadCheckpoint = async (payload: {
    title: string
    body: string
    attachmentIds: string[]
    stagedAttachments?: import('@/lib/projects/fetch-project-files').StagedProjectFile[]
  }) => {
    if (!project) {
      return { ok: false as const, message: 'Project not found' }
    }
    const progressThread = findProjectThread(project, 'PROGRESS')
    if (!progressThread) {
      return { ok: false as const, message: 'Progress thread not found' }
    }
    if (payload.attachmentIds.length === 0 && !payload.stagedAttachments?.length) {
      return {
        ok: false as const,
        message: 'Attach at least one file to send for approval',
      }
    }

    try {
      await submitApprovalFiles(queryClient, {
        organizationId,
        projectId,
        progressRequestId: progressThread.id,
        title: payload.title,
        note: payload.body,
        attachmentIds: payload.attachmentIds,
        stagedAttachments: payload.stagedAttachments,
      })
      setSuccess('Files sent for approval — each file stays open until the client decides.')
      setThreadCheckpointTitle('')
      setThreadCheckpointApproval(false)
      return { ok: true as const }
    } catch (err) {
      const message =
        err instanceof AdminApiFetchError
          ? err.status === 400
            ? err.message
            : `${err.message} — ${adminFetchErrorHint(err.code)}`
          : err instanceof Error
            ? err.message
            : 'Could not send files for approval'
      return { ok: false as const, message }
    }
  }

  const internal = project ? findProjectThread(project, 'INTERNAL') : null
  const onboarding = project ? findProjectThread(project, 'ONBOARDING') : null
  const progress = project ? findProjectThread(project, 'PROGRESS') : null
  const cancellation = project ? findProjectThread(project, 'CANCELLATION') : null
  const { data: threadApprovalItems = [] } = useProjectApprovalItemsQuery(project?.id, {
    includeComments: true,
    enabled: tab === 'progress' && Boolean(project?.id),
  })
  const approvalInvalidateQueryKeys = useMemo(
    () =>
      project?.id
        ? [adminQueryKeys.approvals.project(project.id, { includeComments: true })]
        : [],
    [project?.id],
  )
  const handleApprovalReply = useCallback(
    async (approvalItemId: string, body: string) => {
      if (!project?.id) {
        return { ok: false, message: 'Project not loaded' }
      }

      const queryKey = adminQueryKeys.approvals.project(project.id, { includeComments: true })
      const previous = queryClient.getQueryData<ThreadApprovalItem[]>(queryKey)
      const optimistic = createOptimisticApprovalComment({
        approvalItemId,
        body,
        authorRole: 'ADMIN',
        authorDisplayName: session?.displayName ?? session?.email ?? 'CoCreate team',
        authorUserId: session?.userId ?? undefined,
      })

      patchProjectApprovalCommentsCache(queryClient, project.id, approvalItemId, optimistic)

      const result = await sendApprovalComment(approvalItemId, body)
      if (result.ok) {
        replacePendingProjectApprovalCommentCache(
          queryClient,
          project.id,
          approvalItemId,
          optimistic.id,
          result.comment,
        )
      } else {
        queryClient.setQueryData(queryKey, previous)
      }

      return result
    },
    [project?.id, queryClient, session?.displayName, session?.email, session?.userId],
  )
  const handleApprovalUploadRevision = useCallback(
    async (approvalItemId: string, file: File, note?: string) => {
      if (!project?.id) {
        return { ok: false, message: 'Project not loaded' }
      }

      const result = await submitApprovalRevision(project.id, approvalItemId, file, note)
      if (result.ok) {
        patchProjectApprovalRevisionCache(queryClient, project.id, approvalItemId, {
          status: result.item.status,
          revisionNumber: result.item.revisionNumber,
          attachment: {
            id: result.item.attachmentId,
            fileName: result.item.fileName,
            mimeType: result.item.mimeType,
            createdAt: result.item.createdAt,
          },
          comment: result.comment,
        })
      }
      return result
    },
    [project?.id, queryClient],
  )
  const onboardingClosed = onboarding
    ? ['RESOLVED', 'REJECTED', 'CANCELLED'].includes(onboarding.status)
    : false

  const isOnboarded = project ? project.status !== 'SUBMITTED' : false
  const showProgressThread = Boolean(progress && isOnboarded)

  useEffect(() => {
    if (loading || !project) return
    if (!isOnboarded && (tab === 'progress' || tab === 'approvals')) {
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
              { id: 'progress' as const, label: 'Progress', description: 'Day-to-day messages, deliverables, and checkpoints with your client', icon: Bell },
              ...(isCoreTeam
                ? [{ id: 'approvals' as const, label: 'Approvals', description: 'Internal checkpoints and file approvals before client delivery', icon: CheckSquare }]
                : []),
            ]
          : []),
        { id: 'team-review' as const, label: 'Team review', description: 'Internal team review and QC before client-facing work', icon: Shield },
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
          href={`/clients/${organizationId}?tab=projects`}
          className={`inline-flex items-center gap-2 text-sm text-sanmarino hover:text-chambray ${bricolage_grot600.className}`}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {clientName}
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
                <h1
                  className={`text-xl text-chambray sm:text-2xl ${bricolage_grot700.className}`}
                >
                  {project.title}
                </h1>
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
        {checkpointError ? (
          <AdminToast
            message={checkpointError}
            variant="error"
            autoDismissMs={0}
            onDismiss={() => setCheckpointError(null)}
          />
        ) : null}

        {loading ? (
          <p className="text-sm text-app-muted">Loading…</p>
        ) : !project ? (
          <p className="text-sm text-app-muted">Project not found.</p>
        ) : tab === 'overview' ? (
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
                  <>
                    <button
                      type="button"
                      disabled={completing}
                      onClick={() => void markProjectComplete()}
                      className="admin-btn-primary text-sm"
                    >
                      {completing ? 'Saving…' : 'Mark complete'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowProgressCheck((v) => !v)}
                      className={`text-sm ${
                        showProgressCheck ? 'admin-btn-primary' : 'admin-btn-ghost'
                      }`}
                    >
                      {showProgressCheck ? 'Cancel progress check' : 'Send progress check'}
                    </button>
                  </>
                ) : null}
                <Link
                  href={`/clients/${organizationId}?tab=files`}
                  className="admin-btn-ghost text-sm"
                >
                  Client files
                </Link>
              </div>
              <p className="mt-3 text-sm text-app-muted">
                Phase: {formatPhaseLabel(project.phase)}
              </p>
            </section>

            {showProgressCheck && project.status === 'ACTIVE' ? (
              <ProgressCheckPanel
                project={project}
                clientName={clientName}
                title={checkpointTitle}
                body={checkpointBody}
                reviewUrl={checkpointReviewUrl}
                phase={checkpointPhase}
                selectedFiles={checkpointFiles}
                submitting={submittingCheckpoint}
                onTitleChange={setCheckpointTitle}
                onBodyChange={setCheckpointBody}
                onReviewUrlChange={setCheckpointReviewUrl}
                onFilesChange={setCheckpointFiles}
                onPhaseChange={setCheckpointPhase}
                onSubmit={() => void submitCheckpoint()}
                onCancel={() => setShowProgressCheck(false)}
              />
            ) : null}

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
              subtitle="Updates, progress checks, and replies with the client."
              request={progress}
              organizationId={organizationId}
              loadMessages={tab === 'progress'}
              markReadEnabled={canTrackUnread}
              onInboxMarked={() => void refreshUnreadCount()}
              onSendMessage={(body, attachmentIds) =>
                sendAdminMessage(progress.id, body, attachmentIds)
              }
              onThreadUpdate={() => void refreshThread(progress.id)}
              threadApprovalItems={threadApprovalItems}
              onApprovalReply={handleApprovalReply}
              onApprovalUploadRevision={handleApprovalUploadRevision}
              approvalInvalidateQueryKeys={approvalInvalidateQueryKeys}
              checkpointCompose={
                project.status === 'ACTIVE' && isCoreTeam
                  ? {
                      enabled: true,
                      title: threadCheckpointTitle,
                      onTitleChange: setThreadCheckpointTitle,
                      requestApproval: threadCheckpointApproval,
                      onRequestApprovalChange: setThreadCheckpointApproval,
                      onSendCheckpoint: submitThreadCheckpoint,
                    }
                  : undefined
              }
            />
          ) : (
            <p className="text-sm text-app-muted">No progress conversation yet.</p>
          )
        ) : tab === 'approvals' && isCoreTeam ? (
          <AdminProjectApprovalsPanel projectId={project.id} />
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
        ) : tab === 'collaborators' && isCoreTeam ? (
          <ProjectCollaboratorsPanel projectId={project.id} />
        ) : null}
      </div>
    </main>
  )
}
