import type { OriginalPreview, ProjectPreview, SearchResult } from '@cocreate/types'
import { workClientFilterHref, toClientSlug } from '@/lib/client-slug'
import { projectMatchesSearch } from '@/lib/project-preview'
import { workProjectPath } from '@/lib/work-project-path'
import { galleryProjectPreviews } from '@/site-info/gallery-data'
import { originalPreviews } from '@/site-info/originals-data'
import {
  WORK_PROJECT_CATEGORIES,
  categoryFromSlug,
  categoryMatchesQuery,
  categoryToSlug,
  type WorkProjectCategory,
} from '@/site-info/work-categories'

const workProjects = galleryProjectPreviews

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase()
}

function matchesTerms(haystack: string, terms: string[]): boolean {
  const normalized = haystack.toLowerCase()
  return terms.every((term) => normalized.includes(term))
}

function buildClientResults(
  projects: ProjectPreview[],
  terms: string[],
): SearchResult[] {
  const byClient = new Map<
    string,
    { name: string; slug: string; projects: ProjectPreview[] }
  >()

  for (const project of projects) {
    const slug = project.clientSlug ?? toClientSlug(project.clientName)
    const existing = byClient.get(slug)
    if (existing) {
      existing.projects.push(project)
    } else {
      byClient.set(slug, {
        name: project.clientName,
        slug,
        projects: [project],
      })
    }
  }

  const results: SearchResult[] = []

  for (const client of byClient.values()) {
    const searchable = `${client.name} ${client.projects.map((p) => p.projectName).join(' ')}`
    if (!matchesTerms(searchable, terms)) continue

    const count = client.projects.length
    results.push({
      id: `client-${client.slug}`,
      kind: 'client',
      title: client.name,
      subtitle: count === 1 ? '1 project' : `${count} projects`,
      href: workClientFilterHref(client.slug),
      projectCount: count,
    })
  }

  return results.sort((a, b) => a.title.localeCompare(b.title))
}

function buildCategoryResults(
  projects: ProjectPreview[],
  terms: string[],
): SearchResult[] {
  const results: SearchResult[] = []

  for (const category of WORK_PROJECT_CATEGORIES) {
    if (!categoryMatchesQuery(category, terms)) continue
    const count = projects.filter((p) => p.category === category).length
    if (count === 0) continue

    results.push({
      id: `category-${categoryToSlug(category)}`,
      kind: 'category',
      title: category,
      subtitle: count === 1 ? '1 project' : `${count} projects`,
      href: `/work?category=${categoryToSlug(category)}`,
      projectCount: count,
    })
  }

  return results
}

function buildProjectResults(
  projects: ProjectPreview[],
  terms: string[],
): SearchResult[] {
  return projects
    .filter((project) => projectMatchesSearch(project, terms))
    .map((project) => {
      const slug = project.slug ?? project.id
      return {
        id: `project-${project.id}`,
        kind: 'project' as const,
        title: project.projectName,
        subtitle: [project.clientName, project.category].filter(Boolean).join(' · '),
        href: workProjectPath(slug),
      }
    })
    .sort((a, b) => a.title.localeCompare(b.title))
}

function buildOriginalResults(
  originals: OriginalPreview[],
  terms: string[],
): SearchResult[] {
  return originals
    .filter((item) => {
      const searchable = `${item.title} ${item.format ?? ''} ${item.description ?? ''} ${item.slug}`
      return matchesTerms(searchable, terms)
    })
    .map((item) => ({
      id: `original-${item.id}`,
      kind: 'original' as const,
      title: item.title,
      subtitle: item.format ?? 'Original',
      href: item.href ?? `/originals`,
    }))
    .sort((a, b) => a.title.localeCompare(b.title))
}

export function searchSite(query: string, limit = 12): SearchResult[] {
  const normalized = normalizeQuery(query)
  if (normalized.length < 2) return []

  const terms = normalized.split(/\s+/).filter(Boolean)
  const categories = buildCategoryResults(workProjects, terms)
  const clients = buildClientResults(workProjects, terms)
  const projects = buildProjectResults(workProjects, terms)
  const originals = buildOriginalResults(originalPreviews, terms)

  const merged: SearchResult[] = []
  const seen = new Set<string>()

  for (const result of [...categories, ...clients, ...projects, ...originals]) {
    if (seen.has(result.id)) continue
    seen.add(result.id)
    merged.push(result)
    if (merged.length >= limit) break
  }

  return merged
}

export function getWorkProjectsForClient(clientSlug: string): ProjectPreview[] {
  const slug = clientSlug.trim().toLowerCase()
  return workProjects.filter(
    (project) => (project.clientSlug ?? toClientSlug(project.clientName)) === slug,
  )
}

export function getWorkProjectsForCategory(
  categorySlug: string,
): ProjectPreview[] {
  const category = categoryFromSlug(categorySlug)
  if (!category) return []
  return workProjects.filter((project) => project.category === category)
}

export function getCategoryDisplayName(
  categorySlug: string,
): WorkProjectCategory | null {
  return categoryFromSlug(categorySlug)
}

export function getClientDisplayName(clientSlug: string): string | null {
  const match = workProjects.find(
    (project) =>
      (project.clientSlug ?? toClientSlug(project.clientName)) ===
      clientSlug.trim().toLowerCase(),
  )
  return match?.clientName ?? null
}

export function getWorkProjectBySlug(slug: string): ProjectPreview | null {
  const key = slug.trim().toLowerCase()
  return (
    workProjects.find(
      (project) => (project.slug ?? project.id).toLowerCase() === key,
    ) ?? null
  )
}

export function getAllWorkProjectSlugs(): string[] {
  return workProjects.map((project) => project.slug ?? project.id)
}

export { workProjects }
