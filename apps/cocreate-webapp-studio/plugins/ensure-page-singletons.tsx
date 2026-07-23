import {useEffect, useRef} from 'react'
import {definePlugin, useClient, type LayoutProps} from 'sanity'
import {
  ABOUT_PAGE_DEFAULT_HERO_BODY,
  ABOUT_PAGE_DEFAULT_HERO_BODY_HIGHLIGHT,
  ABOUT_PAGE_DEFAULT_HERO_HEADING,
  ABOUT_PAGE_DEFAULT_TESTIMONIALS_TITLE,
} from '../schemaTypes/aboutPage'
import {LANDING_PAGE_DEFAULT_AGENCY_INTRO} from '../schemaTypes/landingPage'
import {
  WORK_PAGE_DEFAULT_TITLE_LINE_ONE,
  WORK_PAGE_DEFAULT_TITLE_LINE_TWO,
} from '../schemaTypes/workPage'

const API_VERSION = '2025-02-19'
const STARTER_CLIENT_ID = 'client-starter'
const PROJECTS_MIGRATION_FLAG = 'projectsMigratedFromDocuments'
const TESTIMONIALS_MIGRATION_FLAG = 'testimonialsMigratedFromDocuments'

type ClientRef = {_type?: string; _ref?: string}

type LegacyProjectDoc = {
  _id: string
  _type: string
  title?: string
  slug?: {current?: string}
  client?: ClientRef | null
  coverImage?: unknown
  category?: string
  sortOrder?: number | null
  summary?: string
  caseStudy?: unknown
  gallery?: unknown
  projectVideos?: unknown
  tags?: string[]
  featured?: boolean
  publishedAt?: string
  seo?: unknown
  clientName?: string
  clientSlug?: string
  clientLogo?: unknown
}

type EmbeddedProject = {
  _key?: string
  client?: ClientRef | null
  coverImage?: unknown
  [key: string]: unknown
}

type LegacyTestimonialDoc = {
  _id: string
  _type: string
  name?: string
  company?: string
  quote?: string
  photo?: unknown
  sortOrder?: number | null
}

function isValidClientRef(value: unknown): value is {_type: 'reference'; _ref: string} {
  if (!value || typeof value !== 'object') return false
  const ref = value as ClientRef
  return typeof ref._ref === 'string' && ref._ref.trim().length > 0
}

function omitNullishFields<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) continue
    out[key] = value
  }
  return out as Partial<T>
}

function toEmbeddedProject(doc: LegacyProjectDoc) {
  const {
    _id,
    _type: _ignoredType,
    sortOrder: _ignoredOrder,
    client,
    clientName: _cn,
    clientSlug: _cs,
    clientLogo: _cl,
    ...fields
  } = doc

  const embedded: Record<string, unknown> = {
    _type: 'workProject',
    _key: _id.replace(/^drafts\./, '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64) || undefined,
    ...omitNullishFields(fields as Record<string, unknown>),
    featured: fields.featured ?? false,
    category: fields.category ?? 'Digital',
  }

  if (isValidClientRef(client)) {
    embedded.client = {_type: 'reference', _ref: client._ref}
  }

  return embedded
}

function toEmbeddedTestimonial(doc: LegacyTestimonialDoc) {
  const publishedId = doc._id.replace(/^drafts\./, '')
  return omitNullishFields({
    _type: 'aboutTestimonial',
    _key: publishedId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64) || undefined,
    name: doc.name,
    company: doc.company,
    quote: doc.quote,
    photo: doc.photo,
  })
}

function nullClientUnsetPaths(projects: EmbeddedProject[] | null | undefined): string[] {
  if (!projects?.length) return []
  const paths: string[] = []
  for (const project of projects) {
    if (!project?._key) continue
    if (project.client === null || (project.client !== undefined && !isValidClientRef(project.client))) {
      paths.push(`projects[_key=="${project._key}"].client`)
    }
    if (project.coverImage === null) {
      paths.push(`projects[_key=="${project._key}"].coverImage`)
    }
  }
  return paths
}

/**
 * Ensures Home/Work/About singletons exist, migrates legacy workProject and
 * testimonial documents into embedded arrays once, then deletes the orphans.
 * Also strips stored `client: null` (schema expects reference or absent — not null).
 */
function EnsurePageSingletons() {
  const client = useClient({apiVersion: API_VERSION})
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    void (async () => {
      try {
        await Promise.all([
          client.createIfNotExists({
            _id: 'landingPage',
            _type: 'landingPage',
            agencyIntro: LANDING_PAGE_DEFAULT_AGENCY_INTRO,
          }),
          client.createIfNotExists({
            _id: 'workPage',
            _type: 'workPage',
            titleLineOne: WORK_PAGE_DEFAULT_TITLE_LINE_ONE,
            titleLineTwo: WORK_PAGE_DEFAULT_TITLE_LINE_TWO,
            projects: [],
          }),
          client.createIfNotExists({
            _id: 'aboutPage',
            _type: 'aboutPage',
            heroMediaType: 'image',
            heroHeading: ABOUT_PAGE_DEFAULT_HERO_HEADING,
            heroBody: ABOUT_PAGE_DEFAULT_HERO_BODY,
            heroBodyHighlight: ABOUT_PAGE_DEFAULT_HERO_BODY_HIGHLIGHT,
            testimonialsTitle: ABOUT_PAGE_DEFAULT_TESTIMONIALS_TITLE,
            testimonials: [],
          }),
          client.createIfNotExists({
            _id: STARTER_CLIENT_ID,
            _type: 'client',
            name: 'Untitled client',
            slug: {_type: 'slug', current: 'untitled-client'},
          }),
        ])

        const workPage = await client.fetch<{
          _id: string
          projects?: EmbeddedProject[]
          [PROJECTS_MIGRATION_FLAG]?: boolean
        } | null>(
          `*[_type == "workPage" && (_id == "workPage" || _id == "drafts.workPage")] | order(_updatedAt desc)[0]{
            _id,
            projects[]{ _key, client, coverImage },
            ${PROJECTS_MIGRATION_FLAG}
          }`,
        )

        const legacyDocs = await client.fetch<LegacyProjectDoc[]>(
          `*[_type == "workProject"] | order(sortOrder asc, _updatedAt desc) {
            _id,
            _type,
            title,
            slug,
            client,
            coverImage,
            category,
            sortOrder,
            summary,
            caseStudy,
            gallery,
            projectVideos,
            tags,
            featured,
            publishedAt,
            seo,
            clientName,
            clientSlug,
            clientLogo
          }`,
        )

        const alreadyMigrated = Boolean(workPage?.[PROJECTS_MIGRATION_FLAG])
        const hasProjects = (workPage?.projects?.length ?? 0) > 0

        if (legacyDocs.length > 0 && !alreadyMigrated && !hasProjects) {
          const byPublished = new Map<string, LegacyProjectDoc>()
          for (const doc of legacyDocs) {
            const publishedId = doc._id.replace(/^drafts\./, '')
            const existing = byPublished.get(publishedId)
            if (!existing || doc._id.startsWith('drafts.')) {
              byPublished.set(publishedId, doc)
            }
          }

          const projects = [...byPublished.values()]
            .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
            .map(toEmbeddedProject)

          const targetId = workPage?._id?.startsWith('drafts.') ? 'drafts.workPage' : 'workPage'

          await client
            .patch(targetId)
            .set({
              projects,
              [PROJECTS_MIGRATION_FLAG]: true,
            })
            .commit({autoGenerateArrayKeys: true})

          // Never setIfMissing({projects: []}) on published — that stamped an empty
          // array when only the draft was migrated and made projects look wiped.
          if (targetId.startsWith('drafts.')) {
            await client
              .patch('workPage')
              .set({[PROJECTS_MIGRATION_FLAG]: true})
              .commit()
              .catch(() => undefined)
          }

          await Promise.all(
            legacyDocs.map((doc) => client.delete(doc._id).catch(() => undefined)),
          )
        } else if (legacyDocs.length > 0 && (alreadyMigrated || hasProjects)) {
          await Promise.all(
            legacyDocs.map((doc) => client.delete(doc._id).catch(() => undefined)),
          )
          if (workPage && !alreadyMigrated) {
            await client
              .patch(workPage._id)
              .set({[PROJECTS_MIGRATION_FLAG]: true})
              .commit()
              .catch(() => undefined)
          }
        } else if (workPage && !alreadyMigrated && hasProjects) {
          await client
            .patch(workPage._id)
            .set({[PROJECTS_MIGRATION_FLAG]: true})
            .commit()
            .catch(() => undefined)
        }

        // Strip stored null/invalid client (and null coverImage) — causes Studio type errors
        const pagesToClean = await client.fetch<Array<{_id: string; projects?: EmbeddedProject[]}>>(
          `*[_type == "workPage" && (_id == "workPage" || _id == "drafts.workPage")]{
            _id,
            projects[]{ _key, client, coverImage }
          }`,
        )

        for (const page of pagesToClean) {
          const paths = nullClientUnsetPaths(page.projects)
          if (paths.length === 0) continue
          await client.patch(page._id).unset(paths).commit().catch((error) => {
            console.warn('[ensure-page-singletons] Failed to clear null client refs:', error)
          })
        }

        // Migrate legacy standalone testimonial documents into aboutPage.testimonials
        const aboutPage = await client.fetch<{
          _id: string
          testimonials?: unknown[]
          [TESTIMONIALS_MIGRATION_FLAG]?: boolean
        } | null>(
          `*[_type == "aboutPage" && (_id == "aboutPage" || _id == "drafts.aboutPage")] | order(_updatedAt desc)[0]{
            _id,
            testimonials[]{ _key },
            ${TESTIMONIALS_MIGRATION_FLAG}
          }`,
        )

        const legacyTestimonials = await client.fetch<LegacyTestimonialDoc[]>(
          `*[_type == "testimonial"] | order(sortOrder asc, name asc) {
            _id,
            _type,
            name,
            company,
            quote,
            photo,
            sortOrder
          }`,
        )

        const testimonialsMigrated = Boolean(aboutPage?.[TESTIMONIALS_MIGRATION_FLAG])
        const hasTestimonials = (aboutPage?.testimonials?.length ?? 0) > 0

        if (legacyTestimonials.length > 0 && !testimonialsMigrated && !hasTestimonials) {
          const byPublished = new Map<string, LegacyTestimonialDoc>()
          for (const doc of legacyTestimonials) {
            const publishedId = doc._id.replace(/^drafts\./, '')
            const existing = byPublished.get(publishedId)
            if (!existing || doc._id.startsWith('drafts.')) {
              byPublished.set(publishedId, doc)
            }
          }

          const testimonials = [...byPublished.values()]
            .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
            .map(toEmbeddedTestimonial)

          const targetId = aboutPage?._id?.startsWith('drafts.')
            ? 'drafts.aboutPage'
            : 'aboutPage'

          await client
            .patch(targetId)
            .set({
              testimonials,
              [TESTIMONIALS_MIGRATION_FLAG]: true,
            })
            .commit({autoGenerateArrayKeys: true})

          // Never setIfMissing({testimonials: []}) on published after draft-only migrate
          if (targetId.startsWith('drafts.')) {
            await client
              .patch('aboutPage')
              .set({[TESTIMONIALS_MIGRATION_FLAG]: true})
              .commit()
              .catch(() => undefined)
          }

          await Promise.all(
            legacyTestimonials.map((doc) => client.delete(doc._id).catch(() => undefined)),
          )
        } else if (legacyTestimonials.length > 0 && (testimonialsMigrated || hasTestimonials)) {
          await Promise.all(
            legacyTestimonials.map((doc) => client.delete(doc._id).catch(() => undefined)),
          )
          if (aboutPage && !testimonialsMigrated) {
            await client
              .patch(aboutPage._id)
              .set({[TESTIMONIALS_MIGRATION_FLAG]: true})
              .commit()
              .catch(() => undefined)
          }
        } else if (aboutPage && !testimonialsMigrated && hasTestimonials) {
          await client
            .patch(aboutPage._id)
            .set({[TESTIMONIALS_MIGRATION_FLAG]: true})
            .commit()
            .catch(() => undefined)
        }
      } catch (error) {
        console.warn('[ensure-page-singletons] Failed to ensure CMS defaults:', error)
      }
    })()
  }, [client])

  return null
}

function EnsurePageSingletonsLayout(props: LayoutProps) {
  return (
    <>
      <EnsurePageSingletons />
      {props.renderDefault(props)}
    </>
  )
}

export const ensurePageSingletonsPlugin = definePlugin({
  name: 'ensure-page-singletons',
  studio: {
    components: {
      layout: EnsurePageSingletonsLayout,
    },
  },
})
