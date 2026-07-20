import type { ProjectPreview, WorkProjectCategory } from '@cocreate/types'
import { toClientSlug } from '@/lib/client-slug'
import { workProjectPath } from '@/lib/work-project-path'
import { categoryMatchesQuery } from '@/site-info/work-categories'

const CATEGORY_BY_ID: Partial<Record<string, WorkProjectCategory>> = {
  proven: 'Digital',
  jps: 'Digital',
  'vm-wealth': 'Digital',
  'grace-kennedy': 'Digital',
  ncb: 'Digital',
  digicel: 'Digital',
  guardian: 'Digital',
  epics: 'Digital',
  atl: 'Digital',
  'kingston-freezone': 'Digital',
  cpj: 'Digital',
  petrojam: 'Digital',
  'mbj-airports': 'Digital',
  'scotiabank-ja': 'Digital',
  hilo: 'Digital',
  'island-grill': 'Digital',
  cancara: 'Production',
  udc: 'Production',
  sandals: 'Production',
  'red-stripe': 'Production',
  'taj-jamaica': 'Production',
  'maia-chung': 'Production',
  'blue-mountain': 'Production',
  'jamaica-tourist': 'Production',
  cibc: 'Brands & Strategy',
  flow: 'Brands & Strategy',
  'grace-foods': 'Brands & Strategy',
}

function inferCategory(item: ProjectPreview): WorkProjectCategory {
  if (item.category) return item.category
  if (CATEGORY_BY_ID[item.id]) return CATEGORY_BY_ID[item.id]!

  const text = `${item.projectName} ${item.clientName}`.toLowerCase()
  if (/(portal|intranet|app|digital|mobile|platform|dashboard|commerce|flow|loyalty|onboarding|ordering|experience)/.test(text)) {
    return 'Digital'
  }
  if (/(campaign|festival|activation|launch|film|production|heritage|origin)/.test(text)) {
    return 'Production'
  }
  if (/(pr|communications|press)/.test(text)) {
    return 'PR & Communications'
  }
  return 'Brands & Strategy'
}

function defaultSummary(item: ProjectPreview): string {
  return `CoCreate partnered with ${item.clientName} on ${item.projectName} — strategy, craft, and delivery built for Caribbean audiences.`
}

export function enrichProjectPreview(item: ProjectPreview): ProjectPreview {
  const slug = item.slug ?? item.id
  const clientSlug = item.clientSlug ?? toClientSlug(item.clientName)
  const category = inferCategory(item)

  return {
    ...item,
    slug,
    clientSlug,
    category,
    summary: item.summary ?? defaultSummary(item),
    href: item.href ?? workProjectPath(slug),
  }
}

export function enrichProjectPreviews(items: ProjectPreview[]): ProjectPreview[] {
  return items.map(enrichProjectPreview)
}

export function projectSearchableText(project: ProjectPreview): string {
  const category = project.category ?? inferCategory(project)
  return [
    project.projectName,
    project.clientName,
    project.id,
    project.slug ?? project.id,
    category,
    project.summary ?? '',
    project.tags?.join(' ') ?? '',
    project.overviewCategories?.join(' ') ?? '',
    project.overviewIndustries?.join(' ') ?? '',
  ].join(' ')
}

export function projectMatchesSearch(project: ProjectPreview, terms: string[]): boolean {
  const haystack = projectSearchableText(project)
  const normalized = haystack.toLowerCase()
  const category = project.category ?? inferCategory(project)
  const categoryHit = categoryMatchesQuery(category, terms)
  const textHit = terms.every((term) => normalized.includes(term))
  return textHit || categoryHit
}
