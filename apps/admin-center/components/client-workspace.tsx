'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import RequestMessageThread from '@/components/request-message-thread'
import ProjectStatusAttribution, { ProjectTimeline } from '@/components/project-status-attribution'
import AdminToast from '@/components/admin-toast'
import MarkInboxReadOnView from '@/components/mark-inbox-read-on-view'
import { useAdminSession } from '@/components/admin-session-provider'
import {
  adminFetchErrorHint,
  AdminApiFetchError,
  fetchAdminBff,
} from '@/lib/admin-api-fetch'
import { fetchInboxUnreadCount, markInboxRead } from '@/lib/projects/inbox-unread'
import { stageProjectFiles } from '@/lib/projects/fetch-project-files'
import type {
  ClientProjectSummary,
  ProjectActivityItem,
  ProjectRequestItem,
} from '@/lib/projects/types'
import { bricolage_grot600, bricolage_grot700 } from '@/styles/fonts'
import { ArrowLeft, CheckCircle2, FolderKanban, Inbox, LayoutGrid } from 'lucide-react'

type ClientRosterItem = {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  isSocialListeningSubscriber: boolean
  brand24ProjectId: string | null
  primaryContact: { id: string; email: string; status: string } | null
}

type TabId = 'overview' | 'projects' | 'inbox' | 'activity'

const requestTypeLabel: Record<string, string> = {
  ONBOARDING: 'Onboarding',
  PROGRESS: 'Progress',
  CANCELLATION: 'Cancellation request',
}

function findThread(project: ClientProjectSummary, type: ProjectRequestItem['type']) {
  return project.requests?.find((r) => r.type === type) ?? null
}

function formatPhaseLabel(phase: string): string {
  return phase.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function resetCheckpointFields(setters: {
  setTitle: (v: string) => void
  setBody: (v: string) => void
  setReviewUrl: (v: string) => void
  setFiles: (v: FileList | null) => void
  setPhase: (v: string) => void
}) {
  setters.setTitle('')
  setters.setBody('')
  setters.setReviewUrl('')
  setters.setFiles(null)
  setters.setPhase('')
}

function ProgressCheckPanel({
  project,
  clientName,
  title,
  body,
  reviewUrl,
  phase,
  selectedFiles,
  submitting,
  onTitleChange,
  onBodyChange,
  onReviewUrlChange,
  onFilesChange,
  onPhaseChange,
  onSubmit,
  onCancel,
}: {
  project: ClientProjectSummary
  clientName: string
  title: string
  body: string
  reviewUrl: string
  phase: string
  selectedFiles: FileList | null
  submitting: boolean
  onTitleChange: (value: string) => void
  onBodyChange: (value: string) => void
  onReviewUrlChange: (value: string) => void
  onFilesChange: (files: FileList | null) => void
  onPhaseChange: (value: string) => void
  onSubmit: () => void
  onCancel: () => void
}) {
  return (
    <section
      id={`progress-check-${project.id}`}
      className="rounded-xl border border-casablanca/35 bg-linear-to-br from-casablanca/10 via-white/40 to-sanmarino/5 p-5 ring-1 ring-casablanca/20 dark:from-casablanca/10 dark:via-chambray/20 dark:to-sanmarino/10 dark:ring-casablanca/25"
    >
      <p className="admin-eyebrow">Progress check for</p>
      <h3 className={`mt-1 text-lg text-chambray ${bricolage_grot600.className}`}>
        {project.title}
      </h3>
      <p className="mt-1 text-sm text-app-muted">
        {clientName} · Phase: {formatPhaseLabel(project.phase)}
      </p>
      {project.description ? (
        <p className="mt-2 line-clamp-2 text-sm text-app-muted">{project.description}</p>
      ) : null}
      <p className="mt-4 text-sm text-app-muted">
        The client can approve or reply with changes. New checks replace any previous pending
        approval on this project.
      </p>
      <div className="mt-4 space-y-3">
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Title (e.g. Approve phase 2 deliverables)"
          className="admin-input w-full"
        />
        <textarea
          value={body}
          onChange={(e) => onBodyChange(e.target.value)}
          placeholder="What should the client review?"
          rows={4}
          className="admin-textarea w-full resize-y"
        />
        <input
          type="url"
          value={reviewUrl}
          onChange={(e) => onReviewUrlChange(e.target.value)}
          placeholder="Review link (optional) — website, video, etc."
          className="admin-input w-full"
        />
        <div>
          <p className="text-sm text-app-muted">Attachments (optional)</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <label className="admin-btn-ghost cursor-pointer text-sm">
              Choose files
              <input
                type="file"
                multiple
                accept="image/*,video/*,.pdf"
                onChange={(e) => onFilesChange(e.target.files)}
                className="sr-only"
              />
            </label>
            {selectedFiles && selectedFiles.length > 0 ? (
              <span className="text-sm text-app-muted">
                {Array.from(selectedFiles)
                  .map((file) => file.name)
                  .join(', ')}
              </span>
            ) : (
              <span className="text-sm text-app-muted">No files selected</span>
            )}
          </div>
        </div>
        <select
          value={phase}
          onChange={(e) => onPhaseChange(e.target.value)}
          className="admin-input w-full"
        >
          <option value="">No phase change</option>
          <option value="CLIENT_REVIEW">On approve → Client review</option>
          <option value="READY_FOR_DELIVERY">On approve → Ready for delivery</option>
          <option value="DELIVERED">On approve → Delivered</option>
        </select>
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            disabled={submitting}
            onClick={() => void onSubmit()}
            className="admin-btn-primary text-sm"
          >
            {submitting ? 'Sending…' : 'Send to client'}
          </button>
          <button type="button" onClick={onCancel} className="admin-btn-ghost text-sm">
            Cancel
          </button>
        </div>
      </div>
    </section>
  )
}

type ClientWorkspaceProps = {
  organizationId: string
  initialTab?: TabId
}

export default function ClientWorkspace({ organizationId, initialTab = 'projects' }: ClientWorkspaceProps) {
  const { session } = useAdminSession()
  const canTrackUnread = session?.mode === 'user'
  const [tab, setTab] = useState<TabId>(initialTab)
  const [client, setClient] = useState<ClientRosterItem | null>(null)
  const [projects, setProjects] = useState<ClientProjectSummary[]>([])
  const [inbox, setInbox] = useState<ProjectRequestItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [activity, setActivity] = useState<ProjectActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [checkpointError, setCheckpointError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [checkpointTitle, setCheckpointTitle] = useState('')
  const [checkpointBody, setCheckpointBody] = useState('')
  const [checkpointReviewUrl, setCheckpointReviewUrl] = useState('')
  const [checkpointFiles, setCheckpointFiles] = useState<FileList | null>(null)
  const [checkpointPhase, setCheckpointPhase] = useState('')
  const [submittingCheckpoint, setSubmittingCheckpoint] = useState(false)
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null)
  const [completingId, setCompletingId] = useState<string | null>(null)

  const refreshUnreadCount = useCallback(async () => {
    if (!canTrackUnread) {
      setUnreadCount(0)
      return
    }
    try {
      setUnreadCount(await fetchInboxUnreadCount(organizationId))
    } catch {
      setUnreadCount(0)
    }
  }, [canTrackUnread, organizationId])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [roster, projectList, inboxList, activityList, unread] = await Promise.all([
        fetchAdminBff<ClientRosterItem[]>('/api/clients'),
        fetchAdminBff<ClientProjectSummary[]>(`/api/clients/${organizationId}/projects`),
        fetchAdminBff<ProjectRequestItem[]>(`/api/clients/${organizationId}/inbox`),
        fetchAdminBff<ProjectActivityItem[]>(`/api/clients/${organizationId}/activity`),
        canTrackUnread ? fetchInboxUnreadCount(organizationId) : Promise.resolve(0),
      ])
      setClient(roster.find((c) => c.id === organizationId) ?? null)
      setProjects(projectList)
      setInbox(inboxList)
      setActivity(activityList)
      setUnreadCount(unread)
    } catch (err) {
      const message =
        err instanceof AdminApiFetchError
          ? `${err.message} — ${adminFetchErrorHint(err.code)}`
          : err instanceof Error
            ? err.message
            : 'Could not load client workspace.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [canTrackUnread, organizationId])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (tab !== 'inbox' || loading || !canTrackUnread) return
    void (async () => {
      try {
        await markInboxRead(organizationId)
        await refreshUnreadCount()
      } catch {
        /* non-blocking */
      }
    })()
  }, [tab, loading, canTrackUnread, organizationId, refreshUnreadCount])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const t = params.get('tab')
    if (t === 'inbox' || t === 'overview' || t === 'activity' || t === 'projects') {
      setTab(t)
    }
  }, [])

  useEffect(() => {
    if (!selectedProjectId) return
    const el = document.getElementById(`progress-check-${selectedProjectId}`)
    if (!el) return
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'nearest' })
  }, [selectedProjectId])

  const resetCheckpointForm = useCallback(() => {
    resetCheckpointFields({
      setTitle: setCheckpointTitle,
      setBody: setCheckpointBody,
      setReviewUrl: setCheckpointReviewUrl,
      setFiles: setCheckpointFiles,
      setPhase: setCheckpointPhase,
    })
  }, [])

  const openProgressCheckForm = useCallback(
    (projectId: string) => {
      if (selectedProjectId !== projectId) {
        resetCheckpointForm()
      }
      setSelectedProjectId(projectId)
      setExpandedProjectId(projectId)
    },
    [resetCheckpointForm, selectedProjectId],
  )

  const cancelProgressCheckForm = useCallback(() => {
    setSelectedProjectId(null)
    resetCheckpointForm()
  }, [resetCheckpointForm])

  const refreshThread = async (requestId: string) => {
    const thread = await fetchAdminBff<ProjectRequestItem>(
      `/api/project-requests/${requestId}`,
    )
    setProjects((prev) =>
      prev.map((p) => ({
        ...p,
        requests: p.requests?.map((r) => (r.id === requestId ? { ...r, ...thread } : r)),
      })),
    )
    await load()
  }

  const sendAdminMessage = async (requestId: string, body: string) => {
    try {
      await fetchAdminBff(`/api/project-requests/${requestId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
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
      await load()
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
      await fetchAdminBff(
        `/api/clients/${organizationId}/projects/${projectId}/approve`,
        { method: 'POST' },
      )
      setSuccess('Project approved and client notified.')
      await load()
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
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed')
    }
  }

  const submitCheckpoint = async () => {
    if (!selectedProjectId || !checkpointTitle.trim() || !checkpointBody.trim()) return
    setSubmittingCheckpoint(true)
    setCheckpointError(null)
    try {
      const attachments =
        checkpointFiles && checkpointFiles.length > 0
          ? await stageProjectFiles(selectedProjectId, Array.from(checkpointFiles))
          : undefined

      await fetchAdminBff<ProjectRequestItem>(
        `/api/projects/${selectedProjectId}/checkpoints`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: checkpointTitle.trim(),
            body: checkpointBody.trim(),
            ...(checkpointReviewUrl.trim() ? { reviewUrl: checkpointReviewUrl.trim() } : {}),
            ...(checkpointPhase ? { targetPhase: checkpointPhase } : {}),
            ...(attachments?.length ? { attachments } : {}),
          }),
        },
      )

      setSuccess('Progress check sent — client can approve or reply.')
      resetCheckpointForm()
      setExpandedProjectId(selectedProjectId)
      setSelectedProjectId(null)
      await load()
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
      await load()
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
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition ${bricolage_grot600.className} ${
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
          <p className="text-sm text-app-muted">Loading workspace…</p>
        ) : tab === 'overview' ? (
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
                <span className="font-medium text-chambray">{inbox.length}</span> open inbox items
                {unreadCount > 0 ? (
                  <span className="text-app-muted"> · {unreadCount} unread</span>
                ) : null}
              </li>
            </ul>
          </section>
        ) : tab === 'projects' ? (
          <div className="space-y-6">
            {projects.length === 0 ? (
              <p className="text-sm text-app-muted">No projects yet.</p>
            ) : (
              projects.map((project) => {
                const onboarding = findThread(project, 'ONBOARDING')
                const progress = findThread(project, 'PROGRESS')
                const cancellation = findThread(project, 'CANCELLATION')
                const expanded = expandedProjectId === project.id
                const progressCheckOpen = selectedProjectId === project.id
                const onboardingClosed = onboarding
                  ? ['RESOLVED', 'REJECTED', 'CANCELLED'].includes(onboarding.status)
                  : false

                return (
                  <section
                    key={project.id}
                    className={`admin-glass-card overflow-hidden ${
                      progressCheckOpen ? 'ring-2 ring-casablanca/40' : ''
                    }`}
                  >
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
                        <button
                          type="button"
                          onClick={() => setExpandedProjectId(expanded ? null : project.id)}
                          className="admin-btn-ghost text-sm"
                        >
                          {expanded ? 'Hide' : 'View'} threads
                        </button>
                        {project.status === 'SUBMITTED' ? (
                          <button
                            type="button"
                            disabled={approvingId === project.id}
                            onClick={() => void approveProject(project.id)}
                            className="admin-btn-primary text-sm"
                          >
                            Onboard project
                          </button>
                        ) : null}
                        {project.status === 'ACTIVE' ? (
                          <>
                            <button
                              type="button"
                              disabled={completingId === project.id}
                              onClick={() => void markProjectComplete(project.id)}
                              className="admin-btn-primary text-sm"
                            >
                              Mark complete
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (progressCheckOpen) {
                                  cancelProgressCheckForm()
                                } else {
                                  openProgressCheckForm(project.id)
                                }
                              }}
                              className={`text-sm ${
                                progressCheckOpen ? 'admin-btn-primary' : 'admin-btn-ghost'
                              }`}
                            >
                              {progressCheckOpen ? 'Cancel progress check' : 'Send progress check'}
                            </button>
                          </>
                        ) : null}
                      </div>
                    </div>

                    {expanded ? (
                      <div className="space-y-4 border-t border-chambray/6 bg-chambray/[0.02] px-5 py-4 dark:border-white/8 dark:bg-white/5 sm:px-6">
                        {progressCheckOpen ? (
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
                            onSubmit={submitCheckpoint}
                            onCancel={cancelProgressCheckForm}
                          />
                        ) : null}
                        {project.activities && project.activities.length > 0 ? (
                          <ProjectTimeline
                            activities={project.activities}
                            title="Project timeline (all actions)"
                          />
                        ) : null}
                        {onboarding ? (
                          <ThreadPanel
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
                            onSendMessage={(body) => sendAdminMessage(onboarding.id, body)}
                          />
                        ) : null}
                        {progress && project.status !== 'SUBMITTED' ? (
                          <ThreadPanel
                            title="Project progress"
                            subtitle="Progress checks and client replies"
                            request={progress}
                            organizationId={organizationId}
                            markReadEnabled={canTrackUnread}
                            onInboxMarked={() => void refreshUnreadCount()}
                            onSendMessage={(body) => sendAdminMessage(progress.id, body)}
                          />
                        ) : null}
                        {cancellation ? (
                          <ThreadPanel
                            title="Cancellation"
                            subtitle={cancellation.cancellationOutcome ?? 'Open'}
                            request={cancellation}
                            organizationId={organizationId}
                            markReadEnabled={canTrackUnread}
                            onInboxMarked={() => void refreshUnreadCount()}
                            onSendMessage={(body) => sendAdminMessage(cancellation.id, body)}
                            cancellationResolve={(payload) =>
                              resolveCancellation(cancellation.id, payload)
                            }
                          />
                        ) : null}
                      </div>
                    ) : null}
                  </section>
                )
              })
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
                        onMarked={() => void refreshUnreadCount()}
                      />
                    ) : null}
                    <RequestMessageThread
                      request={item}
                      viewerRole="ADMIN"
                      showResolveActions={item.type !== 'CANCELLATION'}
                      onSendMessage={(body) => sendAdminMessage(item.id, body)}
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
    </main>
  )
}

function ThreadPanel({
  title,
  subtitle,
  request,
  readOnly,
  organizationId,
  markReadEnabled,
  onInboxMarked,
  onSendMessage,
  cancellationResolve,
}: {
  title: string
  subtitle: string
  request: ProjectRequestItem
  readOnly?: boolean
  organizationId: string
  markReadEnabled?: boolean
  onInboxMarked?: () => void
  onSendMessage: (body: string) => Promise<{ ok: boolean; message?: string }>
  cancellationResolve?: (payload: {
    outcome: string
    feeAmount?: number
    feeNotes?: string
    message?: string
  }) => Promise<void>
}) {
  return (
    <div className="rounded-xl border border-chambray/8 p-4">
      <p className={`text-sm text-chambray ${bricolage_grot600.className}`}>{title}</p>
      <p className="text-xs text-app-muted">{subtitle}</p>
      <div className="mt-3">
        {markReadEnabled ? (
          <MarkInboxReadOnView
            organizationId={organizationId}
            requestId={request.id}
            enabled
            onMarked={onInboxMarked}
          />
        ) : null}
        <RequestMessageThread
          request={request}
          viewerRole="ADMIN"
          readOnly={readOnly}
          onSendMessage={onSendMessage}
        />
        {cancellationResolve &&
        request.type === 'CANCELLATION' &&
        !['RESOLVED', 'REJECTED'].includes(request.status) ? (
          <CancellationResolveForm onResolve={cancellationResolve} />
        ) : null}
      </div>
    </div>
  )
}

function CancellationResolveForm({
  onResolve,
}: {
  onResolve: (payload: {
    outcome: string
    feeAmount?: number
    feeNotes?: string
    message?: string
  }) => Promise<void>
}) {
  const [outcome, setOutcome] = useState('APPROVED_NO_FEE')
  const [feeAmount, setFeeAmount] = useState('')
  const [feeNotes, setFeeNotes] = useState('')
  const [message, setMessage] = useState('')

  return (
    <div className="mt-4 space-y-3 rounded-lg border border-red-200/50 bg-red-50/30 p-4">
      <p className={`text-sm text-chambray ${bricolage_grot600.className}`}>Resolve cancellation</p>
      <select
        value={outcome}
        onChange={(e) => setOutcome(e.target.value)}
        className="admin-input w-full"
      >
        <option value="APPROVED_NO_FEE">Approve cancellation (no fee)</option>
        <option value="APPROVED_WITH_FEE">Approve cancellation (with fee)</option>
        <option value="DENIED">Deny cancellation</option>
      </select>
      {outcome === 'APPROVED_WITH_FEE' ? (
        <input
          type="number"
          min={0}
          step="0.01"
          value={feeAmount}
          onChange={(e) => setFeeAmount(e.target.value)}
          placeholder="Fee amount"
          className="admin-input w-full"
        />
      ) : null}
      <input
        type="text"
        value={feeNotes}
        onChange={(e) => setFeeNotes(e.target.value)}
        placeholder="Fee notes (optional)"
        className="admin-input w-full"
      />
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Message to client"
        rows={2}
        className="admin-textarea w-full resize-y"
      />
      <button
        type="button"
        className="admin-btn-primary text-sm"
        onClick={() =>
          void onResolve({
            outcome,
            feeAmount: feeAmount ? Number(feeAmount) : undefined,
            feeNotes: feeNotes || undefined,
            message: message || undefined,
          })
        }
      >
        Send resolution
      </button>
    </div>
  )
}
