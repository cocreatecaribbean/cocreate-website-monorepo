import { formatActorEmail } from '../projects/project-labels'

export type UserProfilePick = {
  displayName: string | null
  jobTitle: string | null
  department?: string | null
  avatarStoragePath?: string | null
}

export type UserActorPick = {
  email: string
  profile?: UserProfilePick | null
}

export const userActorSelect = {
  id: true,
  email: true,
  profile: {
    select: {
      displayName: true,
      jobTitle: true,
      department: true,
      avatarStoragePath: true,
    },
  },
} as const

/** Canonical display name for an actor (profile → email guess → email → fallback). */
export function resolveActorDisplayName(
  user: UserActorPick | null | undefined,
  fallback = 'CoCreate team',
): string {
  if (!user) return fallback
  const trimmed = user.profile?.displayName?.trim()
  if (trimmed) return trimmed
  return formatActorEmail(user.email) ?? user.email ?? fallback
}

/** Name plus optional job title for client-facing copy. */
export function resolveActorLabel(
  user: UserActorPick | null | undefined,
  opts?: { includeTitle?: boolean; fallback?: string },
): string {
  const name = resolveActorDisplayName(user, opts?.fallback ?? 'CoCreate team')
  if (!opts?.includeTitle) return name
  const title = user?.profile?.jobTitle?.trim()
  if (!title) return name
  return `${name} · ${title}`
}

export function resolveActorJobTitle(user: UserActorPick | null | undefined): string | null {
  const title = user?.profile?.jobTitle?.trim()
  return title || null
}

export function resolveActorDepartment(user: UserActorPick | null | undefined): string | null {
  const dept = user?.profile?.department?.trim()
  return dept || null
}
