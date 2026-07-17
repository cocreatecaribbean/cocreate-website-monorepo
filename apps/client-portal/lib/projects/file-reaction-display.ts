import type {
  ProjectAttachmentWithReactions,
  ProjectFileReactionKind,
  ProjectFileReactionTag,
} from '@/lib/projects/api-types'

export const REACTION_EMOJI: Record<ProjectFileReactionKind, string> = {
  LOVE_THIS: '❤️',
  SHIP_IT: '🚀',
  GREAT_DIRECTION: '👍',
  ANOTHER_VERSION: '🔄',
  NEEDS_A_TWEAK: '✏️',
}

export function emojisFromReactionTags(tags: ProjectFileReactionTag[]): string[] {
  return tags.slice(0, 3).map((tag) => REACTION_EMOJI[tag.kind])
}

export function reactionsMapFromItems(
  items: ProjectAttachmentWithReactions[],
): Map<string, ProjectAttachmentWithReactions> {
  return new Map(items.map((item) => [item.id, item]))
}
