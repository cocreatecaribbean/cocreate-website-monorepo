import {defineDocuments, defineLocations} from 'sanity/presentation'

export const WORK_INDEX_PATH = '/work'
export const HOME_PATH = '/'
export const ABOUT_PATH = '/about'

/**
 * One page document per marketing route.
 * Work projects / About testimonials are array sections — not sibling docs.
 */
export const mainDocuments = defineDocuments([
  {
    route: HOME_PATH,
    type: 'landingPage',
  },
  {
    route: WORK_INDEX_PATH,
    type: 'workPage',
  },
  {
    route: '/work/:slug',
    type: 'workPage',
  },
  {
    route: ABOUT_PATH,
    type: 'aboutPage',
  },
])

export const presentationLocations = {
  landingPage: defineLocations({
    select: {},
    resolve: () => ({
      locations: [
        {
          title: 'Home',
          href: HOME_PATH,
        },
      ],
    }),
  }),
  // Static /work only — do not select projects[] (heavy nested projection stalls "Resolving locations…").
  workPage: defineLocations({
    select: {},
    resolve: () => ({
      locations: [
        {
          title: 'Work',
          href: WORK_INDEX_PATH,
        },
      ],
    }),
  }),
  aboutPage: defineLocations({
    select: {},
    resolve: () => ({
      locations: [
        {
          title: 'About',
          href: ABOUT_PATH,
        },
      ],
    }),
  }),
  // Clients edited from project sections / Structure — not listed on Work
  client: defineLocations({
    select: {},
    resolve: () => ({locations: []}),
  }),
}
