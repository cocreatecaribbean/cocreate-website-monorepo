import {defineField, defineType} from 'sanity'
import {ClientReferenceInput} from '../components/ClientReferenceInput'

const PROJECT_VIDEO_ROLES = [
  {title: 'Final ad', value: 'final_ad'},
  {title: 'Making of', value: 'making_of'},
  {title: 'Hero reel', value: 'hero_reel'},
  {title: 'Other', value: 'other'},
] as const

type WorkProjectParent = {
  publishedAt?: string
  coverImage?: {asset?: {_ref?: string}}
}

/**
 * Embedded Work project section (lives on workPage.projects[]).
 * Same fields as the former document — Add item on Work page creates one.
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
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        // Nested object: string source resolves on workPage (no title) — use parent
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
      description: 'Required to publish. Drafts can save without a cover.',
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
      name: 'caseStudy',
      title: 'Case study',
      description: 'Full project write-up shown on the project page',
      type: 'blockContent',
    }),
    defineField({
      name: 'gallery',
      title: 'Gallery',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'galleryItem',
          fields: [
            {
              name: 'image',
              title: 'Image',
              type: 'image',
              options: {hotspot: true},
              validation: (rule) => rule.required(),
            },
            {
              name: 'alt',
              title: 'Alt text',
              type: 'string',
            },
            {
              name: 'caption',
              title: 'Caption',
              type: 'string',
            },
          ],
          preview: {
            select: {title: 'caption', media: 'image'},
            prepare({title, media}) {
              return {title: title || 'Gallery image', media}
            },
          },
        },
      ],
    }),
    defineField({
      name: 'projectVideos',
      title: 'Project videos',
      description: 'Upload via Mux — final ads, making-of, hero reels',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'projectVideo',
          fields: [
            {
              name: 'role',
              title: 'Role',
              type: 'string',
              options: {list: PROJECT_VIDEO_ROLES, layout: 'radio'},
              validation: (rule) => rule.required(),
            },
            {
              name: 'title',
              title: 'Title',
              type: 'string',
            },
            {
              name: 'video',
              title: 'Video',
              type: 'mux.video',
              validation: (rule) => rule.required(),
            },
          ],
          preview: {
            select: {title: 'title', role: 'role', subtitle: 'video.asset.status'},
            prepare({title, role, subtitle}) {
              return {
                title: title || role || 'Video',
                subtitle: subtitle ?? role,
              }
            },
          },
        },
      ],
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
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
      description: 'Leave empty to keep as draft. Only published projects appear on the public site.',
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
