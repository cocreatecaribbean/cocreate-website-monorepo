/** Client-safe GROQ for Presentation live updates (mirrors LANDING_PAGE_QUERY). */
export const LANDING_PRESENTATION_QUERY = `
*[_type == "landingPage" && _id == "landingPage"][0] {
  agencyIntro,
  "heroReelPlaybackId": heroReel.asset->playbackId
}
`

export type LandingPresentationResult = {
  agencyIntro?: string | null
  heroReelPlaybackId?: string | null
}
