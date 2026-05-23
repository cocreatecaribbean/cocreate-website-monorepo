export function workProjectPath(slug: string): string {
  return `/work/${encodeURIComponent(slug)}`
}
