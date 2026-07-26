type ValidationLikeContext = {
  hidden?: boolean
  document?: unknown
  path?: unknown
  parent?: unknown
}

/** True when Sanity marks this field (or an ancestor) as hidden. */
export function isValidationHidden(context: ValidationLikeContext): boolean {
  return Boolean(context.hidden)
}

/**
 * True when validating a branch of an `original` document that is not the
 * active contentKind (e.g. leftover `film` data while editing a podcast).
 */
export function isInactiveOriginalBranch(
  context: ValidationLikeContext,
  activeKind: 'film' | 'articleSeries' | 'podcastSeries',
): boolean {
  const doc = context.document as {_type?: string; contentKind?: string} | undefined
  if (doc?._type !== 'original') return false
  return doc.contentKind !== activeKind
}

export function pathIncludesSegment(
  path: unknown,
  segment: string,
): boolean {
  if (!Array.isArray(path)) return false
  return path.some((part) => part === segment)
}
