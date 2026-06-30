'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import AdminToast from '@/components/admin-toast'
import DevSignInLink from '@/components/dev-sign-in-link'
import {
  useAssignCollaboratorToProjectMutation,
  useInviteCollaboratorMutation,
  useRemoveCollaboratorMutation,
  useResendCollaboratorInviteMutation,
} from '@/lib/api/mutations/collaborators'
import { useCollaboratorsRosterQuery } from '@/lib/api/queries/collaborators'
import { useAdminProjectsQuery } from '@/lib/api/queries/projects'
import {
  adminFetchErrorHint,
  AdminApiFetchError,
} from '@/lib/admin-api-fetch'
import { bricolage_grot600 } from '@/styles/fonts'

const statusLabel: Record<string, string> = {
  INVITED: 'Invited',
  ACTIVE: 'Active',
  SUSPENDED: 'Suspended',
}

function collaboratorSignInUrl() {
  if (typeof window === 'undefined') return '/collaborate/login'
  return `${window.location.origin}/collaborate/login`
}

export default function AgencyCollaboratorsManager() {
  const collaboratorsQuery = useCollaboratorsRosterQuery()
  const projectsQuery = useAdminProjectsQuery()
  const inviteMutation = useInviteCollaboratorMutation()
  const resendMutation = useResendCollaboratorInviteMutation()
  const removeMutation = useRemoveCollaboratorMutation()
  const assignMutation = useAssignCollaboratorToProjectMutation()

  const collaborators = collaboratorsQuery.data ?? []
  const projects = projectsQuery.data ?? []
  const loading = collaboratorsQuery.isLoading || projectsQuery.isLoading
  const loadError =
    collaboratorsQuery.isError || projectsQuery.isError
      ? collaboratorsQuery.error instanceof AdminApiFetchError
        ? `${collaboratorsQuery.error.message} — ${adminFetchErrorHint(collaboratorsQuery.error.code)}`
        : projectsQuery.error instanceof AdminApiFetchError
          ? `${projectsQuery.error.message} — ${adminFetchErrorHint(projectsQuery.error.code)}`
          : (collaboratorsQuery.error ?? projectsQuery.error) instanceof Error
            ? (collaboratorsQuery.error ?? projectsQuery.error)?.message
            : 'Could not load collaborators.'
      : null

  const [email, setEmail] = useState('')
  const [inviteProjectIds, setInviteProjectIds] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [devSignInUrl, setDevSignInUrl] = useState<string | null>(null)
  const [assignUserId, setAssignUserId] = useState<string | null>(null)
  const [assignProjectId, setAssignProjectId] = useState('')
  const [signInUrlCopied, setSignInUrlCopied] = useState(false)
  const [signInPageUrl, setSignInPageUrl] = useState('/collaborate/login')

  useEffect(() => {
    setSignInPageUrl(collaboratorSignInUrl())
  }, [])

  useEffect(() => {
    if (!assignUserId) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [assignUserId])

  const assignTarget = useMemo(
    () => collaborators.find((c) => c.id === assignUserId) ?? null,
    [assignUserId, collaborators],
  )

  const assignableProjects = useMemo(() => {
    if (!assignTarget) return projects
    const assigned = new Set(assignTarget.projects.map((p) => p.id))
    return projects.filter((p) => !assigned.has(p.id))
  }, [assignTarget, projects])

  const onInvite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    setSuccess(null)
    setDevSignInUrl(null)
    try {
      const result = await inviteMutation.mutateAsync({
        email: email.trim(),
        projectIds: inviteProjectIds.length ? inviteProjectIds : undefined,
      })
      setEmail('')
      setInviteProjectIds([])
      const signInUrl = collaboratorSignInUrl()
      setSuccess(
        `${result.message} Share the sign-in page: ${signInUrl}`,
      )
      if (result.devSignInUrl) setDevSignInUrl(result.devSignInUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invite failed')
    } finally {
      setSubmitting(false)
    }
  }

  const copySignInUrl = async () => {
    const url = collaboratorSignInUrl()
    try {
      await navigator.clipboard.writeText(url)
      setSignInUrlCopied(true)
      window.setTimeout(() => setSignInUrlCopied(false), 2000)
    } catch {
      setError('Could not copy link. Share this URL manually: ' + url)
    }
  }

  const sendSignInLink = async (userId: string) => {
    setError(null)
    setSuccess(null)
    setDevSignInUrl(null)
    try {
      const result = await resendMutation.mutateAsync(userId)
      setSuccess(result.message)
      if (result.devSignInUrl) setDevSignInUrl(result.devSignInUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send sign-in link')
    }
  }

  const assignToProject = async () => {
    if (!assignUserId || !assignProjectId) return
    setError(null)
    setSuccess(null)
    try {
      const result = await assignMutation.mutateAsync({
        userId: assignUserId,
        projectId: assignProjectId,
      })
      const signInUrl = collaboratorSignInUrl()
      setSuccess(`${result.message} Sign-in page: ${signInUrl}`)
      if (result.devSignInUrl) setDevSignInUrl(result.devSignInUrl)
      setAssignUserId(null)
      setAssignProjectId('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not assign project')
    }
  }

  const removeFromAgency = async (userId: string) => {
    if (!window.confirm('Remove this collaborator from all projects and suspend their access?')) {
      return
    }
    setError(null)
    setSuccess(null)
    try {
      await removeMutation.mutateAsync(userId)
      setSuccess('Collaborator removed from agency.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove collaborator')
    }
  }

  const toggleInviteProject = (projectId: string) => {
    setInviteProjectIds((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId],
    )
  }

  return (
    <div className="space-y-5 sm:space-y-8">
      {success ? (
        <AdminToast message={success} variant="success" onDismiss={() => setSuccess(null)} />
      ) : null}
      {error ?? loadError ? (
        <AdminToast message={error ?? loadError ?? ''} variant="error" onDismiss={() => setError(null)} />
      ) : null}

      {devSignInUrl ? (
        <DevSignInLink url={devSignInUrl} label="Open collaborator sign-in link" />
      ) : null}

      <form
        onSubmit={(e) => void onInvite(e)}
        className="admin-glass-card flex flex-col gap-4 p-5 sm:p-6"
      >
        <div>
          <p className="admin-eyebrow">Freelancers</p>
          <h2 className={`mt-2 text-lg text-chambray ${bricolage_grot600.className}`}>
            Invite collaborator
          </h2>
          <p className="mt-1 text-sm text-app-muted">
            Collaborators sign in at the collaborate portal and only see projects they are
            assigned to. You can also add them from a project&apos;s Collaborators tab.
          </p>
        </div>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="freelancer@example.com"
          className="admin-input"
        />
        {projects.length > 0 ? (
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-chambray">
              Assign to projects (optional)
            </legend>
            <div className="max-h-40 space-y-2 overflow-y-auto rounded-xl border border-chambray/10 p-3">
              {projects.map((project) => (
                <label
                  key={project.id}
                  className="flex cursor-pointer items-start gap-2 text-sm text-chambray"
                >
                  <input
                    type="checkbox"
                    checked={inviteProjectIds.includes(project.id)}
                    onChange={() => toggleInviteProject(project.id)}
                    className="mt-1"
                  />
                  <span>
                    {project.title}
                    {project.organizationName ? (
                      <span className="block text-xs text-app-muted">
                        {project.organizationName}
                      </span>
                    ) : null}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        ) : null}
        <button type="submit" disabled={submitting} className="admin-btn-primary md:w-fit">
          {submitting ? 'Sending…' : 'Invite collaborator'}
        </button>
      </form>

      <section className="admin-glass-card p-5 sm:p-6">
        <p className="admin-eyebrow">Roster</p>
        <h2 className={`mt-2 text-lg text-chambray ${bricolage_grot600.className}`}>
          Collaborators
        </h2>
        <p className="mt-2 text-sm text-app-muted">
          Collaborators sign in with the same email they were invited with. Share the
          collaborate sign-in page so they can request a magic link anytime.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <code className="max-w-full truncate rounded-lg bg-chambray/5 px-2 py-1 text-xs text-chambray">
            {signInPageUrl}
          </code>
          <button
            type="button"
            onClick={() => void copySignInUrl()}
            className="admin-btn-ghost min-h-9 text-xs"
          >
            {signInUrlCopied ? 'Copied' : 'Copy sign-in link'}
          </button>
        </div>
        {loading ? (
          <p className="mt-4 text-sm text-app-muted">Loading…</p>
        ) : collaborators.length === 0 ? (
          <p className="mt-4 text-sm text-app-muted">
            No collaborators yet. Invite someone above or from a project workspace.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-chambray/6">
            {collaborators.map((row) => (
              <li
                key={row.id}
                className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0">
                  <p className={`text-chambray ${bricolage_grot600.className}`}>{row.email}</p>
                  <p className="mt-1 text-xs text-app-muted">
                    {statusLabel[row.status] ?? row.status} · {row.projects.length} project
                    {row.projects.length === 1 ? '' : 's'}
                  </p>
                  {row.projects.length > 0 ? (
                    <p className="mt-1 line-clamp-2 text-xs text-app-muted">
                      {row.projects
                        .map((p) => `${p.title} (${p.organizationName})`)
                        .join(' · ')}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-app-muted">No projects assigned</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {row.status !== 'SUSPENDED' && row.projects.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => void sendSignInLink(row.id)}
                      className="admin-btn-ghost min-h-10 text-xs"
                    >
                      Send sign-in link
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      setAssignUserId(row.id)
                      setAssignProjectId('')
                    }}
                    className="admin-btn-ghost min-h-10 text-xs"
                  >
                    Assign project
                  </button>
                  <button
                    type="button"
                    onClick={() => void removeFromAgency(row.id)}
                    className="admin-btn-ghost min-h-10 text-xs text-red-700"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {assignUserId && assignTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-chambray/40 p-4">
          <div className="admin-glass-card w-full max-w-md p-5 sm:p-6">
            <h3 className={`text-lg text-chambray ${bricolage_grot600.className}`}>
              Assign project
            </h3>
            <p className="mt-1 text-sm text-app-muted">{assignTarget.email}</p>
            <select
              value={assignProjectId}
              onChange={(e) => setAssignProjectId(e.target.value)}
              className="admin-input mt-4 w-full"
            >
              <option value="">Select a project…</option>
              {assignableProjects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title}
                  {project.organizationName ? ` — ${project.organizationName}` : ''}
                </option>
              ))}
            </select>
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setAssignUserId(null)
                  setAssignProjectId('')
                }}
                className="admin-btn-ghost text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!assignProjectId}
                onClick={() => void assignToProject()}
                className="admin-btn-primary text-sm"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
