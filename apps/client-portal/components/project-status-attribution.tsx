import type { ClientProjectSummary } from '@/lib/projects/api-types'
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
  variant?: 'inline' | 'detail' | 'linesOnly'
}

export function ProjectStatusBadge({
  project,
}: {
  project: Pick<ClientProjectSummary, 'status' | 'statusLabel'>
}) {
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${getProjectStatusTone(project.status)}`}
    >
      {getProjectStatusLabel(project.status, project.statusLabel)}
    </span>
  )
}

export default function ProjectStatusAttribution({
  project,
  showPhase = false,
  variant = 'inline',
}: ProjectStatusAttributionProps) {
  if (variant === 'linesOnly') {
    return (
      <div className="space-y-1">
        {project.status === 'ACTIVE' && project.approvedAt ? (
          <p className="portal-info-text text-xs">
            {formatAttributionLine({
              verb: 'Onboarded',
              name: project.approvedByName ?? null,
              jobTitle: project.approvedByJobTitle ?? null,
              email: project.approvedByEmail ?? null,
              at: project.approvedAt,
            })}
          </p>
        ) : project.status === 'SUBMITTED' ? (
          <p className="text-xs text-slate-500">Awaiting agency review</p>
        ) : null}
        {project.status === 'COMPLETED' && project.completedAt ? (
          <p className="text-xs text-sanmarino">
            {formatAttributionLine({
              verb: 'Completed',
              name: project.completedByName ?? null,
              jobTitle: project.completedByJobTitle ?? null,
              email: project.completedByEmail ?? null,
              at: project.completedAt,
            })}
          </p>
        ) : null}
      </div>
    )
  }

  if (variant === 'detail') {
    return (
      <div className="space-y-3">
        <ProjectStatusBadge project={project} />
        <p className="text-sm text-sanmarino">Phase: {project.phase.replace(/_/g, ' ')}</p>
        {project.status === 'ACTIVE' && project.approvedAt ? (
          <p className="portal-info-callout text-sm">
            Project onboarded —{' '}
            {formatAttributionLine({
              verb: 'Accepted',
              name: project.approvedByName ?? null,
              jobTitle: project.approvedByJobTitle ?? null,
              email: project.approvedByEmail ?? null,
              at: project.approvedAt,
            })}
          </p>
        ) : null}
        {project.status === 'COMPLETED' && project.completedAt ? (
          <p className="rounded-xl border border-sanmarino/20 bg-sanmarino/10 px-3 py-2 text-sm text-chambray">
            {formatAttributionLine({
              verb: 'Marked complete',
              name: project.completedByName ?? null,
              jobTitle: project.completedByJobTitle ?? null,
              email: project.completedByEmail ?? null,
              at: project.completedAt,
            })}
          </p>
        ) : null}
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        <ProjectStatusBadge project={project} />
        {showPhase ? (
          <span className="text-xs text-slate-500">{project.phase.replace(/_/g, ' ')}</span>
        ) : null}
      </div>
      {project.status === 'ACTIVE' && project.approvedAt ? (
        <p className="portal-info-text text-xs">
          {formatAttributionLine({
            verb: 'Onboarded',
            name: project.approvedByName ?? null,
            jobTitle: project.approvedByJobTitle ?? null,
            email: project.approvedByEmail ?? null,
            at: project.approvedAt,
          })}
        </p>
      ) : project.status === 'SUBMITTED' ? (
        <p className="text-xs text-slate-500">Awaiting agency review</p>
      ) : null}
      {project.status === 'COMPLETED' && project.completedAt ? (
        <p className="text-xs text-sanmarino">
          {formatAttributionLine({
            verb: 'Completed',
            name: project.completedByName ?? null,
            jobTitle: project.completedByJobTitle ?? null,
            email: project.completedByEmail ?? null,
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
    actorEmail: string | null
    createdAt: string
  }>
  title?: string
}) {
  if (!activities.length) return null
  return (
    <section className="portal-glass-card p-6">
      <p className={`text-sm text-chambray ${bricolage_grot600.className}`}>{title}</p>
      <ul className="mt-4 max-h-64 space-y-3 overflow-y-auto">
        {activities.map((item) => (
          <li key={item.id} className="border-b border-chambray/6 pb-3 last:border-0 last:pb-0">
            <p className="text-sm text-slate-800">{item.summary ?? item.action}</p>
            <p className="mt-0.5 text-xs text-slate-500">
              {formatTimelineActor(
                item.actorName,
                item.actorJobTitle,
                item.actorEmail,
              )}{' '}
              ·{' '}
              {new Date(item.createdAt).toLocaleString()}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}
