import { defineQuery } from 'next-sanity'

/**
 * Published + preview both target the singleton published id.
 * Draft overlay comes from client perspective (published vs previewDrafts),
 * never by OR-ing drafts.* into the query (that leaked drafts to the public site).
 */
const workPageDoc = `*[_type == "workPage" && _id == "workPage"][0]`
const landingPageDoc = `*[_type == "landingPage" && _id == "landingPage"][0]`
const aboutPageDoc = `*[_type == "aboutPage" && _id == "aboutPage"][0]`

const publishedProjectFilter = `defined(publishedAt) && publishedAt <= now()`

const clientNameProj = `"clientName": coalesce(client->name, clientName)`
const clientSlugProj = `"clientSlug": coalesce(client->slug.current, clientSlug)`

const projectVideoProjection = `
  role,
  title,
  "playbackId": video.asset->playbackId,
  "status": video.asset->status,
  "duration": video.asset->data.duration,
  "aspectRatio": video.asset->data.aspect_ratio,
  "posterUrl": "https://image.mux.com/" + video.asset->playbackId + "/thumbnail.jpg"
`

const galleryProjection = `
  gallery[] {
    "src": image.asset->url,
    alt,
    caption
  }
`

/** Array order = grid order. _key becomes id for previews. */
const workIndexProjection = `
  "_id": _key,
  title,
  "slug": slug.current,
  summary,
  tags,
  publishedAt,
  featured,
  "coverImageUrl": coverImage.asset->url,
  ${clientNameProj},
  ${clientSlugProj},
  category,
  "heroReelPlaybackId": projectVideos[role == "hero_reel"][0].video.asset->playbackId
`

const workDetailProjection = `
  "_id": _key,
  title,
  "slug": slug.current,
  summary,
  tags,
  publishedAt,
  featured,
  "coverImageUrl": coverImage.asset->url,
  ${clientNameProj},
  ${clientSlugProj},
  category,
  projectVideos[] { ${projectVideoProjection} },
  caseStudy[] {
    ...,
    _type == "image" => {
      ...,
      "asset": asset->
    }
  },
  ${galleryProjection},
  seo
`

/** All published work projects (from workPage.projects) */
export const WORK_PROJECTS_QUERY = defineQuery(`
  ${workPageDoc}.projects[${publishedProjectFilter}] {
    ${workIndexProjection},
    projectVideos[] { ${projectVideoProjection} }
  }
`)

export const WORK_PROJECTS_PREVIEW_QUERY = defineQuery(`
  ${workPageDoc}.projects[] {
    ${workIndexProjection},
    projectVideos[] { ${projectVideoProjection} }
  }
`)

export const WORK_PROJECTS_INDEX_QUERY = defineQuery(`
  ${workPageDoc}.projects[${publishedProjectFilter}] {
    ${workIndexProjection}
  }
`)

export const WORK_PROJECTS_INDEX_PREVIEW_QUERY = defineQuery(`
  ${workPageDoc}.projects[] {
    ${workIndexProjection}
  }
`)

export const WORK_PROJECT_BY_SLUG_QUERY = defineQuery(`
  ${workPageDoc}.projects[${publishedProjectFilter} && lower(slug.current) == $slug][0] {
    ${workDetailProjection}
  }
`)

export const WORK_PROJECT_BY_SLUG_PREVIEW_QUERY = defineQuery(`
  ${workPageDoc}.projects[lower(slug.current) == $slug][0] {
    ${workDetailProjection}
  }
`)

export const WORK_PROJECT_SLUGS_QUERY = defineQuery(`
  ${workPageDoc}.projects[${publishedProjectFilter}] {
    "slug": slug.current
  }
`)

export const LANDING_PAGE_QUERY = defineQuery(`
  ${landingPageDoc} {
    agencyIntro,
    "heroReelPlaybackId": heroReel.asset->playbackId
  }
`)

export const WORK_PAGE_QUERY = defineQuery(`
  ${workPageDoc} {
    titleLineOne,
    titleLineTwo
  }
`)

const publishedOriginalFilter = `_type == "original" && defined(publishedAt) && publishedAt <= now()`

export const ORIGINALS_QUERY = defineQuery(`
  *[${publishedOriginalFilter}] | order(publishedAt desc) {
    _id,
    title,
    "slug": slug.current,
    description,
    format,
    tags,
    publishedAt,
    youtubeVideoId,
    "coverImageUrl": coverImage.asset->url
  }
`)

export const SEARCH_WORK_QUERY = defineQuery(`
  ${workPageDoc}.projects[${publishedProjectFilter} && (
    title match $q ||
    coalesce(client->name, clientName) match $q ||
    $term in tags
  )] [0...$limit] {
    "_id": _key,
    title,
    "slug": slug.current,
    ${clientNameProj},
    ${clientSlugProj},
    category,
  }
`)

export const ABOUT_PAGE_QUERY = defineQuery(`
  ${aboutPageDoc} {
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
`)
