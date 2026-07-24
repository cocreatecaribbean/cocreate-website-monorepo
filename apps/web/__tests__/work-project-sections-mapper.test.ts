jest.mock('@/sanity/lib/image', () => ({
  urlForImage: () => null,
}))

import {
  mapBrandFill,
  mapSanityProjectMedia,
  mapSanityWorkProjectToDetail,
  normalizeHexColor,
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
          _key: 'call-solid',
          _type: 'impactCallout',
          headline: 'BRAND HIT',
          subheadline: 'SOLID FILL',
          fillMode: 'solid',
          solidColor: '#E85D04',
        },
        {
          _key: 'call-gradient',
          _type: 'impactCallout',
          headline: 'CUSTOM GRAD',
          subheadline: 'TWO STOP',
          fillMode: 'gradient',
          gradientFrom: '#112233',
          gradientTo: 'aabbcc',
          gradientAngle: 45,
        },
        {
          _key: 'call-bad',
          _type: 'impactCallout',
          headline: 'FALLBACK',
          subheadline: 'INVALID SOLID',
          fillMode: 'solid',
          solidColor: 'not-a-color',
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
    expect(detail.sections).toHaveLength(7)
    expect(detail.sections[0]).toMatchObject({
      _type: 'projectOverview',
      body: 'Overview body',
    })
    expect(detail.sections[1]).toMatchObject({ _type: 'mediaPair' })
    expect(detail.sections[2]).toMatchObject({
      _type: 'impactCallout',
      headline: '100K VIEWS',
    })
    expect(detail.sections[2]).not.toHaveProperty('fill')
    expect(detail.sections[3]).toMatchObject({
      _type: 'impactCallout',
      headline: 'BRAND HIT',
      fill: { mode: 'solid', color: '#e85d04' },
    })
    expect(detail.sections[4]).toMatchObject({
      _type: 'impactCallout',
      headline: 'CUSTOM GRAD',
      fill: {
        mode: 'gradient',
        from: '#112233',
        to: '#aabbcc',
        angle: 45,
      },
    })
    expect(detail.sections[5]).toMatchObject({
      _type: 'impactCallout',
      headline: 'FALLBACK',
    })
    expect(detail.sections[5]).not.toHaveProperty('fill')
    expect(detail.sections[6]).toMatchObject({
      _type: 'shareBar',
      heading: 'Share on',
    })
  })

  it('maps impact callout gradient with via stop', () => {
    const detail = mapSanityWorkProjectToDetail({
      _id: 'proj2',
      title: 'Project Name',
      slug: 'project-name',
      summary: 'Short summary',
      coverImageUrl: 'https://cdn.example.com/cover.jpg',
      clientName: 'Client Name',
      category: 'Digital',
      sections: [
        {
          _key: 'call-via',
          _type: 'impactCallout',
          headline: 'THREE STOP',
          subheadline: 'WITH VIA',
          fillMode: 'gradient',
          gradientFrom: '#111111',
          gradientVia: '#222222',
          gradientTo: '#333333',
        },
      ],
    })

    expect(detail.sections[0]).toEqual({
      _type: 'impactCallout',
      _key: 'call-via',
      headline: 'THREE STOP',
      subheadline: 'WITH VIA',
      fill: {
        mode: 'gradient',
        from: '#111111',
        via: '#222222',
        to: '#333333',
        angle: 90,
      },
    })
  })

  it('maps solid fill despite stega / dirty hex characters', () => {
    // Zero-width space simulates Sanity Presentation stega encoding
    const stegaHex = `#E8\u200B5D04`
    const stegaMode = `sol\u200Bid`

    expect(normalizeHexColor(stegaHex)).toBe('#e85d04')
    expect(
      mapBrandFill({
        fillMode: stegaMode,
        solidColor: stegaHex,
      }),
    ).toEqual({mode: 'solid', color: '#e85d04'})

    const detail = mapSanityWorkProjectToDetail({
      _id: 'proj-stega',
      title: 'Stega Project',
      slug: 'stega-project',
      summary: 'Summary',
      coverImageUrl: 'https://cdn.example.com/cover.jpg',
      clientName: 'Client',
      category: 'Digital',
      titleFillMode: stegaMode,
      titleSolidColor: stegaHex,
      sections: [
        {
          _key: 'call-stega',
          _type: 'impactCallout',
          headline: 'HIT',
          subheadline: 'STEGA',
          fillMode: stegaMode,
          solidColor: stegaHex,
        },
      ],
    })

    expect(detail.titleFill).toEqual({mode: 'solid', color: '#e85d04'})
    expect(detail.sections[0]).toMatchObject({
      fill: {mode: 'solid', color: '#e85d04'},
    })
  })

  it('maps project title fill solid and gradient', () => {
    const solid = mapSanityWorkProjectToDetail({
      _id: 'proj-title-solid',
      title: 'Brand Title',
      slug: 'brand-title',
      summary: 'Summary',
      coverImageUrl: 'https://cdn.example.com/cover.jpg',
      clientName: 'Client',
      category: 'Digital',
      titleFillMode: 'solid',
      titleSolidColor: '#00AEEF',
      sections: [],
    })
    expect(solid.titleFill).toEqual({mode: 'solid', color: '#00aeef'})

    const gradient = mapSanityWorkProjectToDetail({
      _id: 'proj-title-grad',
      title: 'Grad Title',
      slug: 'grad-title',
      summary: 'Summary',
      coverImageUrl: 'https://cdn.example.com/cover.jpg',
      clientName: 'Client',
      category: 'Digital',
      titleFillMode: 'gradient',
      titleGradientFrom: '#111111',
      titleGradientVia: '#222222',
      titleGradientTo: '#333333',
      titleGradientAngle: 135,
      sections: [],
    })
    expect(gradient.titleFill).toEqual({
      mode: 'gradient',
      from: '#111111',
      via: '#222222',
      to: '#333333',
      angle: 135,
    })
  })

  it('maps clientFill and callout subFill', () => {
    const detail = mapSanityWorkProjectToDetail({
      _id: 'proj-client-sub',
      title: 'Project',
      slug: 'project',
      summary: 'Summary',
      coverImageUrl: 'https://cdn.example.com/cover.jpg',
      clientName: 'Acme',
      category: 'Digital',
      clientFillMode: 'solid',
      clientSolidColor: '#112233',
      sections: [
        {
          _key: 'call-sub',
          _type: 'impactCallout',
          headline: 'BIG',
          subheadline: 'LINE',
          fillMode: 'default',
          subFillMode: 'solid',
          subSolidColor: '#AABBCC',
        },
        {
          _key: 'call-sub-default',
          _type: 'impactCallout',
          headline: 'OTHER',
          subheadline: 'PLAIN',
        },
      ],
    })

    expect(detail.clientFill).toEqual({mode: 'solid', color: '#112233'})
    expect(detail.sections[0]).toMatchObject({
      _type: 'impactCallout',
      subFill: {mode: 'solid', color: '#aabbcc'},
    })
    expect(detail.sections[0]).not.toHaveProperty('fill')
    expect(detail.sections[1]).not.toHaveProperty('subFill')
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
