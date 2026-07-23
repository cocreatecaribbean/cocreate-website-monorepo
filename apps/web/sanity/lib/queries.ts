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

export const projectMediaProjection = `
  mediaType,
  alt,
  image {
    crop,
    hotspot,
    asset,
    "assetUrl": asset->url,
    "lqip": asset->metadata.lqip
  },
  cover {
    crop,
    hotspot,
    asset,
    "assetUrl": asset->url,
    "lqip": asset->metadata.lqip
  },
  loopPoster {
    crop,
    hotspot,
    asset,
    "assetUrl": asset->url,
    "lqip": asset->metadata.lqip
  },
  "playbackId": video.asset->playbackId,
  "loopVideoSrc": loopVideo.asset->url,
  "loopVideoMime": loopVideo.asset->mimeType
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
  coverImage {
    crop,
    hotspot,
    asset,
    "assetUrl": asset->url,
    "lqip": asset->metadata.lqip
  },
  ${clientNameProj},
  ${clientSlugProj},
  category,
  "overviewCategories": sections[_type == "projectOverview"][0].categories,
  "overviewIndustries": sections[_type == "projectOverview"][0].industries
`

const workDetailProjection = `
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
    "assetUrl": asset->url,
    "lqip": asset->metadata.lqip
  },
  ${clientNameProj},
  ${clientSlugProj},
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
`

/** All published work projects (from workPage.projects) */
export const WORK_PROJECTS_QUERY = defineQuery(`
  ${workPageDoc}.projects[${publishedProjectFilter}] {
    ${workIndexProjection}
  }
`)

export const WORK_PROJECTS_PREVIEW_QUERY = defineQuery(`
  ${workPageDoc}.projects[] {
    ${workIndexProjection}
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
    heroBodyHighlight,
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
