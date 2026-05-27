import { defineField, defineType } from 'sanity'
import { YouTubeVideoIdInput } from '../components/YouTubeVideoIdInput'

const YOUTUBE_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/

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
      options: { source: 'title', maxLength: 96 },
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
      name: 'youtubeVideoId',
      title: 'YouTube video',
      description: 'Paste a YouTube link or 11-character ID — stored as ID only',
      type: 'string',
      components: { input: YouTubeVideoIdInput },
      validation: (rule) =>
        rule.custom((value) => {
          if (!value) return true
          return YOUTUBE_ID_PATTERN.test(value)
            ? true
            : 'Must be a valid 11-character YouTube video ID'
        }),
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
      description: 'e.g. Film, Series, Short, Podcast',
      type: 'string',
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
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
      by: [{ field: 'publishedAt', direction: 'desc' }],
    },
  ],
  preview: {
    select: { title: 'title', subtitle: 'format', media: 'coverImage', publishedAt: 'publishedAt' },
    prepare({ title, subtitle, media, publishedAt }) {
      return {
        title,
        subtitle: publishedAt ? subtitle : `${subtitle ?? 'Original'} · Draft`,
        media,
      }
    },
  },
})
