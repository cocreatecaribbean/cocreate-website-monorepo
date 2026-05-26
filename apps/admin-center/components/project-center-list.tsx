'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  adminFetchErrorHint,
  AdminApiFetchError,
  fetchAdminBff,
} from '@/lib/admin-api-fetch'
import ProjectStatusAttribution from '@/components/project-status-attribution'
import type { ClientProjectSummary } from '@/lib/projects/types'
import { bricolage_grot600 } from '@/styles/fonts'
import { FolderKanban } from 'lucide-react'

export default function ProjectCenterList() {
  const [projects, setProjects] = useState<ClientProjectSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const data = await fetchAdminBff<ClientProjectSummary[]>('/api/projects')
        setProjects(data)
      } catch (err) {
        const message =
          err instanceof AdminApiFetchError
            ? `${err.message} — ${adminFetchErrorHint(err.code)}`
            : err instanceof Error
              ? err.message
              : 'Could not load projects.'
        setError(message)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return (
    <section className="admin-glass-card admin-animate-in overflow-hidden">
      <div className="border-b border-white/50 bg-linear-to-r from-sanmarino/10 via-transparent to-casablanca/10 px-5 py-4 sm:px-6">
        <h2 className={`text-chambray ${bricolage_grot600.className}`}>All client projects</h2>
      </div>
      {error ? (
        <p className="px-6 py-4 text-sm text-red-700">{error}</p>
      ) : loading ? (
        <p className="px-6 py-8 text-sm text-slate-500">Loading…</p>
      ) : (
        <ul className="divide-y divide-chambray/6">
          {projects.length === 0 ? (
            <li className="px-6 py-8 text-sm text-slate-500">No projects yet.</li>
          ) : (
            projects.map((project) => (
              <li
                key={project.id}
                className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5"
              >
                <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                  <div className="shrink-0 rounded-xl bg-linear-to-br from-sanmarino/15 to-chambray/5 p-2.5 text-sanmarino ring-1 ring-sanmarino/10 sm:p-3">
                    <FolderKanban className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0">
                    <p className={`wrap-break-word text-slate-900 ${bricolage_grot600.className}`}>
                      {project.title}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {project.organizationName ?? 'Client'}
                    </p>
                  </div>
                </div>
                <div className="flex min-w-0 flex-col items-start gap-2 pl-11 sm:items-end sm:pl-0">
                  <ProjectStatusAttribution project={project} />
                  {project.organizationId ? (
                    <Link
                      href={`/clients/${project.organizationId}`}
                      className="admin-btn-ghost text-sm"
                    >
                      Open workspace
                    </Link>
                  ) : null}
                </div>
              </li>
            ))
          )}
        </ul>
      )}
    </section>
  )
}
