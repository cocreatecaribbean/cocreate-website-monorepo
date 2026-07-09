'use client'

import { useDeferredValue, useState } from 'react'
import PortalProjectFilesPanel from '@/components/control-center/portal-project-files-panel'
import { useFilesLibraryQuery } from '@/lib/api/queries/files'
import { usePortalProfileQuery } from '@/lib/api/queries/team'
import { Loader2, Search } from 'lucide-react'

export default function ControlCenterFilesSection() {
  const { data: profile } = usePortalProfileQuery()
  const currentUserId = profile?.user.id ?? null
  const [query, setQuery] = useState('')
  const deferredSearch = useDeferredValue(query.trim())
  const [projectId, setProjectId] = useState('')
  const search = deferredSearch

  const {
    data: library = { projects: [], files: [], nextCursor: null },
    isLoading: loading,
    isError,
    refetch,
  } = useFilesLibraryQuery({
    projectId: projectId || undefined,
    q: search || undefined,
  })

  if (loading) {
    return (
      <div className="portal-glass-card flex items-center justify-center gap-2 p-12 text-sm text-app-muted">
        <Loader2 className="h-5 w-5 animate-spin text-sanmarino" aria-hidden />
        Loading files…
      </div>
    )
  }

  if (isError) {
    return (
      <p className="portal-glass-card portal-alert-error p-5 sm:p-6">Could not load files</p>
    )
  }

  return (
    <div className="space-y-6">
      <section className="portal-glass-card portal-animate-in p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <label className="flex-1">
            <span className="text-xs font-medium text-app-muted">Search files</span>
            <div className="relative mt-1">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-app-muted"
                aria-hidden
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by filename"
                className="portal-input w-full pl-9"
              />
            </div>
          </label>
          <label className="sm:w-56">
            <span className="text-xs font-medium text-app-muted">Project</span>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="portal-input mt-1 w-full"
            >
              <option value="">All projects</option>
              {library.projects.map((group) => (
                <option key={group.projectId} value={group.projectId}>
                  {group.projectTitle}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {library.projects.length === 0 ? (
        <p className="portal-glass-card p-8 text-center text-sm text-app-muted">
          No files found.
        </p>
      ) : (
        library.projects.map((group) => (
          <PortalProjectFilesPanel
            key={group.projectId}
            projectId={group.projectId}
            projectTitle={group.projectTitle}
            currentUserId={currentUserId}
            group={group}
            onRefresh={() => void refetch()}
          />
        ))
      )}
    </div>
  )
}
