import {defineArrayMember, defineField, defineType} from 'sanity'
import {YouTubePlaylistIdInput} from '../components/YouTubePlaylistIdInput'
import {YOUTUBE_PLAYLIST_ID_PATTERN} from '../lib/youtube-ids'
import {
  isInactiveOriginalBranch,
  isValidationHidden,
} from '../lib/validation-context'

const PLAYLIST_ID_PATTERN = YOUTUBE_PLAYLIST_ID_PATTERN

export const podcastSeries = defineType({
  name: 'podcastSeries',
  title: 'Podcast series',
  type: 'object',
  fields: [
    defineField({
      name: 'youtubePlaylistId',
      title: 'YouTube playlist',
      description:
        'Paste a playlist URL (list=PL…) or playlist ID. Then use Sync YouTube playlist below this field (or in document actions next to Publish) to import episodes.',
      type: 'string',
      components: {input: YouTubePlaylistIdInput},
      validation: (rule) =>
        rule.custom((value, context) => {
          if (isValidationHidden(context) || isInactiveOriginalBranch(context, 'podcastSeries')) {
            return true
          }
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
      description: 'When off, Sync YouTube playlist (below the playlist field) will refuse to run.',
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
      description:
        'Imported by Sync YouTube playlist. Weak refs so the series can publish even if an episode is still a draft.',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{type: 'originalEpisode'}],
          weak: true,
        }),
      ],
      validation: (rule) =>
        rule.custom((value, context) => {
          if (isValidationHidden(context) || isInactiveOriginalBranch(context, 'podcastSeries')) {
            return true
          }
          if (Array.isArray(value) && value.length > 0) return true
          return 'Sync or add at least one episode before publishing'
        }),
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
      validation: (rule) =>
        rule.custom((value, context) => {
          if (isValidationHidden(context) || isInactiveOriginalBranch(context, 'film')) {
            return true
          }
          if (!value) return 'Add the main film video'
          return true
        }),
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
              validation: (rule) =>
                rule.custom((value, context) => {
                  if (
                    isValidationHidden(context) ||
                    isInactiveOriginalBranch(context, 'articleSeries')
                  ) {
                    return true
                  }
                  return value ? true : 'Required'
                }),
            }),
            defineField({
              name: 'body',
              title: 'Body',
              type: 'blockContent',
              validation: (rule) =>
                rule.custom((value, context) => {
                  if (
                    isValidationHidden(context) ||
                    isInactiveOriginalBranch(context, 'articleSeries')
                  ) {
                    return true
                  }
                  return Array.isArray(value) && value.length > 0 ? true : 'Required'
                }),
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
      validation: (rule) =>
        rule.custom((value, context) => {
          if (isValidationHidden(context) || isInactiveOriginalBranch(context, 'articleSeries')) {
            return true
          }
          if (Array.isArray(value) && value.length > 0) return true
          return 'Add at least one chapter'
        }),
    }),
  ],
})
