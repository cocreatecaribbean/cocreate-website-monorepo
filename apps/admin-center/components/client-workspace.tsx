'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import RequestMessageThread from '@/components/request-message-thread'
import ProjectStatusAttribution, { ProjectTimeline } from '@/components/project-status-attribution'
import AdminToast from '@/components/admin-toast'
import {
  adminFetchErrorHint,
  AdminApiFetchError,
  fetchAdminBff,
} from '@/lib/admin-api-fetch'
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
  CHANGE_REQUEST: 'Change request',
  PHASE_APPROVAL: 'Phase approval',
  ADMIN_REVIEW: 'Client review',
}

type ClientWorkspaceProps = {
  organizationId: string
  initialTab?: TabId
}

export default function ClientWorkspace({ organizationId, initialTab = 'projects' }: ClientWorkspaceProps) {
  const [tab, setTab] = useState<TabId>(initialTab)
  const [client, setClient] = useState<ClientRosterItem | null>(null)
  const [projects, setProjects] = useState<ClientProjectSummary[]>([])
  const [inbox, setInbox] = useState<ProjectRequestItem[]>([])
  const [activity, setActivity] = useState<ProjectActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [reviewTitle, setReviewTitle] = useState('')
  const [reviewDescription, setReviewDescription] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null)
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
  const [completingId, setCompletingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [roster, projectList, inboxList, activityList] = await Promise.all([
        fetchAdminBff<ClientRosterItem[]>('/api/clients'),
        fetchAdminBff<ClientProjectSummary[]>(`/api/clients/${organizationId}/projects`),
        fetchAdminBff<ProjectRequestItem[]>(`/api/clients/${organizationId}/inbox`),
        fetchAdminBff<ProjectActivityItem[]>(`/api/clients/${organizationId}/activity`),
      ])
      setClient(roster.find((c) => c.id === organizationId) ?? null)
      setProjects(projectList)
      setInbox(inboxList)
      setActivity(activityList)
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
  }, [organizationId])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const t = params.get('tab')
    if (t === 'inbox' || t === 'overview' || t === 'activity' || t === 'projects') {
      setTab(t)
    }
    const thread = params.get('thread')
    if (thread) setActiveThreadId(thread)
  }, [])

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

  const submitReviewRequest = async () => {
    if (!selectedProjectId || !reviewTitle.trim()) return
    setSubmittingReview(true)
    setError(null)
    try {
      await fetchAdminBff(`/api/projects/${selectedProjectId}/review-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: reviewTitle.trim(),
          description: reviewDescription.trim() || reviewTitle.trim(),
        }),
      })
      setSuccess('Review request sent to client.')
      setReviewTitle('')
      setReviewDescription('')
      setExpandedProjectId(selectedProjectId)
      setSelectedProjectId(null)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send review request')
    } finally {
      setSubmittingReview(false)
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
          <p className="mt-1 text-sm text-slate-500">{client.primaryContact.email}</p>
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
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition ${bricolage_grot600.className} ${
                  active
                    ? 'bg-chambray text-white'
                    : 'bg-chambray/8 text-chambray hover:bg-chambray/12'
                }`}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden />
                {item.label}
                {item.id === 'inbox' && inbox.length > 0 ? (
                  <span className="rounded-full bg-casablanca/30 px-1.5 text-xs">{inbox.length}</span>
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

        {loading ? (
          <p className="text-sm text-slate-500">Loading workspace…</p>
        ) : tab === 'overview' ? (
          <section className="admin-glass-card max-w-2xl p-6">
            <p className={`text-chambray ${bricolage_grot600.className}`}>Workspace summary</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
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
              </li>
            </ul>
          </section>
        ) : tab === 'projects' ? (
          <div className="space-y-6">
            {projects.length === 0 ? (
              <p className="text-sm text-slate-500">No projects yet.</p>
            ) : (
              projects.map((project) => {
                const reviewRequests =
                  project.requests?.filter((r) => r.type === 'ADMIN_REVIEW') ?? []
                const expanded = expandedProjectId === project.id
                const hasUnread = reviewRequests.some(
                  (r) => r.status === 'OPEN' || r.status === 'IN_PROGRESS',
                )

                return (
                  <section key={project.id} className="admin-glass-card overflow-hidden">
                    <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                      <div>
                        <p className={`text-chambray ${bricolage_grot600.className}`}>
                          {project.title}
                          {hasUnread ? (
                            <span className="ml-2 rounded-full bg-casablanca/25 px-2 py-0.5 text-xs">
                              Awaiting client
                            </span>
                          ) : null}
                        </p>
                        <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                          {project.description}
                        </p>
                        <div className="mt-2">
                          <ProjectStatusAttribution project={project} />
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {reviewRequests.length > 0 ? (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedProjectId(expanded ? null : project.id)
                            }
                            className="admin-btn-ghost text-sm"
                          >
                            {expanded ? 'Hide' : 'View'} conversation
                            {reviewRequests.length > 1
                              ? ` (${reviewRequests.length})`
                              : ''}
                          </button>
                        ) : null}
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
                          <button
                            type="button"
                            disabled={completingId === project.id}
                            onClick={() => void markProjectComplete(project.id)}
                            className="admin-btn-primary text-sm"
                          >
                            Mark complete
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedProjectId(project.id)
                            setExpandedProjectId(project.id)
                          }}
                          className="admin-btn-ghost text-sm"
                        >
                          Request review
                        </button>
                      </div>
                    </div>

                    {expanded ? (
                      <div className="space-y-4 border-t border-chambray/6 bg-white/30 px-5 py-4 sm:px-6">
                        {project.activities && project.activities.length > 0 ? (
                          <ProjectTimeline
                            activities={project.activities}
                            title="Project timeline (all actions)"
                          />
                        ) : null}
                        {reviewRequests.length > 0 ? (
                          <>
                        <p className={`text-sm text-chambray ${bricolage_grot600.className}`}>
                          Messages with client
                        </p>
                        {reviewRequests.map((req) => (
                          <div
                            key={req.id}
                            className={`rounded-xl border p-4 ${
                              activeThreadId === req.id
                                ? 'border-sanmarino/30 bg-sanmarino/5'
                                : 'border-chambray/8'
                            }`}
                          >
                            <p className="text-sm font-medium text-chambray">{req.title}</p>
                            <p className="text-xs text-slate-500">{req.status}</p>
                            <div className="mt-3">
                              <RequestMessageThread
                                request={req}
                                viewerRole="ADMIN"
                                showResolveActions
                                onSendMessage={(body) => sendAdminMessage(req.id, body)}
                                onResolve={async (status) => {
                                  await fetchAdminBff(
                                    `/api/project-requests/${req.id}`,
                                    {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ status }),
                                    },
                                  )
                                  setSuccess(
                                    status === 'RESOLVED' ? 'Request resolved.' : 'Request rejected.',
                                  )
                                  await load()
                                }}
                              />
                            </div>
                          </div>
                        ))}
                          </>
                        ) : (
                          <p className="text-sm text-slate-500">No open review threads.</p>
                        )}
                      </div>
                    ) : null}
                  </section>
                )
              })
            )}

            {selectedProjectId ? (
              <section className="admin-glass-card max-w-lg space-y-4 p-6">
                <p className={`text-chambray ${bricolage_grot600.className}`}>Request client review</p>
                <input
                  type="text"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  placeholder="Review title"
                  className="admin-input w-full"
                />
                <textarea
                  value={reviewDescription}
                  onChange={(e) => setReviewDescription(e.target.value)}
                  placeholder="What should the client review?"
                  rows={4}
                  className="admin-input w-full resize-y"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={submittingReview}
                    onClick={() => void submitReviewRequest()}
                    className="admin-btn-primary text-sm"
                  >
                    Send to client
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedProjectId(null)}
                    className="admin-btn-ghost text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </section>
            ) : null}
          </div>
        ) : tab === 'inbox' ? (
          <div className="space-y-4">
            {inbox.length === 0 ? (
              <p className="text-sm text-slate-500">Inbox is clear.</p>
            ) : (
              inbox.map((item) => (
                <section key={item.id} className="admin-glass-card p-5">
                  <p className="text-xs font-semibold tracking-wide text-sanmarino uppercase">
                    {requestTypeLabel[item.type] ?? item.type}
                  </p>
                  <p className={`mt-1 text-chambray ${bricolage_grot600.className}`}>{item.title}</p>
                  <p className="text-sm text-slate-500">{item.projectTitle}</p>
                  <div className="mt-4">
                    <RequestMessageThread
                      request={item}
                      viewerRole="ADMIN"
                      showResolveActions
                      onSendMessage={(body) => sendAdminMessage(item.id, body)}
                      onResolve={async (status) => {
                        await resolveRequest(item.id, status)
                      }}
                    />
                  </div>
                </section>
              ))
            )}
          </div>
        ) : (
          <ul className="admin-glass-card divide-y divide-chambray/6 overflow-hidden">
            {activity.length === 0 ? (
              <li className="px-6 py-8 text-sm text-slate-500">No activity yet.</li>
            ) : (
              activity.map((item) => (
                <li key={item.id} className="px-5 py-3 sm:px-6">
                  <p className={`text-sm text-chambray ${bricolage_grot600.className}`}>
                    {item.projectTitle}
                  </p>
                  <p className="text-xs text-slate-500">
                    {item.summary ?? item.action}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
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
