import type { ProjectPreview } from '@cocreate/types'
import { stegaClean } from '@sanity/client/stega'
import { mapSanityWorkProjectToPreview } from '@/sanity/lib/mappers'
import { enrichProjectPreviews } from '@/lib/project-preview'

/** Client-safe GROQ for Presentation live updates (page + project tiles). */
export const WORK_PRESENTATION_QUERY = `{
  "page": *[_type == "workPage" && _id == "workPage"][0] {
    titleLineOne,
    titleLineTwo
  },
  "projects": *[_type == "workPage" && _id == "workPage"][0].projects[] {
    "_id": _key,
    title,
    "slug": slug.current,
    summary,
    tags,
    publishedAt,
    featured,
    coverImage {
      crop,
      hotspot,
      asset,
      "assetUrl": asset->url
    },
    "clientName": coalesce(client->name, clientName),
    "clientSlug": coalesce(client->slug.current, clientSlug),
    category,
    "overviewCategories": sections[_type == "projectOverview"][0].categories,
    "overviewIndustries": sections[_type == "projectOverview"][0].industries
  }
}`

export type WorkPresentationPage = {
  titleLineOne?: string | null
  titleLineTwo?: string | null
}

export type WorkPresentationProjectRow = {
  _id: string
  title: string
  slug?: string | null
  summary?: string | null
  tags?: string[] | null
  overviewCategories?: string[] | null
  overviewIndustries?: string[] | null
  publishedAt?: string | null
  featured?: boolean | null
  coverImage?: {
    crop?: unknown
    hotspot?: unknown
    asset?: unknown
    assetUrl?: string | null
  } | null
  clientName?: string | null
  clientSlug?: string | null
  category?: string | null
}

export type WorkPresentationResult = {
  page?: WorkPresentationPage | null
  projects?: WorkPresentationProjectRow[] | null
}

/** Strip stega from Work page fields so overlays stay on the singleton. */
export function cleanPresentationPage(
  page: WorkPresentationPage | null | undefined,
): WorkPresentationPage | null | undefined {
  if (!page) return page
  return {
    titleLineOne:
      page.titleLineOne != null ? stegaClean(page.titleLineOne) : page.titleLineOne,
    titleLineTwo:
      page.titleLineTwo != null ? stegaClean(page.titleLineTwo) : page.titleLineTwo,
  }
}

export function mapPresentationProjects(
  rows: WorkPresentationProjectRow[] | null | undefined,
): ProjectPreview[] {
  if (!rows?.length) return []

  return enrichProjectPreviews(
    rows
      // Keep rows mid-edit even if slug is briefly cleared — fall back to _key/_id
      .filter((row) => Boolean(row._id || row.slug))
      .map((row) => {
        const rawSlug = row.slug != null ? stegaClean(row.slug) : row.slug
        const slug = (typeof rawSlug === 'string' ? rawSlug.trim() : '') || row._id
        return mapSanityWorkProjectToPreview({
          _id: row._id,
          title: row.title,
          slug,
          summary: row.summary,
          tags: row.tags,
          overviewCategories: row.overviewCategories,
          overviewIndustries: row.overviewIndustries,
          featured: row.featured,
          coverImage: row.coverImage,
          clientName: row.clientName != null ? stegaClean(row.clientName) : row.clientName,
          clientSlug: row.clientSlug != null ? stegaClean(row.clientSlug) : row.clientSlug,
          category: row.category as Parameters<
            typeof mapSanityWorkProjectToPreview
          >[0]['category'],
        })
      }),
  )
}
