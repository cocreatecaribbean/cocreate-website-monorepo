import {defineField, defineType} from 'sanity'

/** Keep in sync with apps/web/site-info/about-page-data.ts + about-testimonials.mock.ts */
export const ABOUT_PAGE_DEFAULT_HERO_HEADING = 'Empowering Brands'
export const ABOUT_PAGE_DEFAULT_HERO_BODY =
  'COCREATE Caribbean bridges the gap between Caribbean brands and their audiences through strategic storytelling, innovative design, and immersive digital experiences. From motion graphics that simplify complex ideas to web platforms that foster real engagement, we blend technical expertise with a deep understanding of the market to help businesses shine in their industries.'
export const ABOUT_PAGE_DEFAULT_TESTIMONIALS_TITLE = 'What Clients Say'

export const aboutPage = defineType({
  name: 'aboutPage',
  title: 'About page',
  type: 'document',
  fields: [
    defineField({
      name: 'heroMediaType',
      title: 'Hero media type',
      description: 'Use an image or a Mux video for the About hero visual.',
      type: 'string',
      options: {
        list: [
          {title: 'Image', value: 'image'},
          {title: 'Video', value: 'video'},
        ],
        layout: 'radio',
      },
      initialValue: 'image',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'heroImage',
      title: 'Hero image',
      type: 'image',
      options: {hotspot: true},
      hidden: ({parent}) => parent?.heroMediaType !== 'image',
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as {heroMediaType?: string} | undefined
          if (parent?.heroMediaType === 'image' && !value?.asset) {
            return 'Add a hero image'
          }
          return true
        }),
    }),
    defineField({
      name: 'heroVideo',
      title: 'Hero video',
      description: 'Upload via Mux. Shown when media type is Video.',
      type: 'mux.video',
      hidden: ({parent}) => parent?.heroMediaType !== 'video',
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as {heroMediaType?: string} | undefined
          if (parent?.heroMediaType === 'video' && !value) {
            return 'Add a Mux hero video'
          }
          return true
        }),
    }),
    defineField({
      name: 'heroHeading',
      title: 'Hero heading',
      type: 'string',
      initialValue: ABOUT_PAGE_DEFAULT_HERO_HEADING,
    }),
    defineField({
      name: 'heroBody',
      title: 'Hero body',
      type: 'text',
      rows: 6,
      initialValue: ABOUT_PAGE_DEFAULT_HERO_BODY,
    }),
    defineField({
      name: 'testimonialsTitle',
      title: 'Testimonials section title',
      type: 'string',
      initialValue: ABOUT_PAGE_DEFAULT_TESTIMONIALS_TITLE,
    }),
    defineField({
      name: 'testimonials',
      title: 'Testimonials',
      description:
        'Each quote is a section on this page. Use Add item at the bottom. Array order = carousel order.',
      type: 'array',
      of: [{type: 'aboutTestimonial'}],
    }),
    defineField({
      name: 'testimonialsMigratedFromDocuments',
      title: 'Testimonials migrated',
      type: 'boolean',
      hidden: true,
      readOnly: true,
    }),
  ],
  preview: {
    prepare() {
      return {title: 'About page'}
    },
  },
})
