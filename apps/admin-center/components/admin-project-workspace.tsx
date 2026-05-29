'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
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
import { fetchInboxUnreadCount } from '@/lib/projects/inbox-unread'
import { stageProjectFiles } from '@/lib/projects/fetch-project-files'
import type { ClientProjectSummary, ProjectRequestItem } from '@/lib/projects/types'
import {
  findProjectThread,
  formatPhaseLabel,
  ProgressCheckPanel,
  ProjectThreadPanel,
} from '@/components/project-workspace-shared'
import { bricolage_grot600, bricolage_grot700 } from '@/styles/fonts'
import {
  ArrowLeft,
  FolderKanban,
  LayoutGrid,
  MessageSquare,
  Shield,
  Users,
} from 'lucide-react'

export type ProjectWorkspaceTabId =
  | 'overview'
  | 'threads'
  | 'team-review'
  | 'collaborators'

const TAB_IDS: ProjectWorkspaceTabId[] = [
  'overview',
  'threads',
  'team-review',
  'collaborators',
]

function parseTab(value: string | null): ProjectWorkspaceTabId {
  if (value && TAB_IDS.includes(value as ProjectWorkspaceTabId)) {
    return value as ProjectWorkspaceTabId
  }
  return 'overview'
}

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
  const { session } = useAdminSession()
  const isCoreTeam =
    session?.mode === 'user' && isCoreTeamSession(session.role)
  const canTrackUnread = session?.mode === 'user' && isCoreTeam

  const [tab, setTab] = useState<ProjectWorkspaceTabId>(initialTab)
  const [project, setProject] = useState<ClientProjectSummary | null>(null)
  const [clientName, setClientName] = useState(clientNameProp ?? 'Client')
  const [loading, setLoading] = useState(true)
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
  const threadScrollAppliedRef = useRef(false)

  const setTabWithUrl = useCallback(
    (next: ProjectWorkspaceTabId) => {
      setTab(next)
      const params = new URLSearchParams(searchParams.toString())
      params.set('tab', next)
      router.replace(
        `/clients/${organizationId}/projects/${projectId}?${params.toString()}`,
        { scroll: false },
      )
    },
    [organizationId, projectId, router, searchParams],
  )

  const loadProject = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [roster, data] = await Promise.all([
        clientNameProp
          ? Promise.resolve(null)
          : fetchAdminBff<Array<{ id: string; name: string }>>('/api/clients'),
        fetchAdminBff<ClientProjectSummary>(`/api/projects/${projectId}`),
      ])
      if (roster) {
        setClientName(roster.find((c) => c.id === organizationId)?.name ?? 'Client')
      }
      setProject(data)
    } catch (err) {
      const message =
        err instanceof AdminApiFetchError
          ? `${err.message} — ${adminFetchErrorHint(err.code)}`
          : err instanceof Error
            ? err.message
            : 'Could not load project.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [clientNameProp, organizationId, projectId])

  useEffect(() => {
    void loadProject()
  }, [loadProject])

  useEffect(() => {
    setTab(parseTab(searchParams.get('tab') ?? initialTab))
  }, [searchParams, initialTab])

  useEffect(() => {
    if (loading || !project || threadScrollAppliedRef.current) return
    const threadId = searchParams.get('thread')
    if (!threadId) return
    threadScrollAppliedRef.current = true
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    requestAnimationFrame(() => {
      document.getElementById(`thread-panel-${threadId}`)?.scrollIntoView({
        behavior: reducedMotion ? 'auto' : 'smooth',
        block: 'nearest',
      })
    })
  }, [loading, project, searchParams])

  const refreshUnreadCount = useCallback(async () => {
    if (!canTrackUnread) return
    try {
      await fetchInboxUnreadCount(organizationId)
    } catch {
      /* non-blocking */
    }
  }, [canTrackUnread, organizationId])

  const refreshThread = useCallback(
    async (requestId: string) => {
      const thread = await fetchAdminBff<ProjectRequestItem>(
        `/api/project-requests/${requestId}`,
      )
      setProject((current) => {
        if (!current?.requests) return current
        return {
          ...current,
          requests: current.requests.map((r) =>
            r.id === requestId ? { ...r, ...thread } : r,
          ),
        }
      })
    },
    [],
  )

  const sendAdminMessage = useCallback(
    async (requestId: string, body: string, attachmentIds?: string[]) => {
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
        return { ok: true as const }
      } catch (err) {
        return {
          ok: false as const,
          message: err instanceof Error ? err.message : 'Send failed',
        }
      }
    },
    [refreshThread],
  )

  const approveProject = async () => {
    setApproving(true)
    setError(null)
    try {
      await fetchAdminBff(
        `/api/clients/${organizationId}/projects/${projectId}/approve`,
        { method: 'POST' },
      )
      setSuccess('Project approved and client notified.')
      await loadProject()
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
      await loadProject()
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
      await loadProject()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resolve cancellation')
    }
  }

  const submitCheckpoint = async () => {
    if (!project || !checkpointTitle.trim() || !checkpointBody.trim()) return
    setSubmittingCheckpoint(true)
    setCheckpointError(null)
    try {
      const attachments =
        checkpointFiles && checkpointFiles.length > 0
          ? await stageProjectFiles(projectId, Array.from(checkpointFiles))
          : undefined

      await fetchAdminBff<ProjectRequestItem>(`/api/projects/${projectId}/checkpoints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: checkpointTitle.trim(),
          body: checkpointBody.trim(),
          ...(checkpointReviewUrl.trim() ? { reviewUrl: checkpointReviewUrl.trim() } : {}),
          ...(checkpointPhase ? { targetPhase: checkpointPhase } : {}),
          ...(attachments?.length ? { attachments } : {}),
        }),
      })

      setSuccess('Progress check sent — client can approve or reply.')
      setCheckpointTitle('')
      setCheckpointBody('')
      setCheckpointReviewUrl('')
      setCheckpointFiles(null)
      setCheckpointPhase('')
      setShowProgressCheck(false)
      await loadProject()
      setTabWithUrl('threads')
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

  const internal = project ? findProjectThread(project, 'INTERNAL') : null
  const onboarding = project ? findProjectThread(project, 'ONBOARDING') : null
  const progress = project ? findProjectThread(project, 'PROGRESS') : null
  const cancellation = project ? findProjectThread(project, 'CANCELLATION') : null
  const onboardingClosed = onboarding
    ? ['RESOLVED', 'REJECTED', 'CANCELLED'].includes(onboarding.status)
    : false

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: LayoutGrid },
    { id: 'threads' as const, label: 'Client threads', icon: MessageSquare },
    { id: 'team-review' as const, label: 'Team review', icon: Shield },
    ...(isCoreTeam
      ? [{ id: 'collaborators' as const, label: 'Collaborators', icon: Users }]
      : []),
  ]

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
            <nav className="mt-4 flex flex-wrap gap-2">
              {tabs.map((item) => {
                const Icon = item.icon
                const active = tab === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTabWithUrl(item.id)}
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition ${bricolage_grot600.className} ${
                      active
                        ? 'bg-chambray text-white'
                        : 'bg-chambray/8 text-chambray hover:bg-chambray/12'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                    {item.label}
                  </button>
                )
              })}
            </nav>
          </>
        ) : null}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
        {error ? (
          <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
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
          </div>
        ) : tab === 'threads' ? (
          <div className="space-y-4">
            {onboarding ? (
              <ProjectThreadPanel
                title="Onboarding conversation"
                subtitle={
                  onboardingClosed
                    ? 'Closed — archived for records'
                    : 'Before project is onboarded'
                }
                request={onboarding}
                readOnly={onboardingClosed}
                organizationId={organizationId}
                markReadEnabled={canTrackUnread}
                onInboxMarked={() => void refreshUnreadCount()}
                onSendMessage={(body, attachmentIds) =>
                  sendAdminMessage(onboarding.id, body, attachmentIds)
                }
                onThreadUpdate={() => void refreshThread(onboarding.id)}
              />
            ) : null}
            {progress && project.status !== 'SUBMITTED' ? (
              <ProjectThreadPanel
                title="Project progress"
                subtitle="Progress checks and client replies"
                request={progress}
                organizationId={organizationId}
                markReadEnabled={canTrackUnread}
                onInboxMarked={() => void refreshUnreadCount()}
                onSendMessage={(body, attachmentIds) =>
                  sendAdminMessage(progress.id, body, attachmentIds)
                }
                onThreadUpdate={() => void refreshThread(progress.id)}
              />
            ) : null}
            {cancellation ? (
              <ProjectThreadPanel
                title="Cancellation"
                subtitle={cancellation.cancellationOutcome ?? 'Open'}
                request={cancellation}
                organizationId={organizationId}
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
            {!onboarding && !progress && !cancellation ? (
              <p className="text-sm text-app-muted">No client-facing threads on this project yet.</p>
            ) : null}
          </div>
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
