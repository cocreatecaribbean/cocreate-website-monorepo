import {defineDocuments, defineLocations} from 'sanity/presentation'

export const WORK_INDEX_PATH = '/work'

export const mainDocuments = defineDocuments([
  {
    route: WORK_INDEX_PATH,
    filter: `_type == "workProject"`,
  },
  {
    route: '/work/:slug',
    filter: `_type == "workProject" && slug.current == $slug`,
  },
])

export const workProjectLocations = {
  workProject: defineLocations({
    select: {
      title: 'title',
      slug: 'slug.current',
    },
    resolve: (doc) => {
      const slug = doc?.slug
      if (!slug) {
        return {locations: []}
      }

      return {
        locations: [
          {
            title: doc?.title || 'Work project',
            href: `/work/${slug}`,
          },
          {
            title: 'Work index',
            href: WORK_INDEX_PATH,
          },
        ],
      }
    },
  }),
}

export const presentationLocations = {
  ...workProjectLocations,
}
