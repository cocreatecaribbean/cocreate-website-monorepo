/**
 * @deprecated Import from `@/lib/search/site-search` instead.
 * Kept for backwards compatibility during migration.
 */
export {
  getCategoryDisplayName,
  getClientDisplayName,
  getWorkProjects as workProjects,
  getWorkProjects,
  getWorkProjectsForCategory,
  getWorkProjectsForClient,
  searchSite,
} from '@/lib/search/site-search'

export async function getWorkProjectBySlug(slug: string) {
  const { fetchWorkProjectBySlug } = await import('@/lib/cms/work-projects')
  const detail = await fetchWorkProjectBySlug(slug)
  return detail
}

export async function getAllWorkProjectSlugs() {
  const { fetchWorkProjectSlugs } = await import('@/lib/cms/work-projects')
  return fetchWorkProjectSlugs()
}
