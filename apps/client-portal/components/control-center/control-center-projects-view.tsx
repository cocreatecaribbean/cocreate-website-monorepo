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
import PortalProjectWorkspace from '@/components/control-center/portal-project-workspace'
import ProjectStatusAttribution, {
  ProjectStatusBadge,
} from '@/components/project-status-attribution'
import {
  createProject,
  dispatchPortalNotificationsRefresh,
  fetchProject,
  fetchProjects,
  fetchRequestThread,
  markAttentionRead,
  navigateToApprovals,
  uploadProjectFiles,
} from '@/lib/projects/fetch-projects-client'
import {
  parsePortalProjectTab,
  PROJECT_TAB_QUERY,
  type PortalProjectTabId,
} from '@/lib/control-center/project-workspace'
import ProjectCover from '@/components/project-cover'
import { fetchPortalProfile } from '@/lib/team/fetch-team-client'
import { bricolage_grot600 } from '@/styles/fonts'
import { Bell, Calendar, ExternalLink, Plus } from 'lucide-react'

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
  const [initialProjectTab, setInitialProjectTab] = useState<PortalProjectTabId>('overview')

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
        params.delete(PROJECT_TAB_QUERY)
        const query = params.toString()
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
      }
      return
    }

    const deepLinkId = searchParams.get('projectId')
    if (!deepLinkId) return

    setInitialProjectTab(parsePortalProjectTab(searchParams.get(PROJECT_TAB_QUERY)))
    setOpenedProjectId(deepLinkId)
    const params = new URLSearchParams(searchParams.toString())
    params.delete('projectId')
    params.delete(PROJECT_TAB_QUERY)
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

  const openProject = useCallback((projectId: string, tab: PortalProjectTabId = 'overview') => {
    setInitialProjectTab(tab)
    setOpenedProjectId(projectId)
  }, [])

  const closeProject = useCallback(() => {
    setOpenedProjectId(null)
    setInitialProjectTab('overview')
  }, [])

  const refreshThreadInDetail = useCallback(async (requestId: string) => {
    const result = await fetchRequestThread(requestId)
    if (!result.ok) return
    setDetail((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        requests: prev.requests?.map((r) =>
          r.id === requestId ? result.data : r,
        ),
      }
    })
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
        <p className="portal-alert-error">
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
      <PortalProjectWorkspace
        key={detail.id}
        project={detail}
        initialTab={initialProjectTab}
        onBack={closeProject}
        onRefreshThread={refreshThreadInDetail}
        onRefresh={async () => {
          const next = await fetchProject(openedProjectId!)
          setDetail(next)
          await loadProjects()
        }}
      />
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
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
        <p className="portal-alert-error">
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
