/** Client-safe GROQ for Presentation live updates (mirrors ABOUT_PAGE_QUERY). */
export const ABOUT_PRESENTATION_QUERY = `
*[_type == "aboutPage" && _id == "aboutPage"][0] {
  heroMediaType,
  heroImage {
    crop,
    hotspot,
    asset,
    "assetUrl": asset->url
  },
  "heroVideoPlaybackId": heroVideo.asset->playbackId,
  heroHeading,
  heroBody,
  testimonialsTitle,
  testimonials[] {
    "_id": _key,
    name,
    company,
    jobTitle,
    quote,
    photo {
      crop,
      hotspot,
      asset,
      "assetUrl": asset->url
    }
  }
}
`

export type AboutSanityImage = {
  asset?: {_ref?: string; _type?: string; url?: string} | null
  /** Resolved original URL for fallback when urlFor fails */
  assetUrl?: string | null
  crop?: unknown
  hotspot?: unknown
} | null

export type AboutPresentationResult = {
  heroMediaType?: string | null
  heroImage?: AboutSanityImage
  /** Already-resolved URL (merge/fallback only) */
  heroImageUrl?: string | null
  heroVideoPlaybackId?: string | null
  heroHeading?: string | null
  heroBody?: string | null
  testimonialsTitle?: string | null
  testimonials?: Array<{
    _id?: string | null
    name?: string | null
    company?: string | null
    jobTitle?: string | null
    quote?: string | null
    photo?: AboutSanityImage
    photoUrl?: string | null
  } | null> | null
}
