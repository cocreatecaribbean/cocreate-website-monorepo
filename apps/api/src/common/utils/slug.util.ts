/** Lowercase URL-safe slug from a company or label. */
export function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Append numeric suffix until `isAvailable` returns true. */
export async function uniqueSlug(
  base: string,
  isAvailable: (slug: string) => Promise<boolean>,
): Promise<string> {
  const root = slugify(base) || 'org'
  let candidate = root
  let n = 2

  while (!(await isAvailable(candidate))) {
    candidate = `${root}-${n}`
    n += 1
  }

  return candidate
}
