jest.mock('@/sanity/lib/image', () => ({
  urlForImage: () => null,
}))

import {
  mapSanityProjectMedia,
  mapSanityWorkProjectToDetail,
} from '@/sanity/lib/mappers'

describe('work project detail page builder mapping', () => {
  it('maps hero video + modular sections', () => {
    const detail = mapSanityWorkProjectToDetail({
      _id: 'proj1',
      title: 'Project Name',
      slug: 'project-name',
      summary: 'Short summary',
      coverImageUrl: 'https://cdn.example.com/cover.jpg',
      clientName: 'Client Name',
      clientSlug: 'client-name',
      category: 'Digital',
      hero: {
        mediaType: 'video',
        alt: 'Hero',
        playbackId: 'abc123',
        posterUrl: 'https://image.mux.com/abc123/thumbnail.jpg',
      },
      sections: [
        {
          _key: 'ov1',
          _type: 'projectOverview',
          categories: ['Motion Graphics'],
          industries: ['Banking'],
          body: 'Overview body',
        },
        {
          _key: 'pair1',
          _type: 'mediaPair',
          left: {
            mediaType: 'image',
            alt: 'Left',
            image: { assetUrl: 'https://cdn.example.com/left.jpg' },
          },
          right: {
            mediaType: 'image',
            alt: 'Right',
            image: { assetUrl: 'https://cdn.example.com/right.jpg' },
          },
        },
        {
          _key: 'call1',
          _type: 'impactCallout',
          headline: '100K VIEWS',
          subheadline: 'ACROSS ALL SOCIAL MEDIA PLATFORMS',
        },
        {
          _key: 'share1',
          _type: 'shareBar',
          heading: 'Share on',
        },
      ],
      seo: { metaTitle: 'SEO' },
    })

    expect(detail.hero).toEqual({
      mediaType: 'muxVideo',
      alt: 'Hero',
      playbackId: 'abc123',
      posterUrl: 'https://image.mux.com/abc123/thumbnail.jpg',
    })
    expect(detail.sections).toHaveLength(4)
    expect(detail.sections[0]).toMatchObject({
      _type: 'projectOverview',
      body: 'Overview body',
    })
    expect(detail.sections[1]).toMatchObject({ _type: 'mediaPair' })
    expect(detail.sections[2]).toMatchObject({
      _type: 'impactCallout',
      headline: '100K VIEWS',
    })
    expect(detail.sections[3]).toMatchObject({
      _type: 'shareBar',
      heading: 'Share on',
    })
  })

  it('maps project media images from assetUrl fallback', () => {
    const media = mapSanityProjectMedia({
      mediaType: 'image',
      alt: 'Still',
      image: { assetUrl: 'https://cdn.example.com/still.jpg' },
    })
    expect(media).toEqual({
      mediaType: 'image',
      alt: 'Still',
      imageSrc: 'https://cdn.example.com/still.jpg',
    })
  })

  it('maps muxVideo and legacy video to muxVideo', () => {
    expect(
      mapSanityProjectMedia({
        mediaType: 'muxVideo',
        playbackId: 'mux1',
        posterUrl: 'https://image.mux.com/mux1/thumbnail.jpg',
      }),
    ).toEqual({
      mediaType: 'muxVideo',
      playbackId: 'mux1',
      posterUrl: 'https://image.mux.com/mux1/thumbnail.jpg',
    })

    expect(
      mapSanityProjectMedia({
        mediaType: 'video',
        playbackId: 'legacy1',
      }),
    ).toEqual({
      mediaType: 'muxVideo',
      playbackId: 'legacy1',
      posterUrl: 'https://image.mux.com/legacy1/thumbnail.jpg',
    })
  })

  it('prefers cover image over Mux thumbnail and legacy loopPoster', () => {
    expect(
      mapSanityProjectMedia({
        mediaType: 'muxVideo',
        playbackId: 'mux1',
        cover: { assetUrl: 'https://cdn.example.com/custom-cover.jpg' },
      }),
    ).toEqual({
      mediaType: 'muxVideo',
      playbackId: 'mux1',
      posterUrl: 'https://cdn.example.com/custom-cover.jpg',
    })

    expect(
      mapSanityProjectMedia({
        mediaType: 'loopVideo',
        alt: 'Ambient',
        loopVideoSrc: 'https://cdn.sanity.io/files/x/y/clip.mp4',
        cover: { assetUrl: 'https://cdn.example.com/cover.jpg' },
        loopPoster: { assetUrl: 'https://cdn.example.com/legacy-poster.jpg' },
      }),
    ).toEqual({
      mediaType: 'loopVideo',
      alt: 'Ambient',
      loopVideoSrc: 'https://cdn.sanity.io/files/x/y/clip.mp4',
      posterUrl: 'https://cdn.example.com/cover.jpg',
    })
  })

  it('maps loopVideo with optional poster', () => {
    expect(
      mapSanityProjectMedia({
        mediaType: 'loopVideo',
        alt: 'Ambient',
        loopVideoSrc: 'https://cdn.sanity.io/files/x/y/clip.mp4',
        loopPoster: { assetUrl: 'https://cdn.sanity.io/images/x/y/poster.jpg' },
      }),
    ).toEqual({
      mediaType: 'loopVideo',
      alt: 'Ambient',
      loopVideoSrc: 'https://cdn.sanity.io/files/x/y/clip.mp4',
      posterUrl: 'https://cdn.sanity.io/images/x/y/poster.jpg',
    })
  })
})
