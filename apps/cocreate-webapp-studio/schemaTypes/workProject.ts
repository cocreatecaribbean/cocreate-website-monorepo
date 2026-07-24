import {defineField, defineType} from 'sanity'
import {ClientReferenceInput} from '../components/ClientReferenceInput'
import {brandColorsField, brandFillFields} from './brandFillFields'
import {projectSectionMembers} from './projectSections'

type WorkProjectParent = {
  publishedAt?: string
  coverImage?: {asset?: {_ref?: string}}
  hero?: {
    mediaType?: string
    image?: {asset?: {_ref?: string}}
    video?: {asset?: {_ref?: string}}
  }
}

/**
 * Embedded Work project section (lives on workPage.projects[]).
 * Detail page layout is modular via `sections[]`.
 */
export const workProject = defineType({
  name: 'workProject',
  title: 'Project',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Project name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    brandColorsField,
    ...brandFillFields({
      prefix: 'title',
      label: 'Project name',
      modeDescription:
        'Default keeps the CoCreate gradient. Solid or gradient uses brand colors.',
    }),
    ...brandFillFields({
      prefix: 'client',
      label: 'Client name',
      modeDescription:
        'Default keeps muted San Marino. Solid or gradient uses brand colors.',
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: (_doc, {parent}) =>
          (parent as {title?: string} | undefined)?.title?.trim() || '',
        maxLength: 96,
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'client',
      title: 'Client',
      type: 'reference',
      to: [{type: 'client'}],
      validation: (rule) => rule.required(),
      components: {input: ClientReferenceInput},
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover image',
      description: 'Used on the Work index and home gallery. Required to publish.',
      type: 'image',
      options: {hotspot: true},
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as WorkProjectParent | undefined
          if (parent?.publishedAt && !value?.asset) {
            return 'Add a cover image before publishing'
          }
          return true
        }),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      description: 'Primary service filter on the Work index',
      type: 'string',
      options: {
        list: [
          {title: 'Production', value: 'Production'},
          {title: 'Digital', value: 'Digital'},
          {title: 'PR & Communications', value: 'PR & Communications'},
          {title: 'Brands & Strategy', value: 'Brands & Strategy'},
          {title: 'Talent', value: 'Talent'},
          {title: 'Analytics', value: 'Analytics'},
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'summary',
      title: 'Summary',
      description: 'Short line for cards and search snippets',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'hero',
      title: 'Project heading — hero media',
      description:
        'Full-width hero below the project title on the detail page. Image or Mux video.',
      type: 'object',
      fields: [
        defineField({
          name: 'mediaType',
          title: 'Media type',
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
          name: 'image',
          title: 'Hero image',
          type: 'image',
          options: {hotspot: true},
          hidden: ({parent}) => parent?.mediaType !== 'image',
        }),
        defineField({
          name: 'video',
          title: 'Hero video',
          type: 'mux.video',
          hidden: ({parent}) => parent?.mediaType !== 'video',
        }),
        defineField({
          name: 'alt',
          title: 'Alt text',
          type: 'string',
        }),
      ],
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as WorkProjectParent | undefined
          if (!parent?.publishedAt) return true
          const hero = value as WorkProjectParent['hero'] | undefined
          if (!hero?.mediaType) {
            return 'Add hero media before publishing'
          }
          if (hero.mediaType === 'image' && !hero.image?.asset) {
            return 'Add a hero image before publishing'
          }
          if (hero.mediaType === 'video' && !hero.video?.asset) {
            return 'Add a hero video before publishing'
          }
          return true
        }),
    }),
    defineField({
      name: 'sections',
      title: 'Page sections',
      description:
        'Build the project detail page. Drag to reorder. Not every project needs every section type.',
      type: 'array',
      of: projectSectionMembers,
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      description: 'Used for Work index filters and search',
      type: 'array',
      of: [{type: 'string'}],
      options: {layout: 'tags'},
    }),
    defineField({
      name: 'featured',
      title: 'Featured on home',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published at',
      description:
        'Leave empty to keep as draft. Only published projects appear on the public site.',
      type: 'datetime',
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'object',
      options: {collapsible: true, collapsed: true},
      fields: [
        {
          name: 'metaTitle',
          title: 'Meta title',
          type: 'string',
        },
        {
          name: 'metaDescription',
          title: 'Meta description',
          type: 'text',
          rows: 3,
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'client.name',
      description: 'category',
      media: 'coverImage',
      publishedAt: 'publishedAt',
    },
    prepare({title, subtitle, description, media, publishedAt}) {
      const clientLabel = subtitle || 'No client'
      return {
        title: title || 'Untitled project',
        subtitle: publishedAt ? `${clientLabel} · ${description}` : `${clientLabel} · Draft`,
        ...(media ? {media} : {}),
      }
    },
  },
})
