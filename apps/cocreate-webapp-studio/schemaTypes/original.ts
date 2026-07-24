import {defineField, defineType} from 'sanity'

export const original = defineType({
  name: 'original',
  title: 'Original',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'title', maxLength: 96},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover image',
      type: 'image',
      options: {hotspot: true},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'format',
      title: 'Format',
      description: 'Display label e.g. Film, Series, Short, Podcast',
      type: 'string',
    }),
    defineField({
      name: 'contentKind',
      title: 'Content type',
      description: 'Determines the detail structure on /originals/[slug]',
      type: 'string',
      options: {
        list: [
          {title: 'Podcast series', value: 'podcastSeries'},
          {title: 'Film', value: 'film'},
          {title: 'Article series', value: 'articleSeries'},
        ],
        layout: 'radio',
      },
      initialValue: 'film',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'podcastSeries',
      title: 'Podcast series',
      type: 'podcastSeries',
      hidden: ({document}) => document?.contentKind !== 'podcastSeries',
    }),
    defineField({
      name: 'film',
      title: 'Film',
      type: 'filmContent',
      hidden: ({document}) => document?.contentKind !== 'film',
      validation: (rule) =>
        rule.custom((value, context) => {
          const doc = context.document as {contentKind?: string} | undefined
          if (doc?.contentKind !== 'film') return true
          if (!(value as {media?: unknown} | undefined)?.media) {
            return 'Add the main film video'
          }
          return true
        }),
    }),
    defineField({
      name: 'articleSeries',
      title: 'Article series',
      type: 'articleSeries',
      hidden: ({document}) => document?.contentKind !== 'articleSeries',
      validation: (rule) =>
        rule.custom((value, context) => {
          const doc = context.document as {contentKind?: string} | undefined
          if (doc?.contentKind !== 'articleSeries') return true
          const chapters = (value as {chapters?: unknown[]} | undefined)?.chapters
          if (!chapters?.length) return 'Add at least one chapter'
          return true
        }),
    }),
    defineField({
      name: 'youtubeVideoId',
      title: 'YouTube video (legacy)',
      description:
        'Deprecated — migrated into Film media. Kept for existing documents until re-saved.',
      type: 'string',
      hidden: true,
      readOnly: true,
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{type: 'string'}],
      options: {layout: 'tags'},
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published at',
      description: 'Leave empty to keep as draft. Only published originals appear on the site.',
      type: 'datetime',
    }),
  ],
  orderings: [
    {
      title: 'Published date, newest',
      name: 'publishedAtDesc',
      by: [{field: 'publishedAt', direction: 'desc'}],
    },
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'format',
      contentKind: 'contentKind',
      media: 'coverImage',
      publishedAt: 'publishedAt',
    },
    prepare({title, subtitle, contentKind, media, publishedAt}) {
      const kindLabel =
        contentKind === 'podcastSeries'
          ? 'Podcast'
          : contentKind === 'articleSeries'
            ? 'Articles'
            : contentKind === 'film'
              ? 'Film'
              : 'Original'
      const format = subtitle || kindLabel
      return {
        title,
        subtitle: publishedAt ? format : `${format} · Draft`,
        media,
      }
    },
  },
})
