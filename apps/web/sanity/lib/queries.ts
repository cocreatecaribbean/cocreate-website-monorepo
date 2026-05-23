import { defineQuery } from 'next-sanity'

/** All work projects with resolved client — swap static search once content is in Sanity */
export const WORK_PROJECTS_QUERY = defineQuery(`
  *[_type == "workProject"] | order(publishedAt desc) {
    _id,
    title,
    "slug": slug.current,
    summary,
    tags,
    publishedAt,
    "coverImageUrl": coverImage.asset->url,
    "clientName": client->name,
    "clientSlug": client->slug.current,
    category,
  }
`)

export const ORIGINALS_QUERY = defineQuery(`
  *[_type == "original"] | order(publishedAt desc) {
    _id,
    title,
    "slug": slug.current,
    description,
    format,
    tags,
    publishedAt,
    "coverImageUrl": coverImage.asset->url
  }
`)

export const SEARCH_WORK_QUERY = defineQuery(`
  *[_type == "workProject" && (
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
