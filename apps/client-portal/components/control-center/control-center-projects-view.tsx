'use client'

import {
  FormEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import type { ClientProjectDetail, ClientProjectSummary } from '@/lib/projects/api-types'
import RequestMessageThread from '@/components/control-center/request-message-thread'
import ProjectStatusAttribution, {
  ProjectStatusBadge,
  ProjectTimeline,
} from '@/components/project-status-attribution'
import {
  createProject,
  dispatchPortalNotificationsRefresh,
  fetchProject,
  fetchProjects,
  approveCheckpointMessage,
  createCancellationRequest,
  markAttentionRead,
  navigateToApprovals,
  sendRequestMessage,
  uploadProjectFiles,
} from '@/lib/projects/fetch-projects-client'
import ProjectCover from '@/components/project-cover'
import ProjectCoverEditor from '@/components/project-cover-editor'
import ProjectTeamAside from '@/components/project-team-aside'
import { useProjectMembers } from '@/lib/team/use-project-members'
import { fetchPortalProfile } from '@/lib/team/fetch-team-client'
import { bricolage_grot600, bricolage_grot700 } from '@/styles/fonts'
import { Bell, Calendar, ExternalLink, FolderKanban, Plus } from 'lucide-react'

const SHOW_PROJECTS_LIST_KEY = 'cc-show-projects-list'

export default function ControlCenterProjectsView() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const deepLinkHandled = useRef(false)

  useEffect(() => {
    void fetchPortalProfile().then((profile) => {
      setCanCreateProject(profile?.permissions.canCreateProject ?? true)
    })
  }, [])
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
  const [detailError, setDetailError] = useState<string | null>(null)
  const [canCreateProject, setCanCreateProject] = useState(true)

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
  useLayoutEffect(() => {
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
      setDetailError(null)
      return
    }
    setDetailError(null)
    let cancelled = false
    void fetchProject(openedProjectId).then((project) => {
      if (cancelled) return
      if (!project) {
        setDetail(null)
        setDetailError('Could not load this project.')
        return
      }
      setDetail(project)
    })
    return () => {
      cancelled = true
    }
  }, [openedProjectId])

  useEffect(() => {
    if (!openedProjectId || !detail || detail.id !== openedProjectId) return
    let cancelled = false
    void (async () => {
      try {
        await markAttentionRead({ projectId: openedProjectId })
        if (!cancelled) dispatchPortalNotificationsRefresh()
      } catch {
        /* non-blocking */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [openedProjectId, detail])

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

  const detailReady = Boolean(
    openedProjectId && detail && detail.id === openedProjectId,
  )

  if (openedProjectId && detailError) {
    return (
      <div className="space-y-4">
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
          {detailError}
        </p>
        <button type="button" onClick={closeProject} className="portal-btn-ghost text-sm">
          ← All projects
        </button>
      </div>
    )
  }

  if (openedProjectId && !detailReady) {
    return (
      <div className="space-y-4 py-8">
        <p className={`text-center text-chambray ${bricolage_grot600.className}`}>
          Opening project…
        </p>
        <p className="text-center text-sm text-app-muted">Loading workspace details</p>
      </div>
    )
  }

  if (detailReady && detail) {
    return (
      <ProjectDetailView
        project={detail}
        onBack={closeProject}
        onRefresh={async () => {
          const next = await fetchProject(openedProjectId!)
          setDetail(next)
          await loadProjects()
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className={`text-sm text-app-muted ${bricolage_grot600.className}`}>
          Submit new work for agency review. Approved projects become active.
        </p>
        {canCreateProject ? (
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="portal-btn-primary gap-2 text-sm"
          >
            <Plus className="h-4 w-4" aria-hidden />
            New project
          </button>
        ) : null}
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
            <label className="text-sm text-app-muted">Attachments (optional)</label>
            <input
              type="file"
              multiple
              onChange={(e) => setFiles(e.target.files)}
              className="mt-2 block w-full text-sm text-app-muted"
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
        <p className="text-sm text-app-muted">Loading projects…</p>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <article
              key={project.id}
              className="portal-glass-card portal-shine-hover flex flex-col overflow-hidden p-0"
            >
              <ProjectCover
                coverImageUrl={project.coverImageUrl}
                alt={project.title}
                variant="card"
                className="rounded-none"
              />
              <div className="flex flex-col p-6">
              <div className="flex items-start justify-between gap-2">
                <h3 className={`text-base text-chambray ${bricolage_grot600.className}`}>
                  {project.title}
                </h3>
                <ProjectStatusBadge project={project} />
              </div>
              <p className="mt-2 line-clamp-3 text-sm text-app-muted">{project.description}</p>
              <div className="mt-2">
                <ProjectStatusAttribution project={project} variant="linesOnly" />
              </div>
              <p className="mt-4 flex items-center gap-1.5 text-xs text-app-muted">
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
              {project.hasPendingCheckpoint ? (
                <button
                  type="button"
                  onClick={() => navigateToApprovals()}
                  className="portal-btn-primary mt-2 w-full gap-2 text-sm"
                >
                  <Bell className="h-4 w-4" aria-hidden />
                  Approval needed
                </button>
              ) : null}
              </div>
            </article>
          ))}
          {projects.length === 0 ? (
            <p className="col-span-full text-sm text-app-muted">
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
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(
    project.coverImageUrl ?? null,
  )
  const { canManage, loading: membersLoading } = useProjectMembers(project.id)

  useEffect(() => {
    setCoverImageUrl(project.coverImageUrl ?? null)
  }, [project.coverImageUrl, project.id])

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
      <section className="portal-glass-card overflow-hidden p-0">
        {canManage && !membersLoading ? (
          <ProjectCoverEditor
            projectId={project.id}
            coverImageUrl={coverImageUrl}
            title={project.title}
            onUpdated={(url) => {
              setCoverImageUrl(url)
              void onRefresh()
            }}
          />
        ) : (
          <ProjectCover
            coverImageUrl={coverImageUrl}
            alt={project.title}
            variant="hero"
            className="rounded-none sm:rounded-t-xl"
          />
        )}
        <div className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="portal-eyebrow">Project</p>
              <h3 className={`mt-1 text-xl text-chambray ${bricolage_grot700.className}`}>
                {project.title}
              </h3>
              <p className="mt-2 text-sm text-app-muted">{project.description}</p>
            </div>
            <ProjectStatusAttribution project={project} variant="detail" />
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
        <ProjectTeamAside
          projectId={project.id}
          className="order-1 lg:order-2 lg:sticky lg:top-4 lg:col-start-2 lg:row-start-1"
        />

        <div className="order-2 space-y-6 lg:order-1 lg:col-start-1">
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
          <ul className="mt-3 space-y-2 text-sm text-app-muted">
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
          <p className="mt-1 text-xs text-app-muted">
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
          <p className="mt-1 text-xs text-app-muted">
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
            <p className="mt-1 text-sm text-app-muted">
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
          <p className="mt-1 text-sm text-app-muted">
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
      </div>
    </div>
  )
}
