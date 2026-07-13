import { aboutHero } from '@/site-info/about-page-data'
import {
  aboutTestimonialsMock,
  aboutTestimonialsSection,
} from '@/site-info/about-testimonials.mock'
import type { AboutTestimonial } from '@/types/about-testimonial'

export type AboutPageContent = {
  heroMediaType: 'image' | 'video'
  heroImageUrl: string | null
  heroVideoPlaybackId: string | null
  heroHeading: string
  heroBody: string
  /** Static fallback image when CMS has no hero image */
  fallbackHeroImageSrc: string
  fallbackHeroImageAlt: string
  fallbackHeroBlurDataURL: string
  testimonialsTitle: string
  testimonialsEyebrow: string
  testimonials: AboutTestimonial[]
}

export type SanityAboutPageRow = {
  heroMediaType?: string | null
  heroImageUrl?: string | null
  heroVideoPlaybackId?: string | null
  heroHeading?: string | null
  heroBody?: string | null
  testimonialsTitle?: string | null
  testimonials?: Array<{
    _id?: string | null
    name?: string | null
    company?: string | null
    quote?: string | null
    photoUrl?: string | null
  } | null> | null
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
    const quote = row.quote?.trim()
    const photoUrl = row.photoUrl?.trim()
    if (!id || !name || !company || !quote || !photoUrl) return
    mapped.push({
      id,
      name,
      company,
      quote,
      photoUrl,
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
    heroImageUrl: row?.heroImageUrl?.trim() || null,
    heroVideoPlaybackId: row?.heroVideoPlaybackId?.trim() || null,
    heroHeading: row?.heroHeading?.trim() || aboutHero.heading,
    heroBody: row?.heroBody?.trim() || aboutHero.body,
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
    heroImageUrl:
      live.heroImageUrl !== undefined ? live.heroImageUrl : initial.heroImageUrl,
    heroVideoPlaybackId:
      live.heroVideoPlaybackId !== undefined
        ? live.heroVideoPlaybackId
        : initial.heroVideoPlaybackId,
    heroHeading:
      live.heroHeading !== undefined ? live.heroHeading : initial.heroHeading,
    heroBody: live.heroBody !== undefined ? live.heroBody : initial.heroBody,
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
            quote: t.quote,
            photoUrl: t.photoUrl,
          })),
  })
}
