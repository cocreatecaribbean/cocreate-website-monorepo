import {defineField, defineType} from 'sanity'

/** Keep in sync with apps/web/site-info/about-page-data.ts + about-testimonials.mock.ts */
export const ABOUT_PAGE_DEFAULT_HERO_HEADING = 'Empowering Brands'
export const ABOUT_PAGE_DEFAULT_HERO_BODY =
  'Some clients come to us for a campaign. Others come for a rebrand, a product launch, public relations stories or a corporate transformation. The deliverables are different but our job is always the same:'
export const ABOUT_PAGE_DEFAULT_HERO_BODY_HIGHLIGHT =
  'helping people see your business the way it deserves to be seen.'
export const ABOUT_PAGE_DEFAULT_TESTIMONIALS_TITLE = 'What Clients Say'

export const aboutPage = defineType({
  name: 'aboutPage',
  title: 'About page',
  type: 'document',
  fields: [
    defineField({
      name: 'heroMediaType',
      title: 'Hero media type',
      description:
        'Image or Mux video for the About hero. Media itself is optional — empty uses the site default image.',
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
      description: 'Leave empty to use the site default About hero image.',
      type: 'image',
      options: {hotspot: true},
      hidden: ({parent}) => parent?.heroMediaType !== 'image',
    }),
    defineField({
      name: 'heroVideo',
      title: 'Hero video',
      description:
        'Upload via Mux when media type is Video. Leave empty to use the site default hero image.',
      type: 'mux.video',
      hidden: ({parent}) => parent?.heroMediaType !== 'video',
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
      name: 'heroBodyHighlight',
      title: 'Hero body highlight',
      description:
        'Closing line rendered with stronger emphasis under the body.',
      type: 'text',
      rows: 3,
      initialValue: ABOUT_PAGE_DEFAULT_HERO_BODY_HIGHLIGHT,
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
