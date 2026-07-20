import {defineArrayMember, defineField, defineType} from 'sanity'

export const projectOverview = defineType({
  name: 'projectOverview',
  title: 'Overview',
  type: 'object',
  fields: [
    defineField({
      name: 'categories',
      title: 'Categories',
      description: 'Pills under CATEGORY (e.g. Motion Graphics, Design)',
      type: 'array',
      of: [{type: 'string'}],
      options: {layout: 'tags'},
    }),
    defineField({
      name: 'industries',
      title: 'Industries',
      description: 'Pills under INDUSTRY (e.g. Banking, Finance)',
      type: 'array',
      of: [{type: 'string'}],
      options: {layout: 'tags'},
    }),
    defineField({
      name: 'body',
      title: 'Intro text',
      type: 'text',
      rows: 6,
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {body: 'body'},
    prepare({body}) {
      return {
        title: 'Overview',
        subtitle: typeof body === 'string' ? body.slice(0, 80) : undefined,
      }
    },
  },
})

export const mediaPair = defineType({
  name: 'mediaPair',
  title: 'Media pair',
  type: 'object',
  fields: [
    defineField({
      name: 'left',
      title: 'Left media',
      type: 'projectMedia',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'right',
      title: 'Right media',
      type: 'projectMedia',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    prepare() {
      return {title: 'Media pair', subtitle: 'Two-column media'}
    },
  },
})

export const impactCallout = defineType({
  name: 'impactCallout',
  title: 'Impact callout',
  type: 'object',
  fields: [
    defineField({
      name: 'headline',
      title: 'Headline',
      description: 'e.g. 100K VIEWS',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'subheadline',
      title: 'Subheadline',
      description: 'e.g. ACROSS ALL SOCIAL MEDIA PLATFORMS',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {title: 'headline', subtitle: 'subheadline'},
  },
})

export const textAndMedia = defineType({
  name: 'textAndMedia',
  title: 'Text and media',
  type: 'object',
  fields: [
    defineField({
      name: 'body',
      title: 'Text',
      type: 'text',
      rows: 8,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'media',
      title: 'Media',
      type: 'projectMedia',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'mediaPosition',
      title: 'Media position',
      type: 'string',
      options: {
        list: [
          {title: 'Media on the right', value: 'right'},
          {title: 'Media on the left', value: 'left'},
        ],
        layout: 'radio',
      },
      initialValue: 'right',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {body: 'body', mediaPosition: 'mediaPosition'},
    prepare({body, mediaPosition}) {
      return {
        title: 'Text and media',
        subtitle: [
          mediaPosition === 'left' ? 'Media left' : 'Media right',
          typeof body === 'string' ? body.slice(0, 48) : '',
        ]
          .filter(Boolean)
          .join(' · '),
      }
    },
  },
})

export const mediaBanner = defineType({
  name: 'mediaBanner',
  title: 'Media banner',
  type: 'object',
  fields: [
    defineField({
      name: 'media',
      title: 'Media',
      type: 'projectMedia',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    prepare() {
      return {title: 'Media banner', subtitle: 'Full-width media'}
    },
  },
})

export const shareBar = defineType({
  name: 'shareBar',
  title: 'Share bar',
  type: 'object',
  fields: [
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
      initialValue: 'Share on',
    }),
  ],
  preview: {
    select: {title: 'heading'},
    prepare({title}) {
      return {title: title || 'Share on', subtitle: 'Social share links'}
    },
  },
})

/** Members for workProject.sections page builder. */
export const projectSectionMembers = [
  defineArrayMember({type: 'projectOverview'}),
  defineArrayMember({type: 'mediaPair'}),
  defineArrayMember({type: 'impactCallout'}),
  defineArrayMember({type: 'textAndMedia'}),
  defineArrayMember({type: 'mediaBanner'}),
  defineArrayMember({type: 'shareBar'}),
]
