import { defineQuery } from 'next-sanity'

/** Only documents with publishedAt in the past are public */
const publishedWorkFilter = `_type == "workProject" && defined(publishedAt) && publishedAt <= now()`
const publishedOriginalFilter = `_type == "original" && defined(publishedAt) && publishedAt <= now()`

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

/** All published work projects with resolved client */
export const WORK_PROJECTS_QUERY = defineQuery(`
  *[${publishedWorkFilter}] | order(publishedAt desc) {
    _id,
    title,
    "slug": slug.current,
    summary,
    tags,
    publishedAt,
    featured,
    "coverImageUrl": coverImage.asset->url,
    "clientName": client->name,
    "clientSlug": client->slug.current,
    category,
    "heroReelPlaybackId": projectVideos[role == "hero_reel"][0].video.asset->playbackId,
    projectVideos[] { ${projectVideoProjection} }
  }
`)

export const WORK_PROJECT_BY_SLUG_QUERY = defineQuery(`
  *[${publishedWorkFilter} && lower(slug.current) == $slug][0] {
    _id,
    title,
    "slug": slug.current,
    summary,
    tags,
    publishedAt,
    featured,
    "coverImageUrl": coverImage.asset->url,
    "clientName": client->name,
    "clientSlug": client->slug.current,
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
  }
`)

export const WORK_PROJECT_SLUGS_QUERY = defineQuery(`
  *[${publishedWorkFilter}] {
    "slug": slug.current
  }
`)

export const FEATURED_HERO_REEL_QUERY = defineQuery(`
  *[_type == "workProject" && featured == true && defined(publishedAt) && publishedAt <= now()] | order(publishedAt desc) [0] {
    "playbackId": projectVideos[role == "hero_reel"][0].video.asset->playbackId
  }
`)

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
  *[${publishedWorkFilter} && (
    title match $q ||
    client->name match $q ||
    $term in tags
  )] | order(publishedAt desc) [0...$limit] {
    _id,
    title,
    "slug": slug.current,
    "clientName": client->name,
    "clientSlug": client->slug.current,
    category,
  }
`)
