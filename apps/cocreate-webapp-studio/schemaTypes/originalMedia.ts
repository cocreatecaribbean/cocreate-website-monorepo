import {defineField, defineType} from 'sanity'
import {YouTubeVideoIdInput} from '../components/YouTubeVideoIdInput'

const YOUTUBE_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/

/** YouTube embed or Mux-hosted video for originals / episodes. */
export const originalMedia = defineType({
  name: 'originalMedia',
  title: 'Video media',
  type: 'object',
  fields: [
    defineField({
      name: 'mediaSource',
      title: 'Media source',
      type: 'string',
      options: {
        list: [
          {title: 'YouTube', value: 'youtube'},
          {title: 'Mux video', value: 'muxVideo'},
        ],
        layout: 'radio',
      },
      initialValue: 'youtube',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'youtubeVideoId',
      title: 'YouTube video',
      description: 'Paste a YouTube link or 11-character ID — stored as ID only',
      type: 'string',
      components: {input: YouTubeVideoIdInput},
      hidden: ({parent}) => parent?.mediaSource !== 'youtube',
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as {mediaSource?: string} | undefined
          if (parent?.mediaSource !== 'youtube') return true
          if (!value) return 'Add a YouTube video ID'
          return YOUTUBE_ID_PATTERN.test(value)
            ? true
            : 'Must be a valid 11-character YouTube video ID'
        }),
    }),
    defineField({
      name: 'muxVideo',
      title: 'Mux video',
      description: 'Upload via Mux — shown with a Play control',
      type: 'mux.video',
      hidden: ({parent}) => parent?.mediaSource !== 'muxVideo',
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as {mediaSource?: string} | undefined
          if (
            parent?.mediaSource === 'muxVideo' &&
            !(value as {asset?: unknown} | undefined)?.asset
          ) {
            return 'Add a Mux video'
          }
          return true
        }),
    }),
    defineField({
      name: 'poster',
      title: 'Poster image',
      description: 'Optional. Mux falls back to an auto-generated thumbnail if empty.',
      type: 'image',
      options: {hotspot: true},
      hidden: ({parent}) => parent?.mediaSource !== 'muxVideo',
    }),
  ],
  preview: {
    select: {
      mediaSource: 'mediaSource',
      youtubeVideoId: 'youtubeVideoId',
      videoStatus: 'muxVideo.asset.status',
    },
    prepare({mediaSource, youtubeVideoId, videoStatus}) {
      if (mediaSource === 'muxVideo') {
        return {
          title: 'Mux video',
          subtitle: videoStatus ? `Mux · ${videoStatus}` : 'Mux video',
        }
      }
      return {
        title: youtubeVideoId ? `YouTube · ${youtubeVideoId}` : 'YouTube video',
        subtitle: 'YouTube',
      }
    },
  },
})
