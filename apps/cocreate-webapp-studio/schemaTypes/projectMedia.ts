import {defineField, defineType} from 'sanity'

/** Reusable image, Mux, or ambient loop video for project detail sections. */
export const projectMedia = defineType({
  name: 'projectMedia',
  title: 'Media',
  type: 'object',
  fields: [
    defineField({
      name: 'mediaType',
      title: 'Media type',
      type: 'string',
      options: {
        list: [
          {title: 'Image', value: 'image'},
          {title: 'Mux video', value: 'muxVideo'},
          {
            title: 'Looping video (GIF-like)',
            value: 'loopVideo',
          },
        ],
        layout: 'radio',
      },
      initialValue: 'image',
      validation: (rule) => rule.required(),
      description:
        'Mux for watchable clips with Play. Looping video autoplays muted with no controls — keep clips short/compressed; prefer mp4 (h.264) for Safari.',
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {hotspot: true},
      hidden: ({parent}) => parent?.mediaType !== 'image',
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as {mediaType?: string} | undefined
          if (parent?.mediaType === 'image' && !value?.asset) {
            return 'Add an image'
          }
          return true
        }),
    }),
    defineField({
      name: 'video',
      title: 'Mux video',
      description: 'Upload via Mux — shown with a Play control',
      type: 'mux.video',
      hidden: ({parent}) => parent?.mediaType !== 'muxVideo',
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as {mediaType?: string} | undefined
          if (
            parent?.mediaType === 'muxVideo' &&
            !(value as {asset?: unknown} | undefined)?.asset
          ) {
            return 'Add a Mux video'
          }
          return true
        }),
    }),
    defineField({
      name: 'loopVideo',
      title: 'Looping video file',
      description:
        'mp4 or webm. Autoplays muted, loops, no controls. Prefer short h.264 mp4 for Safari.',
      type: 'file',
      options: {
        accept: 'video/mp4,video/webm',
      },
      hidden: ({parent}) => parent?.mediaType !== 'loopVideo',
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as {mediaType?: string} | undefined
          if (
            parent?.mediaType === 'loopVideo' &&
            !(value as {asset?: unknown} | undefined)?.asset
          ) {
            return 'Add a looping video file'
          }
          return true
        }),
    }),
    defineField({
      name: 'cover',
      title: 'Cover image',
      description:
        'Shown before playback (Play overlay / loop poster). Mux videos fall back to an auto-generated thumbnail if empty.',
      type: 'image',
      options: {hotspot: true},
      hidden: ({parent}) =>
        parent?.mediaType !== 'muxVideo' && parent?.mediaType !== 'loopVideo',
    }),
    defineField({
      name: 'loopPoster',
      title: 'Loop poster (legacy)',
      description: 'Deprecated — use Cover image instead.',
      type: 'image',
      options: {hotspot: true},
      hidden: () => true,
    }),
    defineField({
      name: 'alt',
      title: 'Alt text',
      type: 'string',
      description: 'Describe the media for accessibility.',
    }),
  ],
  preview: {
    select: {
      mediaType: 'mediaType',
      alt: 'alt',
      media: 'image',
      videoStatus: 'video.asset.status',
      loopFile: 'loopVideo.asset.originalFilename',
    },
    prepare({mediaType, alt, media, videoStatus, loopFile}) {
      if (mediaType === 'muxVideo' || mediaType === 'video') {
        return {
          title: alt || 'Mux video',
          subtitle: videoStatus ? `Mux · ${videoStatus}` : 'Mux video',
        }
      }
      if (mediaType === 'loopVideo') {
        return {
          title: alt || 'Looping video',
          subtitle: loopFile || 'Ambient loop',
        }
      }
      return {
        title: alt || 'Image',
        subtitle: 'Image',
        media,
      }
    },
  },
})
