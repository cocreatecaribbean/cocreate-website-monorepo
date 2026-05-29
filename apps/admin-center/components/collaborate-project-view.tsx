'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, FolderOpen, MessageSquare, Shield } from 'lucide-react'
import CollaborateProjectFiles from '@/components/collaborate-project-files'
import { useAdminSession } from '@/components/admin-session-provider'
import RequestMessageThread from '@/components/request-message-thread'
import TeamReviewPanel from '@/components/team-review-panel'
import { fetchAdminBff } from '@/lib/admin-api-fetch'
import type { ClientProjectSummary, ProjectRequestItem } from '@/lib/projects/types'
import { bricolage_grot600, bricolage_grot700 } from '@/styles/fonts'

function findThread(project: ClientProjectSummary, type: ProjectRequestItem['type']) {
  return project.requests?.find((r) => r.type === type) ?? null
}

type ThreadTab = 'team-review' | 'client-progress' | 'files'

type CollaborateProjectViewProps = {
  projectId: string
}

export default function CollaborateProjectView({ projectId }: CollaborateProjectViewProps) {
  const { session } = useAdminSession()
  const currentUserId = session?.mode === 'user' ? session.userId : null
  const [project, setProject] = useState<ClientProjectSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeThread, setActiveThread] = useState<ThreadTab>('team-review')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchAdminBff<ClientProjectSummary>(`/api/projects/${projectId}`)
      setProject(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load project')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    void load()
  }, [load])

  const refreshThread = useCallback(async (requestId: string) => {
    const updated = await fetchAdminBff<ProjectRequestItem>(
      `/api/project-requests/${requestId}`,
    )
    setProject((current) => {
      if (!current?.requests) return current
      return {
        ...current,
        requests: current.requests.map((r) => (r.id === requestId ? updated : r)),
      }
    })
  }, [])

  const internal = project ? findThread(project, 'INTERNAL') : null
  const progress = project ? findThread(project, 'PROGRESS') : null

  const threadTabs = useMemo(() => {
    const tabs: Array<{ id: ThreadTab; label: string; icon: typeof Shield }> = [
      { id: 'files', label: 'Files', icon: FolderOpen },
    ]
    if (internal) {
      tabs.push({ id: 'team-review', label: 'Team review', icon: Shield })
    }
    if (progress) {
      tabs.push({ id: 'client-progress', label: 'Client progress', icon: MessageSquare })
    }
    return tabs
  }, [internal, progress])

  useEffect(() => {
    if (threadTabs.length === 0) return
    if (!threadTabs.some((t) => t.id === activeThread)) {
      setActiveThread(threadTabs[0].id)
    }
  }, [threadTabs, activeThread])

  if (loading) {
    return <p className="mt-6 text-app-muted">Loading project…</p>
  }

  if (error || !project) {
    return <p className="mt-6 text-red-600">{error ?? 'Project not found'}</p>
  }

  return (
    <div className="mt-4 space-y-6">
      <div>
        <Link
          href="/collaborate"
          className={`inline-flex items-center gap-2 text-sm text-sanmarino hover:text-chambray ${bricolage_grot600.className}`}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to projects
        </Link>
        <h1 className={`mt-3 text-2xl text-chambray ${bricolage_grot700.className}`}>
          {project.title}
        </h1>
        {project.organizationName ? (
          <p className="mt-1 text-sm text-app-muted">{project.organizationName}</p>
        ) : null}
      </div>

      {threadTabs.length > 0 ? (
        <>
          <nav className="flex flex-wrap gap-2" aria-label="Project threads">
            {threadTabs.map((item) => {
              const Icon = item.icon
              const active = activeThread === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveThread(item.id)}
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition ${bricolage_grot600.className} ${
                    active
                      ? 'bg-chambray text-white'
                      : 'bg-chambray/8 text-chambray hover:bg-chambray/12'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                  {item.label}
                  {item.id === 'client-progress' ? (
                    <span className="text-[0.65rem] font-normal opacity-80">(read-only)</span>
                  ) : null}
                </button>
              )
            })}
          </nav>

          {activeThread === 'files' ? (
            <CollaborateProjectFiles projectId={project.id} projectTitle={project.title} />
          ) : null}

          {activeThread === 'team-review' && internal ? (
            <TeamReviewPanel
              projectId={project.id}
              internalRequest={internal}
              onThreadUpdate={() => void refreshThread(internal.id)}
            />
          ) : null}

          {activeThread === 'client-progress' && progress ? (
            <section className="admin-glass-card p-5 sm:p-6">
              <h2 className={`text-lg text-chambray ${bricolage_grot700.className}`}>
                Client progress
              </h2>
              <p className="mt-1 text-sm text-app-muted">
                For context only — reply in team review.
              </p>
              <div className="mt-4">
                <RequestMessageThread
                  request={progress}
                  viewerRole="ADMIN"
                  currentUserId={currentUserId}
                  readOnly
                  onSendMessage={async () => ({ ok: false, message: 'Read-only' })}
                  onThreadUpdate={() => void refreshThread(progress.id)}
                />
              </div>
            </section>
          ) : null}
        </>
      ) : (
        <p className="text-sm text-app-muted">
          No threads are available for this project yet.
        </p>
      )}
    </div>
  )
}
