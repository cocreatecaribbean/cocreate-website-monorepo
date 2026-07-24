import {defineArrayMember, defineField, defineType} from 'sanity'
import {YouTubePlaylistIdInput} from '../components/YouTubePlaylistIdInput'

const PLAYLIST_ID_PATTERN = /^PL[\w-]{16,}$/i

export const podcastSeries = defineType({
  name: 'podcastSeries',
  title: 'Podcast series',
  type: 'object',
  fields: [
    defineField({
      name: 'youtubePlaylistId',
      title: 'YouTube playlist',
      description: 'Paste a playlist URL or ID. Use “Sync YouTube playlist” to import episodes.',
      type: 'string',
      components: {input: YouTubePlaylistIdInput},
      validation: (rule) =>
        rule.custom((value) => {
          if (!value) return true
          return PLAYLIST_ID_PATTERN.test(value)
            ? true
            : 'Must be a valid YouTube playlist ID (PL…)'
        }),
    }),
    defineField({
      name: 'syncEnabled',
      title: 'Allow playlist sync',
      type: 'boolean',
      initialValue: true,
      description: 'When off, the Studio sync action will refuse to run.',
    }),
    defineField({
      name: 'lastSyncedAt',
      title: 'Last synced at',
      type: 'datetime',
      readOnly: true,
    }),
    defineField({
      name: 'episodes',
      title: 'Episodes',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{type: 'originalEpisode'}],
        }),
      ],
    }),
  ],
})

export const filmContent = defineType({
  name: 'filmContent',
  title: 'Film',
  type: 'object',
  fields: [
    defineField({
      name: 'media',
      title: 'Main video',
      type: 'originalMedia',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'trailer',
      title: 'Trailer (optional)',
      type: 'originalMedia',
    }),
  ],
})

export const articleSeries = defineType({
  name: 'articleSeries',
  title: 'Article series',
  type: 'object',
  fields: [
    defineField({
      name: 'chapters',
      title: 'Chapters',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'articleChapter',
          title: 'Chapter',
          fields: [
            defineField({
              name: 'title',
              title: 'Title',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'body',
              title: 'Body',
              type: 'blockContent',
              validation: (rule) => rule.required(),
            }),
          ],
          preview: {
            select: {title: 'title'},
            prepare({title}) {
              return {title: title || 'Untitled chapter'}
            },
          },
        }),
      ],
      validation: (rule) => rule.min(1),
    }),
  ],
})
