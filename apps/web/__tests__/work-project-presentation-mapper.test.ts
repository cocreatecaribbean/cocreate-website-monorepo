jest.mock('@/sanity/lib/image', () => ({
  urlForImage: () => null,
}))

jest.mock('@/sanity/lib/queries', () => ({
  projectMediaProjection: '',
}))

import { mapPresentationWorkProject } from '@/lib/sanity/work-project-presentation-query'

describe('mapPresentationWorkProject', () => {
  it('preserves titleFill and clientFill from live Presentation rows', () => {
    const detail = mapPresentationWorkProject({
      _id: 'proj-key',
      title: 'Brand Project',
      slug: 'brand-project',
      summary: 'Summary',
      clientName: 'Acme',
      clientSlug: 'acme',
      category: 'Digital',
      coverImage: { assetUrl: 'https://cdn.example.com/cover.jpg' },
      titleFillMode: 'solid',
      titleSolidColor: '#E85D04',
      clientFillMode: 'solid',
      clientSolidColor: '#112233',
      sections: [
        {
          _key: 'call1',
          _type: 'impactCallout',
          headline: '100K',
          subheadline: 'VIEWS',
          fillMode: 'solid',
          solidColor: '#AABBCC',
        },
      ],
    })

    expect(detail).not.toBeNull()
    expect(detail?.titleFill).toEqual({ mode: 'solid', color: '#e85d04' })
    expect(detail?.clientFill).toEqual({ mode: 'solid', color: '#112233' })
    expect(detail?.sections[0]).toMatchObject({
      _type: 'impactCallout',
      fill: { mode: 'solid', color: '#aabbcc' },
    })
  })
})
