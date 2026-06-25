import { nestApiUrl } from '@cocreate/api-client'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { adminApiHeaders } from '@/lib/admin-api-headers'
import { proxyAdminApi } from '@/lib/admin-api-proxy'
import { bricolage_grot600, bricolage_grot700 } from '@/styles/fonts'
import { FolderKanban } from 'lucide-react'

type CollaboratorMe = {
  ok: true
  collaborator: { id: string; email: string }
  projects: Array<{ id: string; title: string; organizationName: string }>
}

export default async function CollaborateHomePage() {
  const headers = await adminApiHeaders()
  if (!headers) {
    redirect('/collaborate/login')
  }

  const response = await fetch(nestApiUrl('/auth/collaborator/me'), {
    headers,
    cache: 'no-store',
  })
  const data = (await response.json()) as CollaboratorMe | { ok: false }

  if (!response.ok || !data || !('collaborator' in data)) {
    redirect('/collaborate/login?error=collaborator_required')
  }

  const { projects } = data

  return (
    <div className="mt-6">
      <h1 className={`text-xl text-chambray sm:text-2xl ${bricolage_grot700.className}`}>
        Your projects
      </h1>
      <p className="mt-1 text-sm text-app-muted">
        Open a project to view team review and client progress context.
      </p>
      {projects.length === 0 ? (
        <p className="mt-6 text-sm text-app-muted">
          No project access assigned yet. Ask a CoCreate team member to invite you.
        </p>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <li key={project.id}>
              <Link
                href={`/collaborate/projects/${project.id}`}
                className="admin-glass-card flex h-full flex-col gap-3 px-5 py-5 transition hover:ring-2 hover:ring-sanmarino/30"
              >
                <div className="rounded-xl bg-linear-to-br from-sanmarino/15 to-chambray/5 p-2.5 text-sanmarino ring-1 ring-sanmarino/10 w-fit">
                  <FolderKanban className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                </div>
                <div>
                  <span className={`font-medium text-chambray ${bricolage_grot600.className}`}>
                    {project.title}
                  </span>
                  <span className="mt-1 block text-sm text-app-muted">
                    {project.organizationName}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
