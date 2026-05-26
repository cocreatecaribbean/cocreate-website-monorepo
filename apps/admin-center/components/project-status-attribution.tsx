import type { ClientProjectSummary } from '@/lib/projects/types'
import {
  formatAttributionLine,
  formatTimelineActor,
  getProjectStatusLabel,
  getProjectStatusTone,
} from '@/lib/projects/project-display'
import { bricolage_grot600 } from '@/styles/fonts'

type ProjectStatusAttributionProps = {
  project: Pick<
    ClientProjectSummary,
    | 'status'
    | 'statusLabel'
    | 'phase'
    | 'approvedAt'
    | 'approvedByName'
    | 'approvedByJobTitle'
    | 'approvedByEmail'
    | 'completedAt'
    | 'completedByName'
    | 'completedByJobTitle'
    | 'completedByEmail'
  >
  showPhase?: boolean
  badgeClassName?: string
}

export function ProjectStatusBadge({
  project,
  badgeClassName,
}: {
  project: Pick<ClientProjectSummary, 'status' | 'statusLabel'>
  badgeClassName?: string
}) {
  return (
    <span
      className={
        badgeClassName ??
        `rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getProjectStatusTone(project.status)}`
      }
    >
      {getProjectStatusLabel(project.status, project.statusLabel)}
    </span>
  )
}

export default function ProjectStatusAttribution({
  project,
  showPhase = true,
}: ProjectStatusAttributionProps) {
  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        <ProjectStatusBadge project={project} />
        {showPhase ? (
          <span className="text-sm text-app-muted">{project.phase.replace(/_/g, ' ')}</span>
        ) : null}
      </div>
      {project.status === 'ACTIVE' && project.approvedAt ? (
        <p className="admin-info-text text-xs">
          {formatAttributionLine({
            verb: 'Onboarded',
            name: project.approvedByName,
            jobTitle: project.approvedByJobTitle,
            email: project.approvedByEmail,
            at: project.approvedAt,
          })}
        </p>
      ) : project.status === 'SUBMITTED' ? (
        <p className="text-xs text-app-muted">Waiting for agency to onboard this project</p>
      ) : null}
      {project.status === 'COMPLETED' && project.completedAt ? (
        <p className="text-xs text-sanmarino">
          {formatAttributionLine({
            verb: 'Completed',
            name: project.completedByName,
            jobTitle: project.completedByJobTitle,
            email: project.completedByEmail,
            at: project.completedAt,
          })}
        </p>
      ) : null}
    </div>
  )
}

export function ProjectTimeline({
  activities,
  title = 'Project timeline',
}: {
  activities: Array<{
    id: string
    summary?: string
    action: string
    actorName?: string | null
    actorJobTitle?: string | null
    actorEmail: string
    createdAt: string
  }>
  title?: string
}) {
  if (!activities.length) return null
  return (
    <section className="admin-thread-panel max-h-none p-4">
      <p className={`text-sm text-chambray ${bricolage_grot600.className}`}>{title}</p>
      <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto">
        {activities.map((item) => (
          <li key={item.id} className="border-b border-chambray/6 pb-2 last:border-0 last:pb-0">
            <p className="text-sm text-app-primary">{item.summary ?? item.action}</p>
            <p className="text-xs text-app-muted">
              {formatTimelineActor(
                item.actorName,
                item.actorJobTitle,
                item.actorEmail,
              )}{' '}
              · {new Date(item.createdAt).toLocaleString()}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}
