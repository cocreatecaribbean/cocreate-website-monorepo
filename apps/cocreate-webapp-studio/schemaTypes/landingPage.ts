import { defineField, defineType } from 'sanity'

/** Keep in sync with apps/web/site-info/landing-page-defaults.ts */
export const LANDING_PAGE_DEFAULT_AGENCY_INTRO =
  'We are a collective of independent creative professionals, flipping the traditional agency model to deliver transformational creativity.'

export const landingPage = defineType({
  name: 'landingPage',
  title: 'Landing page',
  type: 'document',
  fields: [
    defineField({
      name: 'heroReel',
      title: 'Hero reel',
      description: 'Homepage background reel. Upload via Mux. Leave empty to use the site default MP4.',
      type: 'mux.video',
    }),
    defineField({
      name: 'agencyIntro',
      title: 'Agency intro',
      description:
        'Paragraph under the hero (e.g. “We are a collective…”). Leave empty to use the site default copy.',
      type: 'text',
      rows: 4,
      initialValue: LANDING_PAGE_DEFAULT_AGENCY_INTRO,
    }),
  ],
  preview: {
    prepare() {
      return { title: 'Landing page' }
    },
  },
})
