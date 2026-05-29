'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  adminFetchErrorHint,
  AdminApiFetchError,
  fetchAdminBff,
} from '@/lib/admin-api-fetch'
import ProjectStatusAttribution from '@/components/project-status-attribution'
import type { ClientProjectSummary } from '@/lib/projects/types'
import { bricolage_grot600 } from '@/styles/fonts'
import { ChevronDown, FolderKanban } from 'lucide-react'

type ProjectGroup = {
  organizationId: string | null
  organizationName: string
  projects: ClientProjectSummary[]
}

type ProjectCenterListProps = {
  refreshToken?: number
}

export default function ProjectCenterList({ refreshToken = 0 }: ProjectCenterListProps) {
  const [projects, setProjects] = useState<ClientProjectSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const groupedProjects = useMemo<ProjectGroup[]>(() => {
    const groups = new Map<string, ProjectGroup>()

    for (const project of projects) {
      const groupKey = project.organizationId ?? '__unassigned__'
      const organizationName = project.organizationName?.trim() || 'Unassigned client'
      const existing = groups.get(groupKey)
      if (existing) {
        existing.projects.push(project)
        continue
      }
      groups.set(groupKey, {
        organizationId: project.organizationId,
        organizationName,
        projects: [project],
      })
    }

    return [...groups.values()].sort((a, b) =>
      a.organizationName.localeCompare(b.organizationName, undefined, { sensitivity: 'base' }),
    )
  }, [projects])

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(groupKey)) {
        next.delete(groupKey)
      } else {
        next.add(groupKey)
      }
      return next
    })
  }

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
  }, [refreshToken])

  return (
    <section className="admin-glass-card admin-animate-in overflow-hidden">
      <div className="border-b border-white/50 bg-linear-to-r from-sanmarino/10 via-transparent to-casablanca/10 px-5 py-4 sm:px-6">
        <h2 className={`text-chambray ${bricolage_grot600.className}`}>All client projects</h2>
      </div>
      {error ? (
        <p className="px-6 py-4 text-sm text-red-700">{error}</p>
      ) : loading ? (
        <p className="px-6 py-8 text-sm text-app-muted">Loading…</p>
      ) : (
        <ul className="divide-y divide-chambray/6">
          {projects.length === 0 ? (
            <li className="px-6 py-8 text-sm text-app-muted">No projects yet.</li>
          ) : (
            groupedProjects.map((group) => (
              (() => {
                const groupKey = group.organizationId ?? 'unassigned'
                const sectionId = `project-group-${groupKey}`
                const isExpanded = expandedGroups.has(groupKey)
                return (
                  <li key={groupKey} className="px-5 py-4 sm:px-6 sm:py-5">
                    <button
                      type="button"
                      className="mb-3 flex w-full items-center justify-between gap-3 rounded-lg px-1 py-1 text-left"
                      aria-expanded={isExpanded}
                      aria-controls={sectionId}
                      onClick={() => toggleGroup(groupKey)}
                    >
                      <div className="min-w-0">
                        <h3 className={`text-sm text-chambray ${bricolage_grot600.className}`}>
                          {group.organizationName}
                        </h3>
                        <p className="text-xs text-app-muted">
                          {group.projects.length} {group.projects.length === 1 ? 'project' : 'projects'}
                        </p>
                      </div>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-chambray/80 transition-transform ${isExpanded ? 'rotate-180' : 'rotate-0'}`}
                        aria-hidden="true"
                      />
                    </button>
                    <div
                      id={sectionId}
                      className={`grid transition-[grid-template-rows,opacity,margin] duration-300 ease-out ${isExpanded ? 'mt-1 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                    >
                      <div className="min-h-0 overflow-hidden">
                        <ul className="overflow-hidden rounded-2xl border border-chambray/10 bg-white/50 divide-y divide-chambray/6">
                          {group.projects.map((project) => (
                            <li
                              key={project.id}
                              className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                            >
                              <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                                <div className="shrink-0 rounded-xl bg-linear-to-br from-sanmarino/15 to-chambray/5 p-2.5 text-sanmarino ring-1 ring-sanmarino/10 sm:p-3">
                                  <FolderKanban className="h-5 w-5" strokeWidth={1.75} />
                                </div>
                                <div className="min-w-0">
                                  <p className={`wrap-break-word text-app-primary ${bricolage_grot600.className}`}>
                                    {project.title}
                                  </p>
                                  <p className="mt-1 text-sm text-app-muted">{group.organizationName}</p>
                                </div>
                              </div>
                              <div className="flex min-w-0 flex-col items-start gap-2 pl-11 sm:items-end sm:pl-0">
                                <ProjectStatusAttribution project={project} />
                                {project.organizationId ? (
                                  <Link
                                    href={`/clients/${project.organizationId}/projects/${project.id}`}
                                    className="admin-btn-ghost text-sm"
                                  >
                                    Open project
                                  </Link>
                                ) : null}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </li>
                )
              })()
            ))
          )}
        </ul>
      )}
    </section>
  )
}
