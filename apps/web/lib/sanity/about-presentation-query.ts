/** Client-safe GROQ for Presentation live updates (mirrors ABOUT_PAGE_QUERY). */
export const ABOUT_PRESENTATION_QUERY = `
*[_type == "aboutPage" && _id == "aboutPage"][0] {
  heroMediaType,
  "heroImageUrl": heroImage.asset->url,
  "heroVideoPlaybackId": heroVideo.asset->playbackId,
  heroHeading,
  heroBody,
  testimonialsTitle,
  testimonials[] {
    "_id": _key,
    name,
    company,
    quote,
    "photoUrl": photo.asset->url
  }
}
`

export type AboutPresentationResult = {
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
