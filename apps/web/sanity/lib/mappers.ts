import type {
  GalleryImage,
  OriginalPreview,
  ProjectPreview,
  ProjectVideo,
  ProjectVideoRole,
  WorkProjectCategory,
  WorkProjectDetail,
} from '@cocreate/types'
import { workProjectPath } from '@/lib/work-project-path'

type SanityWorkProjectRow = {
  _id: string
  title: string
  slug: string
  summary?: string | null
  coverImageUrl?: string | null
  clientName?: string | null
  clientSlug?: string | null
  category?: WorkProjectCategory | null
  featured?: boolean | null
  heroReelPlaybackId?: string | null
  tags?: string[] | null
  projectVideos?: SanityProjectVideoRow[] | null
  caseStudy?: unknown[] | null
  gallery?: GalleryImage[] | null
  seo?: { metaTitle?: string; metaDescription?: string } | null
}

type SanityProjectVideoRow = {
  role?: ProjectVideoRole | null
  title?: string | null
  playbackId?: string | null
  status?: string | null
  duration?: number | null
  aspectRatio?: string | null
  posterUrl?: string | null
}

type SanityOriginalRow = {
  _id: string
  title: string
  slug: string
  description?: string | null
  format?: string | null
  coverImageUrl?: string | null
  youtubeVideoId?: string | null
}

function mapProjectVideos(rows: SanityProjectVideoRow[] | null | undefined): ProjectVideo[] {
  if (!rows?.length) return []

  return rows
    .filter((row): row is SanityProjectVideoRow & { playbackId: string; role: ProjectVideoRole } =>
      Boolean(row.playbackId && row.role),
    )
    .map((row) => ({
      role: row.role,
      title: row.title ?? undefined,
      playbackId: row.playbackId,
      status: row.status ?? undefined,
      duration: row.duration ?? undefined,
      aspectRatio: row.aspectRatio ?? undefined,
      posterUrl: row.posterUrl ?? undefined,
    }))
}

export function mapSanityWorkProjectToPreview(row: SanityWorkProjectRow): ProjectPreview {
  const slug = row.slug
  const coverImageSrc = row.coverImageUrl ?? ''

  return {
    id: row._id,
    slug,
    projectName: row.title,
    clientName: row.clientName ?? '',
    clientSlug: row.clientSlug ?? undefined,
    category: row.category ?? undefined,
    summary: row.summary ?? undefined,
    coverImageSrc,
    href: workProjectPath(slug),
    featured: row.featured ?? false,
    heroReelPlaybackId: row.heroReelPlaybackId ?? undefined,
    tags: row.tags?.filter(Boolean) ?? undefined,
  }
}

export function mapSanityWorkProjectToDetail(row: SanityWorkProjectRow): WorkProjectDetail {
  const preview = mapSanityWorkProjectToPreview(row)
  const videos = mapProjectVideos(row.projectVideos)

  if (!preview.category) {
    throw new Error(`Sanity project "${preview.id}" is missing category`)
  }

  return {
    ...preview,
    slug: preview.slug ?? preview.id,
    category: preview.category,
    summary: preview.summary ?? '',
    caseStudy: row.caseStudy ?? undefined,
    gallery: row.gallery?.filter((item) => item.src) ?? undefined,
    videos: videos.length > 0 ? videos : undefined,
    seo: row.seo ?? undefined,
  }
}

export function mapSanityOriginalToPreview(row: SanityOriginalRow): OriginalPreview {
  return {
    id: row._id,
    title: row.title,
    slug: row.slug,
    description: row.description ?? undefined,
    format: row.format ?? undefined,
    coverImageSrc: row.coverImageUrl ?? '',
    youtubeVideoId: row.youtubeVideoId ?? undefined,
    href: '/originals',
  }
}
