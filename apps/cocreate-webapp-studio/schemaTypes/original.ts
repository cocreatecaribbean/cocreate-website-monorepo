import {defineField, defineType} from 'sanity'
import {CautionRequiredField} from '../components/CautionRequiredField'
import {OriginalDocumentInput} from '../components/OriginalDocumentInput'
import {PublishedAtField} from '../components/PublishedAtInput'
import {brandColorsField, brandFillFields} from './brandFillFields'

export const original = defineType({
  name: 'original',
  title: 'Original',
  type: 'document',
  components: {
    input: OriginalDocumentInput,
  },
  validation: (rule) =>
    rule.custom((doc) => {
      if (!doc || typeof doc !== 'object') return true
      const row = doc as {
        contentKind?: string
        title?: string
        slug?: {current?: string}
        coverImage?: {asset?: {_ref?: string}}
        podcastSeries?: {episodes?: unknown[]}
        film?: {media?: unknown}
        articleSeries?: {chapters?: unknown[]}
      }

      if (!row.title?.trim()) {
        return {message: 'Add a title', path: ['title']}
      }
      if (!row.slug?.current?.trim()) {
        return {message: 'Add a slug', path: ['slug']}
      }
      if (!row.coverImage?.asset?._ref) {
        return {message: 'Add a cover image', path: ['coverImage']}
      }
      if (row.contentKind === 'podcastSeries') {
        if (!row.podcastSeries?.episodes?.length) {
          return {
            message: 'Sync or add at least one episode before publishing',
            path: ['podcastSeries', 'episodes'],
          }
        }
      }
      if (row.contentKind === 'film' && !row.film?.media) {
        return {message: 'Add the main film video', path: ['film', 'media']}
      }
      if (row.contentKind === 'articleSeries' && !row.articleSeries?.chapters?.length) {
        return {
          message: 'Add at least one chapter',
          path: ['articleSeries', 'chapters'],
        }
      }
      return true
    }),
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
      components: {field: CautionRequiredField},
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'title', maxLength: 96},
      validation: (rule) => rule.required(),
      description: 'URL path under /originals/',
      components: {field: CautionRequiredField},
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover image (image only)',
      description:
        'Still image for cards and listings — videos are not accepted. Use Main video / media for video.',
      type: 'image',
      options: {hotspot: true},
      validation: (rule) => rule.required(),
      components: {field: CautionRequiredField},
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      description:
        'Series or film mark shown on Featured Originals cards and podcast detail (separate from cover).',
      type: 'image',
      options: {hotspot: true},
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
          if ((context as {hidden?: boolean}).hidden) return true
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
          if ((context as {hidden?: boolean}).hidden) return true
          const chapters = (value as {chapters?: unknown[]} | undefined)?.chapters
          if (!chapters?.length) return 'Add at least one chapter'
          return true
        }),
    }),
    brandColorsField,
    ...brandFillFields({
      prefix: 'videoTitle',
      label: 'Video title',
      modeDescription:
        'Default uses a warm brown. Solid or gradient uses brand colors on episode titles.',
    }),
    ...brandFillFields({
      prefix: 'playlistSidebar',
      label: 'Playlist sidebar',
      modeDescription:
        'Default uses a medium brown panel. Solid or gradient fills the podcast playlist sidebar.',
    }),
    ...brandFillFields({
      prefix: 'playlistSelected',
      label: 'Selected playlist row',
      modeDescription:
        'Default uses a darker brown. Solid or gradient highlights the active episode.',
    }),
    ...brandFillFields({
      prefix: 'watchButton',
      label: 'Watch button',
      modeDescription:
        'Default uses a warm brown. Solid or gradient fills the Watch CTA on Featured Originals.',
    }),
    ...brandFillFields({
      prefix: 'watchButtonText',
      label: 'Watch button text',
      modeDescription:
        'Default is white. Solid or gradient styles the Watch label.',
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
      description:
        'Required for the public Originals page. Empty = invisible on the live site even after you Publish this document in Studio.',
      type: 'datetime',
      components: {
        field: PublishedAtField,
      },
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
