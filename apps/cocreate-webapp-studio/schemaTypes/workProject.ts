import { defineField, defineType } from 'sanity'

const PROJECT_VIDEO_ROLES = [
  { title: 'Final ad', value: 'final_ad' },
  { title: 'Making of', value: 'making_of' },
  { title: 'Hero reel', value: 'hero_reel' },
  { title: 'Other', value: 'other' },
] as const

export const workProject = defineType({
  name: 'workProject',
  title: 'Work Project',
  type: 'document',
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
      options: { source: 'title', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'client',
      title: 'Client',
      type: 'reference',
      to: [{ type: 'client' }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover image',
      type: 'image',
      options: { hotspot: true },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'Production', value: 'Production' },
          { title: 'Digital', value: 'Digital' },
          { title: 'PR & Communications', value: 'PR & Communications' },
          { title: 'Brands & Strategy', value: 'Brands & Strategy' },
          { title: 'Talent', value: 'Talent' },
          { title: 'Analytics', value: 'Analytics' },
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
              options: { hotspot: true },
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
            select: { title: 'caption', media: 'image' },
            prepare({ title, media }) {
              return { title: title || 'Gallery image', media }
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
              options: { list: PROJECT_VIDEO_ROLES, layout: 'radio' },
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
            select: { title: 'title', role: 'role', subtitle: 'video.asset.status' },
            prepare({ title, role, subtitle }) {
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
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
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
      description: 'Leave empty to keep as draft. Only published projects appear on the site.',
      type: 'datetime',
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'object',
      options: { collapsible: true, collapsed: true },
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
  orderings: [
    {
      title: 'Published date, newest',
      name: 'publishedAtDesc',
      by: [{ field: 'publishedAt', direction: 'desc' }],
    },
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'client.name',
      description: 'category',
      media: 'coverImage',
      publishedAt: 'publishedAt',
    },
    prepare({ title, subtitle, description, media, publishedAt }) {
      return {
        title,
        subtitle: publishedAt ? `${subtitle} · ${description}` : `${subtitle} · Draft`,
        media,
      }
    },
  },
})
