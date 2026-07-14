import { createImageUrlBuilder, type SanityImageSource } from '@sanity/image-url'
import { dataset, isSanityConfigured, projectId } from '../env'

const builder = isSanityConfigured()
  ? createImageUrlBuilder({ projectId, dataset })
  : null

/** Builder for CDN URLs that honor crop + hotspot. Returns null when Sanity is not configured. */
export function urlForImage(source: SanityImageSource) {
  if (!builder || !source) return null
  return builder.image(source)
}

export function urlForTestimonialPhoto(source: SanityImageSource): string | null {
  return (
    urlForImage(source)
      ?.width(320)
      .height(320)
      .fit('crop')
      .auto('format')
      .url() ?? null
  )
}

export function urlForAboutHeroImage(source: SanityImageSource): string | null {
  return (
    urlForImage(source)?.width(1600).fit('max').auto('format').url() ?? null
  )
}
