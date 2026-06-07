/** URL-safe slug from a tag label (matches client slug convention). */
export function toTagSlug(tag: string): string {
  return tag
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function workTagFilterHref(tagSlug: string): string {
  return `/work?tag=${encodeURIComponent(tagSlug)}`
}
