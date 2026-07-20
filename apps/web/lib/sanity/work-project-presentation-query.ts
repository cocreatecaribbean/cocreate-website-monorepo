import type { WorkProjectDetail } from '@cocreate/types'
import { stegaClean } from '@sanity/client/stega'
import { mapSanityWorkProjectToDetail } from '@/sanity/lib/mappers'
import { projectMediaProjection } from '@/sanity/lib/queries'

/**
 * Client-safe GROQ for Presentation live updates of a single project detail.
 * Mirrors workDetailProjection in sanity/lib/queries.ts — keep in sync.
 */
export const WORK_PROJECT_PRESENTATION_QUERY = `
*[_type == "workPage" && _id == "workPage"][0].projects[lower(slug.current) == $slug][0] {
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
  hero {
    ${projectMediaProjection}
  },
  sections[] {
    _key,
    _type,
    _type == "projectOverview" => {
      categories,
      industries,
      body
    },
    _type == "mediaPair" => {
      left { ${projectMediaProjection} },
      right { ${projectMediaProjection} }
    },
    _type == "impactCallout" => {
      headline,
      subheadline
    },
    _type == "textAndMedia" => {
      body,
      mediaPosition,
      media { ${projectMediaProjection} }
    },
    _type == "mediaBanner" => {
      media { ${projectMediaProjection} }
    },
    _type == "shareBar" => {
      heading
    }
  },
  seo
}
`

export type WorkProjectPresentationRow = {
  _id?: string | null
  title?: string | null
  slug?: string | null
  summary?: string | null
  tags?: string[] | null
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
  hero?: unknown
  sections?: unknown[] | null
  seo?: { metaTitle?: string; metaDescription?: string } | null
}

/** Map a live Presentation row into a detail model. Returns null if incomplete mid-edit. */
export function mapPresentationWorkProject(
  row: WorkProjectPresentationRow | null | undefined,
): WorkProjectDetail | null {
  if (!row) return null

  const rawSlug = row.slug != null ? stegaClean(row.slug) : row.slug
  const slug =
    (typeof rawSlug === 'string' ? rawSlug.trim() : '') ||
    (typeof row._id === 'string' ? row._id : '')
  if (!slug || !row.title?.trim()) return null

  try {
    return mapSanityWorkProjectToDetail({
      _id: (typeof row._id === 'string' && row._id.trim()) || slug,
      title: row.title,
      slug,
      summary: row.summary,
      tags: row.tags,
      featured: row.featured,
      coverImage: row.coverImage ?? undefined,
      clientName:
        row.clientName != null ? stegaClean(row.clientName) : row.clientName,
      clientSlug:
        row.clientSlug != null ? stegaClean(row.clientSlug) : row.clientSlug,
      category: row.category as Parameters<
        typeof mapSanityWorkProjectToDetail
      >[0]['category'],
      hero: row.hero as Parameters<typeof mapSanityWorkProjectToDetail>[0]['hero'],
      sections: row.sections as Parameters<
        typeof mapSanityWorkProjectToDetail
      >[0]['sections'],
      seo: row.seo ?? undefined,
    })
  } catch {
    return null
  }
}
