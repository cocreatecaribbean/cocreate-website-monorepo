import { aboutHero } from '@/site-info/about-page-data'
import {
  aboutTestimonialsMock,
  aboutTestimonialsSection,
} from '@/site-info/about-testimonials.mock'
import {
  urlForAboutHeroImage,
  urlForTestimonialPhoto,
} from '@/sanity/lib/image'
import type {
  AboutPresentationResult,
  AboutSanityImage,
} from '@/lib/sanity/about-presentation-query'
import type { AboutTestimonial } from '@/types/about-testimonial'

export type AboutPageContent = {
  heroMediaType: 'image' | 'video'
  heroImageUrl: string | null
  heroVideoPlaybackId: string | null
  heroHeading: string
  heroBody: string
  heroBodyHighlight: string
  /** Static fallback image when CMS has no hero image */
  fallbackHeroImageSrc: string
  fallbackHeroImageAlt: string
  fallbackHeroBlurDataURL: string
  testimonialsTitle: string
  testimonialsEyebrow: string
  testimonials: AboutTestimonial[]
}

export type SanityAboutPageRow = AboutPresentationResult

function hasImageAsset(image: AboutSanityImage | undefined): boolean {
  if (!image || typeof image !== 'object') return false
  if (typeof image.assetUrl === 'string' && image.assetUrl.trim()) return true
  const asset = image.asset
  if (!asset || typeof asset !== 'object') return false
  return Boolean(
    ('url' in asset && asset.url) ||
      ('_ref' in asset && asset._ref) ||
      ('_id' in asset && (asset as {_id?: string})._id),
  )
}

function imageAssetFallbackUrl(image: AboutSanityImage | undefined): string | null {
  if (!image) return null
  const fromProjection = image.assetUrl?.trim()
  if (fromProjection) return fromProjection
  const asset = image.asset
  if (asset && typeof asset === 'object' && typeof asset.url === 'string') {
    return asset.url.trim() || null
  }
  return null
}

function resolveHeroImageUrl(row: SanityAboutPageRow | null | undefined): string | null {
  if (hasImageAsset(row?.heroImage)) {
    return (
      urlForAboutHeroImage(row!.heroImage!) ??
      imageAssetFallbackUrl(row!.heroImage) 
    )
  }
  return row?.heroImageUrl?.trim() || null
}

function resolveTestimonialPhotoUrl(
  photo: AboutSanityImage | undefined,
  photoUrl?: string | null,
): string | null {
  if (hasImageAsset(photo)) {
    return urlForTestimonialPhoto(photo!) ?? imageAssetFallbackUrl(photo)
  }
  return photoUrl?.trim() || null
}

function mapTestimonials(
  rows: SanityAboutPageRow['testimonials'],
): AboutTestimonial[] {
  if (!rows?.length) return []
  const mapped: AboutTestimonial[] = []
  rows.forEach((row, index) => {
    if (!row) return
    const id = row._id?.trim()
    const name = row.name?.trim()
    const company = row.company?.trim()
    const jobTitle = row.jobTitle?.trim() || undefined
    const quote = row.quote?.trim()
    const resolvedPhotoUrl = resolveTestimonialPhotoUrl(row.photo, row.photoUrl)
    if (!id || !name || !company || !quote || !resolvedPhotoUrl) return
    mapped.push({
      id,
      name,
      ...(jobTitle ? {jobTitle} : {}),
      company,
      quote,
      photoUrl: resolvedPhotoUrl,
      sortOrder: index + 1,
    })
  })
  return mapped
}

function mockTestimonials(): AboutTestimonial[] {
  return [...aboutTestimonialsMock].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
  )
}

function normalizeMediaType(value: string | null | undefined): 'image' | 'video' {
  return value === 'video' ? 'video' : 'image'
}

export function withAboutPageDefaults(
  row: SanityAboutPageRow | null | undefined,
): AboutPageContent {
  const fromCms = mapTestimonials(row?.testimonials)
  const hasCmsRow = row != null

  return {
    heroMediaType: normalizeMediaType(row?.heroMediaType),
    heroImageUrl: resolveHeroImageUrl(row),
    heroVideoPlaybackId: row?.heroVideoPlaybackId?.trim() || null,
    heroHeading: row?.heroHeading?.trim() || aboutHero.heading,
    heroBody: row?.heroBody?.trim() || aboutHero.body,
    // Prefer CMS highlight; only use static fallback when body also falls back
    // (avoids duplicating a punchline still left in an older CMS heroBody).
    heroBodyHighlight:
      row?.heroBodyHighlight?.trim() ||
      (row?.heroBody?.trim() ? '' : aboutHero.bodyHighlight),
    fallbackHeroImageSrc: aboutHero.imageSrc,
    fallbackHeroImageAlt: aboutHero.imageAlt,
    fallbackHeroBlurDataURL: aboutHero.imageBlurDataURL,
    testimonialsTitle:
      row?.testimonialsTitle?.trim() || aboutTestimonialsSection.title,
    testimonialsEyebrow: aboutTestimonialsSection.eyebrow,
    // When Sanity is configured and returns a row, empty array means empty —
    // do not flash mocks. Mocks only when Sanity is missing / fetch failed (null).
    testimonials: hasCmsRow
      ? fromCms
      : mockTestimonials(),
  }
}

export function mergeAboutPageContent(
  initial: AboutPageContent,
  live: SanityAboutPageRow | null | undefined,
): AboutPageContent {
  if (!live) return initial
  return withAboutPageDefaults({
    heroMediaType:
      live.heroMediaType !== undefined ? live.heroMediaType : initial.heroMediaType,
    heroImage:
      live.heroImage !== undefined ? live.heroImage : undefined,
    heroImageUrl:
      live.heroImage !== undefined
        ? undefined
        : live.heroImageUrl !== undefined
          ? live.heroImageUrl
          : initial.heroImageUrl,
    heroVideoPlaybackId:
      live.heroVideoPlaybackId !== undefined
        ? live.heroVideoPlaybackId
        : initial.heroVideoPlaybackId,
    heroHeading:
      live.heroHeading !== undefined ? live.heroHeading : initial.heroHeading,
    heroBody: live.heroBody !== undefined ? live.heroBody : initial.heroBody,
    heroBodyHighlight:
      live.heroBodyHighlight !== undefined
        ? live.heroBodyHighlight
        : initial.heroBodyHighlight,
    testimonialsTitle:
      live.testimonialsTitle !== undefined
        ? live.testimonialsTitle
        : initial.testimonialsTitle,
    testimonials:
      live.testimonials !== undefined
        ? live.testimonials
        : initial.testimonials.map((t) => ({
            _id: t.id,
            name: t.name,
            company: t.company,
            jobTitle: t.jobTitle,
            quote: t.quote,
            photoUrl: t.photoUrl,
          })),
  })
}
