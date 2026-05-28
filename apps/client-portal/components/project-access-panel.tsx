'use client'

import ProjectTeamAside from '@/components/project-team-aside'

/** @deprecated Prefer ProjectTeamAside; kept for imports that expect the panel name. */
export default function ProjectAccessPanel({ projectId }: { projectId: string }) {
  return <ProjectTeamAside projectId={projectId} className="mt-6" />
}
