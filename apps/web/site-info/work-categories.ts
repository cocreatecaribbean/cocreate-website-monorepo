import {
  WORK_PROJECT_CATEGORIES,
  type WorkProjectCategory,
} from '@cocreate/types'

export { WORK_PROJECT_CATEGORIES, type WorkProjectCategory }

export const WORK_CATEGORY_SLUGS: Record<WorkProjectCategory, string> = {
  Production: 'production',
  Digital: 'digital',
  'PR & Communications': 'pr',
  'Brands & Strategy': 'brands-strategy',
  Talent: 'talent',
  Analytics: 'analytics',
}

const SLUG_TO_CATEGORY = Object.fromEntries(
  Object.entries(WORK_CATEGORY_SLUGS).map(([category, slug]) => [
    slug,
    category as WorkProjectCategory,
  ]),
) as Record<string, WorkProjectCategory>

export function categoryToSlug(category: WorkProjectCategory): string {
  return WORK_CATEGORY_SLUGS[category]
}

export function categoryFromSlug(slug: string): WorkProjectCategory | null {
  return SLUG_TO_CATEGORY[slug.trim().toLowerCase()] ?? null
}

export function categoryMatchesQuery(
  category: WorkProjectCategory,
  terms: string[],
): boolean {
  const label = category.toLowerCase()
  const slug = categoryToSlug(category)
  const aliases: Record<WorkProjectCategory, string[]> = {
    Production: ['production', 'studio', 'film', 'video'],
    Digital: ['digital', 'web', 'app', 'product'],
    'PR & Communications': ['pr', 'communications', 'comms', 'media'],
    'Brands & Strategy': ['brand', 'brands', 'strategy', 'campaign'],
    Talent: ['talent'],
    Analytics: ['analytics', 'insights', 'data'],
  }

  return terms.some((term) => {
    if (label.includes(term) || slug.includes(term)) return true
    return aliases[category].some((alias) => alias.includes(term) || term.includes(alias))
  })
}
