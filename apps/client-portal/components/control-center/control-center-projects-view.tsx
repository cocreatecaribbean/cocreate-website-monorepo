'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
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
  navigateToApprovals,
  sendRequestMessage,
  uploadProjectFiles,
} from '@/lib/projects/fetch-projects-client'
import { bricolage_grot600, bricolage_grot700 } from '@/styles/fonts'
import { Bell, Calendar, ExternalLink, FolderKanban, Plus } from 'lucide-react'

export default function ControlCenterProjectsView() {
  const [projects, setProjects] = useState<ClientProjectSummary[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
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

  useEffect(() => {
    if (!selectedId) {
      setDetail(null)
      return
    }
    void fetchProject(selectedId).then(setDetail)
  }, [selectedId])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const projectId = params.get('projectId')
    if (projectId) setSelectedId(projectId)
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
    setSelectedId(result.project.id)
  }

  if (selectedId && detail) {
    return (
      <ProjectDetailView
        project={detail}
        onBack={() => setSelectedId(null)}
        onRefresh={async () => {
          const next = await fetchProject(selectedId)
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
                onClick={() => setSelectedId(project.id)}
                className="portal-btn-ghost mt-5 w-full text-sm"
              >
                Open project
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </button>
              {project.hasOpenAdminReview ? (
                <button
                  type="button"
                  onClick={() => navigateToApprovals()}
                  className="portal-btn-primary mt-2 w-full gap-2 text-sm"
                >
                  <Bell className="h-4 w-4" aria-hidden />
                  CoCreate request — respond
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

function ProjectDetailView({
  project,
  onBack,
  onRefresh,
}: {
  project: ClientProjectDetail
  onBack: () => void
  onRefresh: () => Promise<void>
}) {
  const [changeTitle, setChangeTitle] = useState('')
  const [changeDesc, setChangeDesc] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  const canRequestChanges = project.status === 'ACTIVE'

  const submitChange = async (e: FormEvent) => {
    e.preventDefault()
    const { createChangeRequest } = await import('@/lib/projects/fetch-projects-client')
    const result = await createChangeRequest(project.id, {
      title: changeTitle.trim(),
      description: changeDesc.trim(),
    })
    if (!result.ok) {
      setMessage(result.message)
      return
    }
    setChangeTitle('')
    setChangeDesc('')
    setMessage('Change request submitted.')
    await onRefresh()
  }

  const requestPhase = async (phase: string) => {
    const { createPhaseApproval } = await import('@/lib/projects/fetch-projects-client')
    const result = await createPhaseApproval(project.id, {
      targetPhase: phase,
      description: `Ready to move to ${phase}`,
    })
    setMessage(result.ok ? 'Phase approval submitted.' : result.message)
    await onRefresh()
  }

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

      {canRequestChanges ? (
        <>
          <section className="portal-glass-card p-6">
            <p className={`text-chambray ${bricolage_grot600.className}`}>Request changes</p>
            <form className="mt-4 space-y-3" onSubmit={(e) => void submitChange(e)}>
              <input
                type="text"
                required
                value={changeTitle}
                onChange={(e) => setChangeTitle(e.target.value)}
                placeholder="Summary"
                className="portal-input w-full"
              />
              <textarea
                required
                value={changeDesc}
                onChange={(e) => setChangeDesc(e.target.value)}
                placeholder="Describe the change you need"
                rows={3}
                className="portal-input w-full resize-y"
              />
              <button type="submit" className="portal-btn-primary text-sm">
                Submit change request
              </button>
            </form>
          </section>
          <section className="portal-glass-card p-6">
            <p className={`text-chambray ${bricolage_grot600.className}`}>Phase approval</p>
            <p className="mt-1 text-sm text-slate-500">
              Tell us when this project is ready for the next phase or delivery.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {(['CLIENT_REVIEW', 'READY_FOR_DELIVERY', 'DELIVERED'] as const).map((phase) => (
                <button
                  key={phase}
                  type="button"
                  onClick={() => void requestPhase(phase)}
                  className="portal-btn-ghost text-sm"
                >
                  Ready for {phase.replace(/_/g, ' ').toLowerCase()}
                </button>
              ))}
            </div>
          </section>
        </>
      ) : null}

      {project.requests && project.requests.length > 0 ? (
        <section className="space-y-4">
          <p className={`text-sm text-chambray ${bricolage_grot600.className}`}>
            Conversation history with CoCreate
          </p>
          {project.requests
            .filter((req) => req.type === 'ADMIN_REVIEW')
            .map((req) => (
              <div key={req.id} className="portal-glass-card p-5">
                <p className={`text-chambray ${bricolage_grot600.className}`}>{req.title}</p>
                <p className="mt-1 text-xs text-slate-500">{req.status}</p>
                <div className="mt-4">
                  <RequestMessageThread
                    request={req}
                    viewerRole="CLIENT"
                    onSendMessage={async (body) => {
                      const result = await sendRequestMessage(req.id, body)
                      if (result.ok) await onRefresh()
                      return { ok: result.ok, message: result.ok ? undefined : result.message }
                    }}
                  />
                </div>
              </div>
            ))}
        </section>
      ) : null}
    </div>
  )
}
