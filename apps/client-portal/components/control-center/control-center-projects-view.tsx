'use client'

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import type { ClientProjectDetail, ClientProjectSummary } from '@/lib/projects/api-types'
import RequestMessageThread from '@/components/control-center/request-message-thread'
import ProjectStatusAttribution, {
  ProjectStatusBadge,
  ProjectTimeline,
} from '@/components/project-status-attribution'
import {
  createProject,
  fetchProject,
  fetchProjects,
  approveCheckpointMessage,
  createCancellationRequest,
  navigateToApprovals,
  sendRequestMessage,
  uploadProjectFiles,
} from '@/lib/projects/fetch-projects-client'
import { bricolage_grot600, bricolage_grot700 } from '@/styles/fonts'
import { Bell, Calendar, ExternalLink, FolderKanban, Plus } from 'lucide-react'

const SHOW_PROJECTS_LIST_KEY = 'cc-show-projects-list'

export default function ControlCenterProjectsView() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const deepLinkHandled = useRef(false)
  const [openedProjectId, setOpenedProjectId] = useState<string | null>(null)
  const [projects, setProjects] = useState<ClientProjectSummary[]>([])
  const [detail, setDetail] = useState<ClientProjectDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [files, setFiles] = useState<FileList | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadProjects = useCallback(async () => {
    setLoading(true)
    const list = await fetchProjects()
    setProjects(list)
    setLoading(false)
  }, [])

  useEffect(() => {
    void loadProjects()
  }, [loadProjects])

  // Email / notification deep links use ?projectId= once; in-app navigation uses local state only.
  useEffect(() => {
    if (deepLinkHandled.current) return
    deepLinkHandled.current = true

    if (typeof window !== 'undefined' && sessionStorage.getItem(SHOW_PROJECTS_LIST_KEY) === '1') {
      sessionStorage.removeItem(SHOW_PROJECTS_LIST_KEY)
      setOpenedProjectId(null)
      const params = new URLSearchParams(searchParams.toString())
      if (params.has('projectId')) {
        params.delete('projectId')
        const query = params.toString()
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
      }
      return
    }

    const deepLinkId = searchParams.get('projectId')
    if (!deepLinkId) return

    setOpenedProjectId(deepLinkId)
    const params = new URLSearchParams(searchParams.toString())
    params.delete('projectId')
    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }, [pathname, router, searchParams])

  useEffect(() => {
    if (!openedProjectId) {
      setDetail(null)
      return
    }
    void fetchProject(openedProjectId).then(setDetail)
  }, [openedProjectId])

  const openProject = useCallback((projectId: string) => {
    setOpenedProjectId(projectId)
  }, [])

  const closeProject = useCallback(() => {
    setOpenedProjectId(null)
  }, [])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const result = await createProject({
      title: title.trim(),
      description: description.trim(),
    })
    if (!result.ok || !result.project) {
      setError(result.message ?? 'Could not create project')
      setSubmitting(false)
      return
    }
    if (files?.length) {
      const upload = await uploadProjectFiles(result.project.id, Array.from(files))
      if (!upload.ok) setError(upload.message ?? 'Project created but upload failed')
    }
    setTitle('')
    setDescription('')
    setFiles(null)
    setShowForm(false)
    setSubmitting(false)
    await loadProjects()
    openProject(result.project.id)
  }

  if (openedProjectId && detail) {
    return (
      <ProjectDetailView
        project={detail}
        onBack={closeProject}
        onRefresh={async () => {
          const next = await fetchProject(openedProjectId)
          setDetail(next)
          await loadProjects()
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className={`text-sm text-slate-600 ${bricolage_grot600.className}`}>
          Submit new work for agency review. Approved projects become active.
        </p>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="portal-btn-primary gap-2 text-sm"
        >
          <Plus className="h-4 w-4" aria-hidden />
          New project
        </button>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      {showForm ? (
        <form
          onSubmit={(e) => void onSubmit(e)}
          className="portal-glass-card space-y-4 p-6"
        >
          <p className="portal-eyebrow">New project</p>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Project title"
            className="portal-input w-full"
          />
          <textarea
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe goals, timeline, and deliverables"
            rows={4}
            className="portal-input w-full resize-y"
          />
          <div>
            <label className="text-sm text-slate-600">Attachments (optional)</label>
            <input
              type="file"
              multiple
              onChange={(e) => setFiles(e.target.files)}
              className="mt-2 block w-full text-sm text-slate-600"
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={submitting} className="portal-btn-primary text-sm">
              {submitting ? 'Submitting…' : 'Submit for review'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="portal-btn-ghost text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {loading ? (
        <p className="text-sm text-slate-500">Loading projects…</p>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <article
              key={project.id}
              className="portal-glass-card portal-shine-hover flex flex-col p-6"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className={`text-base text-chambray ${bricolage_grot600.className}`}>
                  {project.title}
                </h3>
                <ProjectStatusBadge project={project} />
              </div>
              <p className="mt-2 line-clamp-3 text-sm text-slate-500">{project.description}</p>
              <div className="mt-2">
                <ProjectStatusAttribution project={project} variant="linesOnly" />
              </div>
              <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
                <Calendar className="h-3.5 w-3.5" aria-hidden />
                {new Date(project.updatedAt).toLocaleDateString()}
              </p>
              <button
                type="button"
                onClick={() => openProject(project.id)}
                className="portal-btn-ghost mt-5 w-full text-sm"
              >
                Open project
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </button>
              {project.hasPendingCheckpoint || project.hasOpenAdminReview ? (
                <button
                  type="button"
                  onClick={() => navigateToApprovals()}
                  className="portal-btn-primary mt-2 w-full gap-2 text-sm"
                >
                  <Bell className="h-4 w-4" aria-hidden />
                  Approval needed
                </button>
              ) : null}
            </article>
          ))}
          {projects.length === 0 ? (
            <p className="col-span-full text-sm text-slate-500">
              No projects yet. Create one to get started.
            </p>
          ) : null}
        </div>
      )}
    </div>
  )
}

function findThread(project: ClientProjectDetail, type: 'ONBOARDING' | 'PROGRESS' | 'CANCELLATION') {
  return project.requests?.find((r) => r.type === type) ?? null
}

function ProjectDetailView({
  project,
  onBack,
  onRefresh,
}: {
  project: ClientProjectDetail
  onBack: () => void
  onRefresh: () => Promise<void>
}) {
  const [message, setMessage] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)

  const onboarding = findThread(project, 'ONBOARDING')
  const progress = findThread(project, 'PROGRESS')
  const cancellation = findThread(project, 'CANCELLATION')
  const onboardingClosed = onboarding
    ? ['RESOLVED', 'REJECTED', 'CANCELLED'].includes(onboarding.status)
    : false
  const canCancel =
    project.status === 'ACTIVE' || project.status === 'ON_HOLD'

  const requestCancellation = async () => {
    if (!window.confirm('Request to cancel this project? CoCreate will review and respond.')) {
      return
    }
    setCancelling(true)
    const result = await createCancellationRequest(project.id, cancelReason.trim() || undefined)
    setCancelling(false)
    if (!result.ok) {
      setMessage(result.message ?? 'Could not submit cancellation request')
      return
    }
    setCancelReason('')
    setMessage('Cancellation request sent.')
    await onRefresh()
  }

  const threadProps = (req: NonNullable<typeof onboarding>) => ({
    request: req,
    viewerRole: 'CLIENT' as const,
    onSendMessage: async (body: string) => {
      const result = await sendRequestMessage(req.id, body)
      if (result.ok) await onRefresh()
      return { ok: result.ok, message: result.ok ? undefined : result.message }
    },
    onApproveCheckpoint: async (messageId: string) => {
      const result = await approveCheckpointMessage(req.id, messageId)
      if (result.ok) await onRefresh()
      return { ok: result.ok, message: result.ok ? undefined : result.message }
    },
  })

  return (
    <div className="space-y-6">
      <button type="button" onClick={onBack} className="portal-btn-ghost text-sm">
        ← All projects
      </button>
      <section className="portal-glass-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="portal-eyebrow">Project</p>
            <h3 className={`mt-1 text-xl text-chambray ${bricolage_grot700.className}`}>
              {project.title}
            </h3>
            <p className="mt-2 text-sm text-slate-600">{project.description}</p>
          </div>
          <ProjectStatusAttribution project={project} variant="detail" />
        </div>
      </section>

      {project.activities && project.activities.length > 0 ? (
        <ProjectTimeline activities={project.activities} />
      ) : null}

      {message ? (
        <p className="rounded-xl border border-sanmarino/20 bg-sanmarino/5 px-4 py-3 text-sm text-chambray">
          {message}
        </p>
      ) : null}

      {project.attachments && project.attachments.length > 0 ? (
        <section className="portal-glass-card p-6">
          <p className={`text-sm text-chambray ${bricolage_grot600.className}`}>Files</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {project.attachments.map((f) => (
              <li key={f.id} className="flex items-center gap-2">
                <FolderKanban className="h-4 w-4 text-sanmarino" aria-hidden />
                {f.fileName}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {onboarding ? (
        <section className="portal-glass-card p-6">
          <p className={`text-chambray ${bricolage_grot600.className}`}>
            Onboarding conversation
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {onboardingClosed
              ? 'Closed after project was onboarded — kept for your records.'
              : 'Discussion before your project is accepted.'}
          </p>
          <div className="mt-4">
            <RequestMessageThread
              {...threadProps(onboarding)}
              readOnly={onboardingClosed}
            />
          </div>
        </section>
      ) : null}

      {progress && project.status !== 'SUBMITTED' ? (
        <section className="portal-glass-card p-6">
          <p className={`text-chambray ${bricolage_grot600.className}`}>Project progress</p>
          <p className="mt-1 text-xs text-slate-500">
            Updates, progress checks, and replies with CoCreate.
          </p>
          <div className="mt-4">
            <RequestMessageThread {...threadProps(progress)} />
          </div>
        </section>
      ) : null}

      {cancellation ? (
        <section className="portal-glass-card p-6">
          <p className={`text-chambray ${bricolage_grot600.className}`}>Cancellation</p>
          {cancellation.cancellationOutcome ? (
            <p className="mt-1 text-sm text-slate-600">
              Outcome: {cancellation.cancellationOutcome.replace(/_/g, ' ').toLowerCase()}
              {cancellation.cancellationFeeAmount != null
                ? ` · Fee: ${cancellation.cancellationFeeAmount}`
                : ''}
            </p>
          ) : null}
          <div className="mt-4">
            <RequestMessageThread
              {...threadProps(cancellation)}
              readOnly={['RESOLVED', 'REJECTED'].includes(cancellation.status)}
            />
          </div>
        </section>
      ) : null}

      {canCancel && !cancellation ? (
        <section className="portal-glass-card border border-red-200/40 p-6">
          <p className={`text-chambray ${bricolage_grot600.className}`}>Request cancellation</p>
          <p className="mt-1 text-sm text-slate-500">
            Tell CoCreate you wish to end this project. We will confirm any fees before it is
            cancelled.
          </p>
          <textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Optional reason for cancellation…"
            rows={3}
            className="portal-textarea mt-4 w-full resize-y"
          />
          <button
            type="button"
            disabled={cancelling}
            onClick={() => void requestCancellation()}
            className="portal-btn-ghost mt-3 text-sm text-red-800 ring-red-200/60"
          >
            {cancelling ? 'Sending…' : 'Request project cancellation'}
          </button>
        </section>
      ) : null}
    </div>
  )
}
