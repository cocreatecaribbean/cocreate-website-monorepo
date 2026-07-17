'use client'

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import PortalProjectWorkspace from '@/components/control-center/portal-project-workspace'
import ProjectStatusAttribution, {
  ProjectStatusBadge,
} from '@/components/project-status-attribution'
import { useCreateProjectWithFilesMutation } from '@/lib/api/mutations/projects'
import { useMarkAttentionReadMutation } from '@/lib/api/mutations/notifications'
import { usePortalProfileQuery } from '@/lib/api/queries/team'
import { useProjectQuery, useProjectsQuery, prefetchClientProjectOverview } from '@/lib/api/queries/projects'
import { queryKeys } from '@/lib/api/query-keys'
import { CONTROL_CENTER_VIEW_QUERY } from '@/lib/control-center/nav'
import {
  applyProjectWorkspaceParams,
  parsePortalProjectTab,
  PROJECT_ID_QUERY,
  PROJECT_TAB_QUERY,
  type PortalProjectTabId,
} from '@/lib/control-center/project-workspace'
import ProjectCover from '@/components/project-cover'
import { AttachmentPreviewChip } from '@cocreate/app-ui/file-media-tile'
import { bricolage_grot600 } from '@/styles/fonts'
import { Calendar, ExternalLink, Plus } from 'lucide-react'

export default function ControlCenterProjectsView() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const markedAttentionProjectRef = useRef<string | null>(null)

  const { data: profile } = usePortalProfileQuery()
  const canCreateProject = profile?.permissions.canCreateProject ?? false
  const isViewer = Boolean(profile?.permissions.isViewer)
  const isContributor = Boolean(profile?.permissions.isContributor)

  const openedProjectId = searchParams.get(PROJECT_ID_QUERY)
  const activeProjectTab = parsePortalProjectTab(searchParams.get(PROJECT_TAB_QUERY), {
    isViewer,
  })

  const { data: projects = [], isLoading: loading } = useProjectsQuery()
  const {
    data: detail,
    isError: detailIsError,
    refetch: refetchDetail,
  } = useProjectQuery(openedProjectId)

  const createProjectMutation = useCreateProjectWithFilesMutation()
  const { mutate: markAttentionRead } = useMarkAttentionReadMutation()

  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [error, setError] = useState<string | null>(null)

  const replaceSearchParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString())
      mutate(params)
      const query = params.toString()
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  useEffect(() => {
    if (!openedProjectId) {
      markedAttentionProjectRef.current = null
      return
    }
    if (!detail || detail.id !== openedProjectId) return
    if (markedAttentionProjectRef.current === openedProjectId) return

    markedAttentionProjectRef.current = openedProjectId
    markAttentionRead({ projectId: openedProjectId })
  }, [openedProjectId, detail?.id, markAttentionRead])

  const openProject = useCallback(
    (projectId: string, tab: PortalProjectTabId = isViewer ? 'progress' : 'overview') => {
      replaceSearchParams((params) => {
        params.set(CONTROL_CENTER_VIEW_QUERY, 'projects')
        applyProjectWorkspaceParams(params, projectId, tab)
      })
    },
    [isViewer, replaceSearchParams],
  )

  const closeProject = useCallback(() => {
    replaceSearchParams((params) => {
      applyProjectWorkspaceParams(params, null)
    })
  }, [replaceSearchParams])

  const handleTabChange = useCallback(
    (tab: PortalProjectTabId) => {
      if (!openedProjectId) return
      replaceSearchParams((params) => {
        applyProjectWorkspaceParams(params, openedProjectId, tab)
      })
    },
    [openedProjectId, replaceSearchParams],
  )

  const refreshProjectData = useCallback(async () => {
    await refetchDetail()
    await queryClient.invalidateQueries({ queryKey: queryKeys.projects.list() })
  }, [queryClient, refetchDetail])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    const result = await createProjectMutation.mutateAsync({
      title: title.trim(),
      description: description.trim(),
      files: files.length ? files : undefined,
    })
    if (!result.ok || !result.project) {
      setError(result.message ?? 'Could not create project')
      return
    }
    if ('uploadError' in result && result.uploadError) {
      setError(result.uploadError)
    }
    setTitle('')
    setDescription('')
    setFiles([])
    setShowForm(false)
    openProject(result.project.id)
  }

  const detailReady = Boolean(
    openedProjectId && detail && detail.id === openedProjectId,
  )
  const detailError = detailIsError ? 'Could not load this project.' : null
  const submitting = createProjectMutation.isPending

  if (openedProjectId && detailError) {
    return (
      <div className="space-y-4">
        <p className="portal-alert-error">{detailError}</p>
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
        initialTab={activeProjectTab}
        onBack={closeProject}
        onRefresh={refreshProjectData}
        onTabChange={handleTabChange}
      />
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className={`text-sm text-app-muted ${bricolage_grot600.className}`}>
          {canCreateProject
            ? 'Submit new work for agency review. Approved projects become active.'
            : 'Projects you’ve been assigned to appear here.'}
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

      {error ? <p className="portal-alert-error">{error}</p> : null}

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
          <div className="space-y-2">
            <label className="text-sm text-app-muted">Attachments (optional)</label>
            <input
              type="file"
              multiple
              onChange={(e) => {
                const next = e.target.files ? Array.from(e.target.files) : []
                if (next.length) setFiles((prev) => [...prev, ...next])
                e.target.value = ''
              }}
              className="mt-2 block w-full text-sm text-app-muted"
            />
            {files.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {files.map((file, index) => (
                  <AttachmentPreviewChip
                    key={`${file.name}-${index}`}
                    fileName={file.name}
                    mimeType={file.type || 'application/octet-stream'}
                    localFile={file}
                    onRemove={() =>
                      setFiles((prev) => prev.filter((_, fileIndex) => fileIndex !== index))
                    }
                  />
                ))}
              </ul>
            ) : null}
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
              onMouseEnter={() => void prefetchClientProjectOverview(queryClient, project.id)}
              onFocus={() => void prefetchClientProjectOverview(queryClient, project.id)}
            >
              <ProjectCover
                coverImageUrl={project.coverImageUrl}
                alt={project.title}
                variant="card"
                className="rounded-none"
              />
              <div className="flex flex-col p-6">
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => openProject(project.id)}
                    onMouseEnter={() => void prefetchClientProjectOverview(queryClient, project.id)}
                    onFocus={() => void prefetchClientProjectOverview(queryClient, project.id)}
                    className={`text-left text-base text-chambray underline-offset-4 hover:text-sanmarino hover:underline ${bricolage_grot600.className}`}
                  >
                    {project.title}
                  </button>
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
                  onMouseEnter={() => void prefetchClientProjectOverview(queryClient, project.id)}
                  onFocus={() => void prefetchClientProjectOverview(queryClient, project.id)}
                  className="portal-btn-ghost mt-5 w-full text-sm"
                >
                  Open project
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                </button>
              </div>
            </article>
          ))}
          {projects.length === 0 ? (
            <div className="portal-glass-card col-span-full space-y-2 p-8 text-center">
              <p className={`text-chambray ${bricolage_grot600.className}`}>
                {canCreateProject
                  ? 'No projects yet'
                  : isContributor || isViewer
                    ? 'Welcome — you’re not on a project yet'
                    : 'No projects yet'}
              </p>
              <p className="text-sm text-app-muted">
                {canCreateProject
                  ? 'Create one to get started with your CoCreate team.'
                  : isContributor || isViewer
                    ? 'An Admin will assign you to a project. Until then you can update your theme in Settings.'
                    : 'Check back soon.'}
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
