import type { ProjectPreview } from '@cocreate/types'
import { fetchWorkProjectPreviews } from '@/lib/cms/work-projects'
import { fetchOriginalPreviews } from '@/lib/cms/originals'
import {
  getCategoryDisplayNameFromData,
  getClientDisplayNameFromData,
  getWorkProjectsForCategoryFromData,
  getWorkProjectsForClientFromData,
  searchSiteWithData,
} from '@/lib/search/search-site'

export async function searchSite(query: string, limit = 12) {
  const [projects, originals] = await Promise.all([
    fetchWorkProjectPreviews(),
    fetchOriginalPreviews(),
  ])
  return searchSiteWithData(query, projects, originals, limit)
}

export async function getWorkProjects(): Promise<ProjectPreview[]> {
  return fetchWorkProjectPreviews()
}

export async function getWorkProjectsForClient(clientSlug: string) {
  const projects = await fetchWorkProjectPreviews()
  return getWorkProjectsForClientFromData(projects, clientSlug)
}

export async function getWorkProjectsForCategory(categorySlug: string) {
  const projects = await fetchWorkProjectPreviews()
  return getWorkProjectsForCategoryFromData(projects, categorySlug)
}

export async function getCategoryDisplayName(categorySlug: string) {
  const projects = await fetchWorkProjectPreviews()
  return getCategoryDisplayNameFromData(projects, categorySlug)
}

export async function getClientDisplayName(clientSlug: string) {
  const projects = await fetchWorkProjectPreviews()
  return getClientDisplayNameFromData(projects, clientSlug)
}

export {
  getWorkProjectsForCategoryFromData,
  getWorkProjectsForClientFromData,
  searchSiteWithData,
} from '@/lib/search/search-site'
