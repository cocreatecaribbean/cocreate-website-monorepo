import {createElement} from 'react'
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {presentationTool} from 'sanity/presentation'
import {muxInput} from 'sanity-plugin-mux-input'
import {schemaTypes} from './schemaTypes'
import {structure} from './structure'
import {dataset, previewOrigin, projectId} from './env'
import {StudioNavbar} from './components/StudioNavbar'
import {mainDocuments, presentationLocations} from './presentation/resolve'
import {ensurePageSingletonsPlugin} from './plugins/ensure-page-singletons'
import {LANDING_PAGE_DEFAULT_AGENCY_INTRO} from './schemaTypes/landingPage'
import {
  ABOUT_PAGE_DEFAULT_HERO_BODY,
  ABOUT_PAGE_DEFAULT_HERO_BODY_HIGHLIGHT,
  ABOUT_PAGE_DEFAULT_HERO_HEADING,
  ABOUT_PAGE_DEFAULT_TESTIMONIALS_TITLE,
} from './schemaTypes/aboutPage'
import {
  WORK_PAGE_DEFAULT_TITLE_LINE_ONE,
  WORK_PAGE_DEFAULT_TITLE_LINE_TWO,
} from './schemaTypes/workPage'

const PAGE_SINGLETON_TEMPLATE_IDS = new Set(['landingPage', 'workPage', 'aboutPage'])

export default defineConfig({
  name: 'default',
  title: `CoCreate — ${dataset}`,

  projectId,
  dataset,

  plugins: [
    structureTool({structure}),
    presentationTool({
      previewUrl: {
        initial: `${previewOrigin}/`,
        previewMode: {
          enable: '/api/draft',
          disable: '/api/draft/disable',
        },
      },
      allowOrigins: [previewOrigin],
      resolve: {
        mainDocuments,
        locations: presentationLocations,
      },
    }),
    muxInput(),
    visionTool(),
    ensurePageSingletonsPlugin(),
  ],

  schema: {
    types: schemaTypes,
    templates: (prev) => [
      {
        id: 'landingPage',
        title: 'Landing page',
        schemaType: 'landingPage',
        value: {
          _id: 'landingPage',
          agencyIntro: LANDING_PAGE_DEFAULT_AGENCY_INTRO,
        },
      },
      {
        id: 'workPage',
        title: 'Work page',
        schemaType: 'workPage',
        value: {
          _id: 'workPage',
          titleLineOne: WORK_PAGE_DEFAULT_TITLE_LINE_ONE,
          titleLineTwo: WORK_PAGE_DEFAULT_TITLE_LINE_TWO,
          projects: [],
        },
      },
      {
        id: 'aboutPage',
        title: 'About page',
        schemaType: 'aboutPage',
        value: {
          _id: 'aboutPage',
          heroMediaType: 'image',
          heroHeading: ABOUT_PAGE_DEFAULT_HERO_HEADING,
          heroBody: ABOUT_PAGE_DEFAULT_HERO_BODY,
          heroBodyHighlight: ABOUT_PAGE_DEFAULT_HERO_BODY_HIGHLIGHT,
          testimonialsTitle: ABOUT_PAGE_DEFAULT_TESTIMONIALS_TITLE,
          testimonials: [],
        },
      },
      ...prev.filter(
        (template) =>
          template.schemaType !== 'landingPage' &&
          template.schemaType !== 'workPage' &&
          template.schemaType !== 'workProject' &&
          template.schemaType !== 'aboutPage' &&
          template.schemaType !== 'aboutTestimonial' &&
          template.schemaType !== 'testimonial',
      ),
    ],
  },

  document: {
    newDocumentOptions: (prev, {creationContext}) => {
      if (creationContext.type === 'global') {
        return prev.filter((template) => !PAGE_SINGLETON_TEMPLATE_IDS.has(template.templateId))
      }
      return prev
    },
  },

  studio: {
    components: {
      navbar: (props) => createElement(StudioNavbar, {...props, dataset}),
    },
  },
})
