/** URL-safe slug from a display name (matches Sanity slug convention). */
export function toClientSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function workClientFilterHref(clientSlug: string): string {
  return `/work?client=${encodeURIComponent(clientSlug)}`
}
