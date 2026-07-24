import {defineField, defineType} from 'sanity'

export const originalEpisode = defineType({
  name: 'originalEpisode',
  title: 'Original episode',
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
      name: 'episodeNumber',
      title: 'Episode number',
      type: 'number',
      validation: (rule) => rule.integer().min(1),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
    }),
    defineField({
      name: 'thumbnail',
      title: 'Thumbnail',
      type: 'image',
      options: {hotspot: true},
      description: 'Optional override. Otherwise YouTube/Mux thumbnails are used.',
    }),
    defineField({
      name: 'media',
      title: 'Media',
      type: 'originalMedia',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'parent',
      title: 'Parent original',
      type: 'reference',
      to: [{type: 'original'}],
      description: 'The podcast series this episode belongs to.',
      weak: true,
    }),
    defineField({
      name: 'youtubeVideoId',
      title: 'YouTube video ID (sync key)',
      type: 'string',
      readOnly: true,
      hidden: ({document}) => {
        const media = document?.media as {mediaSource?: string; youtubeVideoId?: string} | undefined
        return media?.mediaSource !== 'youtube' && !document?.youtubeVideoId
      },
      description: 'Set by playlist sync for idempotent upserts. Prefer editing Media above.',
    }),
  ],
  orderings: [
    {
      title: 'Episode number',
      name: 'episodeNumberAsc',
      by: [{field: 'episodeNumber', direction: 'asc'}],
    },
    {
      title: 'Published date, newest',
      name: 'publishedAtDesc',
      by: [{field: 'publishedAt', direction: 'desc'}],
    },
  ],
  preview: {
    select: {
      title: 'title',
      episodeNumber: 'episodeNumber',
      media: 'thumbnail',
      youtubeVideoId: 'media.youtubeVideoId',
    },
    prepare({title, episodeNumber, media, youtubeVideoId}) {
      const ep = typeof episodeNumber === 'number' ? `Ep ${episodeNumber}` : 'Episode'
      return {
        title: title || 'Untitled episode',
        subtitle: youtubeVideoId ? `${ep} · ${youtubeVideoId}` : ep,
        media,
      }
    },
  },
})
